// Aufgaben rund ums METAR – reine Funktionen ohne Oberfläche (werden auch getestet).
//   entschluesselnFragen()  Stufe 2: Werte aus einem METAR herauslesen
//   bauenVergleichen()      Stufe 3: selbst geschriebenes METAR mit der Lösung vergleichen
//   szenarioErzeugen()      Stufe 4: Entscheidungsfragen zu einem fiktiven Flugplatz
import { zerlegen, auswerten, wetterText } from './metar.js';
import { metarErzeugen, LAGEN } from './erzeugen.js';

const RAD = Math.PI / 180;

const WETTER_POOL = ['-RA', 'RA', '+RA', '-SHRA', 'SHRA', '+SHRA', 'TSRA', '+TSRA', '-DZ', 'BR', 'FG', 'BCFG', 'MIFG', 'HZ', '-SN', 'SN', '-FZDZ', '-FZRA', 'VCSH', 'VCTS', 'GR', 'BLSN', 'DRSN', 'SHGS'];

/** Gruppen für die Anzeige als Chips, mit markierten Positionen. */
export function gruppenAnzeige(gruppen, markiert = []) {
  return gruppen.map((g, i) => ({ text: g.text, typ: g.typ, imTrend: g.imTrend, markiert: markiert.includes(i) }));
}

function verschiedene(richtig, kandidaten, anzahl = 3) {
  const liste = [];
  for (const k of kandidaten) {
    if (k && k !== richtig && !liste.includes(k)) liste.push(k);
    if (liste.length === anzahl) break;
  }
  return liste;
}

// ---------- Stufe 2: Entschlüsseln ----------

