// Animation für „METAR lesen“: das Beispiel-METAR aus dem Kapitel „Aufbau“ Gruppe für Gruppe (js/animation.js).
// Frei erfundener Übungsplatz XMUS; Höhen maßstäblich (Wolken in ft über Platzhöhe).
import { svg, text, linie, pfeil, wolke, aufKreis, sanft, abschnitt, zwischen } from '../../js/grafik.js';

const r1 = (n) => Math.round(n * 10) / 10;

export const ZEILEN = ['METAR XMUS 121420Z 24012G25KT 9999 -SHRA', 'FEW025CB BKN045 18/11 Q1009 TEMPO 3000 TSRA'];
// Welche Gruppen in welchem Schritt hervorgehoben sind, und was sie bedeuten
export const SCHRITTE = [
  { gruppen: ['XMUS', '121420Z'], bedeutung: 'Übungsplatz Musterstadt · am 12. um 14:20 UTC' },
  { gruppen: ['24012G25KT'], bedeutung: 'Wind aus 240° mit 12 kt, Böen bis 25 kt' },
  { gruppen: ['9999', '-SHRA'], bedeutung: 'Sicht 10 km oder mehr · leichter Regenschauer' },
  { gruppen: ['FEW025CB', 'BKN045'], bedeutung: 'wenige CB ab 2500 ft · durchbrochen ab 4500 ft' },
  { gruppen: ['18/11', 'Q1009'], bedeutung: '18 °C, Taupunkt 11 °C · QNH 1009 hPa' },
  { gruppen: ['TEMPO', '3000', 'TSRA'], bedeutung: 'vorübergehend 3000 m Sicht, Gewitter mit Regen' },
];

const SCHRIFT = 13;
const ZEICHEN = SCHRIFT * 0.6; // Breite eines Zeichens in Festbreitenschrift
const MONO = 'font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"';

/** Kästen hinter den hervorgehobenen Gruppen. */
function markierungen(gruppen) {
  const kaesten = [];
  ZEILEN.forEach((zeile, z) => {
    const start = 200 - (zeile.length * ZEICHEN) / 2;
    zeile.split(' ').reduce((pos, wort) => {
      if (gruppen.includes(wort)) {
        // als Pfad gezeichnet: ein Textmarker, kein Kasten, in dem der Text stehen müsste
        kaesten.push(`<path d="M${r1(start + pos * ZEICHEN - 3)} ${z === 0 ? 11 : 33}h${r1(wort.length * ZEICHEN + 6)}v20h${r1(-(wort.length * ZEICHEN + 6))}z" class="g-f-primaer" opacity=".2"/>`);
      }
      return pos + wort.length + 1;
    }, 0);
  });
  return kaesten.join('');
}

// Höhenmaßstab: Boden bei y = 214, 1000 ft ≙ 28 px
const BODEN = 214;
const yFt = (ft) => BODEN - ft * 0.028;
/** Wolke mit Unterkante bei Höhe ft. */
const wolkeAuf = (x, ft, b, klasse = 'g-f-wolke g-s-rand') => wolke(x, r1(yFt(ft) - (28 * b) / 120), b, klasse);
const PX_KM = 16; // Sicht: 1 km ≙ 16 px

function windsack(x, t, schritt) {
  // Wind von links (aus Südwest) – Sack zeigt nach rechts, flattert in den Böen
  const winkel = schritt === 1 ? 12 + Math.sin(t * Math.PI * 6) * 9 : 14;
  return `${linie(x, BODEN, x, BODEN - 40, 'g-s-text', 2)}
    <g transform="translate(${x} ${BODEN - 38}) rotate(${r1(winkel)})">
      <path d="M0-5L34-3V3L0 5z" class="g-f-orange"/><path d="M11-4.4v8.8M22-3.7v7.4" style="stroke: var(--flaeche); stroke-width: 2; fill: none"/>
    </g>`;
}

function kompass(cx, cy) {
  const [ax, ay] = aufKreis(cx, cy, 22, 240);
  const [bx, by] = aufKreis(cx, cy, 6, 240);
  return `<circle cx="${cx}" cy="${cy}" r="22" class="g-f-weiss" style="stroke: var(--rand-stark); stroke-width: 1"/>
    ${text(cx, cy - 14, 'N', { groesse: 9, gewicht: 800, klasse: 'g-f-leise' })}
    ${pfeil(r1(ax), r1(ay), r1(bx), r1(by), { farbe: 'orange', breite: 2.4, spitze: 8 })}
    ${text(cx, cy + 34, 'aus 240°', { groesse: 10, gewicht: 800, klasse: 'g-f-orange g-halo' })}`;
}

