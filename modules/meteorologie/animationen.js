// Animationen für das Modul „Meteorologie“ – selbst gezeichnet, maßstäblich (js/animation.js).
import { svg, text, linie, wolke, sanft, abschnitt, zwischen } from '../../js/grafik.js';

const r1 = (n) => Math.round(n * 10) / 10;
const komma = (n) => String(Math.round(n * 10) / 10).replace('.', ',');

// Werte wie im Kapitel: trockenadiabatisch 1 °C je 100 m, Taupunkt der aufsteigenden Luft 0,2 °C je 100 m.
export const AM_BODEN = { temperatur: 20, taupunkt: 12 };

/** Temperatur und Taupunkt eines aufsteigenden (noch ungesättigten) Luftpakets in hoeheM über Grund. */
export function luftpaket(hoeheM, start = AM_BODEN) {
  return { temperatur: start.temperatur - hoeheM / 100, taupunkt: start.taupunkt - (0.2 * hoeheM) / 100 };
}

/** Höhe, in der Temperatur und Taupunkt gleich sind: Spread / 0,8 °C je 100 m. */
export function kondensationsHoehe(start = AM_BODEN) {
  return ((start.temperatur - start.taupunkt) / 0.8) * 100;
}

const BODEN = 236; // y des Bodens
const PRO_M = 0.15; // Pixel je Meter: 1000 m = 150 px (maßstäblich)
const yHoehe = (m) => BODEN - m * PRO_M;