export function entschluesselnFragen(z, text) {
  const a = auswerten(text);
  const g = a.gruppen;
  const index = (typ) => g.findIndex((x) => x.typ === typ && !x.imTrend);
  const fragen = [];
  const neu = (markiert, frage) => fragen.push({ gruppen: gruppenAnzeige(g, markiert), ...frage });

  const wi = index('wind');
  const w = a.wind;
  if (w && w.staerke === 0) {
    neu([wi], { typ: 'auswahl', frage: 'Wie ist der Wind?', richtig: 'Windstille', falsch: ['Wind aus wechselnden Richtungen', 'Wind aus Norden mit 10 kt', 'Wind nicht gemessen'], erklaerung: '00000KT bedeutet Windstille.' });
  } else if (w?.vrb) {
    neu([wi], { typ: 'auswahl', frage: 'Woher weht der Wind?', richtig: 'Aus wechselnden Richtungen', falsch: ['Aus Norden', 'Aus Süden', 'Aus Westen'], erklaerung: 'VRB steht für variable – wechselnde Windrichtung, meist bei schwachem Wind.' });
    neu([wi], { typ: 'zahl', frage: 'Mit welcher mittleren Geschwindigkeit weht der Wind?', loesung: w.staerke, einheit: 'kt' });
  } else if (w) {
    neu([wi], { typ: 'zahl', frage: 'Aus welcher Richtung weht der Wind?', loesung: w.richtung, einheit: '°', kreis: true, erklaerung: `Die ersten drei Ziffern: Wind aus ${String(w.richtung).padStart(3, '0')}° (rechtweisend).` });
    neu([wi], { typ: 'zahl', frage: 'Mit welcher mittleren Geschwindigkeit weht der Wind?', loesung: w.staerke, einheit: 'kt' });
    if (w.boeen) neu([wi], { typ: 'zahl', frage: 'Wie stark sind die Böen?', loesung: w.boeen, einheit: 'kt', erklaerung: 'Die Zahl nach dem G gibt die Spitzenböen an.' });
  }

  if (a.windvariabel) {
    const { von, bis } = a.windvariabel;
    const vi = index('windvariabel');
    neu([vi], { typ: 'auswahl', frage: `Was bedeutet **${g[vi].text}**?`, richtig: `Die Windrichtung schwankt zwischen ${von}° und ${bis}°`, falsch: [`Der Wind dreht bis zum Abend von ${von}° auf ${bis}°`, `Böen kommen aus ${von}° bis ${bis}°`, `Die Sicht schwankt zwischen ${von} m und ${bis} m`] });
  }

  if (a.cavok) {
    neu([index('cavok')], { typ: 'auswahl', frage: 'Was bedeutet **CAVOK**?', richtig: 'Sicht 10 km oder mehr, keine Wolken unter 5000 ft, keine CB/TCU, kein signifikantes Wetter', falsch: ['Wolkenlos und windstill', 'Sicht mehr als 5 km, keine Wolken unter 1500 ft', 'Keine Wolken unter 10 000 ft und kein Niederschlag'] });
  } else if (a.sicht >= 10000) {
    neu([index('sicht')], { typ: 'auswahl', frage: 'Wie groß ist die Sicht?', richtig: '10 km oder mehr', falsch: ['9999 m – knapp unter 10 km', 'Unter 10 km', 'Sicht nicht gemessen'], erklaerung: '9999 steht für 10 km oder mehr.' });
  } else if (a.sicht !== null) {
    neu([index('sicht')], { typ: 'zahl', frage: 'Wie groß ist die vorherrschende Sicht?', loesung: a.sicht, einheit: 'm' });
  }

  const ri = index('rvr');
  if (ri >= 0) neu([ri], { typ: 'auswahl', frage: `Was bedeutet **${g[ri].text}**?`, richtig: g[ri].bedeutung, falsch: ['Piste gesperrt', 'Pistenzustand: nass', 'Windscherung auf der Piste'] });

  a.wetter.slice(0, 2).forEach((code) => {
    const wi2 = g.findIndex((x) => x.text === code && !x.imTrend);
    const richtig = code === 'NSW' ? g[wi2].bedeutung : wetterText(code);
    neu([wi2], { typ: 'auswahl', frage: `Was bedeutet **${code}**?`, richtig, falsch: verschiedene(richtig, z.mischen(WETTER_POOL).map(wetterText)) });
  });

  const wolkenIdx = g.map((x, i) => (x.typ === 'wolken' && !x.imTrend ? i : -1)).filter((i) => i >= 0);
  const vv = a.wolken.find((x) => x.menge === 'VV');
  if (vv) {
    neu(wolkenIdx, { typ: 'zahl', frage: 'Der Himmel ist nicht erkennbar. Wie groß ist die Vertikalsicht?', loesung: vv.hoehe, einheit: 'ft', erklaerung: 'VV gibt die Vertikalsicht in Hundert Fuß an.' });
  } else if (a.hauptwolkenuntergrenze !== null) {
    neu(wolkenIdx, { typ: 'zahl', frage: 'Wo liegt die Hauptwolkenuntergrenze (über Platzhöhe)?', loesung: a.hauptwolkenuntergrenze, einheit: 'ft', erklaerung: 'Die niedrigste Schicht mit BKN oder OVC ist die Hauptwolkenuntergrenze. Die drei Ziffern sind Hundert Fuß.' });
  } else if (a.wolken.some((x) => ['FEW', 'SCT'].includes(x.menge))) {
    const richtig = 'Keine – es gibt keine Schicht mit BKN oder OVC';
    neu(wolkenIdx, { typ: 'auswahl', frage: 'Wo liegt die Hauptwolkenuntergrenze?', richtig, falsch: verschiedene(richtig, a.wolken.filter((x) => x.hoehe).map((x) => `Bei ${x.hoehe} ft`).concat(['Bei 1500 ft', 'Bei 5000 ft'])), erklaerung: 'FEW und SCT bedecken höchstens 4 Achtel – sie zählen nicht als Hauptwolkenuntergrenze.' });
  }

  const ti = index('temperatur');
  if (ti >= 0) {
    neu([ti], { typ: 'zahl', frage: 'Wie hoch ist die Temperatur?', loesung: a.temperatur, einheit: '°C', erklaerung: 'Die Zahl vor dem Schrägstrich; M bedeutet minus.' });
    neu([ti], { typ: 'zahl', frage: 'Wie hoch ist der Taupunkt?', loesung: a.taupunkt, einheit: '°C', erklaerung: 'Die Zahl nach dem Schrägstrich; M bedeutet minus.' });
  }

  const qi = index('qnh');
  if (qi >= 0) neu([qi], { typ: 'zahl', frage: 'Welches QNH ist gemeldet?', loesung: a.qnh, einheit: 'hPa' });

  const tri = g.findIndex((x) => x.typ === 'trend');
  if (tri >= 0) {
    const BEDEUTUNG = { NOSIG: 'Keine wesentliche Änderung in den nächsten 2 Stunden', BECMG: 'Das Wetter ändert sich dauerhaft zu den folgenden Werten', TEMPO: 'Die folgenden Werte treten nur vorübergehend auf' };
    const richtig = BEDEUTUNG[g[tri].text];
    const markiert = g.map((x, i) => (x.imTrend ? i : -1)).filter((i) => i >= 0);
    neu(markiert, { typ: 'auswahl', frage: `Was sagt der Trend **${g[tri].text}** aus?`, richtig, falsch: [...Object.values(BEDEUTUNG).filter((b) => b !== richtig), 'So war das Wetter in den letzten 2 Stunden'] });
  }
  return fragen;
}

