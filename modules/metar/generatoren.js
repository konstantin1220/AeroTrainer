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

// ---------- TAF: frei erfundene Vorhersagen für die Übungsplätze ----------

const zwei = (n) => String(n).padStart(2, '0');

/** Erzeugt einen kurzen TAF mit einer Änderungsgruppe. Zeiten als Stunden ab Mitternacht des Ausgabetags. */
export function tafErzeugen(z) {
  const station = z.wahl(['XMUS', 'XALT', 'XBER']);
  const tag = z.ganz(1, 27);
  const beginn = z.wahl([6, 9, 12, 15, 18]);
  const dauer = z.wahl([9, 9, 24]);
  // Tag und Stunde; Mitternacht am Ende eines Zeitraums wird wie im TAF üblich als 24 des Vortags geschrieben
  const ddhh = (h, ende = false) => (ende && h % 24 === 0 ? `${zwei(tag + h / 24 - 1)}24` : `${zwei(tag + Math.floor(h / 24))}${zwei(h % 24)}`);
  const art = z.wahl(['TEMPO', 'BECMG', 'PROB30', 'PROB40', 'FM']);
  const von = beginn + z.ganz(1, dauer - 4);
  const bis = von + (art === 'BECMG' ? 2 : z.ganz(2, 4));
  const wind = `${zwei(z.ganz(20, 30))}0${zwei(z.ganz(6, 14))}KT`;
  const basis = `${wind} 9999 SCT0${z.ganz(30, 45)}`;
  const gruppe = {
    TEMPO: `TEMPO ${ddhh(von)}/${ddhh(bis, true)} 4000 SHRA BKN0${z.ganz(12, 18)}`,
    BECMG: `BECMG ${ddhh(von)}/${ddhh(bis, true)} ${zwei(z.ganz(31, 35))}0${zwei(z.ganz(15, 22))}KT`,
    PROB30: `PROB30 ${ddhh(von)}/${ddhh(bis, true)} 0800 FG BKN002`,
    PROB40: `PROB40 TEMPO ${ddhh(von)}/${ddhh(bis, true)} 3000 TSRA BKN015CB`,
    FM: `FM${ddhh(von)}00 ${zwei(z.ganz(31, 35))}0${zwei(z.ganz(8, 14))}KT 6000 -RA BKN0${z.ganz(15, 25)}`,
  }[art];
  const text = `TAF ${station} ${zwei(tag)}${zwei(beginn - 1)}00Z ${ddhh(beginn)}/${ddhh(beginn + dauer, true)} ${basis} ${gruppe}`;
  return { text, station, tag, beginn, ende: beginn + dauer, art, von, bis: art === 'FM' ? beginn + dauer : bis, ddhh };
}

/** „vom 2. um 12:00 UTC bis zum 2. um 21:00 UTC“ */
const zeitraumText = (tag, von, bis) => `${zeitText(tag, von).replace(/^am/, 'vom')} bis ${zeitText(tag, bis).replace(/^am/, 'zum')}`;
const zeitText = (tag, h) => (h > 0 && h % 24 === 0 ? `am ${tag + h / 24 - 1}. um 24:00 UTC (Mitternacht)` : `am ${tag + Math.floor(h / 24)}. um ${zwei(h % 24)}:00 UTC`);

