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

// ---------- Maßstab ----------
// Interaktive Grafiken zeichnen maßstäblich: Ein Wert, der sich ändert, ändert auch die Grafik.
// Achsen wachsen nur in runden Stufen mit, damit Längen innerhalb einer Stufe vergleichbar bleiben.

/** Kleinste Stufe aus der Liste, die mindestens wert ist (sonst die größte). */
export function stufenMaximum(wert, stufen) {
  return stufen.find((s) => s >= wert) ?? stufen.at(-1);
}

/** Maßstabsleiste mit Endstrichen ab (x, y), laenge in Pixeln, Beschriftung darüber. */
export function massstab(x, y, laenge, beschriftung, klasse = 'leise') {
  const r = (n) => Math.round(n * 10) / 10;
  return `<path d="M${r(x)} ${r(y - 4)}V${r(y)}H${r(x + laenge)}V${r(y - 4)}" class="g-s-${klasse}" stroke-width="1.4" fill="none"/>`
    + text(r(x + laenge / 2), r(y - 7), beschriftung, { groesse: 10, gewicht: 700, klasse: `g-f-${klasse}` });
}

// ---------- Bewegung (für Animationen, js/animation.js) ----------
// Alles reine Rechnungen: Eine Animation zeichnet für jeden Zeitpunkt t (0 bis 1) ein ganzes Bild.

/** Weicher Übergang: 0 → 1 mit sanftem Anfahren und Abbremsen. */
export function sanft(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/** Wie weit t im Abschnitt von a bis b ist: 0 davor, 1 danach. */
export function abschnitt(t, a, b) {
  return Math.max(0, Math.min(1, (t - a) / (b - a)));
}

/** Linear zwischen a und b. */
export function zwischen(a, b, t) {
  return a + (b - a) * t;
}

/** Glatter Weg durch alle Punkte (Catmull-Rom), als dichte Liste von [x, y]. Jeder Eckpunkt liegt bei Index i * proAbschnitt. */
export function glatterWeg(punkte, proAbschnitt = 12) {
  const weg = [];
  for (let i = 0; i < punkte.length - 1; i++) {
    const p0 = punkte[Math.max(0, i - 1)], p1 = punkte[i], p2 = punkte[i + 1], p3 = punkte[Math.min(punkte.length - 1, i + 2)];
    for (let k = 0; k < proAbschnitt; k++) {
      const t = k / proAbschnitt, t2 = t * t, t3 = t2 * t;
      weg.push([0, 1].map((a) => 0.5 * ((2 * p1[a]) + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3)));
    }
  }
  weg.push([...punkte.at(-1)]);
  return weg;
}

/** Bisher zurückgelegte Länge bis zu jedem Punkt des Wegs. */
export function weglaengen(weg) {
  const laengen = [0];
  for (let i = 1; i < weg.length; i++) laengen.push(laengen[i - 1] + Math.hypot(weg[i][0] - weg[i - 1][0], weg[i][1] - weg[i - 1][1]));
  return laengen;
}

/** Ort und Kurs (0 = Norden/oben, im Uhrzeigersinn) beim Anteil s (0 bis 1) der Weglänge. */
export function aufWeg(weg, s, laengen = weglaengen(weg)) {
  const ziel = Math.max(0, Math.min(1, s)) * laengen.at(-1);
  let i = 1;
  while (i < weg.length - 1 && laengen[i] < ziel) i++;
  const a = weg[i - 1], b = weg[i];
  const stueck = laengen[i] - laengen[i - 1];
  const f = stueck > 0 ? (ziel - laengen[i - 1]) / stueck : 0;
  return {
    x: zwischen(a[0], b[0], f),
    y: zwischen(a[1], b[1], f),
    winkel: (Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180) / Math.PI,
  };
}

/** SVG-Pfad (Attribut d) für den Weg vom Anteil von bis zum Anteil bis. */
export function wegPfad(weg, von = 0, bis = 1, laengen = weglaengen(weg)) {
  const r = (n) => Math.round(n * 10) / 10;
  const gesamt = laengen.at(-1);
  const anfang = aufWeg(weg, von, laengen);
  const ende = aufWeg(weg, bis, laengen);
  let d = `M${r(anfang.x)} ${r(anfang.y)}`;
  weg.forEach((p, i) => { if (laengen[i] > von * gesamt && laengen[i] < bis * gesamt) d += `L${r(p[0])} ${r(p[1])}`; });
  return `${d}L${r(ende.x)} ${r(ende.y)}`;
}
