import test, { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './client.mjs';

// Deze tests praten met de echte database. Eén server voor alle tests, want
// elke start haalt de zwaarste kolom van de tabel op.
let server;
before(async () => { server = await startServer(); });
after(async () => { await server?.stop(); });

const percentage = (n, waar) => {
  assert.equal(typeof n, 'number', `${waar} is geen getal`);
  assert.ok(n >= 0 && n <= 100, `${waar} ligt buiten 0-100: ${n}`);
};

describe('protocol', () => {
  test('acht gereedschappen, allemaal met beschrijving en schema', async () => {
    const lijst = await server.gereedschappen();
    assert.equal(lijst.length, 8);
    for (const g of lijst) {
      assert.ok(g.description?.length > 40, `${g.name} heeft een te dunne beschrijving`);
      assert.equal(g.inputSchema.type, 'object');
    }
  });

  test('onbekend gereedschap geeft een fout', async () => {
    assert.ok((await server.roep('nietbestaand')).fout);
  });
});

describe('landelijk', () => {
  test('negen rijbewijscategorieën met een toelichting', async () => {
    const { data } = await server.roep('rijbewijscategorieen');
    assert.equal(data.categorieen.length, 9);
    assert.ok(data.categorieen.every((c) => c.toelichting.length > 20));
    assert.ok(data.categorieen.some((c) => c.code === 'B'));
  });

  test('de landelijke cijfers zijn intern consistent', async () => {
    const { data } = await server.roep('landelijke_cijfers');
    assert.ok(data.examencentra > 40, `te weinig centra: ${data.examencentra}`);
    assert.ok(data.rijscholen_met_cijfers > 1000);
    assert.equal(data.examens_totaal, data.eerste_examens + data.herexamens);
    percentage(data.slagingspercentage_eerste_examen, 'eerste examen');
    percentage(data.slagingspercentage_herexamen, 'herexamen');
  });

  test('een andere categorie geeft andere aantallen', async () => {
    const { data: auto } = await server.roep('landelijke_cijfers');
    const { data: motor } = await server.roep('landelijke_cijfers', { categorie: 'AVB' });
    assert.notEqual(auto.examens_totaal, motor.examens_totaal);
    assert.equal(motor.categorie.code, 'AVB');
  });

  test('een onzin-categorie noemt de geldige codes', async () => {
    const r = await server.roep('landelijke_cijfers', { categorie: 'XYZ' });
    assert.ok(r.fout);
    assert.match(r.tekst, /\bB\b/);
  });
});

describe('examencentra', () => {
  test('alle centra hebben een slug, cijfers en een link', async () => {
    const { data } = await server.roep('examencentra');
    assert.ok(data.aantal > 40);
    for (const c of data.centra) {
      assert.ok(c.slug && c.korte_naam, 'centrum zonder naam');
      assert.equal(c.examens, c.eerste_examens + c.herexamens);
      assert.match(c.ribba_url, /^https:\/\/ribba\.nl\/examencentra\//);
      if (c.eerste_percentage != null) percentage(c.eerste_percentage, `${c.slug} eerste`);
    }
  });

  test('gesorteerd op examenaantal, aflopend', async () => {
    const { data } = await server.roep('examencentra');
    const n = data.centra.map((c) => c.examens);
    assert.deepEqual(n, [...n].sort((a, b) => b - a));
  });

  test('de parkeertekst blijft uit het overzicht', async () => {
    const { data } = await server.roep('examencentra');
    assert.ok(data.centra.every((c) => !c.adres || !('parkeren' in c.adres)));
  });

  test('één centrum geeft adres, parkeren en een ranglijst', async () => {
    const { data } = await server.roep('examencentrum', { naam: 'amsterdam', ranglijst_limiet: 5 });
    assert.equal(data.slug, 'amsterdam');
    assert.ok(data.adres.straat, 'adres ontbreekt');
    assert.ok(data.adres.parkeren, 'parkeerinformatie ontbreekt');
    assert.equal(data.ranglijst.length, 5);
    assert.deepEqual(data.ranglijst.map((s) => s.positie), [1, 2, 3, 4, 5]);
    const pct = data.ranglijst.map((s) => s.percentage);
    assert.deepEqual(pct, [...pct].sort((a, b) => b - a), 'ranglijst niet aflopend');
  });

  test('de ranglijstdrempel wordt echt toegepast', async () => {
    const { data } = await server.roep('examencentrum', { naam: 'utrecht', ranglijst_limiet: 50 });
    assert.ok(data.ranglijst.every((s) => s.examens >= 25),
      'een school onder de drempel staat in de ranglijst');
  });

  test('een onbekend centrum somt de bestaande op', async () => {
    const r = await server.roep('examencentrum', { naam: 'lutjebroek' });
    assert.ok(r.fout);
    assert.match(r.tekst, /amsterdam/);
  });
});

describe('ranglijsten', () => {
  test('landelijk: drempel van honderd, aflopend, met werkende links', async () => {
    const { data } = await server.roep('ranglijst', { limiet: 10 });
    assert.equal(data.minimum_examens, 100);
    assert.equal(data.ranglijst.length, 10);
    for (const s of data.ranglijst) {
      assert.ok(s.eerste_examens >= 100, `${s.naam} zit onder de drempel`);
      percentage(s.slagingspercentage_eerste_examen, s.naam);
      assert.match(s.pagina, /^https:\/\/ribba\.nl\/rijscholen\/[a-z-]+\/[^/]+\/[^/]+-\d+$/);
    }
    const pct = data.ranglijst.map((s) => s.slagingspercentage_eerste_examen);
    assert.deepEqual(pct, [...pct].sort((a, b) => b - a));
  });

  test('per stad geldt de lagere drempel en zit iedereen in die stad', async () => {
    const { data } = await server.roep('ranglijst', { stad: 'Utrecht', limiet: 10 });
    assert.equal(data.minimum_examens, 25);
    assert.ok(data.ranglijst.every((s) => s.stad === 'Utrecht'));
  });

  test('per provincie filtert op provincie', async () => {
    const { data } = await server.roep('ranglijst', { provincie: 'Zeeland', limiet: 10 });
    assert.ok(data.ranglijst.length > 0);
    assert.ok(data.ranglijst.every((s) => s.provincie === 'Zeeland'));
  });

  test('een stad die niet bestaat geeft uitleg in plaats van een lege lijst', async () => {
    const r = await server.roep('ranglijst', { stad: 'Atlantis' });
    assert.ok(r.fout);
    assert.match(r.tekst, /minimum_examens|schrijfwijze/);
  });
});

describe('gebieden en scholen', () => {
  test('twaalf provincies, aflopend op examens, met een link per provincie', async () => {
    const { data } = await server.roep('cijfers_per_gebied');
    assert.equal(data.aantal, 12);
    const n = data.gebieden.map((g) => g.examens);
    assert.deepEqual(n, [...n].sort((a, b) => b - a));
    for (const g of data.gebieden) {
      assert.match(g.pagina, /^https:\/\/ribba\.nl\/rijscholen\/[a-z-]+$/);
    }
  });

  test('met een provincie krijg je de steden erbinnen', async () => {
    const { data } = await server.roep('cijfers_per_gebied', { provincie: 'Zeeland' });
    assert.equal(data.niveau, 'stad');
    assert.ok(data.gebieden.some((g) => g.naam === 'Middelburg'));
    for (const g of data.gebieden) {
      assert.match(g.pagina, /^https:\/\/ribba\.nl\/rijscholen\/zeeland\/[a-z0-9-]+$/);
    }
  });

  test('de cijfers van één school kloppen met de uitsplitsing', async () => {
    const { data } = await server.roep('school_cijfers', { school_id: 883 });
    assert.equal(data.school_id, 883);
    assert.equal(data.examens_totaal, data.eerste_examens + data.herexamens);
    assert.ok(data.per_examencentrum.length > 0);
    const eerste = data.per_examencentrum.reduce((t, l) => t + (l.eerste_examens ?? 0), 0);
    assert.equal(eerste, data.eerste_examens, 'de som per centrum wijkt af van het totaal');
  });

  test('zoeken op een naam die vaker voorkomt vraagt om te kiezen', async () => {
    const { data } = await server.roep('school_cijfers', { naam: 'rijschool' });
    assert.ok(data.melding, 'geen keuzemelding bij een dubbelzinnige naam');
    assert.ok(data.gevonden.length > 1);
  });

  test('zonder id en zonder naam is het een fout', async () => {
    assert.ok((await server.roep('school_cijfers')).fout);
  });

  test('een onbekend id verzint niets', async () => {
    assert.ok((await server.roep('school_cijfers', { school_id: 99999999 })).fout);
  });

  test('de tijdreeks loopt op in de tijd', async () => {
    const { data, fout } = await server.roep('cijfers_over_tijd', { school_id: 6754 });
    if (fout) return; // nog geen metingen voor deze school is een geldige uitkomst
    const datums = data.reeks.map((r) => r.datum);
    assert.deepEqual(datums, [...datums].sort(), 'reeks niet chronologisch');
    assert.equal(data.eerste_meting, datums[0]);
    assert.equal(data.laatste_meting, datums[datums.length - 1]);
  });
});
