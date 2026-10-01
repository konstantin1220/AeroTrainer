// Helfer zum Zeichnen der Abbildungen als SVG-Text. Alle Grafiken der App sind selbst
// gezeichnet. Farben kommen über Klassen aus css/app.css (passen sich dem Dunkelmodus an):
//   g-f-<farbe> = Füllung, g-s-<farbe> = Linie
//   Farben: text, leise, rand, flaeche, primaer, ok, fehler, orange, mf (Themenfarbe),
//           himmel, wolke, boden, wasser, wald, strasse

export const FLUGZEUG_PFAD = 'M12 2.5c.9 0 1.4.8 1.4 2v5l7.1 4v2l-7.1-2v4.3l2.3 1.7V21L12 20l-3.7 1v-1.5l2.3-1.7v-4.3l-7.1 2v-2l7.1-4v-5c0-1.2.5-2 1.4-2z';

export function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function svg(breite, hoehe, inhalt, beschreibung = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="${esc(beschreibung)}" font-family="system-ui, -apple-system, sans-serif">${inhalt}</svg>`;
}

/** Flugzeug in Draufsicht. winkel 0 = Nase nach oben (Norden), im Uhrzeigersinn. */
export function flugzeug(x, y, winkel = 0, groesse = 30, klasse = 'g-f-primaer') {
  const s = groesse / 24;
  return `<g transform="translate(${x} ${y}) rotate(${winkel}) scale(${s}) translate(-12 -12)"><path class="${klasse}" d="${FLUGZEUG_PFAD}"/></g>`;
}

export function text(x, y, inhalt, { klasse = 'g-f-text', anker = 'middle', groesse = 14, gewicht = 400, extra = '' } = {}) {
  return `<text x="${x}" y="${y}" class="${klasse}" text-anchor="${anker}" font-size="${groesse}" font-weight="${gewicht}" ${extra}>${esc(inhalt)}</text>`;
}

export function linie(x1, y1, x2, y2, klasse = 'g-s-text', breite = 2, extra = '') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${klasse}" stroke-width="${breite}" stroke-linecap="round" ${extra}/>`;
}

/** Pfeil von (x1,y1) nach (x2,y2) mit Spitze. */
export function pfeil(x1, y1, x2, y2, { farbe = 'primaer', breite = 2, spitze = 9, gestrichelt = false } = {}) {
  const w = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - Math.cos(w) * spitze * 0.8;
  const by = y2 - Math.sin(w) * spitze * 0.8;
  const p1 = [x2 - Math.cos(w - 0.42) * spitze, y2 - Math.sin(w - 0.42) * spitze];
  const p2 = [x2 - Math.cos(w + 0.42) * spitze, y2 - Math.sin(w + 0.42) * spitze];
  const r = (n) => Math.round(n * 10) / 10;
  return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(bx)}" y2="${r(by)}" class="g-s-${farbe}" stroke-width="${breite}" stroke-linecap="round" ${gestrichelt ? 'stroke-dasharray="6 5"' : ''}/>`
    + `<path d="M${r(x2)} ${r(y2)}L${r(p1[0])} ${r(p1[1])}L${r(p2[0])} ${r(p2[1])}z" class="g-f-${farbe}"/>`;
}

/** Wolke mit Mittelpunkt (x, y) und Breite b. */
export function wolke(x, y, b = 120, klasse = 'g-f-wolke g-s-rand') {
  const s = b / 120;
  return `<path transform="translate(${x - 60 * s} ${y - 30 * s}) scale(${s})" class="${klasse}" stroke-width="${1.5 / s}" d="M18 58h86a16 16 0 0 0 3-31.7A26 26 0 0 0 58 14a22 22 0 0 0-38 13.5A15.5 15.5 0 0 0 18 58z"/>`;
}

/** Punkt auf einem Kreis (Kurs in Grad, 0 = oben). */
export function aufKreis(cx, cy, r, grad) {
  const w = ((grad - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(w), cy + r * Math.sin(w)];
}
