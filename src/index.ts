#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { selecteer, selecteerAlles } from './db.js';
import { slug, toonNaam } from './tekst.js';
import { CATEGORIEEN, CODES, categorie } from './categorieen.js';
import { provincieSlug, schoolUrl, stadUrl } from './pagina.js';
import { aantalScholen, centrum, examencentra, MIN_EXAMENS_RANGLIJST } from './centra.js';

const VERSIE = '0.1.0';

/** Onder dit aantal examens rust een landelijke notering op te weinig. */
const MIN_EXAMENS_LANDELIJK = 100;

type SchoolRij = {
  id: number;
  name: string;
  city: string | null;
  service_province: string | null;
  stats_exam_type: string | null;
  total_exams: number | null;
  total_exams_first: number | null;
  total_exams_retake: number | null;
  success_percentage: number | null;
  success_percentage_first: number | null;
  success_percentage_retake: number | null;
  location_avg_percentage: number | null;
};

const SCHOOL_KOLOMMEN =
  'id,name,city,service_province,stats_exam_type,total_exams,total_exams_first,'
  + 'total_exams_retake,success_percentage,success_percentage_first,'
  + 'success_percentage_retake,location_avg_percentage';

let _scholen: Promise<SchoolRij[]> | null = null;

/** Alle actieve rijscholen met hun CBR-cijfers, één keer per proces. */
function scholen(): Promise<SchoolRij[]> {
  if (!_scholen) {
    _scholen = selecteerAlles<SchoolRij>('cbr_rijscholen', {
      select: SCHOOL_KOLOMMEN,
      disabled: 'eq.false',
      order: 'id',
    });
  }
  return _scholen;
}

function antwoord(waarde: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(waarde, null, 2) }] };
}

function fout(bericht: string) {
  return { content: [{ type: 'text' as const, text: bericht }], isError: true };
}

function gemiddelde(getallen: number[]): number | null {
  if (getallen.length === 0) return null;
  return Math.round(getallen.reduce((t, n) => t + n, 0) / getallen.length);
}

const server = new McpServer(
  { name: 'cbr-mcp', version: VERSIE },
  {
    instructions:
      'Slagingspercentages en examencijfers van het CBR, per rijschool, per examencentrum, '
      + 'per stad en per provincie. De cijfers komen uit de openbare CBR-publicatie per '
      + 'rijschool en worden wekelijks opgehaald.\n\n'
      + 'Lees de cijfers zorgvuldig. Een slagingspercentage over weinig examens zegt weinig: '
      + 'gebruik altijd het bijbehorende aantal examens. Het eerste-keer-percentage en het '
      + 'herexamenpercentage meten verschillende dingen, en het gemiddelde van het '
      + 'examencentrum is een eerlijker ijkpunt dan het landelijk gemiddelde, want het ene '
      + 'centrum is strenger dan het andere.\n\n'
      + 'Standaard gaat alles over categorie B, de personenauto. Voor motor, bromfiets, '
      + 'vrachtwagen, bus, aanhanger of tractor geef je een andere categorie mee.',
  },
);

// ── Wat er te halen valt ──────────────────────────────────────────────

server.registerTool(
  'rijbewijscategorieen',
  {
    title: 'Rijbewijscategorieën',
    description:
      'De rijbewijscategorieën waarvoor het CBR per rijschool cijfers publiceert, met per '
      + 'categorie wat het examen precies meet. Gebruik de code als parameter bij de andere tools.',
    inputSchema: {},
  },
  async () => antwoord({ categorieen: CATEGORIEEN }),
);

// ── Landelijk ─────────────────────────────────────────────────────────