function quellwolke(schritt, t) {
  const basis = kondensationsHoehe();
  // Wo die Luftblase in jedem Schritt ist (in m über Grund)
  const hoehe = [zwischen(0, 300, sanft(t)), zwischen(300, basis - 60, sanft(t)), zwischen(basis - 60, basis, sanft(abschnitt(t, 0, 0.35)))][schritt];
  const paket = luftpaket(hoehe);
  const bx = 150, by = yHoehe(hoehe) - 18;

  // Höhenachse
  let achse = linie(46, BODEN, 46, 40, 'g-s-leise', 1);
  for (const m of [500, 1000]) achse += linie(42, r1(yHoehe(m)), 50, r1(yHoehe(m)), 'g-s-leise', 1) + text(38, r1(yHoehe(m)), `${m} m`, { groesse: 10, klasse: 'g-f-leise', anker: 'end' });
  achse += text(38, BODEN - 8, '0 m', { groesse: 10, klasse: 'g-f-leise', anker: 'end' });

  // Thermometer-Leiste rechts: Temperatur (orange, oben beschriftet) und Taupunkt (blau, unten) auf fester Skala 0–25 °C
  const sx = (grad) => 250 + (grad / 25) * 128;
  const sy = 58;
  const skala = `<rect x="236" y="14" width="156" height="84" rx="12" class="g-f-weiss g-s-rand" stroke-width="1"/>`
    + text(246, 27, 'Luftblase', { groesse: 11, gewicht: 800, anker: 'start' })
    + linie(sx(0), sy, sx(25), sy, 'g-s-rand', 3)
    + linie(r1(sx(paket.taupunkt)), sy, r1(sx(paket.temperatur)), sy, 'g-s-orange', 3, 'opacity=".45"')
    + `<circle cx="${r1(sx(paket.temperatur))}" cy="${sy}" r="5.5" class="g-f-orange"/>`
    + `<circle cx="${r1(sx(paket.taupunkt))}" cy="${sy}" r="5.5" class="g-f-primaer"/>`
    + text(r1(Math.min(sx(paket.temperatur), 360)), sy - 13, `T ${komma(paket.temperatur)} °C`, { groesse: 10, gewicht: 800, klasse: 'g-f-orange' })
    + text(r1(Math.max(sx(paket.taupunkt), 272)), sy + 14, `Td ${komma(paket.taupunkt)} °C`, { groesse: 10, gewicht: 800, klasse: 'g-f-primaer' })
    + text(sx(0), sy + 29, '0 °C', { groesse: 9, klasse: 'g-f-leise', anker: 'start' })
    + text(sx(25), sy + 29, '25 °C', { groesse: 9, klasse: 'g-f-leise', anker: 'end' });

  let bild = '';
  if (schritt === 0) {
    // Warmer Boden: flimmernde Wärme und eine Blase, die sich ablöst
    const flimmern = (i) => r1(Math.sin(t * 9 + i) * 2.5);
    for (let i = 0; i < 4; i++) {
      const x = 112 + i * 26;
      bild += `<path d="M${x + Number(flimmern(i))} ${BODEN - 4}c-5-7 5-11 0-18" class="g-s-orange" stroke-width="2" fill="none" opacity="${r1(0.4 + 0.4 * Math.abs(Math.sin(t * 5 + i)))}"/>`;
    }
    bild += text(150, BODEN + 13, 'Die Sonne erwärmt den Boden', { groesse: 10.5, gewicht: 700, klasse: 'g-f-text' });
  }
  if (schritt >= 1) bild += linie(bx, BODEN - 4, bx, r1(by + 18), 'g-s-primaer', 1.5, 'stroke-dasharray="3 4" opacity=".6"');

  // Wolke ab Schritt 3: wächst über der Basis
  let wolkeBild = '';
  if (schritt === 2) {
    const g = sanft(abschnitt(t, 0.25, 1));
    const yb = yHoehe(basis);
    wolkeBild += linie(46, r1(yb), 392, r1(yb), 'g-s-primaer', 1.5, `stroke-dasharray="6 4" opacity="${r1(g)}"`);
    if (g > 0.02) wolkeBild += `<g opacity="${r1(Math.min(1, g * 1.4))}">${wolke(bx, r1(yb - 28 * g), r1(70 + 90 * g))}</g>`;
    wolkeBild += `<g opacity="${r1(g)}"><rect x="170" y="${r1(yb + 16)}" width="222" height="44" rx="10" class="g-f-weiss g-s-primaer" stroke-width="1.2"/>`
      + text(180, r1(yb + 30), `Wolkenbasis ≈ ${Math.round(basis)} m ≈ 3300 ft`, { groesse: 10.5, gewicht: 800, klasse: 'g-f-primaer', anker: 'start' })
      + text(180, r1(yb + 46), `Faustformel: (${AM_BODEN.temperatur} − ${AM_BODEN.taupunkt}) × 400 ft = 3200 ft`, { groesse: 9.5, anker: 'start' })
      + '</g>';
  }

  // Die Luftblase (verschwindet in der Wolke)
  const blase = schritt === 2 && t > 0.35 ? '' : `<circle cx="${bx}" cy="${r1(by)}" r="17" class="g-f-weiss g-s-orange" stroke-width="2" opacity=".92"/>`
    + text(bx, r1(by), `${komma(paket.temperatur)}°`, { groesse: 10.5, gewicht: 800, klasse: 'g-f-orange' });

  return svg(400, 256, `
    <rect width="400" height="256" class="g-f-himmel"/>
    <circle cx="96" cy="26" r="13" fill="#f7c514"/>
    <rect x="0" y="${BODEN}" width="400" height="${256 - BODEN}" class="g-f-wald"/>
    ${linie(0, BODEN, 400, BODEN, 'g-s-leise', 1)}
    ${achse}
    ${bild}
    ${wolkeBild}
    ${blase}
    ${skala}
  `, `Aufsteigende Luft in ${Math.round(hoehe)} m: Temperatur ${komma(paket.temperatur)} Grad, Taupunkt ${komma(paket.taupunkt)} Grad`);
}

export const animationen = {
  quellwolke: {
    titel: 'Wie eine Quellwolke entsteht',
    schritte: [
      { text: 'Die Sonne erwärmt den Boden. Die Luft darüber wird warm und leichter – sie löst sich als **Blase** und steigt auf.', dauer: 3.4 },
      { text: 'Beim Steigen dehnt sich die Luft aus und **kühlt ab: 1 °C je 100 m**. Ihr **Taupunkt** sinkt nur um 0,2 °C je 100 m – der Spread wird kleiner.', dauer: 4.4 },
      { text: 'Bei etwa 1000 m sind **Temperatur und Taupunkt gleich**: Der Wasserdampf kondensiert, die Wolke entsteht. Hier liegt die **Wolkenbasis**.', dauer: 3.6 },
    ],
    bild: quellwolke,
  },
};
