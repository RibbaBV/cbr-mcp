import { selecteerAlles } from './db.js';
import { slug, toonNaam } from './tekst.js';
import { CENTRUM_ADRES, type CentrumAdres } from './centrum-adressen.js';

/**
 * Examencentra, opgeteld uit wat het CBR per rijschool publiceert.
 *
 * Het CBR geeft deze cijfers alleen als bijvangst bij een rijschool: in
 * exam_details_by_type staat per school welke centra hij bezoekt, hoeveel
 * examens daar zijn afgelegd en wat het gemiddelde van dat centrum is. Wie het
 * andersom wil zien, per centrum in plaats van per school, moet het zelf
 * omdraaien. Dat gebeurt hier.
 */

export type CentrumSchool = {
  id: number;
  naam: string;
  stad: string | null;
  provincie: string | null;
  examens: number;
  eerste_examens: number;
  percentage: number;
  eerste_percentage: number | null;
};

export type Examencentrum = {
  naam: string;
  korte_naam: string;
  slug: string;
  /** Het gemiddelde dat het CBR zelf voor dit centrum opgeeft. */
  gemiddelde: number | null;
  scholen: number;
  examens: number;
  eerste_examens: number;
  herexamens: number;
  /** Gewogen naar het aantal examens per school. */
  eerste_percentage: number | null;
  herexamen_percentage: number | null;
  steden: { stad: string; examens: number }[];
  /** Zwaartepunt van de rijscholen die hier examen doen, niet het pand zelf. */
  lat: number | null;
  lon: number | null;
  adres: CentrumAdres | null;
  cbr_url: string | null;
  ribba_url: string;
  ranglijst: CentrumSchool[];
};

/** Onder dit aantal examens zegt een percentage te weinig voor een ranglijst. */
export const MIN_EXAMENS_RANGLIJST = 25;

type Rij = {
  id: number;
  name: string;
  city: string | null;
  service_province: string | null;
  lat: number | null;
  lon: number | null;
  exam_details_by_type: Record<string, { examInformation?: any[] }> | null;
};

