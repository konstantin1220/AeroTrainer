// Abbildungen für das Modul „Meteorologie“ – selbst gezeichnet, schematisch.
import { svg, text, linie, pfeil, wolke } from '../../js/grafik.js';

const CUMULUS = 'M6 70H94C104 70 107 56 99 49C106 37 97 24 84 27C82 11 63 5 53 16C45 3 25 8 25 25C12 23 4 35 11 45C1 49-1 66 6 70Z';
const CUMULONIMBUS = 'M10 160H110C121 160 124 143 113 134C123 124 120 106 106 101C114 89 108 72 94 70L97 42C121 37 141 30 151 21V14H-31V21C-21 30-1 37 23 42L26 70C12 72 6 89 14 101C0 106-3 124 7 134C-4 143-1 160 10 160Z';

/** Quellwolke (Cumulus) mit flacher Basis bei y = basis. */
function cumulus(x, basis, breite, hoehe, klasse = 'g-f-wolke g-s-rand') {
  const sx = breite / 100;
  const sy = hoehe / 70;
  return `<path class="${klasse}" stroke-width="1.5" vector-effect="non-scaling-stroke" transform="translate(${x - 50 * sx} ${basis - 70 * sy}) scale(${sx} ${sy})" d="${CUMULUS}"/>`;
}

/** Gewitterwolke (Cumulonimbus) mit Amboss; breite = Breite der Basis. */
function cumulonimbus(x, basis, oben, breite) {
  const sx = breite / 120;
  const sy = (basis - oben) / 146;
  return `<path class="g-f-wolke g-s-rand" stroke-width="1.5" vector-effect="non-scaling-stroke" transform="translate(${x - 60 * sx} ${basis - 160 * sy}) scale(${sx} ${sy})" d="${CUMULONIMBUS}"/>`;
}

/** Frontsymbol wie in der Bodenwetterkarte: Linie mit Halbkreisen (warm) oder Dreiecken (kalt). */
function frontSymbol(x, y, art) {
  const farbe = art === 'warm' ? 'fehler' : 'primaer';
  const zeichen = [0, 1, 2].map((i) => {
    const mx = x + 14 + i * 22;
    return art === 'warm'
      ? `<path d="M${mx - 7} ${y}a7 7 0 0 1 14 0z" class="g-f-${farbe}"/>`
      : `<path d="M${mx - 7} ${y}L${mx} ${y - 10}L${mx + 7} ${y}z" class="g-f-${farbe}"/>`;
  }).join('');
  return `${linie(x, y, x + 72, y, `g-s-${farbe}`, 2.5)}${zeichen}${text(x + 80, y - 6, 'so in der', { groesse: 10, anker: 'start', klasse: 'g-f-leise' })}${text(x + 80, y + 6, 'Wetterkarte', { groesse: 10, anker: 'start', klasse: 'g-f-leise' })}`;
}

function regen(x1, x2, y1, y2, dicht = 14) {
  let striche = '';
  for (let x = x1; x <= x2; x += dicht) striche += linie(x, y1, x - 6, y2, 'g-s-primaer', 1.5, 'opacity=".7"');
  return striche;
}