function uhr(cx, cy) {
  const [hx, hy] = aufKreis(cx, cy, 10, (14 % 12) * 30 + 10);
  const [mx, my] = aufKreis(cx, cy, 16, 120);
  return `<circle cx="${cx}" cy="${cy}" r="20" class="g-f-weiss" style="stroke: var(--rand-stark); stroke-width: 1.5"/>
    ${linie(cx, cy, r1(hx), r1(hy), 'g-s-text', 2.5)}${linie(cx, cy, r1(mx), r1(my), 'g-s-text', 1.5)}
    ${text(cx, cy + 32, '14:20 UTC', { groesse: 10, gewicht: 800, klasse: 'g-f-text g-halo' })}`;
}

function metarBild(schritt, t) {
  const f = sanft(abschnitt(t, 0, 0.6));
  const s = SCHRITTE[schritt];
  let szene = '';
  // Höhenskala
  szene += [1000, 2000, 3000, 4000, 5000].map((ft) => linie(31, r1(yFt(ft)), 36, r1(yFt(ft)), 'g-s-leise', 1) + text(28, r1(yFt(ft)), String(ft), { groesse: 9, klasse: 'g-f-leise', anker: 'end' })).join('');
  szene += text(28, BODEN - 8, 'ft', { groesse: 9, klasse: 'g-f-leise', anker: 'end' });
  // Platz
  szene += `<rect x="150" y="${BODEN}" width="200" height="8" class="g-f-strasse"/>`;
  szene += `<path d="M196 ${BODEN}v-18l18-10 18 10v18z" class="g-f-flaeche" style="stroke: var(--rand-stark); stroke-width: 1"/>`;
  szene += text(214, BODEN - 8, 'XMUS', { groesse: 8, gewicht: 800, klasse: 'g-f-text' });
  if (schritt === 0) szene += uhr(360, 116);
  if (schritt >= 1) szene += windsack(356, t, schritt) + kompass(360, 116);
  // Schauerwolke (CB) mit Regen
  if (schritt >= 2) {
    const deckkraft = schritt === 2 ? f : 1;
    const gewitter = schritt === 5;
    const striche = gewitter ? 10 : 5;
    szene += `<g opacity="${r1(deckkraft)}">`;
    for (let i = 0; i < striche; i++) {
      const x = 262 + i * (gewitter ? 6 : 11);
      szene += linie(x, r1(yFt(2500) + 4), x - 8, BODEN - 2, 'g-s-wasser', gewitter ? 1.6 : 1.2, 'stroke-dasharray="6 5"');
    }
    szene += `<path d="M244 ${r1(yFt(2500))}c-6-26 4-48 22-56 4-14 22-18 32-8 14-4 26 8 24 22 10 6 10 30 2 42z" class="g-f-wolke" style="stroke: var(--rand-stark); stroke-width: 1.5"/>`;
    if (gewitter) szene += `<path d="M292 ${r1(yFt(2500) + 2)}l-8 22h9l-7 20 18-27h-9l7-15z" class="g-f-orange" opacity="${r1(0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI * 3)))}"/>`;
    szene += '</g>';
  }
  // Sicht
  if (schritt === 2 || schritt === 5) {
    const km = schritt === 2 ? 10 * f : 10;
    szene += pfeil(110, 176, r1(110 + Math.max(km, 0.6) * PX_KM), 176, { farbe: 'ok', breite: 2, spitze: 8 });
    szene += text(190, 164, 'Sicht 10 km und mehr', { groesse: 10, gewicht: 800, klasse: 'g-f-ok g-halo' });
  }
  if (schritt === 5) {
    szene += pfeil(110, 200, r1(110 + Math.max(3 * f, 0.6) * PX_KM), 200, { farbe: 'fehler', breite: 2, spitze: 8, gestrichelt: true });
    szene += text(112, 189, 'TEMPO 3000 m', { groesse: 10, gewicht: 800, klasse: 'g-f-fehler g-halo', anker: 'start' });
  }
  // Wolkenschicht BKN in 4500 ft (5 bis 7 Achtel bedeckt)
  if (schritt >= 3) {
    const deckkraft = schritt === 3 ? f : 1;
    szene += `<g opacity="${r1(deckkraft)}">${[68, 120, 168, 212, 368].map((x) => wolkeAuf(x, 4500, 58)).join('')}</g>`;
    if (schritt === 3) {
      szene += linie(38, r1(yFt(4500)), 392, r1(yFt(4500)), 'g-s-leise', 1, 'stroke-dasharray="3 4" opacity=".7"');
      szene += linie(38, r1(yFt(2500)), 242, r1(yFt(2500)), 'g-s-leise', 1, 'stroke-dasharray="3 4" opacity=".7"');
      szene += text(42, r1(yFt(4500) + 11), 'BKN 4500 ft', { groesse: 10, gewicht: 800, klasse: 'g-f-primaer g-halo', anker: 'start' });
      szene += text(236, r1(yFt(2500) - 9), 'FEW CB 2500 ft', { groesse: 10, gewicht: 800, klasse: 'g-f-primaer g-halo', anker: 'end' });
    }
  }
  // Thermometer (nur im Schritt Temperatur)
  if (schritt === 4) {
    const yT = (c) => 196 - c * 3; // 1 °C ≙ 3 px
    szene += `<g opacity="${r1(f)}">
      <rect x="45" y="${yT(30)}" width="10" height="${r1(yT(-2) - yT(30))}" rx="5" class="g-f-weiss" style="stroke: var(--rand-stark); stroke-width: 1.2"/>
      <circle cx="50" cy="${yT(-4)}" r="8" class="g-f-fehler"/>
      <rect x="47.5" y="${yT(18)}" width="5" height="${r1(yT(-4) - yT(18))}" class="g-f-fehler"/>
      ${linie(40, yT(11), 62, yT(11), 'g-s-primaer', 2)}
      ${text(66, yT(18), '18 °C', { groesse: 10, gewicht: 800, klasse: 'g-f-fehler g-halo', anker: 'start' })}
      ${text(66, yT(11) + 4, 'Taupunkt 11 °C', { groesse: 10, gewicht: 800, klasse: 'g-f-primaer g-halo', anker: 'start' })}
    </g>`;
  }
  return svg(400, 284, `
    <rect width="400" height="284" class="g-f-land"/>
    <rect x="0" y="62" width="400" height="${BODEN - 62}" class="g-f-himmel"/>
    <rect x="0" y="${BODEN}" width="400" height="${236 - BODEN}" class="g-f-boden"/>
    <rect x="6" y="6" width="388" height="52" rx="10" class="g-f-weiss" style="stroke: var(--rand); stroke-width: 1"/>
    ${markierungen(s.gruppen)}
    ${ZEILEN.map((z, i) => text(200, i === 0 ? 21 : 43, z, { groesse: SCHRIFT, gewicht: 700, extra: MONO })).join('')}
    ${szene}
    <rect x="6" y="244" width="388" height="32" rx="10" class="g-f-weiss" style="stroke: var(--rand); stroke-width: 1"/>
    ${text(200, 260, s.bedeutung, { groesse: 12, gewicht: 800, klasse: 'g-f-primaer' })}
  `, `METAR Gruppe für Gruppe: ${s.gruppen.join(' ')} – ${s.bedeutung}`);
}