server.registerTool(
  'landelijke_cijfers',
  {
    title: 'Landelijke cijfers',
    description:
      'Het landelijk gemiddelde slagingspercentage, het aantal rijscholen met examencijfers '
      + 'en het totaal aantal afgelegde examens. Het ijkpunt waar je een losse rijschool '
      + 'tegen afzet.',
    inputSchema: {
      categorie: z.string().optional().describe('Rijbewijscategorie, standaard B (auto).'),
    },
  },
  async ({ categorie: code = 'B' }) => {
    const cat = categorie(code);
    if (!cat) return fout(`Onbekende categorie "${code}". Kies uit: ${CODES.join(', ')}.`);

    const centra = await examencentra(cat.code);
    const examens = centra.reduce((t, c) => t + c.examens, 0);
    const eerste = centra.reduce((t, c) => t + c.eerste_examens, 0);
    const herex = centra.reduce((t, c) => t + c.herexamens, 0);

    // Gewogen naar examens, niet het gemiddelde van de centrumgemiddelden:
    // anders telt een centrum met driehonderd examens even zwaar als een met
    // dertigduizend.
    const geslaagdEerste = centra.reduce(
      (t, c) => t + (c.eerste_percentage ?? 0) * c.eerste_examens / 100, 0);
    const geslaagdHerex = centra.reduce(
      (t, c) => t + (c.herexamen_percentage ?? 0) * c.herexamens / 100, 0);

    return antwoord({
      categorie: cat,
      examencentra: centra.length,
      rijscholen_met_cijfers: await aantalScholen(cat.code),
      examens_totaal: examens,
      eerste_examens: eerste,
      herexamens: herex,
      slagingspercentage_eerste_examen: eerste > 0 ? Math.round((geslaagdEerste / eerste) * 100) : null,
      slagingspercentage_herexamen: herex > 0 ? Math.round((geslaagdHerex / herex) * 100) : null,
      bron: 'CBR, openbare cijfers per rijschool. Verzameld door Ribba (https://ribba.nl).',
    });
  },
);

// ── Examencentra ──────────────────────────────────────────────────────

server.registerTool(
  'examencentra',
  {
    title: 'Alle examencentra',
    description:
      'Alle CBR-examencentra met hun slagingspercentage, het aantal examens en het aantal '
      + 'rijscholen dat er rijdt. Gesorteerd op examenaantal. Zonder de ranglijst per centrum; '
      + 'die haal je met examencentrum.',
    inputSchema: {
      categorie: z.string().optional().describe('Rijbewijscategorie, standaard B (auto).'),
    },
  },
  async ({ categorie: code = 'B' }) => {
    const cat = categorie(code);
    if (!cat) return fout(`Onbekende categorie "${code}". Kies uit: ${CODES.join(', ')}.`);

    const centra = await examencentra(cat.code);
    return antwoord({
      categorie: cat.code,
      aantal: centra.length,
      // Zonder ranglijst en zonder de parkeertekst: die twee maken van een
      // overzicht van 54 centra een muur waar het cijfer in verdwijnt. Beide
      // staan wel in examencentrum.
      centra: centra.map(({ ranglijst, steden, adres, ...rest }) => ({
        ...rest,
        adres: adres ? { straat: adres.straat, postcode: adres.postcode, plaats: adres.plaats } : null,
        grootste_steden: steden.slice(0, 3).map((s) => s.stad),
      })),
    });
  },
);

server.registerTool(
  'examencentrum',
  {
    title: 'Eén examencentrum',
    description:
      'Alles over één CBR-examencentrum: adres en parkeerinformatie, slagingspercentages voor '
      + 'eerste examens en herexamens, de steden waar de rijscholen vandaan komen, en de '
      + 'ranglijst van rijscholen die er examen doen.',
    inputSchema: {
      naam: z.string().describe('Naam of slug van het examencentrum, bijvoorbeeld "Amsterdam" of "den-bosch".'),
      categorie: z.string().optional().describe('Rijbewijscategorie, standaard B (auto).'),
      ranglijst_limiet: z.number().int().min(1).max(200).optional()
        .describe('Hoeveel rijscholen in de ranglijst, standaard 20.'),
    },
  },
  async ({ naam, categorie: code = 'B', ranglijst_limiet = 20 }) => {
    const cat = categorie(code);
    if (!cat) return fout(`Onbekende categorie "${code}". Kies uit: ${CODES.join(', ')}.`);

    const c = await centrum(naam, cat.code);
    if (!c) {
      const alle = await examencentra(cat.code);
      return fout(
        `Geen examencentrum gevonden voor "${naam}". Beschikbaar: ${alle.map((x) => x.slug).join(', ')}.`,
      );
    }

    return antwoord({
      ...c,
      ranglijst: c.ranglijst.slice(0, ranglijst_limiet).map((s, i) => ({ positie: i + 1, ...s })),
      ranglijst_drempel: `Alleen rijscholen met minstens ${MIN_EXAMENS_RANGLIJST} examens op dit centrum.`,
      ranglijst_totaal: c.ranglijst.length,
    });
  },
);