// ---------- Stufe 3: METAR bauen ----------

export function normalisieren(text) {
  return String(text).toUpperCase().replace(/=\s*$/, '').trim().split(/\s+/).filter(Boolean);
}

/** Vergleicht Eingabe und Lösung gruppenweise (längste gemeinsame Teilfolge). */
export function bauenVergleichen(eingabe, soll) {
  const a = normalisieren(eingabe);
  const b = normalisieren(soll);
  const tabelle = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      tabelle[i][j] = a[i] === b[j] ? tabelle[i + 1][j + 1] + 1 : Math.max(tabelle[i + 1][j], tabelle[i][j + 1]);
    }
  }
  const eingabeStatus = a.map((t) => ({ text: t, ok: false }));
  const sollStatus = b.map((t) => ({ text: t, ok: false }));
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { eingabeStatus[i].ok = true; sollStatus[j].ok = true; i++; j++; }
    else if (tabelle[i + 1][j] >= tabelle[i][j + 1]) i++;
    else j++;
  }
  const richtig = a.length === b.length && eingabeStatus.every((t) => t.ok);
  return { richtig, eingabe: eingabeStatus, soll: sollStatus };
}

/** Klartext-Beschreibung eines METARs für Stufe 3 (eine Zeile je Gruppe). */
export function beschreibung(text) {
  return zerlegen(text).map((g) => ({ typ: g.typ, text: g.bedeutung, imTrend: g.imTrend }));
}

// ---------- Stufe 4: Entscheiden ----------

export function windKomponenten(windRichtung, staerke, piste) {
  const winkel = (windRichtung - parseInt(piste, 10) * 10) * RAD;
  return { gegen: staerke * Math.cos(winkel), seite: Math.abs(staerke * Math.sin(winkel)), vonRechts: Math.sin(winkel) > 0 };
}

export function ctrEntscheidung(sicht, decke) {
  if (sicht >= 5000 && (decke === null || decke >= 1500)) return 'vfr';
  if (sicht >= 1500 && (decke === null || decke >= 600)) return 'sonder';
  return 'nein';
}

const CTR_TEXT = { vfr: 'VFR ohne Sonderfreigabe möglich', sonder: 'Nur mit Sonder-VFR-Freigabe', nein: 'Weder VFR noch Sonder-VFR' };

export function platzKopf(platz) {
  const luftraum = platz.luftraum === 'CTR' ? 'Kontrollzone (Luftraum D)' : `Luftraum G · Platzrunde ${platz.platzrunde} ft GND`;
  return `${platz.name} (fiktiv)\nPlatzhöhe ${platz.hoehe} ft · Pisten ${platz.pisten.join('/')}\n${luftraum}`;
}

