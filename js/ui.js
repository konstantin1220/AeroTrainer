// Kleine Helfer für die Oberfläche. Elemente werden mit h() erzeugt statt mit
// innerHTML – das ist übersichtlich und schützt vor versehentlich eingeschleustem HTML.

import { icon } from './icons.js';

/**
 * Erzeugt ein DOM-Element.
 * Beispiel: h('a', { href: '#/', class: 'knopf' }, 'Zur Startseite')
 * Attribute, die mit „on“ beginnen, werden als Ereignis registriert (onclick, onchange …).
 */
export function h(tag, attribute = {}, ...kinder) {
  const el = document.createElement(tag);
  for (const [name, wert] of Object.entries(attribute ?? {})) {
    if (wert == null || wert === false) continue;
    if (name.startsWith('on') && typeof wert === 'function') el.addEventListener(name.slice(2), wert);
    else if (name === 'class') el.className = wert;
    else if (name === 'style' && typeof wert === 'object') Object.assign(el.style, wert);
    else el.setAttribute(name, wert === true ? '' : wert);
  }
  for (const kind of kinder.flat(Infinity)) {
    if (kind == null || kind === false) continue;
    el.append(kind instanceof Node ? kind : String(kind));
  }
  return el;
}

/** Hängt Kinder an ein Element an und überspringt leere Werte (null, undefined, false). */
export function anhaengen(el, ...kinder) {
  for (const kind of kinder.flat(Infinity)) {
    if (kind == null || kind === false) continue;
    el.append(kind instanceof Node ? kind : String(kind));
  }
  return el;
}

export async function ladeJSON(url) {
  const antwort = await fetch(url);
  if (!antwort.ok) throw new Error(`${url} konnte nicht geladen werden (Fehler ${antwort.status}).`);
  return antwort.json();
}

export function fehlerAnzeige(fehler) {
  return h('div', { class: 'leerzustand' },
    h('div', { class: 'leerzustand-symbol fehlerton' }, icon('warnung')),
    h('h2', {}, 'Da ist etwas schiefgelaufen'),
    h('p', {}, fehler.message),
    h('a', { class: 'knopf', href: '#/' }, 'Zur Startseite'),
  );
}

export function datumText(datum) {
  return datum.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Text mit **fett** in Elemente umwandeln (mehr Formatierung gibt es bewusst nicht). */
export function formatiert(text) {
  return String(text).split('**').map((teil, i) => (i % 2 ? h('strong', {}, teil) : teil));
}

/** Kreisförmige Fortschrittsanzeige, anteil von 0 bis 1. */
export function ring(anteil, beschriftung, groesse = 'normal') {
  const r = 16;
  const umfang = 2 * Math.PI * r;
  const wert = Math.max(0, Math.min(1, anteil || 0));
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '0 0 40 40');
  el.setAttribute('class', `ring ring-${groesse}`);
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <circle class="ring-spur" cx="20" cy="20" r="${r}"/>
    <circle class="ring-wert" cx="20" cy="20" r="${r}" stroke-dasharray="${umfang}" stroke-dashoffset="${umfang * (1 - wert)}" transform="rotate(-90 20 20)"/>`;
  return h('span', { class: `ring-box ring-box-${groesse}`, role: 'img', 'aria-label': beschriftung ?? `${Math.round(wert * 100)} Prozent` },
    el, h('span', { class: 'ring-zahl' }, `${Math.round(wert * 100)}%`));
}

export function balken(anteil, klasse = '') {
  const prozent = `${Math.round(Math.max(0, Math.min(1, anteil || 0)) * 100)}%`;
  return h('span', { class: `balken ${klasse}`, role: 'presentation' }, h('span', { style: { width: prozent } }));
}

/** Eine (selbst gezeichnete) SVG-Abbildung aus einem Text einfügen. Nur für Grafiken aus dem eigenen Code! */
export function abbildungKnoten(svgText, unterschrift) {
  const box = h('figure', { class: 'abbildung' });
  const grafik = h('div', { class: 'abbildung-grafik' });
  grafik.innerHTML = svgText;
  box.append(grafik);
  if (unterschrift) box.append(h('figcaption', {}, formatiert(unterschrift)));
  return box;
}

export function brotkrumen(...teile) {
  const kinder = [];
  teile.forEach(([text, href], i) => {
    if (i) kinder.push(h('span', { class: 'brotkrumen-trenner', 'aria-hidden': 'true' }, '›'));
    kinder.push(href ? h('a', { href }, text) : h('span', {}, text));
  });
  return h('nav', { class: 'brotkrumen', 'aria-label': 'Navigationspfad' }, kinder);
}

export function leerzustand(symbol, titel, text, ...aktionen) {
  return h('div', { class: 'leerzustand' },
    h('div', { class: 'leerzustand-symbol' }, icon(symbol)),
    h('h2', {}, titel),
    text && h('p', {}, text),
    aktionen.length > 0 && h('div', { class: 'knopfreihe zentriert' }, aktionen),
  );
}

export function mehrzahl(anzahl, einzahl, mehrzahlWort) {
  return `${anzahl} ${anzahl === 1 ? einzahl : mehrzahlWort}`;
}