export const abbildungen = {
  atmosphaere() {
    // Höhe 0–15 km auf y 270→20; Temperatur −60 … +20 °C auf x 70→370
    const py = (km) => 270 - (km / 15) * 250;
    const px = (t) => 70 + ((t + 60) / 80) * 300;
    const f = (n) => n.toFixed(1);
    let raster = '';
    for (let km = 0; km <= 15; km += 5) raster += linie(70, f(py(km)), 370, f(py(km)), 'g-s-rand', 0.8) + text(62, f(py(km)), `${km} km`, { groesse: 11, anker: 'end', klasse: 'g-f-leise' });
    for (let t = -60; t <= 20; t += 20) raster += text(f(px(t)), 286, `${t} °C`, { groesse: 11, klasse: 'g-f-leise' });
    return svg(400, 300, `
      <rect x="70" y="${f(py(15))}" width="300" height="${f(py(11) - py(15))}" class="g-f-mf-hell"/>
      ${raster}
      ${linie(70, f(py(11)), 370, f(py(11)), 'g-s-mf', 2, 'stroke-dasharray="7 5"')}
      ${text(366, f(py(11) - 10), 'Tropopause (ca. 11 km)', { groesse: 12, gewicht: 700, anker: 'end', klasse: 'g-f-mf' })}
      ${text(300, f(py(13.3)), 'Stratosphäre', { groesse: 13, gewicht: 600 })}
      ${text(150, f(py(3)), 'Troposphäre', { groesse: 13, gewicht: 600 })}
      ${text(150, f(py(1.9)), '(hier spielt das Wetter)', { groesse: 11, klasse: 'g-f-leise' })}
      <path d="M${f(px(15))} ${f(py(0))}L${f(px(-56.5))} ${f(py(11))}L${f(px(-56.5))} ${f(py(15))}" class="g-s-orange" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="${f(px(15))}" cy="${f(py(0))}" r="5" class="g-f-orange"/>
      ${text(f(px(15) - 14), f(py(0) - 6), 'am Boden: 15 °C · 1013,25 hPa', { groesse: 12, gewicht: 700, anker: 'end', klasse: 'g-f-orange' })}
      ${text(f(px(-56.5) + 8), f(py(12.6)), '−56,5 °C', { groesse: 12, gewicht: 700, anker: 'start', klasse: 'g-f-orange' })}
      ${(() => {
        const [x1, y1, x2, y2] = [px(15), py(0), px(-56.5), py(11)];
        const winkel = Math.atan2(y1 - y2, x1 - x2) * 180 / Math.PI;
        const mx = (x1 + x2) / 2 + 9;
        const my = (y1 + y2) / 2 - 12;
        return text(f(mx), f(my), '−2 °C je 1000 ft', { groesse: 12, gewicht: 700, klasse: 'g-f-orange', extra: `transform="rotate(${winkel.toFixed(1)} ${f(mx)} ${f(my)})"` });
      })()}
    `, 'Standardatmosphäre: Temperatur nimmt bis zur Tropopause in etwa 11 Kilometern ab und bleibt darüber gleich');
  },

  wolkenstockwerke() {
    return svg(400, 320, `
      <rect width="400" height="320" class="g-f-himmel"/>
      ${linie(0, 110, 400, 110, 'g-s-rand', 1, 'stroke-dasharray="5 5"')}
      ${linie(0, 205, 400, 205, 'g-s-rand', 1, 'stroke-dasharray="5 5"')}
      ${text(8, 22, 'hohe Wolken', { groesse: 12, gewicht: 700, anker: 'start' })}${text(88, 22, 'ab ca. 5 km', { groesse: 11, anker: 'start', klasse: 'g-f-leise' })}
      ${text(8, 124, 'mittelhohe Wolken', { groesse: 12, gewicht: 700, anker: 'start' })}${text(122, 124, 'ca. 2 bis 7 km', { groesse: 11, anker: 'start', klasse: 'g-f-leise' })}
      ${text(8, 219, 'tiefe Wolken', { groesse: 12, gewicht: 700, anker: 'start' })}${text(86, 219, 'bis ca. 2 km', { groesse: 11, anker: 'start', klasse: 'g-f-leise' })}
      <path d="M40 60c30-14 60-12 80-24M70 74c26-10 50-8 70-20M150 48c22-8 40-6 60-18" class="g-s-leise" stroke-width="2.5"/>
      ${text(100, 94, 'Cirrus', { groesse: 11 })}
      ${wolke(196, 70, 34)}${wolke(228, 64, 28)}${wolke(256, 72, 30)}
      ${text(226, 94, 'Cirrocumulus', { groesse: 11 })}
      ${wolke(50, 158, 40)}${wolke(86, 150, 36)}${wolke(120, 160, 40)}
      ${text(86, 186, 'Altocumulus', { groesse: 11 })}
      <rect x="156" y="146" width="104" height="22" rx="10" class="g-f-wolke g-s-rand" stroke-width="1.5"/>
      ${text(208, 186, 'Altostratus', { groesse: 11 })}
      <rect x="20" y="246" width="150" height="20" rx="9" class="g-f-wolke g-s-rand" stroke-width="1.5"/>
      ${text(95, 280, 'Stratus', { groesse: 11 })}
      ${cumulus(222, 288, 70, 52)}
      ${text(222, 302, 'Cumulus', { groesse: 11 })}
      ${cumulonimbus(330, 288, 84, 76)}
      ${text(330, 302, 'Cumulonimbus', { groesse: 11 })}
      <rect x="0" y="306" width="400" height="14" class="g-f-boden"/>
      ${text(330, 316, 'reicht durch alle Stockwerke', { groesse: 9, klasse: 'g-f-leise' })}
    `, 'Wolkenstockwerke: hohe, mittelhohe und tiefe Wolken sowie Quellwolken bis zur Gewitterwolke');
  },

  warmfront() {
    return svg(400, 240, `
      <rect width="400" height="240" class="g-f-himmel"/>
      <path d="M40 210L390 50V210z" class="g-f-primaer" opacity=".1"/>
      <path d="M40 210L390 50" class="g-s-orange" stroke-width="3"/>
      ${text(70, 96, 'Warmluft', { groesse: 13, gewicht: 700, klasse: 'g-f-orange' })}
      ${text(330, 150, 'Kaltluft', { groesse: 13, gewicht: 700, klasse: 'g-f-primaer' })}
      ${pfeil(300, 198, 372, 198, { farbe: 'text', breite: 1.6 })}
      ${text(336, 190, 'Zugrichtung', { groesse: 11, gewicht: 700 })}
      ${frontSymbol(14, 32, 'warm')}
      ${pfeil(110, 160, 200, 119, { farbe: 'orange', breite: 2.5 })}
      <path d="M262 64c14-6 28-4 40-11M296 50c12-5 22-3 34-9" class="g-s-leise" stroke-width="2"/>
      ${text(300, 30, 'Ci', { groesse: 12, gewicht: 700 })}
      <path d="M176 112L270 69V84L176 127z" class="g-f-wolke g-s-rand" stroke-width="1.5" stroke-linejoin="round"/>
      ${text(244, 108, 'Cs / As', { groesse: 12, gewicht: 700 })}
      <path d="M52 196L178 138V112L52 168z" class="g-f-wolke g-s-rand" stroke-width="1.5" stroke-linejoin="round"/>
      ${text(118, 160, 'Ns', { groesse: 12, gewicht: 700 })}
      ${regen(96, 176, 188, 208, 12)}
      ${text(200, 230, 'Warmluft gleitet flach auf → breites Regengebiet vor der Bodenfront', { groesse: 11, klasse: 'g-f-leise' })}
      <rect x="0" y="210" width="400" height="8" class="g-f-boden"/>
    `, 'Schnitt durch eine Warmfront: Die Warmluft gleitet flach auf die vorgelagerte Kaltluft auf; davor Cirrus, Cirrostratus und Altostratus, an der Front Nimbostratus mit Landregen');
  },

  kaltfront() {
    return svg(400, 240, `
      <rect width="400" height="240" class="g-f-himmel"/>
      <path d="M220 210C200 160 190 110 200 40H400V210z" class="g-f-orange" opacity=".12"/>
      <path d="M220 210C200 160 190 110 200 40" class="g-s-primaer" stroke-width="3"/>
      ${text(352, 112, 'Warmluft', { groesse: 13, gewicht: 700, klasse: 'g-f-orange' })}
      ${text(80, 120, 'Kaltluft', { groesse: 13, gewicht: 700, klasse: 'g-f-primaer' })}
      ${cumulonimbus(275, 190, 40, 90)}
      ${regen(240, 310, 194, 210, 9)}
      ${pfeil(70, 180, 150, 190, { farbe: 'primaer', breite: 2.5 })}
      ${text(110, 172, 'Zugrichtung', { groesse: 11, gewicht: 700, klasse: 'g-f-primaer' })}
      ${frontSymbol(14, 32, 'kalt')}
      ${text(255, 226, 'Kaltluft schiebt sich unter → Cb, Schauer, Böen', { groesse: 11, klasse: 'g-f-leise' })}
      <rect x="0" y="210" width="400" height="8" class="g-f-boden"/>
    `, 'Schnitt durch eine Kaltfront: Kaltluft schiebt sich unter die Warmluft, an der Front Gewitterwolken mit Schauern');
  },

  'hoch-tief'() {
    const isobaren = (x, y) => [30, 58, 86].map((r) => `<ellipse cx="${x}" cy="${y}" rx="${r * 1.15}" ry="${r}" class="g-s-leise" stroke-width="1.4"/>`).join('');
    return svg(400, 250, `
      ${isobaren(100, 110)}${isobaren(300, 110)}
      ${text(100, 110, 'T', { groesse: 30, gewicht: 800, klasse: 'g-f-fehler' })}
      ${text(300, 110, 'H', { groesse: 30, gewicht: 800, klasse: 'g-f-primaer' })}
      ${pfeil(34, 78, 46, 140, { farbe: 'orange' })}
      ${pfeil(70, 172, 124, 164, { farbe: 'orange' })}
      ${pfeil(166, 142, 154, 80, { farbe: 'orange' })}
      ${pfeil(128, 48, 76, 56, { farbe: 'orange' })}
      ${pfeil(276, 56, 328, 46, { farbe: 'orange' })}
      ${pfeil(362, 78, 372, 140, { farbe: 'orange' })}
      ${pfeil(324, 164, 272, 174, { farbe: 'orange' })}
      ${pfeil(238, 142, 228, 80, { farbe: 'orange' })}
      ${text(100, 214, 'Tief: gegen den Uhrzeigersinn', { groesse: 12, gewicht: 600 })}
      ${text(300, 214, 'Hoch: im Uhrzeigersinn', { groesse: 12, gewicht: 600 })}
      ${text(200, 240, 'Nordhalbkugel, Wind am Boden: ins Tief hinein, aus dem Hoch heraus', { groesse: 11, klasse: 'g-f-leise' })}
    `, 'Nordhalbkugel: Wind weht um ein Tief gegen den Uhrzeigersinn und um ein Hoch im Uhrzeigersinn');
  },

  seewind() {
    return svg(400, 220, `
      <rect width="400" height="220" class="g-f-himmel"/>
      <rect x="0" y="170" width="190" height="50" class="g-f-wasser"/>
      <path d="M190 170h210v50H190z" class="g-f-boden"/>
      <circle cx="340" cy="40" r="18" class="g-f-orange"/>
      ${text(95, 196, 'Meer (kühler)', { groesse: 12, gewicht: 600 })}
      ${text(295, 196, 'Land (wärmer)', { groesse: 12, gewicht: 600 })}
      ${pfeil(60, 150, 260, 150, { farbe: 'primaer', breite: 3 })}
      ${text(160, 134, 'Seewind am Boden', { groesse: 12, gewicht: 700, klasse: 'g-f-primaer' })}
      ${pfeil(290, 140, 290, 70, { farbe: 'orange', breite: 2.5 })}
      ${pfeil(260, 56, 80, 56, { farbe: 'leise', breite: 2, gestrichelt: true })}
      ${pfeil(50, 70, 50, 136, { farbe: 'leise', breite: 2, gestrichelt: true })}
      ${cumulus(300, 64, 60, 30)}
      ${text(200, 24, 'tagsüber', { groesse: 13, gewicht: 700 })}
    `, 'Seewind: Tagsüber erwärmt sich das Land, die Luft steigt auf und am Boden strömt kühlere Luft vom Meer nach');
  },

  gewitterstadien() {
    return svg(400, 240, `
      <rect width="400" height="240" class="g-f-himmel"/>
      ${cumulus(70, 190, 84, 120)}
      ${pfeil(70, 182, 70, 92, { farbe: 'orange', breite: 2.5 })}
      ${text(70, 212, 'Aufbau', { groesse: 12, gewicht: 700 })}
      ${text(70, 228, 'Aufwinde', { groesse: 11, klasse: 'g-f-leise' })}
      ${cumulonimbus(200, 190, 26, 84)}
      ${pfeil(186, 182, 186, 70, { farbe: 'orange', breite: 2.5 })}
      ${pfeil(214, 80, 214, 186, { farbe: 'primaer', breite: 2.5 })}
      ${regen(228, 252, 193, 204, 8)}
      ${text(200, 212, 'Reife', { groesse: 12, gewicht: 700 })}
      ${text(200, 228, 'Auf- und Abwinde, Niederschlag', { groesse: 11, klasse: 'g-f-leise' })}
      <path d="M282 52c20-10 76-12 100-2 6 3 6 10-2 12-28 5-72 4-96 0-7-2-8-7-2-10z" class="g-f-wolke g-s-rand" stroke-width="1.5"/>
      ${cumulus(330, 170, 70, 46)}
      ${pfeil(330, 128, 330, 186, { farbe: 'primaer', breite: 2.5 })}
      ${regen(306, 352, 174, 190, 12)}
      ${text(330, 212, 'Auflösung', { groesse: 12, gewicht: 700 })}
      ${text(330, 228, 'Abwinde', { groesse: 11, klasse: 'g-f-leise' })}
    `, 'Lebenslauf eines Gewitters: Aufbau mit Aufwinden, Reife mit Auf- und Abwinden, Auflösung mit Abwinden');
  },
};
