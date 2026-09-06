# cbr-mcp

Een MCP-server met de slagingspercentages en examencijfers van het CBR: per rijschool, per examencentrum, per stad en per provincie. Gratis, zonder account en zonder sleutel.

Het CBR publiceert zijn cijfers per rijschool, als losse momentopname. Wie het andersom wil zien, per examencentrum of per stad, of wie wil weten hoe een cijfer zich over de tijd ontwikkelt, moet dat zelf opbouwen. Dat is precies wat deze server teruggeeft.

Gemaakt door [Ribba](https://ribba.nl).

## Installeren

Voeg de server toe aan je MCP-client. Er is geen sleutel nodig.

### Claude Code

```bash
claude mcp add cbr -- npx -y @ribba/cbr-mcp
```

### Claude Desktop, Cursor, Windsurf en andere clients

In `claude_desktop_config.json` of het equivalent van je client:

```json
{
  "mcpServers": {
    "cbr": {
      "command": "npx",
      "args": ["-y", "@ribba/cbr-mcp"]
    }
  }
}
```

## Wat je kunt vragen

- Wat is het landelijk slagingspercentage voor het autoexamen?
- Welk examencentrum heeft het hoogste slagingspercentage, en welk het laagste?
- Waar zit examencentrum Den Bosch en hoe parkeer ik daar?
- Wat zijn de tien beste rijscholen in Rotterdam, gemeten aan eerste examens?
- Hoe doet rijschool 883 het ten opzichte van het examencentrum waar hij rijdt?
- In welke provincie slaag je het vaakst in één keer?

## Gereedschappen

| Naam | Wat het teruggeeft |
| --- | --- |
| `rijbewijscategorieen` | De categorieën waarvoor het CBR cijfers publiceert, met per categorie wat het examen meet. |
| `landelijke_cijfers` | Het landelijk gemiddelde, het aantal rijscholen met cijfers en het totaal aantal examens. |
| `examencentra` | Alle 54 CBR-examencentra met hun cijfers, adres en examenaantal. |
| `examencentrum` | Eén centrum in detail: adres, parkeren, eerste examens en herexamens, en de ranglijst van rijscholen. |
| `ranglijst` | De best scorende rijscholen, landelijk of binnen één stad of provincie. |
| `cijfers_per_gebied` | Het gemiddelde per provincie, of per stad binnen één provincie. |
| `school_cijfers` | De cijfers van één rijschool, met de uitsplitsing per examencentrum. |
| `cijfers_over_tijd` | De tijdreeks van wekelijkse metingen voor één rijschool. |

Alles gaat standaard over categorie B, de personenauto. Voor motor, bromfiets, aanhanger, vrachtwagen, bus of tractor geef je `categorie` mee: `AVB`, `AVD`, `AM`, `BE`, `C`, `CE`, `D` of `T`.

## De cijfers goed lezen

Een slagingspercentage is een breuk, en een breuk over weinig examens zegt weinig. Elke uitvoer bevat daarom het aantal examens waarop een percentage rust. De ranglijsten hanteren een drempel: minstens honderd eerste examens voor een landelijke notering, minstens vijfentwintig binnen een stad of examencentrum.

Verder is er niet één slagingspercentage maar drie, en ze meten iets anders:

- **Eerste examen.** Het aandeel kandidaten dat in één keer slaagt. Dit is het cijfer waar het meestal om gaat.
- **Herexamen.** Het aandeel dat bij een tweede of latere poging slaagt.
- **Gemiddelde van het examencentrum.** Wat álle rijscholen op dat centrum halen. Dit is een eerlijker ijkpunt dan het landelijk gemiddelde: het ene centrum is strenger dan het andere, en een school die op een streng centrum rijdt wordt anders onterecht afgestraft.

Eén ding om op te letten bij `school_cijfers`: het veld `slagingspercentage_eerste_examen` komt zo uit de CBR-publicatie en neemt de hoogste locatiescore. Voor een rijschool die op meerdere centra examineert valt dat cijfer te hoog uit. Het veld `per_examencentrum` in dezelfde uitvoer bevat de losse cijfers, en `cijfers_over_tijd` geeft de naar examenaantal gewogen variant.

## Waar de gegevens vandaan komen

De cijfers komen uit de openbare CBR-publicatie per rijschool en worden wekelijks opgehaald. De examencentra worden hier opgeteld uit die publicatie: het CBR levert de uitsplitsing per centrum alleen als bijvangst bij een rijschool.

Twee dingen zijn afgeleid en geen CBR-gegeven. De coördinaten van een examencentrum zijn het zwaartepunt van de rijscholen die er examen doen, want het CBR publiceert geen coördinaten; het adres in dezelfde uitvoer is wél het echte pand. En de tijdreeks in `cijfers_over_tijd` begint bij de eerste meting van Ribba, niet bij het begin van de rijschool: het CBR publiceert geen historie.

## Instellingen

De server praat standaard met de publieke leesomgeving van Ribba. Wie een eigen kopie draait, zet twee omgevingsvariabelen:

| Variabele | Standaard |
| --- | --- |
| `RIBBA_SUPABASE_URL` | De publieke Ribba-database |
| `RIBBA_SUPABASE_ANON_KEY` | De publieke leessleutel |

## Zelf draaien

```bash
npm install
npm run build
node dist/index.js
```

## Licentie

De code staat onder de MIT-licentie. De examencijfers zijn openbare CBR-gegevens; de bewerking en samenstelling door Ribba staan onder [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Verwijs bij hergebruik naar https://ribba.nl.

## Verwant

- [rijschool-mcp](https://github.com/RibbaBV/rijschool-mcp) voor de rijscholen zelf: adressen, prijzen, beoordelingen en dekkingsgebied.
- [theorie-mcp](https://github.com/RibbaBV/theorie-mcp) voor de theorie: hoofdstukken, verkeersborden, begrippen en wetsartikelen.

Vragen of iets kapot? [team@ribba.nl](mailto:team@ribba.nl) of open een issue.