function tafFrage(z) {
  const t = tafErzeugen(z);
  const art = z.wahl(t.art === 'BECMG' ? ['ende', 'bedeutung'] : ['ende', 'gilt', 'bedeutung']);
  if (art === 'ende') {
    const ende = t.ddhh(t.ende, true);
    const richtig = zeitText(t.tag, t.ende);
    const falsch = [...new Set([`am ${t.tag}. um ${ende.slice(0, 2)}:${ende.slice(2)} UTC`, zeitText(t.tag, t.ende - 1), zeitText(t.tag, t.ende + 1), `${t.ende - t.beginn} Stunden nach dem Abflug`])].filter((f) => f !== richtig).slice(0, 3);
    return {
      typ: 'auswahl', code: t.text, frage: 'Bis wann gilt dieser TAF?', richtig, falsch,
      rechenweg: [
        'Der Gültigkeitszeitraum steht direkt nach der Ausgabezeit: zweimal **Tag und Stunde** (UTC) – keine Minuten.',
        `${t.ddhh(t.beginn)}/${ende}: Beginn am ${t.ddhh(t.beginn).slice(0, 2)}. um ${t.ddhh(t.beginn).slice(2)} Uhr, Ende am ${ende.slice(0, 2)}. um ${ende.slice(2)} Uhr.`,
        `Ende der Gültigkeit: **${richtig}**.`,
      ],
      erklaerung: `Der Gültigkeitszeitraum steht nach der Ausgabezeit: ${t.ddhh(t.beginn)}/${ende} heißt ${zeitraumText(t.tag, t.beginn, t.ende)}. Die vier Ziffern sind Tag und Stunde – keine Uhrzeit mit Minuten.`,
    };
  }
  if (art === 'gilt') {
    const drin = z.janein();
    const draussen = [];
    for (let h = t.beginn; h < t.ende; h++) if (h < t.von || h > t.bis) draussen.push(h);
    const stunde = drin || !draussen.length ? z.ganz(t.von, t.bis - 1) : z.wahl(draussen);
    const name = t.art === 'FM' ? 'die Wetterangaben nach FM' : t.art === 'PROB40' ? 'die Gruppe PROB40 TEMPO' : `die ${t.art}-Gruppe`;
    const imFenster = stunde >= t.von && stunde < t.bis;
    return {
      typ: 'wahrfalsch', code: t.text,
      aussage: `${zeitText(t.tag, stunde).replace(/^am/, 'Am')} betrifft dich ${name}.`,
      richtig: imFenster,
      rechenweg: t.art === 'FM'
        ? [`FM${t.ddhh(t.von)}00 heißt: **ab** dem ${t.tag + Math.floor(t.von / 24)}. um ${zwei(t.von % 24)}:00 UTC bis zum Ende des TAF.`, `${zwei(stunde % 24)}:00 UTC liegt ${imFenster ? '**danach** – die Gruppe betrifft dich' : '**davor** – noch gilt das Grundwetter'}.`]
        : [`Der Zeitraum der Gruppe: ${t.ddhh(t.von)}/${t.ddhh(t.bis, true)} → ${zeitraumText(t.tag, t.von, t.bis)}.`, `${zeitText(t.tag, stunde).replace(/^am /, '')} liegt ${imFenster ? '**innerhalb** – die Gruppe betrifft dich' : '**außerhalb** – dann gilt das Grundwetter'}.`],
      erklaerung: t.art === 'FM'
        ? `FM${t.ddhh(t.von)}00 heißt: ab dem ${t.tag + Math.floor(t.von / 24)}. um ${zwei(t.von % 24)}:00 UTC gilt das neue Wetter bis zum Ende des TAF.`
        : `Der Zeitraum ${t.ddhh(t.von)}/${t.ddhh(t.bis, true)} reicht ${zeitraumText(t.tag, t.von, t.bis)} – danach gilt wieder das Grundwetter.`,
    };
  }
  const BEDEUTUNG = {
    TEMPO: 'Im angegebenen Zeitraum zeitweise Regenschauer mit 4 km Sicht und tieferen Wolken',
    BECMG: 'Im angegebenen Zeitraum dreht und frischt der Wind dauerhaft auf',
    PROB30: 'Mit 30 % Wahrscheinlichkeit Nebel mit 800 m Sicht im angegebenen Zeitraum',
    PROB40: 'Mit 40 % Wahrscheinlichkeit zeitweise Gewitter im angegebenen Zeitraum',
    FM: 'Ab der angegebenen Zeit gilt vollständig neues Wetter mit Regen und 6 km Sicht',
  };
  return {
    typ: 'auswahl', code: t.text, frage: 'Was sagt die Änderungsgruppe am Ende dieses TAF?',
    richtig: BEDEUTUNG[t.art],
    falsch: Object.entries(BEDEUTUNG).filter(([k]) => k !== t.art).map(([, b]) => b).slice(0, 3),
    erklaerung: { TEMPO: 'TEMPO = vorübergehend: Die Werte treten zeitweise auf, danach gilt wieder das Grundwetter.', BECMG: 'BECMG = becoming: Das Wetter ändert sich im Zeitraum dauerhaft.', PROB30: 'PROB30 = Wahrscheinlichkeit 30 %.', PROB40: 'PROB40 TEMPO = mit 40 % Wahrscheinlichkeit vorübergehend.', FM: 'FM = from: Ab dieser Zeit ersetzt das neue Wetter alle bisherigen Angaben.' }[t.art],
  };
}

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

    taf: (z) => tafFrage(z),

    pistenwahl: (z) => entscheidung(z, 'pistenwahl'),
    seitenwind: (z) => entscheidung(z, 'seitenwind'),
    boeen: (z) => entscheidung(z, 'boeen'),
    kontrollzone: (z) => entscheidung(z, 'luftraum', (p) => p.luftraum === 'CTR'),
    platzrunde: (z) => entscheidung(z, 'luftraum', (p) => p.luftraum !== 'CTR'),
  };
}
