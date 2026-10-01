// Abbildungen für das Modul „Aerodynamik“ – selbst gezeichnet, schematisch.
import { svg, text, linie, pfeil, FLUGZEUG_PFAD } from '../../js/grafik.js';

const PROFIL = 'M0 0C0-14 30-34 90-36S240-18 290 0C220 6 120 10 50 10S0 6 0 0z';

/** Flugzeug in Seitenansicht (Nase links). */
function seitenansicht(x = 0, y = 0, s = 1, klasse = 'g-f-flaeche g-s-text') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path class="${klasse}" stroke-width="2" d="M74 112c0-8 6-12 16-13l196-5 14-24h14l-4 30c0 6-4 10-12 10L92 124c-12 0-18-4-18-12z"/>
    <path class="g-s-text" stroke-width="2" d="M128 99c4-12 34-14 44 0"/>
    <ellipse cx="175" cy="113" rx="46" ry="4" class="g-f-rand g-s-text" stroke-width="1.5"/>
    <ellipse cx="300" cy="100" rx="20" ry="3" class="g-f-rand g-s-text" stroke-width="1.5"/>
    ${linie(68, 92, 68, 132, 'g-s-text', 3)}
  </g>`;
}

export const abbildungen = {
  profil() {
    return svg(400, 230, `
      ${[40, 80, 120, 190].map((y) => pfeil(6, y, 46, y, { farbe: 'leise', breite: 1.8, spitze: 8 })).join('')}
      ${text(8, 214, 'Anströmung', { groesse: 11, klasse: 'g-f-leise', anker: 'start' })}
      <g transform="translate(70 128) rotate(9)">
        <path d="${PROFIL}" class="g-f-mf-hell g-s-mf" stroke-width="2.5"/>
        ${linie(0, 0, 290, 0, 'g-s-text', 1.5, 'stroke-dasharray="6 5"')}
      </g>
      ${linie(70, 128, 230, 128, 'g-s-leise', 1.5)}
      <path d="M150 128A80 80 0 0 1 149 140.5" class="g-s-orange" stroke-width="3"/>
      ${text(166, 137, 'α', { groesse: 17, gewicht: 800, klasse: 'g-f-orange' })}
      ${text(300, 120, 'Anstellwinkel α', { groesse: 12, gewicht: 700, klasse: 'g-f-orange' })}
      ${text(52, 156, 'Vorderkante', { groesse: 12, gewicht: 600 })}
      ${text(350, 194, 'Hinterkante', { groesse: 12, gewicht: 600 })}
      ${text(250, 146, 'Profilsehne', { groesse: 12, gewicht: 600, extra: 'transform="rotate(9 250 146)"' })}
      ${text(170, 76, 'Oberseite: Sog', { groesse: 12, klasse: 'g-f-leise' })}
      ${text(200, 196, 'Unterseite: Überdruck', { groesse: 12, klasse: 'g-f-leise' })}
    `, 'Tragflächenprofil mit Vorderkante, Hinterkante, Profilsehne und Anstellwinkel zwischen Profilsehne und Anströmung');
  },

  kraefte() {
    return svg(400, 260, `
      ${seitenansicht(10, 20)}
      ${pfeil(190, 128, 190, 28, { farbe: 'ok', breite: 4 })}
      ${text(204, 34, 'Auftrieb', { groesse: 14, gewicht: 700, klasse: 'g-f-ok', anker: 'start' })}
      ${pfeil(190, 136, 190, 238, { farbe: 'fehler', breite: 4 })}
      ${text(204, 232, 'Gewichtskraft', { groesse: 14, gewicht: 700, klasse: 'g-f-fehler', anker: 'start' })}
      ${pfeil(76, 132, 8, 132, { farbe: 'primaer', breite: 4 })}
      ${text(40, 112, 'Schub', { groesse: 14, gewicht: 700, klasse: 'g-f-primaer' })}
      ${pfeil(330, 132, 392, 132, { farbe: 'orange', breite: 4 })}
      ${text(360, 156, 'Widerstand', { groesse: 14, gewicht: 700, klasse: 'g-f-orange' })}
      <circle cx="190" cy="132" r="6" class="g-f-text"/>
    `, 'Die vier Kräfte am Flugzeug: Auftrieb, Gewichtskraft, Schub und Widerstand');
  },

  achsen() {
    return svg(400, 340, `
      <g transform="translate(200 160) scale(11) translate(-12 -12)"><path d="${FLUGZEUG_PFAD}" class="g-f-mf-hell g-s-mf" stroke-width="0.18"/></g>
      ${linie(200, 26, 200, 288, 'g-s-primaer', 2.5, 'stroke-dasharray="8 6"')}
      ${linie(30, 165, 370, 165, 'g-s-orange', 2.5, 'stroke-dasharray="8 6"')}
      <circle cx="200" cy="165" r="9" class="g-f-weiss g-s-ok" stroke-width="3"/><circle cx="200" cy="165" r="3" class="g-f-ok"/>
      ${text(200, 12, 'Längsachse: Rollen · Querruder', { groesse: 12, gewicht: 700, klasse: 'g-f-primaer' })}
      ${text(392, 116, 'Querachse:', { groesse: 12, gewicht: 700, klasse: 'g-f-orange', anker: 'end' })}
      ${text(392, 132, 'Nicken · Höhenruder', { groesse: 12, gewicht: 700, klasse: 'g-f-orange', anker: 'end' })}
      ${text(200, 306, 'Hochachse (zeigt aus dem Bild heraus):', { groesse: 12, gewicht: 700, klasse: 'g-f-ok' })}
      ${text(200, 324, 'Gieren · Seitenruder', { groesse: 12, gewicht: 700, klasse: 'g-f-ok' })}
    `, 'Die drei Achsen des Flugzeugs: Längsachse, Querachse und Hochachse mit den zugehörigen Bewegungen und Rudern');
  },

  widerstandskurve() {
    const l = 50, r = 380, o = 20, u = 230;
    const v = (i) => l + i * (r - l);
    const punkte = (f) => Array.from({ length: 41 }, (_, k) => { const i = k / 40; return `${v(i).toFixed(1)},${(u - f(i) * (u - o)).toFixed(1)}`; }).join(' ');
    const induziert = (i) => 0.08 / (i + 0.15) ** 2 * 0.22;
    const schaedlich = (i) => 0.05 + 0.85 * i * i;
    const gesamt = (i) => induziert(i) + schaedlich(i);
    let min = 0;
    for (let k = 0; k <= 400; k++) if (gesamt(k / 400) < gesamt(min)) min = k / 400;
    return svg(400, 270, `
      ${linie(l, u, r, u, 'g-s-text', 2)}${linie(l, u, l, o, 'g-s-text', 2)}
      ${text((l + r) / 2, 254, 'Geschwindigkeit →', { groesse: 12, klasse: 'g-f-leise' })}
      ${text(20, (o + u) / 2, 'Widerstand →', { groesse: 12, klasse: 'g-f-leise', extra: `transform="rotate(-90 20 ${(o + u) / 2})"` })}
      <polyline points="${punkte((i) => Math.min(induziert(i), 0.98))}" class="g-s-primaer" stroke-width="2.5"/>
      <polyline points="${punkte(schaedlich)}" class="g-s-orange" stroke-width="2.5"/>
      <polyline points="${punkte((i) => Math.min(gesamt(i), 0.98))}" class="g-s-text" stroke-width="3.5"/>
      ${linie(v(min).toFixed(1), (u - gesamt(min) * (u - o)).toFixed(1), v(min).toFixed(1), u, 'g-s-ok', 2, 'stroke-dasharray="5 4"')}
      <circle cx="${v(min).toFixed(1)}" cy="${(u - gesamt(min) * (u - o)).toFixed(1)}" r="6" class="g-f-ok"/>
      ${text(v(min).toFixed(1), u + 12, 'bestes Gleiten', { groesse: 11, gewicht: 700, klasse: 'g-f-ok' })}
      ${text(v(0.18).toFixed(1), 40, 'induzierter', { groesse: 12, gewicht: 700, klasse: 'g-f-primaer', anker: 'start' })}
      ${text(v(0.18).toFixed(1), 55, 'Widerstand', { groesse: 12, gewicht: 700, klasse: 'g-f-primaer', anker: 'start' })}
      ${text(v(0.74).toFixed(1), 58, 'schädlicher', { groesse: 12, gewicht: 700, klasse: 'g-f-orange', anker: 'end' })}
      ${text(v(0.74).toFixed(1), 73, 'Widerstand', { groesse: 12, gewicht: 700, klasse: 'g-f-orange', anker: 'end' })}
      ${text(v(0.7).toFixed(1), 150, 'Gesamtwiderstand', { groesse: 12, gewicht: 700, anker: 'end' })}
    `, 'Widerstand über der Geschwindigkeit: induzierter Widerstand sinkt, schädlicher steigt, der Gesamtwiderstand hat bei der Geschwindigkeit des besten Gleitens sein Minimum');
  },

  auftriebskurve() {
    const l = 50, r = 380, o = 20, u = 230;
    const px = (a) => l + (a / 24) * (r - l);
    const py = (c) => u - (c / 1.6) * (u - o);
    const f = (n) => n.toFixed(1);
    const kurve = [[0, 0.2], [4, 0.6], [8, 1.0], [12, 1.32], [15, 1.45], [16, 1.47], [17, 1.42], [19, 1.15], [22, 0.95]];
    return svg(400, 270, `
      ${linie(l, u, r, u, 'g-s-text', 2)}${linie(px(0), u, px(0), o, 'g-s-text', 2)}
      ${text((l + r) / 2, 254, 'Anstellwinkel α →', { groesse: 12, klasse: 'g-f-leise' })}
      ${text(22, (o + u) / 2, 'Auftriebsbeiwert cA →', { groesse: 12, klasse: 'g-f-leise', extra: `transform="rotate(-90 22 ${(o + u) / 2})"` })}
      <rect x="${f(px(16))}" y="${o}" width="${f(px(24) - px(16))}" height="${u - o}" class="g-f-fehler" opacity=".08"/>
      <polyline points="${kurve.map(([a, c]) => `${f(px(a))},${f(py(c))}`).join(' ')}" class="g-s-mf" stroke-width="3.5" stroke-linejoin="round"/>
      ${linie(f(px(16)), f(py(1.47)), f(px(16)), u, 'g-s-fehler', 2, 'stroke-dasharray="5 4"')}
      ${text(f(px(16)), u + 12, 'kritischer α', { groesse: 11, gewicht: 700, klasse: 'g-f-fehler' })}
      ${text(f(px(20.2)), 50, 'Strömungs-', { groesse: 12, gewicht: 700, klasse: 'g-f-fehler' })}
      ${text(f(px(20.2)), 65, 'abriss', { groesse: 12, gewicht: 700, klasse: 'g-f-fehler' })}
      ${text(f(px(9) + 10), f(py(0.75)), 'cA steigt mit α', { groesse: 12, gewicht: 600, anker: 'start' })}
    `, 'Auftriebsbeiwert über dem Anstellwinkel: steigt bis zum kritischen Anstellwinkel, danach reißt die Strömung ab');
  },

  kurvenflug() {
    const cx = 200, cy = 150;
    return svg(400, 290, `
      <g transform="rotate(-30 ${cx} ${cy})">
        <rect x="${cx - 150}" y="${cy - 5}" width="300" height="10" rx="5" class="g-f-mf-hell g-s-mf" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="18" class="g-f-flaeche g-s-text" stroke-width="2"/>
        <path d="M${cx - 4} ${cy - 18}l4-26 4 26" class="g-f-rand g-s-text" stroke-width="1.5"/>
        ${pfeil(cx, cy, cx, cy - 120, { farbe: 'ok', breite: 4 })}
      </g>
      ${pfeil(cx, cy, cx, cy - 104, { farbe: 'ok', breite: 2, gestrichelt: true })}
      ${pfeil(cx, cy, cx - 60, cy, { farbe: 'primaer', breite: 2, gestrichelt: true })}
      ${pfeil(cx, cy + 4, cx, cy + 108, { farbe: 'fehler', breite: 4 })}
      ${text(cx - 64, 28, 'Auftrieb (größer!)', { groesse: 13, gewicht: 700, klasse: 'g-f-ok' })}
      ${text(cx + 8, 60, 'trägt das Gewicht', { groesse: 12, gewicht: 600, klasse: 'g-f-ok', anker: 'start' })}
      ${text(cx - 70, cy + 22, 'zieht in die Kurve', { groesse: 12, gewicht: 600, klasse: 'g-f-primaer' })}
      ${text(cx + 12, cy + 100, 'Gewichtskraft', { groesse: 13, gewicht: 700, klasse: 'g-f-fehler', anker: 'start' })}
      ${text(cx, 282, 'Lastvielfaches n = 1 ÷ cos(Querlage)', { groesse: 13, gewicht: 700 })}
    `, 'Kurvenflug von vorn: Der geneigte Auftrieb muss größer sein, damit sein senkrechter Anteil das Gewicht trägt; der waagerechte Anteil zieht das Flugzeug in die Kurve');
  },
};
