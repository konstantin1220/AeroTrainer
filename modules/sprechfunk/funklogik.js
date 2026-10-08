// Reine Logik der Funkgespräche (ohne Seitenanzeige) – damit sie mit node --test geprüft werden kann.
import { STATIONEN } from './uebungsgebiet.js';
import { zufallsRufzeichen, kurzform } from './funkwerte.js';

const MUSTER = ['Cessna 172', 'Piper PA-28', 'Robin DR400'];
const ATIS = ['Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
const HIMMELSRICHTUNG = {
  de: ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'],
  en: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'],
};
const drei = (n) => String(n).padStart(3, '0');

/** Füllt die Platzhalter eines Szenarios mit zufälligen, zueinander passenden Werten. */
export function szenarioWerte(z, szenario) {
  const rufzeichen = zufallsRufzeichen(z);
  const piste = szenario.pisten ? z.wahl(szenario.pisten) : '27';
  const kurs = Number(piste) * 10;
  const windRichtung = ((kurs + z.ganz(-4, 4) * 10 + 360) % 360) || 360;
  const windStaerke = z.ganz(3, 14);
  const kategorie = windStaerke < 6 ? ['schwacher', 'weak'] : windStaerke <= 15 ? ['mäßiger', 'moderate'] : ['starker', 'strong'];
  const sektor = Math.round(windRichtung / 45) % 8;
  const rechts = (szenario.platzrunde_rechts ?? []).includes(piste);
  const station = STATIONEN[szenario.station] ?? STATIONEN.mittelland;
  const gemeinsam = {
    rufzeichen,
    kurz: kurzform(rufzeichen),
    muster: z.wahl(MUSTER),
    piste,
    qnh: String(z.ganz(998, 1028)),
    atis: z.wahl(ATIS),
    squawk: `${z.ganz(2, 6)}${z.ganz(0, 7)}${z.ganz(0, 7)}${z.ganz(1, 7)}`,
    frequenz: station.frequenz,
    fis_frequenz: STATIONEN.mittelland.frequenz,
    bergen_frequenz: STATIONEN.bergen.frequenz,
    uhr: String(z.wahl([1, 2, 3, 9, 10, 11])),
    nm: String(z.ganz(2, 5)),
  };
  return {
    de: {
      ...gemeinsam,
      station: station.de,
      fis: STATIONEN.mittelland.de,
      wind: `Wind ${drei(windRichtung)} Grad, ${windStaerke} Knoten`,
      windradio: `${kategorie[0]} Wind aus ${HIMMELSRICHTUNG.de[sektor]}`,
      seite_akk: rechts ? 'rechten ' : 'linken ',
      Seite_nom: rechts ? 'Rechter ' : 'Linker ',
      rechts_akk: rechts ? 'rechten ' : '',
      rechts_nom: rechts ? 'rechter ' : '',
      seite_en: rechts ? 'right-hand ' : 'left-hand ',
      rechts_en: rechts ? 'right-hand ' : '',
    },
    en: {
      ...gemeinsam,
      station: station.en,
      fis: STATIONEN.mittelland.en,
      wind: `wind ${drei(windRichtung)} degrees, ${windStaerke} knots`,
      windradio: `${kategorie[1]} wind from ${HIMMELSRICHTUNG.en[sektor]}`,
      seite_akk: rechts ? 'rechten ' : 'linken ',
      Seite_nom: rechts ? 'Rechter ' : 'Linker ',
      rechts_akk: rechts ? 'rechten ' : '',
      rechts_nom: rechts ? 'rechter ' : '',
      seite_en: rechts ? 'right-hand ' : 'left-hand ',
      rechts_en: rechts ? 'right-hand ' : '',
    },
  };
}

/** Ersetzt {platzhalter} durch die Werte der gewählten Sprache. */
export function fuellen(text, werte) {
  return String(text).replace(/\{(\w+)\}/g, (ganz, name) => (name in werte ? werte[name] : ganz));
}

// ---------- Freie Eingabe: tolerant bei der Schreibweise, streng beim Inhalt ----------
// Egal sind: Groß-/Kleinschreibung, Satzzeichen, Umlaute als ae/oe/ue, Bindestriche, „Fuß“ statt „ft“,
// getrennt oder zusammen geschrieben und kleine Tippfehler (je nach Wortlänge 1–2 Buchstaben).
// Zahlen und Rufzeichen dürfen auch gesprochen eingegeben werden („zwo sieben“, „Delta Echo …“),
// müssen aber genau stimmen. Ein anderes echtes Funkwort (Abflug statt Anflug, west statt east)
// gilt nie als Tippfehler.

const ZAHLWORT = {
  null: 0, zero: 0, eins: 1, one: 1, zwo: 2, zwei: 2, two: 2, drei: 3, three: 3, tree: 3, vier: 4, four: 4, fower: 4,
  fuenf: 5, five: 5, fife: 5, sechs: 6, six: 6, sieben: 7, seven: 7, acht: 8, eight: 8, neun: 9, nine: 9, niner: 9,
};
const GANZZAHL = { zehn: 10, ten: 10, elf: 11, eleven: 11, zwoelf: 12, twelve: 12 };
const MAL = { hundert: 100, hundred: 100, tausend: 1000, thousand: 1000 };
const KOMMA = new Set(['komma', 'decimal', 'dezimal', 'point']);
const EINHEIT = { fuss: 'ft', feet: 'ft', foot: 'ft', meilen: 'nm', meile: 'nm', miles: 'nm', mile: 'nm' };
const BUCHSTABIERT = {
  alfa: 'a', alpha: 'a', bravo: 'b', charlie: 'c', charly: 'c', delta: 'd', echo: 'e', foxtrot: 'f', golf: 'g',
  hotel: 'h', india: 'i', juliett: 'j', juliet: 'j', kilo: 'k', lima: 'l', mike: 'm', november: 'n', oscar: 'o',
  papa: 'p', quebec: 'q', romeo: 'r', sierra: 's', tango: 't', uniform: 'u', victor: 'v', whiskey: 'w', whisky: 'w',
  xray: 'x', yankee: 'y', zulu: 'z',
};
// Richtungswörter: nah beieinander geschrieben, aber nie verwechseln (siehe wortschatz)
const RICHTUNGEN = ['nord', 'nordost', 'ost', 'suedost', 'sued', 'suedwest', 'west', 'nordwest', 'north', 'east', 'south', 'west',
  'northeast', 'southeast', 'southwest', 'northwest', 'noerdlich', 'oestlich', 'suedlich', 'westlich', 'northern', 'eastern',
  'southern', 'western', 'links', 'rechts', 'left', 'right', 'linken', 'rechten', 'linker', 'rechter'];

const zahlwort = (w) => w in ZAHLWORT || w in GANZZAHL;

/** Ein Wort für den Vergleich vereinheitlichen. */
function wortForm(roh) {
  return roh.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/['’‘`´-]/g, '');
}

/** Gesprochene Zahl („zwo tausend fünf hundert“, „eins eins acht komma null null fünf“) in Ziffern. */
function zahlAusWorten(woerter) {
  let ganz = 0;
  let ziffern = '';
  let nachkomma = null;
  let mitMal = false;
  for (const w of woerter) {
    if (KOMMA.has(w)) nachkomma = '';
    else if (nachkomma !== null) nachkomma += w in ZAHLWORT ? ZAHLWORT[w] : (GANZZAHL[w] ?? '');
    else if (w in MAL) { ganz += (ziffern ? Number(ziffern) : 1) * MAL[w]; ziffern = ''; mitMal = true; }
    else if (w in ZAHLWORT) ziffern += ZAHLWORT[w];
    else if (w in GANZZAHL) ziffern += GANZZAHL[w];
    else if (w === 'ein' || w === 'eine') ziffern += '1';
  }
  const vorn = mitMal ? String(ganz + (ziffern ? Number(ziffern) : 0)) : ziffern;
  return nachkomma !== null ? `${vorn}.${nachkomma}` : vorn;
}

/** Zahlen einheitlich schreiben: „2.500“ → „2500“, „118.100“ → „118.1“, „119.000“ → „119“. */
function zahlForm(t) {
  if (/^\d{1,2}\.\d{3}$/.test(t)) return t.replace('.', '');
  if (/^\d+\.\d*$/.test(t)) return t.replace(/0+$/, '').replace(/\.$/, '');
  return t;
}

/**
 * Zerlegt einen Funkspruch in vergleichbare Wörter: [{ t, roh, streng, phon }]
 *  t      – vereinheitlichte Form
 *  roh    – so wie eingegeben (für die Rückmeldung)
 *  streng – muss genau stimmen (Zahl, Rufzeichen, buchstabierter Buchstabe)
 *  phon   – einzelnes Buchstabierwort („Whiskey“) und sein Buchstabe
 */
export function zerlegen(text) {
  const abschnitte = String(text)
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d)\.(\d)/g, '$1§$2')
    .split(/[.,;:!?()„“"/–—\n]+/);
  const woerter = [];
  for (const abschnitt of abschnitte) {
    // Rohwörter eines Satzteils; Ziffern und Buchstaben werden getrennt („2500ft“ → 2500 ft)
    const roh = abschnitt.replace(/§/g, '.').split(/\s+/).filter(Boolean);
    const teil = roh.flatMap((r) => {
      const rufzeichen = /^[A-Z]{1,2}-[A-Z]{2,5}$/.test(r);
      return wortForm(r).replace(/(\d)([a-z])/g, '$1 $2').replace(/([a-z])(\d)/g, '$1 $2').split(' ').filter(Boolean)
        .map((t) => ({ t: EINHEIT[t] ?? t, roh: r, streng: rufzeichen || /\d/.test(t) }));
    });
    for (let i = 0; i < teil.length; i++) {
      const w = teil[i].t;
      const naechstes = teil[i + 1]?.t;
      // gesprochene Zahlen zusammenfassen
      const zahlBeginn = zahlwort(w) || w in MAL || ((w === 'ein' || w === 'eine') && (naechstes in MAL || naechstes === 'uhr'));
      if (zahlBeginn) {
        let j = i;
        const lauf = [];
        while (j < teil.length) {
          const x = teil[j].t;
          const danach = teil[j + 1]?.t;
          const passt = zahlwort(x) || x in MAL || ((x === 'ein' || x === 'eine') && (danach in MAL || danach === 'uhr'))
            || (KOMMA.has(x) && lauf.length > 0 && danach !== undefined && zahlwort(danach));
          if (!passt) break;
          lauf.push(teil[j]);
          j++;
        }
        woerter.push({ t: zahlForm(zahlAusWorten(lauf.map((x) => x.t))), roh: lauf.map((x) => x.roh).join(' '), streng: true });
        i = j - 1;
        continue;
      }
      // buchstabierte Folgen („Delta Echo Kilo Lima Mike“) werden zu einzelnen Buchstaben
      if (w in BUCHSTABIERT && naechstes in BUCHSTABIERT) {
        let j = i;
        while (j < teil.length && teil[j].t in BUCHSTABIERT) {
          woerter.push({ t: BUCHSTABIERT[teil[j].t], roh: teil[j].roh, streng: true, buchstabe: true });
          j++;
        }
        i = j - 1;
        continue;
      }
      const wort = { ...teil[i], t: /\d/.test(w) ? zahlForm(w) : w };
      if (w in BUCHSTABIERT) wort.phon = BUCHSTABIERT[w];
      woerter.push(wort);
    }
  }
  return woerter;
}

/** Vereinheitlichte Form als Text – praktisch zum Vergleichen und Testen. */
export function normalisieren(text) {
  return zerlegen(text).map((w) => w.t).join(' ');
}

/** Alle echten Wörter der Funkgespräche: Sie gelten untereinander nie als Tippfehler. */
export function wortschatz(szenarien) {
  const texte = szenarien.flatMap((s) => s.schritte.flatMap((x) => [x.de, x.en, ...(x.falsch?.de ?? []), ...(x.falsch?.en ?? [])]));
  const menge = new Set(RICHTUNGEN);
  for (const text of texte) {
    if (!text) continue;
    for (const w of zerlegen(String(text).replace(/\{\w+\}/g, ' '))) if (!w.streng && w.t.length > 1) menge.add(w.t);
  }
  return menge;
}

/** Abstand zweier Wörter: Einfügen, Löschen, Ersetzen und vertauschte Nachbarn kosten je 1. */
export function abstand(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + kosten);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Erlaubte Tippfehler je Wortlänge: kurze Wörter genau, dann 1, 2 oder (ab 12 Buchstaben) 3. */
const erlaubt = (laenge) => (laenge <= 3 ? 0 : laenge <= 6 ? 1 : laenge <= 11 ? 2 : 3);

/** Nur andere Endung („rolle“/„rollen“, „linken“/„linker“)? */
function beugung(a, b) {
  let gleich = 0;
  while (gleich < a.length && a[gleich] === b[gleich]) gleich++;
  return Math.min(a.length, b.length) >= 4 && gleich >= Math.max(a.length, b.length) - 2;
}

/** Kosten, wenn „eingabe“ als Tippfehler von „soll“ gelten soll – sonst Infinity. */
function tippfehler(eingabe, soll, woerter) {
  if (/\d/.test(eingabe) || /\d/.test(soll)) return Infinity;
  const d = abstand(eingabe, soll);
  if (d > erlaubt(soll.length)) return Infinity;
  if (woerter?.has(eingabe) && !beugung(eingabe, soll)) return Infinity;
  return d;
}

/** Ab Position start in der Eingabe die Wörter eines Pflichtteils suchen. */
function abgleich(soll, eingabe, start, woerter) {
  let i = 0;
  let j = start;
  let kosten = 0;
  while (i < soll.length) {
    if (j >= eingabe.length) return null;
    const p = soll[i];
    const e = eingabe[j];
    if (e.t === p.t || (p.phon && e.t === p.phon)) { i++; j++; continue; }
    // mehrere Eingabewörter ergeben genau ein Wort (buchstabiertes Rufzeichen, „roll halt“)
    let zusammen = e.t;
    let m = 1;
    while (j + m < eingabe.length && p.t.startsWith(zusammen) && zusammen !== p.t) zusammen += eingabe[j + m++].t;
    if (m > 1 && zusammen === p.t) { i++; j += m; continue; }
    // ein Eingabewort ergibt genau mehrere Pflichtwörter („holdingpoint“)
    zusammen = p.t;
    let r = 1;
    while (i + r < soll.length && e.t.startsWith(zusammen) && zusammen !== e.t) zusammen += soll[i + r++].t;
    if (r > 1 && zusammen === e.t) { i += r; j++; continue; }
    if (p.streng) return null;
    // kleine Tippfehler – auch getrennt oder zusammen geschrieben
    let d = tippfehler(e.t, p.t, woerter);
    if (d < Infinity) { kosten += d; i++; j++; continue; }
    if (j + 1 < eingabe.length && !eingabe[j + 1].streng) {
      d = tippfehler(e.t + eingabe[j + 1].t, p.t, woerter);
      if (d < Infinity) { kosten += d; i++; j += 2; continue; }
    }
    if (i + 1 < soll.length && !soll[i + 1].streng) {
      d = tippfehler(e.t, p.t + soll[i + 1].t, woerter);
      if (d < Infinity) { kosten += d; i += 2; j++; continue; }
    }
    return null;
  }
  return { kosten, start, ende: j };
}

/** Bester Fundort eines Pflichtteils (mit Alternativen „A|B“) in der Eingabe. */
function finden(teil, eingabe, woerter) {
  let bester = null;
  for (const alternative of teil.split('|')) {
    const soll = zerlegen(alternative);
    if (!soll.length) continue;
    for (let start = 0; start < eingabe.length; start++) {
      const treffer = abgleich(soll, eingabe, start, woerter);
      if (treffer && (!bester || treffer.kosten < bester.kosten)) bester = treffer;
      if (bester?.kosten === 0) return bester;
    }
  }
  return bester;
}

/**
 * Prüft eine frei eingetippte Meldung: Stecken alle Pflichtteile drin?
 *  woerter     – Wortschatz (siehe wortschatz), damit echte andere Wörter nicht als Tippfehler gelten
 *  tabu        – Teile, die nicht vorkommen dürfen (z. B. „frei“ bei einer RADIO-Stelle)
 *  reihenfolge – Pflichtteile, die in dieser Reihenfolge kommen müssen (z. B. Stelle vor Rufzeichen)
 * Ergebnis: { ok, fehlend, tippfehler, teile: [{ teil, status: 'ok'|'tippfehler'|'fehlt'|'tabu', du }], reihenfolgeFalsch }
 */
export function freitextPruefen(eingabe, pflicht, woerter, { tabu = [], reihenfolge = [] } = {}) {
  const e = zerlegen(eingabe);
  const roh = (treffer) => e.slice(treffer.start, treffer.ende).map((w) => w.roh).filter((r, i, liste) => r !== liste[i - 1]).join(' ');
  const fundorte = new Map();
  const teile = pflicht.map((teil) => {
    const name = teil.split('|')[0];
    const treffer = finden(teil, e, woerter);
    if (!treffer) return { teil: name, status: 'fehlt' };
    fundorte.set(teil, treffer.start);
    return { teil: name, status: treffer.kosten > 0 ? 'tippfehler' : 'ok', du: roh(treffer) };
  });
  for (const teil of tabu) {
    const treffer = finden(teil, e, woerter);
    if (treffer) teile.push({ teil: teil.split('|')[0], status: 'tabu', du: roh(treffer) });
  }
  const orte = reihenfolge.filter((t) => fundorte.has(t)).map((t) => fundorte.get(t));
  const reihenfolgeFalsch = orte.some((ort, i) => i > 0 && ort < orte[i - 1]);
  const fehlend = teile.filter((t) => t.status === 'fehlt').map((t) => t.teil);
  return {
    ok: fehlend.length === 0 && !teile.some((t) => t.status === 'tabu') && !reihenfolgeFalsch,
    fehlend,
    tippfehler: teile.filter((t) => t.status === 'tippfehler').map((t) => ({ soll: t.teil, du: t.du })),
    teile,
    reihenfolgeFalsch,
  };
}

/** Gerüst als Tipp: von jedem Wort nur der erste Buchstabe („Rolle zum“ → „R···· z··“). */
export function geruest(text) {
  return String(text).replace(/([\p{L}\d])([\p{L}\d]*)/gu, (_, a, rest) => a + '·'.repeat(rest.length));
}

/** Satzteile für die Bausteine: die richtigen Teile plus bis zu drei falsche aus den Ablenkern. */
export function bausteine(richtig, falsch, z) {
  const teile = richtig.split(', ');
  const fremd = [...new Set(falsch.flatMap((f) => f.split(', ')))].filter((t) => !teile.includes(t));
  return { teile, auswahl: z.mischen([...teile.map((t, i) => ({ t, id: `r${i}` })), ...z.ziehen(fremd, 3).map((t, i) => ({ t, id: `f${i}` }))]) };
}

/** Einzelne Wörter als Bausteine (Stufe 3): alle Wörter der Meldung plus Störwörter aus den falschen Antworten. */
export function einzelwoerter(richtig, falsch, z, anzahlFremd = 3) {
  const zerteilen = (text) => text.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  const teile = zerteilen(richtig);
  const vorhanden = new Set(teile.map((t) => t.toLowerCase()));
  const fremd = new Map();
  for (const t of falsch.flatMap(zerteilen)) if (!vorhanden.has(t.toLowerCase()) && !fremd.has(t.toLowerCase())) fremd.set(t.toLowerCase(), t);
  return { teile, auswahl: z.mischen([...teile.map((t, i) => ({ t, id: `r${i}` })), ...z.ziehen([...fremd.values()], anzahlFremd).map((t, i) => ({ t, id: `f${i}` }))]) };
}

/** Gelegte Bausteine mit der Lösung vergleichen: pro Platz richtig oder falsch (Groß/klein egal). */
export function reihenfolgePruefen(gelegt, teile) {
  const gleich = (a, b) => a?.toLowerCase() === b?.toLowerCase();
  const plaetze = gelegt.map((t, i) => gleich(t, teile[i]));
  return { ok: gelegt.length === teile.length && plaetze.every(Boolean), plaetze, fehlen: Math.max(0, teile.length - gelegt.length) };
}