// ── Ranglijsten ───────────────────────────────────────────────────────

server.registerTool(
  'ranglijst',
  {
    title: 'Ranglijst rijscholen',
    description:
      'De rijscholen met het hoogste slagingspercentage, landelijk of binnen één stad of '
      + 'provincie. Alleen scholen met genoeg examens om een percentage op te baseren.',
    inputSchema: {
      stad: z.string().optional().describe('Beperk tot één stad, bijvoorbeeld "Utrecht".'),
      provincie: z.string().optional().describe('Beperk tot één provincie, bijvoorbeeld "Noord-Holland".'),
      minimum_examens: z.number().int().min(1).optional()
        .describe(`Drempel, standaard ${MIN_EXAMENS_LANDELIJK} landelijk en ${MIN_EXAMENS_RANGLIJST} binnen een stad of provincie.`),
      limiet: z.number().int().min(1).max(200).optional().describe('Aantal rijscholen, standaard 25.'),
    },
  },
  async ({ stad, provincie, minimum_examens, limiet = 25 }) => {
    const alle = await scholen();
    const drempel = minimum_examens ?? (stad || provincie ? MIN_EXAMENS_RANGLIJST : MIN_EXAMENS_LANDELIJK);

    const gezochteStad = stad ? slug(stad) : null;
    const gezochteProvincie = provincie ? slug(provincie) : null;

    const noteringen = alle
      .filter((s) => {
        if (s.success_percentage_first == null || (s.total_exams_first ?? 0) < drempel) return false;
        if (gezochteStad && slug(s.city ?? '') !== gezochteStad) return false;
        if (gezochteProvincie && slug(s.service_province ?? '') !== gezochteProvincie) return false;
        return true;
      })
      .sort((a, b) =>
        (b.success_percentage_first ?? 0) - (a.success_percentage_first ?? 0)
        || (b.total_exams_first ?? 0) - (a.total_exams_first ?? 0))
      .slice(0, limiet)
      .map((s, i) => ({
        positie: i + 1,
        school_id: s.id,
        naam: s.name,
        stad: s.city ? toonNaam(s.city) : null,
        provincie: s.service_province,
        slagingspercentage_eerste_examen: s.success_percentage_first,
        eerste_examens: s.total_exams_first,
        gemiddelde_examencentrum: s.location_avg_percentage,
        examentype: s.stats_exam_type,
        pagina: schoolUrl(s),
      }));

    if (noteringen.length === 0) {
      return fout(
        `Geen rijscholen gevonden met minstens ${drempel} eerste examens`
        + `${stad ? ` in ${toonNaam(stad)}` : ''}${provincie ? ` in ${provincie}` : ''}. `
        + 'Verlaag minimum_examens of controleer de schrijfwijze.',
      );
    }

    return antwoord({
      bereik: stad ? `stad: ${toonNaam(stad)}` : provincie ? `provincie: ${provincie}` : 'landelijk',
      minimum_examens: drempel,
      aantal: noteringen.length,
      ranglijst: noteringen,
      let_op:
        'Het percentage geldt voor eerste examens. Zet het naast '
        + 'gemiddelde_examencentrum: dat is het gemiddelde van de centra waar deze school rijdt.',
    });
  },
);

// ── Per gebied ────────────────────────────────────────────────────────

