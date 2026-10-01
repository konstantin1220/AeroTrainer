// Lexikon der Fachbegriffe (modules/lexikon.json).
// Fachbegriffe in Erklärtexten werden automatisch antippbar gemacht. Wie ausführlich
// die Erklärung ist, hängt vom Erklär-Level ab (js/stufe.js).

import { h, ladeJSON } from './ui.js';
import { icon } from './icons.js';
import { aktuelleStufe } from './stufe.js';

let begriffe = [];
let nachId = new Map();
let muster = null;
let gesehenAufSeite = new Set();
let ladevorgang = null;

const BUCHSTABE = 'A-Za-zÄÖÜäöüß0-9';

export function lexikonLaden() {
  ladevorgang ??= ladeJSON('modules/lexikon.json').then((daten) => {
    begriffe = daten.begriffe;
    nachId = new Map(begriffe.map((b) => [b.id, b]));
    const varianten = begriffe.flatMap((b) => (b.suche ?? [b.begriff]).map((v) => [v, b.id]));
    varianten.sort((a, b) => b[0].length - a[0].length);
    const zuId = new Map(varianten);
    const teile = varianten.map(([v]) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    muster = { regex: new RegExp(`(?<![${BUCHSTABE}])(${teile.join('|')})(?![${BUCHSTABE}])`, 'g'), zuId };
    return begriffe;
  }).catch((fehler) => { ladevorgang = null; console.warn('Lexikon nicht verfügbar', fehler); return []; });
  return ladevorgang;
}

export const alleBegriffe = () => begriffe;
export const begriff = (id) => nachId.get(id);

/** Neue Seite: Begriffe werden auf jeder Seite nur beim ersten Vorkommen markiert. */
export function neueSeite() {
  gesehenAufSeite = new Set();
  schliessen();
}

/** Verwandelt Text in Knoten, Fachbegriffe werden zu Knöpfen (nicht im Level „kompakt“). */
export function begriffeVerlinken(text) {
  if (!muster || aktuelleStufe() === 'kompakt') return [text];
  const ergebnis = [];
  let rest = 0;
  for (const treffer of text.matchAll(muster.regex)) {
    const id = muster.zuId.get(treffer[1]);
    if (!id || gesehenAufSeite.has(id)) continue;
    gesehenAufSeite.add(id);
    if (treffer.index > rest) ergebnis.push(text.slice(rest, treffer.index));
    ergebnis.push(h('button', { type: 'button', class: 'begriff', 'data-begriff': id, onclick: (e) => { e.stopPropagation(); zeigen(id); } }, treffer[1]));
    rest = treffer.index + treffer[1].length;
  }
  if (rest < text.length) ergebnis.push(text.slice(rest));
  return ergebnis;
}

/** Text mit **fett** und automatisch verlinkten Fachbegriffen. */
export function textMitBegriffen(text) {
  return String(text).split('**').flatMap((teil, i) => (i % 2 ? [h('strong', {}, begriffeVerlinken(teil))] : begriffeVerlinken(teil)));
}

/** Erklärung eines Begriffs passend zum Level. */
export function erklaerungKnoten(b, stufe = aktuelleStufe()) {
  return [
    stufe === 'einsteiger' && b.einfach && h('p', { class: 'begriff-einfach' }, b.einfach),
    h('p', {}, b.kurz),
    stufe !== 'einsteiger' && b.einfach && h('details', { class: 'begriff-mehr' }, h('summary', {}, 'Einfacher erklärt'), h('p', {}, b.einfach)),
  ];
}

// ---------- Erklär-Blatt (öffnet sich beim Antippen eines Begriffs) ----------

let blatt = null;

function schliessen() {
  blatt?.remove();
  blatt = null;
}

export function zeigen(id) {
  const b = nachId.get(id);
  if (!b) return;
  schliessen();
  blatt = h('div', { class: 'begriff-blatt', role: 'dialog', 'aria-modal': 'false', 'aria-label': `Begriff: ${b.begriff}` },
    h('div', { class: 'begriff-blatt-innen' },
      h('div', { class: 'begriff-blatt-kopf' },
        h('span', { class: 'begriff-blatt-symbol' }, icon('lexikon')),
        h('strong', {}, b.begriff),
        h('button', { type: 'button', class: 'begriff-schliessen', 'aria-label': 'Schließen', onclick: schliessen }, icon('kreuz')),
      ),
      erklaerungKnoten(b),
      h('a', { class: 'begriff-link', href: `#/lexikon/${b.id}`, onclick: schliessen }, 'Im Lexikon ansehen', icon('weiter')),
    ));
  document.body.append(blatt);
  blatt.querySelector('.begriff-schliessen').focus({ preventScroll: true });
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') schliessen(); });
document.addEventListener('click', (e) => {
  if (blatt && !blatt.contains(e.target) && !e.target.closest('.begriff')) schliessen();
});