export const animationen = {
  gruppen: {
    titel: 'Ein METAR Gruppe für Gruppe',
    schritte: [
      { text: 'Vorne stehen **Ortskennung** und **Zeit**: XMUS ist der Übungsplatz Musterstadt, 121420Z heißt am **12.** um **14:20 UTC** (Z = UTC).', dauer: 3.6 },
      { text: '**Wind:** aus **240°** (rechtweisend) mit **12 kt**, in **Böen (G) 25 kt**. Der Windsack flattert.', dauer: 3.6 },
      { text: '**Sicht** 9999 heißt **10 km oder mehr**. Dazu **-SHRA**: ein leichter (–) Schauer (SH) mit Regen (RA).', dauer: 3.6 },
      { text: '**Wolken** in Hundert Fuß über dem Platz: **FEW025CB** – wenige Cumulonimben mit Basis **2500 ft**; **BKN045** – durchbrochene Schicht in **4500 ft**.', dauer: 4.2 },
      { text: '**Temperatur 18 °C**, **Taupunkt 11 °C**, Luftdruck **QNH 1009 hPa** – den stellst du am Höhenmesser ein.', dauer: 3.6 },
      { text: 'Zum Schluss der **Trend** für die nächsten zwei Stunden: **TEMPO 3000 TSRA** – vorübergehend nur **3000 m Sicht** und **Gewitter mit Regen**.', dauer: 4 },
    ],
    bild: metarBild,
  },
};
