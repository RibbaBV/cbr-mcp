/**
 * Adres en parkeerinformatie per examencentrum, van het CBR zelf.
 *
 * Het CBR publiceert dit als gestructureerde gegevens op zijn locatiepagina's.
 * Dat overnemen scheelt de bezoeker een klik naar buiten, en het is de bron die
 * ertoe doet: een adres van horen zeggen zet iemand op de verkeerde plek.
 *
 * Opgehaald op 21 augustus 2026.
 */
export type CentrumAdres = {
  straat: string; postcode: string; plaats: string | null; parkeren: string | null;
};

export const CENTRUM_ADRES: Record<string, CentrumAdres> = {
  'herten-roermond': { straat: "Oude Trambaan  27", postcode: "6049 GT", plaats: "Herten (Roermond)", parkeren: "Voor de juiste route naar locatie Herten kunt u de navigatie instellen op: Sodaweg 2, Herten. Aan het einde van de Sodaweg rijdt u het parkeerterrein op. Dit terrein is voorzien van voldoende CBR-parkeervakken. Rolstoeltoegankelijk Dit examencentrum heeft geen automatische deuren, maar is voor de rest wel rolstoeltoegankelijk." },
  'alkmaar': { straat: "Olympiaweg 28", postcode: "1816 MJ", plaats: "Alkmaar", parkeren: "Parkeren kan op de parkeerplaats van McDonald’s aan de overkant van het examencentrum. Ik ga een rijtest doen Alleen als u voor een rijtest naar het CBR komt, mag u parkeren op het parkeerterrein voor examenvoertuigen. Dit terrein is vlakbij de hoofdingang van het CBR. Rolstoeltoegankelijk Dit examencentrum heeft geen automatische deuren. Verder is het wel rolstoeltoegankelijk." },
  'almelo': { straat: "Bedrijvenpark Twente 305", postcode: "7602 KL", plaats: "Almelo", parkeren: null },
  'amsterdam': { straat: "Naritaweg 150", postcode: "1043 CA", plaats: "Amsterdam", parkeren: "Kom bij voorkeur met het openbaar vervoer. Er is een bushalte voor de deur en het examencentrum ligt op ongeveer 10 minuten loopafstand van station Amsterdam Sloterdijk. U kunt parkeren aan de achterzijde van het examencentrum of, bij drukte, bij voetbalvereniging SDW aan de Seineweg. Buiten het eigen terrein geldt betaald parkeren." },
  'apeldoorn': { straat: "Antillen 11", postcode: "7333 PE", plaats: "Apeldoorn", parkeren: null },
  'arnhem': { straat: "Wassenaarweg 20", postcode: "6843 NW", plaats: "Arnhem", parkeren: null },
  'assen': { straat: "Aziëweg 25", postcode: "9407 TC", plaats: "Assen", parkeren: null },
  'barendrecht': { straat: "Zwaalweg 1", postcode: "2991 ZC", plaats: "Barendrecht", parkeren: null },
  'bergen-op-zoom': { straat: "Gagelboslaan 162", postcode: "4623 AH", plaats: "Bergen op Zoom", parkeren: null },
  'berkel-enschot': { straat: "Bosscheweg 11", postcode: "5056 PP", plaats: "Berkel-Enschot", parkeren: null },
  'breda': { straat: "Bavelseparklaan 18", postcode: "4817 ZX", plaats: "Breda", parkeren: null },
  'den-bosch': { straat: "Hambakenwetering 13", postcode: "5231 DD", plaats: "Den Bosch", parkeren: null },
  'den-helder': { straat: "Nijverheidsweg 8", postcode: "1785 AA", plaats: "Den Helder", parkeren: null },
  'deventer': { straat: "Duisburgstraat 10", postcode: "7418 BK", plaats: "Deventer", parkeren: null },
  'doetinchem': { straat: "Koopmanslaan 3", postcode: "7005 BK", plaats: "Doetinchem", parkeren: "U kunt parkeren op het parkeerterrein. Ik ga een rijtest doen Alleen als u voor een rijtest naar het CBR komt, mag u parkeren op de parkeerplaats voor invaliden. Deze is vlakbij de hoofdingang. Rolstoeltoegankelijk Dit examencentrum heeft geen automatische deuren, maar is voor de rest wel rolstoeltoegankelijk." },
  'dordrecht': { straat: "Egstraat 4", postcode: "3319 LA", plaats: "Dordrecht", parkeren: null },
  'eemnes': { straat: "Bramenberg 6", postcode: "3755 BX", plaats: "Eemnes", parkeren: null },
  'eindhoven': { straat: "Hoevenweg 20", postcode: "5652 AW", plaats: "Eindhoven", parkeren: "Kom bij voorkeur met het openbaar vervoer. U kunt gratis parkeren op de gastenplekken op het CBR-parkeerterrein of, bij drukte, langs de openbare weg (Hoevenweg)." },
  'emmeloord': { straat: "Het Hooiveld 9", postcode: "8302 AE", plaats: "Emmeloord", parkeren: null },
  'emmen': { straat: "Nijbracht 112", postcode: "7821 CE", plaats: "Emmen", parkeren: null },
  'goes': { straat: "M.A. de Ruijterlaan 2", postcode: "4461 GE", plaats: "Goes", parkeren: "U kunt betaald parkeren op het Hollandiaplein naast het Stadskantoor. Ik ga een rijtest doen Alleen als u voor een rijtest naar het CBR komt, mag u gratis parkeren op een parkeerplaats voor examenvoertuigen. U vindt deze aan de achterkant van het Stadskantoor. Volg de borden Hollandiaplein. Rolstoeltoegankelijk Dit examencentrum is rolstoeltoegankelijk." },
  'gouda': { straat: "Zwolleweg 10", postcode: "2803 PS", plaats: "Gouda", parkeren: null },
  'groningen': { straat: "Protonstraat 3", postcode: "9743 AL", plaats: "Groningen", parkeren: null },
  'haarlem': { straat: "Professor Eijkmanlaan 2", postcode: "2035 XB", plaats: "Haarlem", parkeren: null },
  'harderwijk': { straat: "Tesselschadelaan 1", postcode: "3842 GA", plaats: "Harderwijk", parkeren: null },
  'heerenveen': { straat: "Businesspark Friesland-West 41", postcode: "8447 SL", plaats: "Heerenveen", parkeren: null },
  'hengelo': { straat: "Jan Tinbergenstraat 115", postcode: "7559 SP", plaats: "Hengelo (Overijssel)", parkeren: "Het examencentrum is goed bereikbaar. Parkeren kan buiten het bedrijventerrein. Afzetten en ophalen bij het examencentrum is wel mogelijk. Gezondheidsverklaring kopen U kunt bij dit examencentrum geen Gezondheidsverklaring kopen. Koop uw Gezondheidsverklaring bij een ander examencentrum . Of koop het online via Mijn CBR ." },
  'hoogeveen': { straat: "Grote Beer 20", postcode: "7904 LW", plaats: "Hoogeveen", parkeren: null },
  'hoorn': { straat: "Holenweg 14", postcode: "1624 PB", plaats: "Hoorn", parkeren: "Het examencentrum ligt naast het parkeerterrein van zwembad De Waterhoorn. Vanaf Rijksweg A7 of vanuit Enkhuizen volgt u de borden 'De Waterhoorn.' Rolstoeltoegankelijk Dit examencentrum heeft geen automatische deuren. Verder is het wel rolstoeltoegankelijk." },
  'kerkrade': { straat: "Spekhofstraat 24", postcode: "6466 LZ", plaats: "Kerkrade", parkeren: null },
  'leeuwarden': { straat: "Douwe Tammingawei 30", postcode: "8914 BK", plaats: "Leeuwarden", parkeren: null },
  'leiden': { straat: "Smaragdlaan 99", postcode: "2332 JP", plaats: "Leiden", parkeren: "U kunt gratis parkeren in de parkeervakken met de letters ‘CBR’ op het parkeerterrein aan de Smaragdlaan 99 in Leiden. Rolstoeltoegankelijk Dit examencentrum heeft geen automatische deuren, maar is voor de rest wel rolstoeltoegankelijk." },
  'leusden': { straat: "Fokkerstraat 21", postcode: "3833 LD", plaats: "Leusden", parkeren: null },
  'maastricht': { straat: "Pierre de Coubertinweg 3", postcode: "6225 XT", plaats: "Maastricht", parkeren: null },
  'meppel': { straat: "Blankenstein 230", postcode: "7943 PG", plaats: "Meppel", parkeren: null },
  'mierlo': { straat: "Geldropseweg 10", postcode: "5731 AA", plaats: "Mierlo", parkeren: null },
  'nijmegen': { straat: "Wijchenseweg 2", postcode: "6537 TL", plaats: "Nijmegen", parkeren: "Route vanaf de snelweg (A73): U gaat de bij de eerste verkeerslichten naar rechts en gaat daarna gelijk weer rechtsaf. U rijdt de doodlopende weg in tot u bij het CBR bent." },
  'rijswijk': { straat: "Lange Kleiweg 30", postcode: "2288 GK", plaats: "Rijswijk", parkeren: null },
  'roosendaal-gesloten': { straat: "De Stok 12", postcode: "4703 SZ", plaats: "Roosendaal", parkeren: null },
  'rotterdam': { straat: "Noorderbocht 25", postcode: "3039 MA", plaats: "Rotterdam", parkeren: "Kom bij voorkeur met het openbaar vervoer. Er is beperkt parkeerruimte bij het examencentrum Rotterdam." },
  'schelluinen-gorinchem': { straat: "Sportlaan 2", postcode: "4209 AX", plaats: "Schelluinen", parkeren: null },
  'sneek': { straat: "Smidsstraat 6", postcode: "8601 WB", plaats: "Sneek", parkeren: null },
  'spijkenisse': { straat: "Curieweg 19", postcode: "3208 KJ", plaats: "Spijkenisse", parkeren: null },
  'terneuzen': { straat: "Handelspoort 3", postcode: "4538 BN", plaats: "Terneuzen", parkeren: null },
  'tiel': { straat: "Stephensonstraat 25", postcode: "4004 JA", plaats: "Tiel", parkeren: null },
  'urmond': { straat: "Mauritslaan 49", postcode: "6129 EL", plaats: "Urmond", parkeren: null },
  'utrecht': { straat: "Mississippidreef 151", postcode: "3565 CE", plaats: "Utrecht", parkeren: null },
  'venlo': { straat: "Parlevinkerweg 1", postcode: "5928 NV", plaats: "Venlo", parkeren: null },
  'vlissingen': { straat: "Marie Curieweg 5", postcode: "4389 WB", plaats: "Ritthem", parkeren: null },
  'weert': { straat: "Risseweg 46", postcode: "6004 RM", plaats: "Weert", parkeren: null },
  'winschoten': { straat: "Zeefbaan 20", postcode: "9672 BN", plaats: "Winschoten", parkeren: null },
  'zaandam': { straat: "Kuilpad 1", postcode: "1509 AS", plaats: "Zaandam", parkeren: null },
  'zoetermeer': { straat: "Zilverstraat 40", postcode: "2718 RK", plaats: "Zoetermeer", parkeren: null },
  'zwolle': { straat: "Branderweg 15", postcode: "8042 PD", plaats: "Zwolle", parkeren: "Kom bij voorkeur met het openbaar vervoer. Er is beperkt parkeerruimte bij het examencentrum Zwolle. Parkeren kan bij Punterweg 9-11 (op 200 meter afstand)." },
};
