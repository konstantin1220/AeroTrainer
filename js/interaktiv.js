// Bausteine für interaktive Darstellungen: Regler, Umschalter, Wertanzeigen und eine
// „Bühne“ für selbst gezeichnete SVG-Grafiken, die bei jeder Änderung neu gezeichnet wird.
//
// Ein interaktives Element in einem Modul sieht so aus (modules/<thema>/interaktiv.js):
//   export const interaktiv = {
//     winddreieck: { titel: '…', kurz: '…', symbol: 'karte', erstellen: () => Node },
//   };
// In der Theorie wird es mit { "typ": "interaktiv", "id": "winddreieck" } eingebunden.

import { h } from './ui.js';

let zaehler = 0;
const neueId = (vorsilbe) => `${vorsilbe}-${++zaehler}`;

/** Schieberegler. format(wert) liefert den angezeigten Text. */
export function regler({ name, min, max, schritt = 1, wert, format = (w) => String(w), beiAenderung }) {
  const id = neueId('regler');
  const ausgabe = h('output', { for: id, class: 'regler-wert' });
  const feld = h('input', { type: 'range', id, min, max, step: schritt, value: wert, class: 'regler-feld' });
  const anzeigen = () => {
    const w = Number(feld.value);
    ausgabe.textContent = format(w);
    feld.style.setProperty('--anteil', `${((w - min) / (max - min)) * 100}%`);
  };
  feld.addEventListener('input', () => { anzeigen(); beiAenderung?.(Number(feld.value)); });
  anzeigen();
  return {
    el: h('div', { class: 'regler' }, h('div', { class: 'regler-kopf' }, h('label', { for: id }, name), ausgabe), feld),
    get wert() { return Number(feld.value); },
    setzen(w) { feld.value = w; anzeigen(); },
  };
}

/** Umschalter mit mehreren Möglichkeiten: optionen = [[wert, text], …]. */
export function umschalter({ name, optionen, wert, beiAenderung }) {
  let aktuell = wert ?? optionen[0][0];
  const knoepfe = optionen.map(([w, text]) => h('button', {
    type: 'button', role: 'radio', class: 'segment', 'aria-checked': String(w === aktuell),
    onclick: () => { aktuell = w; aktualisieren(); beiAenderung?.(w); },
  }, text));
  const aktualisieren = () => knoepfe.forEach((k, i) => k.setAttribute('aria-checked', String(optionen[i][0] === aktuell)));
  return {
    el: h('div', { class: 'umschalter' }, name && h('span', { class: 'umschalter-name' }, name), h('div', { class: 'segmente', role: 'radiogroup', 'aria-label': name ?? 'Auswahl' }, knoepfe)),
    get wert() { return aktuell; },
  };
}

/** Reihe von Wertkarten: [{ titel, wert, einheit, art: 'gut'|'schlecht'|'warnung'|'' }] */
export function wertanzeige() {
  const el = h('div', { class: 'wertanzeige', 'aria-live': 'polite' });
  return {
    el,
    setzen(liste) {
      el.replaceChildren(...liste.filter(Boolean).map((w) => h('div', { class: `wertkarte ${w.art ?? ''}` },
        h('span', { class: 'wertkarte-titel' }, w.titel),
        h('strong', {}, w.wert, w.einheit && h('small', {}, ` ${w.einheit}`)),
        w.hinweis && h('span', { class: 'wertkarte-hinweis' }, w.hinweis))));
    },
  };
}

/** Fläche für eine SVG-Grafik aus eigenem Code (wird mit zeichnen(svgText) neu gesetzt). */
export function buehne() {
  const el = h('div', { class: 'buehne' });
  return { el, zeichnen(svgText) { el.innerHTML = svgText; } };
}

/** Hinweis- oder Ergebniszeile. */
export function meldung() {
  const el = h('p', { class: 'interaktiv-meldung', 'aria-live': 'polite' });
  return {
    el,
    setzen(text, art = '') { el.className = `interaktiv-meldung ${art}`; el.textContent = text; el.hidden = !text; },
  };
}

/** Ordnet Bedienelemente in einem Raster an. */
export function bedienfeld(...elemente) {
  return h('div', { class: 'bedienfeld' }, elemente);
}