server.registerTool(
  'cijfers_per_gebied',
  {
    title: 'Cijfers per provincie of stad',
    description:
      'Het gemiddelde slagingspercentage per provincie, of per stad binnen één provincie, '
      + 'met het aantal rijscholen en het aantal examens.',
    inputSchema: {
      provincie: z.string().optional()
        .describe('Laat leeg voor alle provincies. Vul in om de steden binnen die provincie te krijgen.'),
      minimum_rijscholen: z.number().int().min(1).optional()
        .describe('Toon alleen gebieden met minstens zoveel rijscholen, standaard 3.'),
    },
  },
  async ({ provincie, minimum_rijscholen = 3 }) => {
    const alle = await scholen();
    const gezocht = provincie ? slug(provincie) : null;

    const bakken = new Map<string, SchoolRij[]>();
    for (const s of alle) {
      const gebied = gezocht ? s.city : s.service_province;
      if (!gebied) continue;
      if (gezocht && slug(s.service_province ?? '') !== gezocht) continue;
      const naam = toonNaam(gebied);
      const bak = bakken.get(naam);
      if (bak) bak.push(s); else bakken.set(naam, [s]);
    }

    if (bakken.size === 0) {
      return fout(`Geen gegevens gevonden voor provincie "${provincie}".`);
    }

    const gebieden = [...bakken.entries()]
      .map(([naam, groep]) => {
        const metCijfer = groep.filter((s) => s.success_percentage_first != null);
        return {
          naam,
          slug: slug(naam),
          pagina: provincie
            ? stadUrl(provincie, naam)
            : `https://ribba.nl/rijscholen/${provincieSlug(naam)}`,
          rijscholen: groep.length,
          rijscholen_met_cijfers: metCijfer.length,
          examens: groep.reduce((t, s) => t + (s.total_exams ?? 0), 0),
          gemiddeld_slagingspercentage_eerste_examen:
            gemiddelde(metCijfer.map((s) => s.success_percentage_first as number)),
        };
      })
      .filter((g) => g.rijscholen >= minimum_rijscholen)
      .sort((a, b) => b.examens - a.examens);

    return antwoord({
      niveau: provincie ? 'stad' : 'provincie',
      binnen: provincie ? toonNaam(provincie) : 'Nederland',
      aantal: gebieden.length,
      gebieden,
    });
  },
);

// ── Eén rijschool ─────────────────────────────────────────────────────