const CTR_LAGEN = ['heiter', 'bewoelkt', 'regen', 'dunst', 'niesel', 'nebel', 'boeig', 'schauer'];
const G_LAGEN = ['heiter', 'cavok', 'bewoelkt', 'boeig', 'regen', 'niesel', 'schauer', 'gewitter', 'dunst'];

export function szenarioMetar(z, platz) {
  const lage = z.wahl(platz.luftraum === 'CTR' ? CTR_LAGEN : G_LAGEN);
  const stufe = Number(Object.entries(LAGEN).find(([, l]) => l.includes(lage))[0]);
  return metarErzeugen(z, { stufe, lage, station: { kennung: platz.kennung, pisten: platz.pisten } });
}

/** Einzelne Entscheidungsfragen; art: pistenwahl | seitenwind | boeen | luftraum | qnh | gewitter */
export function entscheidungsFrage(art, platz, flugzeug, metar) {
  const a = auswerten(metar);
  // Jede Frage zeigt den Flugplatz (Textblock) und das METAR (Gruppen-Chips).
  const code = platzKopf(platz);
  const gruppen = gruppenAnzeige(a.gruppen);
  const w = a.wind;
  const windNutzbar = w && !w.vrb && w.staerke >= 3;
  const komponenten = windNutzbar ? Object.fromEntries(platz.pisten.map((p) => [p, windKomponenten(w.richtung, w.staerke, p)])) : null;
  const beste = windNutzbar ? [...platz.pisten].sort((p, q) => komponenten[q].gegen - komponenten[p].gegen)[0] : platz.pisten[0];

  switch (art) {
    case 'pistenwahl': {
      if (!windNutzbar) return null;
      const [p1, p2] = platz.pisten;
      if (Math.abs(komponenten[p1].gegen - komponenten[p2].gegen) < 3) return null;
      return { typ: 'auswahl', code, gruppen, frage: 'Welche Piste wählst du für die Landung?', richtig: `Piste ${beste}`, falsch: platz.pisten.filter((p) => p !== beste).map((p) => `Piste ${p}`), erklaerung: `Wind aus ${String(w.richtung).padStart(3, '0')}°: Auf Piste ${beste} hast du Gegenwind (${Math.round(komponenten[beste].gegen)} kt). Man landet und startet möglichst gegen den Wind.` };
    }
    case 'seitenwind': {
      if (!windNutzbar) return null;
      const k = komponenten[beste];
      return { typ: 'zahl', code, gruppen, frage: `Wie groß ist die Seitenwindkomponente des mittleren Windes auf Piste ${beste}?`, loesung: Math.round(k.seite), toleranz: 2, einheit: 'kt', hinweis: 'Missweisung vernachlässigen. Faustregel: Winkel 30° → ½, 45° → 0,7, 60° → 0,9 der Windgeschwindigkeit.', erklaerung: `Winkel zwischen Wind (${String(w.richtung).padStart(3, '0')}°) und Piste (${parseInt(beste, 10) * 10}°) → Seitenwind ≈ ${Math.round(k.seite)} kt von ${k.vonRechts ? 'rechts' : 'links'}.` };
    }
    case 'boeen': {
      if (!windNutzbar || !w.boeen) return null;
      const seite = Math.abs(w.boeen * Math.sin((w.richtung - parseInt(beste, 10) * 10) * RAD));
      const innerhalb = seite <= flugzeug.seitenwind;
      return { typ: 'auswahl', code, gruppen, frage: `Du landest auf Piste ${beste}. Liegt die Seitenwindkomponente **in den Böen** innerhalb der nachgewiesenen Seitenwindkomponente deines Flugzeugs (${flugzeug.seitenwind} kt)?`, richtig: innerhalb ? 'Ja, sie liegt innerhalb' : 'Nein, sie liegt darüber', falsch: [innerhalb ? 'Nein, sie liegt darüber' : 'Ja, sie liegt innerhalb'], erklaerung: `In den Böen (${w.boeen} kt) beträgt die Seitenwindkomponente etwa ${Math.round(seite)} kt. Der nachgewiesene Wert ist keine feste Grenze, aber ein wichtiger Anhaltspunkt – entscheidend sind auch deine Erfahrung und die Regeln deines Vereins.` };
    }
    case 'luftraum': {
      if (platz.luftraum === 'CTR') {
        const ergebnis = ctrEntscheidung(a.sicht, a.hauptwolkenuntergrenze ?? (a.wolken.find((x) => x.menge === 'VV')?.hoehe ?? null));
        return { typ: 'auswahl', code, gruppen, frage: `Du willst in ${platz.name} nach VFR starten. Was ist bei diesem Wetter möglich?`, richtig: CTR_TEXT[ergebnis], falsch: Object.values(CTR_TEXT).filter((t) => t !== CTR_TEXT[ergebnis]), erklaerung: 'In der Kontrollzone: VFR ab 5 km Bodensicht und 1500 ft Hauptwolkenuntergrenze. Sonder-VFR ab 1500 m Bodensicht und 600 ft Hauptwolkenuntergrenze.' };
      }
      const decke = a.hauptwolkenuntergrenze;
      const richtig = decke === null ? 'Es ist keine Hauptwolkenuntergrenze gemeldet' : decke > platz.platzrunde ? 'Ja, sie liegt darüber' : 'Nein, sie liegt auf oder unter Platzrundenhöhe';
      return { typ: 'auswahl', code, gruppen, frage: `Liegt die gemeldete Hauptwolkenuntergrenze über der Platzrundenhöhe von ${platz.platzrunde} ft über Grund?`, richtig, falsch: ['Ja, sie liegt darüber', 'Nein, sie liegt auf oder unter Platzrundenhöhe', 'Es ist keine Hauptwolkenuntergrenze gemeldet'].filter((t) => t !== richtig), erklaerung: decke === null ? 'Es gibt keine Schicht mit BKN oder OVC (oder CAVOK).' : `Hauptwolkenuntergrenze ${decke} ft über Platzhöhe. In der Platzrunde musst du frei von Wolken bleiben – plane nach oben ausreichend Abstand ein.` };
    }
    case 'qnh':
      return { typ: 'zahl', code, gruppen, frage: 'Du stellst vor dem Start das gemeldete QNH ein. Was zeigt dein Höhenmesser am Boden an?', loesung: platz.hoehe, toleranz: 20, einheit: 'ft', erklaerung: `Mit QNH zeigt der Höhenmesser die Höhe über MSL – am Boden also die Platzhöhe von ${platz.hoehe} ft.` };
    case 'gewitter':
      if (!a.gewitter && !a.gruppen.some((x) => /TS/.test(x.text))) return null;
      return { typ: 'auswahl', code, gruppen, frage: 'Was bedeutet die Gewitterangabe in dieser Meldung für deinen Flug?', richtig: 'Mit Gewittern, Böen und Turbulenz rechnen – Flug verschieben oder Gewitter weiträumig meiden', falsch: ['Unbedenklich, solange die Sicht über 5 km liegt', 'Gewitter betreffen nur den Instrumentenflug', 'Möglichst schnell starten, bevor es ankommt'], erklaerung: 'TS und CB bedeuten Gewitter: Böen, Turbulenz, Hagel, Windscherung. Abstand halten und lieber am Boden bleiben.' };
    default:
      return null;
  }
}

export function szenarioErzeugen(z, daten, kennung) {
  const platz = kennung ? daten.plaetze.find((p) => p.kennung === kennung) : z.wahl(daten.plaetze);
  const metar = szenarioMetar(z, platz);
  const fragen = ['pistenwahl', 'seitenwind', 'boeen', 'luftraum', 'gewitter', 'qnh']
    .map((art) => entscheidungsFrage(art, platz, daten.flugzeug, metar.text))
    .filter(Boolean);
  return { platz, metar, fragen };
}
