/**
 * De rijbewijscategorieën waarvoor het CBR per rijschool cijfers publiceert.
 *
 * De code is de sleutel in exam_details_by_type. AM2 en DE staan er bewust
 * niet bij: AM2 is een aparte sleutel naast AM waarvan de afbakening onduidelijk
 * is, en DE heeft te weinig examens om een percentage op te bouwen.
 */
export type Categorie = {
  code: string;
  naam: string;
  /** Wat het cijfer precies meet, zodat niemand het verkeerd leest. */
  toelichting: string;
};

export const CATEGORIEEN: Categorie[] = [
  { code: 'B', naam: 'Auto', toelichting: 'Het praktijkexamen voor de personenauto.' },
  {
    code: 'AVB',
    naam: 'Motor, voertuigbeheersing',
    toelichting:
      'Het AVB is het eerste motorexamen: voertuigbeheersing op het terrein van het '
      + 'examencentrum, zonder verkeer.',
  },
  {
    code: 'AVD',
    naam: 'Motor, verkeersdeelname',
    toelichting: 'Het AVD is het tweede motorexamen: rijden in het verkeer.',
  },
  { code: 'AM', naam: 'Bromfiets', toelichting: 'Het praktijkexamen voor de bromfiets.' },
  { code: 'BE', naam: 'Aanhanger', toelichting: 'Het praktijkexamen voor rijden met een zware aanhanger.' },
  { code: 'C', naam: 'Vrachtwagen', toelichting: 'Het praktijkexamen voor de vrachtwagen.' },
  { code: 'CE', naam: 'Vrachtwagen met aanhanger', toelichting: 'Het praktijkexamen voor de vrachtwagencombinatie.' },
  { code: 'D', naam: 'Bus', toelichting: 'Het praktijkexamen voor de autobus.' },
  { code: 'T', naam: 'Tractor', toelichting: 'Het praktijkexamen voor de land- en bosbouwtrekker.' },
];

export const CODES = CATEGORIEEN.map((c) => c.code);

export function categorie(code: string): Categorie | undefined {
  return CATEGORIEEN.find((c) => c.code.toUpperCase() === code.toUpperCase());
}