server.registerTool(
  'school_cijfers',
  {
    title: 'Examencijfers van één rijschool',
    description:
      'De CBR-cijfers van één rijschool: eerste examens, herexamens, het gemiddelde van de '
      + 'examencentra waar hij rijdt, en de uitsplitsing per examencentrum. Zoek op id of op naam.',
    inputSchema: {
      school_id: z.number().int().optional().describe('Het Ribba-id van de rijschool.'),
      naam: z.string().optional().describe('Naam van de rijschool, als je het id niet hebt.'),
      stad: z.string().optional().describe('Stad erbij, om een naam die vaker voorkomt te onderscheiden.'),
    },
  },
  async ({ school_id, naam, stad }) => {
    if (school_id == null && !naam) return fout('Geef school_id of naam mee.');

    const filter: Record<string, string> = {
      select: 'id,name,city,service_province,stats_exam_type,exam_types,total_exams,'
        + 'total_exams_first,total_exams_retake,success_percentage,success_percentage_first,'
        + 'success_percentage_retake,location_avg_percentage,exam_details_by_type,scraped_at',
      disabled: 'eq.false',
    };
    if (school_id != null) filter.id = `eq.${school_id}`;
    else filter.name = `ilike.*${naam}*`;
    if (stad) filter.city = `ilike.*${stad}*`;

    const rijen = await selecteer<any>('cbr_rijscholen', filter, 10);
    if (rijen.length === 0) {
      return fout(`Geen rijschool gevonden voor ${school_id != null ? `id ${school_id}` : `"${naam}"`}.`);
    }
    if (rijen.length > 1) {
      return antwoord({
        melding: 'Meerdere rijscholen passen bij deze zoekopdracht. Kies er een op id.',
        gevonden: rijen.map((r) => ({ school_id: r.id, naam: r.name, stad: toonNaam(r.city ?? '') })),
      });
    }

    const s = rijen[0];
    const details = s.exam_details_by_type?.[s.stats_exam_type ?? 'B']?.examInformation ?? [];

    return antwoord({
      school_id: s.id,
      naam: s.name,
      stad: s.city ? toonNaam(s.city) : null,
      provincie: s.service_province,
      examentype: s.stats_exam_type,
      alle_examentypes: s.exam_types,
      examens_totaal: s.total_exams,
      eerste_examens: s.total_exams_first,
      herexamens: s.total_exams_retake,
      slagingspercentage: s.success_percentage,
      slagingspercentage_eerste_examen: s.success_percentage_first,
      slagingspercentage_herexamen: s.success_percentage_retake,
      gemiddelde_examencentrum: s.location_avg_percentage,
      per_examencentrum: (Array.isArray(details) ? details : []).map((loc: any) => ({
        centrum: loc.cbrLocation ?? loc.cbrLocationShortName,
        eerste_examens: loc.firstAttempts,
        eerste_percentage: loc.successfulFirstAttemptsPercentage,
        herexamens: loc.retakeAttempts,
        herexamen_percentage: loc.successfulSecondAttemptsPercentage,
        gemiddelde_van_dit_centrum: loc.locationSuccessfulPercentage,
      })),
      opgehaald_op: s.scraped_at,
      pagina: schoolUrl(s),
      let_op:
        'slagingspercentage_eerste_examen neemt de hoogste locatiescore en valt daardoor '
        + 'hoger uit voor scholen die op meerdere centra examineren. Voor een gewogen cijfer: '
        + 'gebruik cijfers_over_tijd, of reken zelf uit per_examencentrum na.',
    });
  },
);

server.registerTool(
  'cijfers_over_tijd',
  {
    title: 'Examencijfers over tijd',
    description:
      'De tijdreeks van CBR-cijfers voor één rijschool. Het CBR publiceert zelf geen historie: '
      + 'dit is opgebouwd uit wekelijkse metingen door Ribba, dus de reeks begint bij de eerste '
      + 'meting en niet bij het begin van de rijschool. Deze cijfers zijn gewogen naar het '
      + 'aantal examens per locatie.',
    inputSchema: {
      school_id: z.number().int().describe('Het Ribba-id van de rijschool.'),
      categorie: z.string().optional().describe('Rijbewijscategorie, standaard B (auto).'),
    },
  },
  async ({ school_id, categorie: code = 'B' }) => {
    const cat = categorie(code);
    if (!cat) return fout(`Onbekende categorie "${code}". Kies uit: ${CODES.join(', ')}.`);

    const rijen = await selecteerAlles<any>('cbr_exam_snapshots', {
      select: 'snapshot_date,exam_type,all_attempts,success_pct,first_attempts,'
        + 'first_success_pct,retake_attempts,retake_success_pct',
      school_id: `eq.${school_id}`,
      exam_type: `eq.${cat.code}`,
      order: 'snapshot_date.asc',
    });

    if (rijen.length === 0) {
      return fout(
        `Nog geen metingen voor rijschool ${school_id} in categorie ${cat.code}. `
        + 'De reeks wordt wekelijks aangevuld.',
      );
    }

    return antwoord({
      school_id,
      categorie: cat.code,
      metingen: rijen.length,
      eerste_meting: rijen[0].snapshot_date,
      laatste_meting: rijen[rijen.length - 1].snapshot_date,
      reeks: rijen.map((r) => ({
        datum: r.snapshot_date,
        examens: r.all_attempts,
        slagingspercentage: r.success_pct,
        eerste_examens: r.first_attempts,
        eerste_percentage: r.first_success_pct,
        herexamens: r.retake_attempts,
        herexamen_percentage: r.retake_success_pct,
      })),
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