function getal(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

let _rijen: Promise<Rij[]> | null = null;

/**
 * De ruwe CBR-detailkolom, één keer opgehaald en daarna hergebruikt.
 *
 * Dit is de zwaarste kolom van de tabel en negen categorieën lezen er allemaal
 * uit. Zonder deze cache trekt één gesprek hem meerdere keren over de lijn.
 */
function laadRijen(): Promise<Rij[]> {
  if (!_rijen) {
    _rijen = selecteerAlles<Rij>('cbr_rijscholen', {
      select: 'id,name,city,service_province,lat,lon,exam_details_by_type',
      disabled: 'eq.false',
      exam_details_by_type: 'not.is.null',
      order: 'id',
    });
  }
  return _rijen;
}

const _perCode = new Map<string, Promise<Examencentrum[]>>();

/** Alle examencentra voor één rijbewijscategorie, op examenaantal gesorteerd. */
export function examencentra(code = 'B'): Promise<Examencentrum[]> {
  const sleutel = code.toUpperCase();
  let uit = _perCode.get(sleutel);
  if (!uit) {
    uit = bouw(sleutel);
    _perCode.set(sleutel, uit);
  }
  return uit;
}

async function bouw(code: string): Promise<Examencentrum[]> {
  const rijen = await laadRijen();

  type Bak = {
    naam: string;
    korteNaam: string;
    gemiddelde: number | null;
    cbrUrl: string | null;
    eerste: number;
    herex: number;
    geslaagdEerste: number;
    geslaagdHerex: number;
    steden: Map<string, number>;
    punten: { lat: number; lon: number; gewicht: number }[];
    scholen: CentrumSchool[];
  };
  const bakken = new Map<string, Bak>();

  for (const s of rijen) {
    const locaties = s.exam_details_by_type?.[code]?.examInformation;
    if (!Array.isArray(locaties)) continue;

    for (const loc of locaties) {
      const naam: string | undefined = loc.cbrLocation || loc.cbrLocationShortName;
      if (!naam) continue;

      const eerste = getal(loc.firstAttempts);
      const herex = getal(loc.retakeAttempts);
      const examens = eerste + herex;
      if (examens <= 0) continue;

      let bak = bakken.get(naam);
      if (!bak) {
        bak = {
          naam,
          korteNaam: loc.cbrLocationShortName || naam.replace(/^Examencentrum\s+/i, ''),
          gemiddelde: loc.locationSuccessfulPercentage ?? null,
          cbrUrl: loc.cbrLocationLink ? `https://www.cbr.nl${loc.cbrLocationLink}` : null,
          eerste: 0, herex: 0, geslaagdEerste: 0, geslaagdHerex: 0,
          steden: new Map(), punten: [], scholen: [],
        };
        bakken.set(naam, bak);
      }

      bak.eerste += eerste;
      bak.herex += herex;
      bak.geslaagdEerste += (eerste * getal(loc.successfulFirstAttemptsPercentage)) / 100;
      bak.geslaagdHerex += (herex * getal(loc.successfulSecondAttemptsPercentage)) / 100;

      if (s.city) {
        const stad = toonNaam(s.city);
        bak.steden.set(stad, (bak.steden.get(stad) ?? 0) + examens);
      }
      if (s.lat != null && s.lon != null) {
        bak.punten.push({ lat: s.lat, lon: s.lon, gewicht: examens });
      }

      const pct = loc.drivingSchoolSuccessfulPercentage;
      if (pct != null) {
        bak.scholen.push({
          id: s.id,
          naam: s.name,
          stad: s.city ? toonNaam(s.city) : null,
          provincie: s.service_province,
          examens,
          eerste_examens: eerste,
          percentage: Number(pct),
          eerste_percentage: loc.successfulFirstAttemptsPercentage ?? null,
        });
      }
    }
  }

  const centra: Examencentrum[] = [];
  for (const bak of bakken.values()) {
    // Het CBR publiceert geen coördinaten van zijn centra. Het zwaartepunt van
    // de rijscholen die er examen doen klopt op stadsniveau, en dat is genoeg
    // om op te navigeren. Het adres hieronder is wel het echte pand.
    let lat: number | null = null;
    let lon: number | null = null;
    const gewicht = bak.punten.reduce((t, p) => t + p.gewicht, 0);
    if (gewicht > 0) {
      lat = bak.punten.reduce((t, p) => t + p.lat * p.gewicht, 0) / gewicht;
      lon = bak.punten.reduce((t, p) => t + p.lon * p.gewicht, 0) / gewicht;
    }

    const eigenSlug = slug(bak.korteNaam);
    centra.push({
      naam: bak.naam,
      korte_naam: bak.korteNaam,
      slug: eigenSlug,
      gemiddelde: bak.gemiddelde,
      scholen: bak.scholen.length,
      examens: bak.eerste + bak.herex,
      eerste_examens: bak.eerste,
      herexamens: bak.herex,
      eerste_percentage: bak.eerste > 0 ? Math.round((bak.geslaagdEerste / bak.eerste) * 100) : null,
      herexamen_percentage: bak.herex > 0 ? Math.round((bak.geslaagdHerex / bak.herex) * 100) : null,
      steden: [...bak.steden.entries()]
        .map(([stad, examens]) => ({ stad, examens }))
        .sort((a, b) => b.examens - a.examens)
        .slice(0, 8),
      lat,
      lon,
      adres: CENTRUM_ADRES[eigenSlug] ?? null,
      cbr_url: bak.cbrUrl,
      ribba_url: `https://ribba.nl/examencentra/${eigenSlug}`,
      ranglijst: bak.scholen
        .filter((s) => s.examens >= MIN_EXAMENS_RANGLIJST)
        .sort((a, b) => b.percentage - a.percentage || b.examens - a.examens),
    });
  }

  return centra.sort((a, b) => b.examens - a.examens);
}

/** Eén centrum op slug, korte naam of volledige naam. */
export async function centrum(vraag: string, code = 'B'): Promise<Examencentrum | undefined> {
  const alle = await examencentra(code);
  const gezocht = slug(vraag);
  return (
    alle.find((c) => c.slug === gezocht)
    ?? alle.find((c) => slug(c.korte_naam) === gezocht || slug(c.naam) === gezocht)
    ?? alle.find((c) => c.slug.includes(gezocht) || gezocht.includes(c.slug))
  );
}

/** Hoeveel verschillende rijscholen het CBR voor deze categorie cijfers geeft. */
export async function aantalScholen(code = 'B'): Promise<number> {
  const rijen = await laadRijen();
  const sleutel = code.toUpperCase();
  let n = 0;
  for (const s of rijen) {
    const locaties = s.exam_details_by_type?.[sleutel]?.examInformation;
    if (Array.isArray(locaties) && locaties.length > 0) n++;
  }
  return n;
}
