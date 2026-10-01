// Wiederholungskarten zum METAR, die jedes Mal neu erzeugt werden.
// Die Flugplatzdaten (content/plaetze.json) werden von module.js übergeben.
import { zerlegen } from './metar.js';
import { metarErzeugen } from './erzeugen.js';
import { entschluesselnFragen, entscheidungsFrage, szenarioMetar, gruppenAnzeige } from './aufgaben.js';

export const KUERZEL = [
  ['FEW', 'Wenige Wolken (1–2 Achtel)'],
  ['SCT', 'Aufgelockert (3–4 Achtel)'],
  ['BKN', 'Durchbrochen (5–7 Achtel)'],
  ['OVC', 'Bedeckt (8 Achtel)'],
  ['NSC', 'Keine signifikante Bewölkung'],
  ['NCD', 'Keine Wolken erkannt (automatische Station)'],
  ['VV', 'Vertikalsicht'],
  ['CB', 'Cumulonimbus (Gewitterwolke)'],
  ['TCU', 'Mächtige Quellwolke (Towering Cumulus)'],
  ['NOSIG', 'Keine wesentliche Änderung erwartet'],
  ['BECMG', 'Dauerhafte Änderung erwartet'],
  ['TEMPO', 'Vorübergehende Änderung erwartet'],
  ['FM', 'Ab (Uhrzeit)'],
  ['TL', 'Bis (Uhrzeit)'],
  ['RE', 'Kürzlich aufgetretenes Wetter'],
  ['VRB', 'Wechselnde Windrichtung'],
  ['G', 'Böen'],
  ['VC', 'In der Umgebung des Flugplatzes'],
  ['BR', 'Feuchter Dunst'],
  ['HZ', 'Trockener Dunst'],
  ['FG', 'Nebel'],
  ['RA', 'Regen'],
  ['DZ', 'Sprühregen'],
  ['SN', 'Schnee'],
  ['GR', 'Hagel'],
  ['SH', 'Schauer'],
  ['TS', 'Gewitter'],
  ['FZ', 'Gefrierend'],
  ['NSW', 'Keine signifikanten Wettererscheinungen mehr'],
  ['AUTO', 'Automatisch erstellte Meldung'],
  ['Z', 'Zeitangabe in UTC'],
  ['Q', 'QNH in Hektopascal folgt'],
];

export function erstelleGeneratoren(daten) {
  /** Eine Frage aus Stufe 2 zu einem zufälligen METAR, gefiltert nach Thema. */
  const ausMetar = (z, stufen, filter) => {
    for (let versuch = 0; versuch < 40; versuch++) {
      const { text } = metarErzeugen(z, { stufe: z.wahl(stufen) });
      const passend = entschluesselnFragen(z, text).filter(filter);
      if (passend.length) return z.wahl(passend);
    }
    throw new Error('Keine passende Frage gefunden');
  };
  const markiertTyp = (typen) => (f) => f.gruppen.some((g) => g.markiert && typen.includes(g.typ));

  const entscheidung = (z, art, platzFilter = () => true) => {
    for (let versuch = 0; versuch < 60; versuch++) {
      const platz = z.wahl(daten.plaetze.filter(platzFilter));
      const frage = entscheidungsFrage(art, platz, daten.flugzeug, szenarioMetar(z, platz).text);
      if (frage) return frage;
    }
    throw new Error(`Keine Entscheidungsfrage „${art}“ gefunden`);
  };

  return {
    kuerzel(z) {
      const [kuerzel, bedeutung] = z.wahl(KUERZEL);
      return {
        typ: 'auswahl',
        frage: `Was bedeutet **${kuerzel}** im METAR?`,
        richtig: bedeutung,
        falsch: z.ziehen(KUERZEL.filter(([k]) => k !== kuerzel), 3).map(([, b]) => b),
      };
    },

    gruppe(z) {
      const { text } = metarErzeugen(z, { stufe: z.ganz(2, 5) });
      const gruppen = zerlegen(text);
      const kandidaten = gruppen.map((g, i) => i).filter((i) => !['kennung', 'station', 'zeit', 'zusatz'].includes(gruppen[i].typ));
      const i = z.wahl(kandidaten);
      const richtig = gruppen[i].bedeutung;
      // Falsche Antworten: Bedeutungen derselben Gruppenart aus anderen METARs
      const falsch = [];
      for (let versuch = 0; versuch < 80 && falsch.length < 3; versuch++) {
        const anderes = zerlegen(metarErzeugen(z, { stufe: z.ganz(1, 5) }).text).filter((g) => g.typ === gruppen[i].typ);
        for (const g of anderes) if (g.bedeutung !== richtig && !falsch.includes(g.bedeutung) && falsch.length < 3) falsch.push(g.bedeutung);
      }
      if (falsch.length === 0) falsch.push('Diese Gruppe hat keine Bedeutung');
      return { typ: 'auswahl', frage: `Was bedeutet die markierte Gruppe **${gruppen[i].text}**?`, gruppen: gruppenAnzeige(gruppen, [i]), richtig, falsch };
    },

    wind: (z) => ausMetar(z, [1, 2, 4, 5], markiertTyp(['wind', 'windvariabel'])),
    sicht: (z) => ausMetar(z, [2, 3, 4, 5], markiertTyp(['sicht', 'cavok', 'rvr'])),
    wetter: (z) => ausMetar(z, [3, 4, 5], markiertTyp(['wetter'])),
    wolken: (z) => ausMetar(z, [2, 3, 4, 5], markiertTyp(['wolken'])),
    temperatur: (z) => ausMetar(z, [1, 2, 3, 4, 5], markiertTyp(['temperatur', 'qnh'])),
    trend: (z) => ausMetar(z, [3, 4, 5], (f) => f.gruppen.some((g) => g.markiert && g.imTrend)),

    pistenwahl: (z) => entscheidung(z, 'pistenwahl'),
    seitenwind: (z) => entscheidung(z, 'seitenwind'),
    boeen: (z) => entscheidung(z, 'boeen'),
    kontrollzone: (z) => entscheidung(z, 'luftraum', (p) => p.luftraum === 'CTR'),
    platzrunde: (z) => entscheidung(z, 'luftraum', (p) => p.luftraum !== 'CTR'),
  };
}
