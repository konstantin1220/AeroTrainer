// Gesprochene Form von Rufzeichen und Zahlen im Sprechfunk – deutsch und englisch.
// Regeln nach der „Bekanntmachung über die Sprechfunkverfahren“ (NfL 2024-1-3266, Nr. 10 und 11):
//   – Ziffern einzeln (Rufzeichen, Pisten, Wind, QNH, Transpondercodes, Frequenzen)
//   – Höhen, Sichten, Wolkenhöhen mit „tausend/hundert“ (3 400 = drei tausend vier hundert)
//   – QNH 1000 = „ein tausend“, Transpondercodes aus ganzen Tausendern mit „tausend“
//   – Frequenzen: alle sechs Ziffern, außer die fünfte und sechste sind beide null
//   – Uhrzeigerstellung zusammen gesprochen („zehn Uhr“)

import { BUCHSTABEN } from './aussprache.js';

export const ZIFFERN = {
  de: ['null', 'eins', 'zwo', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'],
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner'],
};
const WORT = {
  de: { komma: 'komma', tausend: 'tausend', hundert: 'hundert', eintausend: 'ein tausend', fuss: 'Fuß', grad: 'Grad', knoten: 'Knoten', meilen: 'Meilen', uhr: 'Uhr' },
  en: { komma: 'decimal', tausend: 'thousand', hundert: 'hundred', eintausend: 'one thousand', fuss: 'feet', grad: 'degrees', knoten: 'knots', meilen: 'miles', uhr: "o'clock" },
};
const UHR = {
  de: ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'],
  en: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
};

/** Ziffern einzeln: „1013“ → „eins null eins drei“ */
export function ziffern(text, sprache = 'de') {
  return [...String(text)].filter((z) => /\d/.test(z)).map((z) => ZIFFERN[sprache][Number(z)]).join(' ');
}

/** Höhe, Sicht, Wolkenhöhe: ganze Tausender/Hunderter mit „tausend/hundert“, sonst ziffernweise. */
export function hoehe(zahl, sprache = 'de') {
  const w = WORT[sprache];
  if (zahl % 100 !== 0) return ziffern(zahl, sprache);
  const tausender = Math.floor(zahl / 1000);
  const hunderter = (zahl % 1000) / 100;
  const teile = [];
  if (tausender) teile.push(tausender === 1 && sprache === 'de' ? w.eintausend : `${ziffern(tausender, sprache)} ${w.tausend}`);
  if (hunderter) teile.push(`${ziffern(hunderter, sprache)} ${w.hundert}`);
  return teile.join(' ');
}

/** QNH ziffernweise – außer 1000 hPa („ein tausend“ / „one thousand“). */
export function qnh(wert, sprache = 'de') {
  return Number(wert) === 1000 ? WORT[sprache].eintausend : ziffern(wert, sprache);
}

/** Transpondercode ziffernweise – außer ganze Tausender („zwo tausend“). */
export function squawk(code, sprache = 'de') {
  const zahl = Number(code);
  if (zahl % 1000 === 0) return zahl === 1000 ? WORT[sprache].eintausend : `${ziffern(zahl / 1000, sprache)} ${WORT[sprache].tausend}`;
  return ziffern(code, sprache);
}

/** Frequenz: alle sechs Ziffern, außer die fünfte und sechste sind beide null. */
export function frequenz(text, sprache = 'de') {
  const [mhz, khz = '000'] = String(text).split('.');
  const nach = khz.padEnd(3, '0');
  const teil = nach.slice(1) === '00' ? nach[0] : nach;
  return `${ziffern(mhz, sprache)} ${WORT[sprache].komma} ${ziffern(teil, sprache)}`;
}

/** Rufzeichen buchstabieren: „D-EKLM“ → „Delta Echo Kilo Lima Mike“ */
export function rufzeichen(text) {
  return [...text.replace(/-/g, '')].map((b) => BUCHSTABEN[b]?.wort ?? b).join(' ');
}

/** Kurzform nach SERA.14050: erstes Zeichen und die letzten beiden („D-EKLM“ → „D-LM“). */
export function kurzform(text) {
  const b = text.replace(/-/g, '');
  return `${b[0]}-${b.slice(-2)}`;
}

/** Zufälliges Rufzeichen eines deutschen Motorflugzeugs (frei erfunden). */
export function zufallsRufzeichen(z) {
  const buchstaben = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return `D-E${z.ziehen(buchstaben, 3).join('')}`;
}

/**
 * Wandelt eine geschriebene Funkmeldung in die gesprochene Form um, z. B.
 * „D-EKLM, Piste 27, QNH 1013“ → „Delta Echo Kilo Lima Mike, Piste zwo sieben, QNH eins null eins drei“.
 * Erkennt: Rufzeichen, Frequenzen, QNH, Squawk, Pisten, Wind, Höhen in ft, NM, Uhrzeigerstellung.
 */
export function sprechen(text, sprache = 'de') {
  const w = WORT[sprache];
  return String(text)
    .replace(/\b(\d{3}\.\d{2,3})\b/g, (_, f) => frequenz(f, sprache))
    .replace(/\b([DN]-[A-Z]{2,4})\b/g, (_, r) => rufzeichen(r))
    .replace(/\bQNH (\d{3,4})\b/g, (_, q) => `QNH ${qnh(q, sprache)}`)
    .replace(/\b([Ss]quawk(?:ing)?) (\d{4})\b/g, (_, s, c) => `${s} ${squawk(c, sprache)}`)
    .replace(/\b(Piste|[Rr]unway|PISTE|RUNWAY) (\d{2})([LRC]?)\b/g, (_, p, n, s) => `${p} ${ziffern(n, sprache)}${s ? ` ${{ L: sprache === 'de' ? 'links' : 'left', R: sprache === 'de' ? 'rechts' : 'right', C: sprache === 'de' ? 'Mitte' : 'center' }[s]}` : ''}`)
    .replace(/\b(\d{3}) (Grad|degrees)\b/g, (_, g) => `${ziffern(g, sprache)} ${w.grad}`)
    .replace(/\b(\d{1,2}) (Knoten|knots)\b/g, (_, k) => `${ziffern(k, sprache)} ${w.knoten}`)
    .replace(/\b(\d{3,5}) ?ft\b/g, (_, h) => `${hoehe(Number(h), sprache)} ${w.fuss}`)
    .replace(/\b(\d{1,2}) NM\b/g, (_, n) => `${ziffern(n, sprache)} ${w.meilen}`)
    .replace(/\b(\d{1,2}) (Uhr|o'clock)\b/g, (_, u) => `${UHR[sprache][Number(u)] ?? u} ${w.uhr}`);
}
