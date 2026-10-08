// Abbildungen für das Modul „Sprechfunk“ – selbst gezeichnet.
import { svg, text, esc, linie, pfeil, flugzeug, aufKreis } from '../../js/grafik.js';
import { SYMBOLE } from '../navigation/abbildungen.js';
import { STATIONEN, MUSTERSTADT, ALTDORF } from './uebungsgebiet.js';

const r1 = (n) => Number(n).toFixed(1);

/** Bedienteil eines Transponders mit dem eingestellten Code (feste Gerätefarben). */
export function transponder(code) {
  return svg(400, 150, `
    <rect x="4" y="4" width="392" height="142" rx="16" fill="#1d2532" stroke="#3a4558" stroke-width="2"/>
    <text x="28" y="34" fill="#9fb0c8" font-size="14" font-weight="700" dominant-baseline="middle">XPDR</text>
    <rect x="96" y="40" width="208" height="72" rx="8" fill="#0b0f15" stroke="#3a4558"/>
    <text x="200" y="78" fill="#ffb547" font-size="48" font-weight="700" font-family="ui-monospace, Menlo, monospace" text-anchor="middle" dominant-baseline="middle" letter-spacing="8">${esc(code)}</text>
    <text x="112" y="56" fill="#5dd39e" font-size="11" font-weight="700" dominant-baseline="middle">ALT</text>
    <circle cx="48" cy="96" r="18" fill="#2b3546" stroke="#56647a" stroke-width="2"/>
    <text x="48" y="96" fill="#d5deea" font-size="10" font-weight="700" text-anchor="middle" dominant-baseline="middle">MODE</text>
    <rect x="320" y="68" width="60" height="34" rx="8" fill="#2b3546" stroke="#56647a" stroke-width="2"/>
    <text x="350" y="86" fill="#d5deea" font-size="12" font-weight="700" text-anchor="middle" dominant-baseline="middle">IDENT</text>
  `, `Transponder mit dem Code ${code}`);
}


/** Sichtanflugkarte des frei erfundenen Übungsflughafens Musterstadt (XMUS). */
export function sichtanflugkarte() {
  const cx = 200, cy = 215, rCtr = 118;
  const n = [cx, cy - 128];
  const w = [cx - 138, cy + 6];
  const zum = (von, abstand) => {
    const d = Math.hypot(cx - von[0], cy - von[1]);
    return [von[0] + ((cx - von[0]) * (d - abstand)) / d, von[1] + ((cy - von[1]) * (d - abstand)) / d];
  };
  const nZiel = zum(n, 34);
  const wZiel = zum(w, 72);
  const m = MUSTERSTADT.meldepunkte;
  return svg(400, 470, `
    <rect x="0.5" y="0.5" width="399" height="469" rx="6" class="g-f-land g-s-rand" stroke-width="1"/>
    ${text(12, 22, 'MUSTERSTADT (XMUS)', { groesse: 15, gewicht: 800, anker: 'start' })}
    ${text(12, 39, 'Sichtanflugkarte · Übungskarte, frei erfunden', { groesse: 11, anker: 'start', klasse: 'g-f-leise' })}
    <g transform="translate(372 32)"><path d="M0-14l6 16-6-4-6 4z" class="g-f-text"/>${text(0, 14, 'N', { groesse: 10, gewicht: 800 })}</g>
    <circle cx="${cx}" cy="${cy}" r="${rCtr}" class="g-s-luft" stroke-width="2" stroke-dasharray="8 5"/>
    ${text(cx + 96, cy - 44, 'CTR', { groesse: 12, gewicht: 800, klasse: 'g-f-luft g-halo' })}
    ${text(cx + 96, cy - 30, MUSTERSTADT.ctr, { groesse: 9.5, gewicht: 700, klasse: 'g-f-luft g-halo' })}
    <path d="M${cx - 50} ${cy + 12}H${cx + 50}V${cy + 58}H${cx - 50}Z" class="g-s-primaer" stroke-width="1.4" stroke-dasharray="5 4" fill="none"/>
    ${pfeil(cx - 12, cy + 58, cx + 14, cy + 58, { farbe: 'primaer', breite: 1.4, spitze: 7 })}
    ${pfeil(cx + 50, cy + 30, cx + 50, cy + 20, { farbe: 'primaer', breite: 1.4, spitze: 7 })}
    ${text(cx, cy + 74, `Platzrunde Süd ${MUSTERSTADT.platzrunde} ft MSL`, { groesse: 10, gewicht: 700, klasse: 'g-f-primaer g-halo' })}
    <rect x="${cx - 46}" y="${cy - 4}" width="92" height="8" rx="1.5" class="g-f-text"/>
    ${linie(cx - 40, cy, cx + 40, cy, 'g-s-flaeche', 1, 'stroke-dasharray="6 5"')}
    ${text(cx - 56, cy + 4, MUSTERSTADT.pisten[0], { groesse: 11, gewicht: 800, anker: 'end' })}
    ${text(cx + 56, cy + 4, MUSTERSTADT.pisten[1], { groesse: 11, gewicht: 800, anker: 'start' })}
    ${linie(r1(n[0]), r1(n[1] + 10), r1(nZiel[0]), r1(nZiel[1]), 'g-s-orange', 2, 'stroke-dasharray="7 5"')}
    ${linie(r1(w[0] + 10), r1(w[1]), r1(wZiel[0]), r1(wZiel[1]), 'g-s-orange', 2, 'stroke-dasharray="7 5"')}
    ${SYMBOLE.pflichtmeldepunkt.zeichnen(n[0], n[1], 1.1)}
    ${text(n[0] + 14, n[1] - 2, `N · ${m.N.name}`, { groesse: 12, gewicht: 800, klasse: 'g-f-luft g-halo', anker: 'start' })}
    ${text(n[0] + 14, n[1] + 12, `${m.N.hoehe} ft MSL`, { groesse: 10, klasse: 'g-f-luft g-halo', anker: 'start' })}
    ${SYMBOLE.bedarfsmeldepunkt.zeichnen(w[0], w[1], 1.1)}
    ${text(w[0], w[1] + 22, `W · ${m.W.name}`, { groesse: 12, gewicht: 800, klasse: 'g-f-luft g-halo' })}
    ${text(w[0], w[1] + 36, `${m.W.hoehe} ft MSL`, { groesse: 10, klasse: 'g-f-luft g-halo' })}
    ${text(cx - 8, r1((n[1] + nZiel[1]) / 2 + 4), 'Ein-/Ausflug', { groesse: 9.5, gewicht: 700, klasse: 'g-f-orange g-halo', anker: 'end' })}
    <g transform="translate(12 368)">
      <rect width="376" height="62" rx="6" class="g-f-flaeche g-s-rand" stroke-width="1"/>
      ${text(10, 18, 'Frequenzen', { groesse: 10.5, gewicht: 800, anker: 'start' })}
      ${text(10, 34, `${STATIONEN.musterstadtTurm.de} ${STATIONEN.musterstadtTurm.frequenz} · ATIS ${STATIONEN.musterstadtAtis.frequenz}`, { groesse: 10.5, anker: 'start' })}
      ${text(10, 50, `FIS ${STATIONEN.mittelland.de} ${STATIONEN.mittelland.frequenz} · ELEV ${MUSTERSTADT.hoehe} ft`, { groesse: 10.5, anker: 'start' })}
    </g>
    ${text(200, 448, 'Pflichtmeldepunkt ▲ gefüllt · Meldepunkt auf Anforderung △ leer', { groesse: 9.5, klasse: 'g-f-leise' })}
    ${text(200, 462, 'ÜBUNGSKARTE – NICHT FÜR DIE NAVIGATION', { groesse: 9.5, gewicht: 800, klasse: 'g-f-fehler' })}
  `, 'Frei erfundene Sichtanflugkarte Musterstadt mit Kontrollzone, Meldepunkten November und Whiskey, Piste 09/27 und Platzrunde Süd');
}

/** Platzrunde des frei erfundenen Flugplatzes Altdorf (XALT): rechte Platzrunde Piste 25. */
export function platzrunde() {
  const l = 120, r = 280, y = 205, o = 92, links = 64, rechts = 336;
  const bein = (x1, y1, x2, y2) => pfeil(x1, y1, x2, y2, { farbe: 'primaer', breite: 1.8, spitze: 8 });
  return svg(400, 300, `
    <rect width="400" height="300" class="g-f-land"/>
    ${text(12, 22, `Altdorf (${ALTDORF.kennung}) · rechte Platzrunde Piste 25`, { groesse: 13, gewicht: 800, anker: 'start' })}
    ${text(12, 38, `1000 ft über Grund (${ALTDORF.platzrunde} ft MSL) · frei erfunden`, { groesse: 10.5, anker: 'start', klasse: 'g-f-leise' })}
    <g transform="translate(372 32)"><path d="M0-14l6 16-6-4-6 4z" class="g-f-text"/>${text(0, 14, 'N', { groesse: 10, gewicht: 800 })}</g>
    <ellipse cx="300" cy="262" rx="46" ry="20" class="g-f-ort"/>
    ${text(300, 266, 'Ortschaft', { groesse: 10, klasse: 'g-f-leise' })}
    <rect x="${l}" y="${y - 6}" width="${r - l}" height="12" rx="2" class="g-f-text"/>
    ${linie(l + 8, y, r - 8, y, 'g-s-flaeche', 1, 'stroke-dasharray="7 6"')}
    ${text(l - 8, y + 4, '07', { groesse: 11, gewicht: 800, anker: 'end' })}${text(r + 8, y + 4, '25', { groesse: 11, gewicht: 800, anker: 'start' })}
    ${bein(r - 10, y - 14, l + 10, y - 14)}
    ${bein(l - 10, y - 18, links + 4, o + 14)}
    ${bein(links + 14, o, rechts - 14, o)}
    ${bein(rechts - 4, o + 14, rechts - 4, y - 30)}
    ${bein(rechts - 10, y - 18, r + 16, y - 6)}
    ${text(178, y - 22, 'Start / Abflug · upwind', { groesse: 10.5, gewicht: 700, klasse: 'g-f-primaer g-halo' })}
    ${text(links + 34, 140, 'Querabflug', { groesse: 10.5, gewicht: 700, klasse: 'g-f-primaer g-halo', anker: 'start' })}
    ${text(links + 34, 153, 'crosswind', { groesse: 10, klasse: 'g-f-leise g-halo', anker: 'start' })}
    ${text(200, o - 8, 'Gegenanflug · downwind', { groesse: 11, gewicht: 800, klasse: 'g-f-primaer g-halo' })}
    ${text(rechts + 2, 140, 'Queranflug', { groesse: 10.5, gewicht: 700, klasse: 'g-f-primaer g-halo', anker: 'end' })}
    ${text(rechts + 2, 153, 'base', { groesse: 10, klasse: 'g-f-leise g-halo', anker: 'end' })}
    ${text(rechts + 2, y - 28, 'Endanflug · final', { groesse: 10.5, gewicht: 700, klasse: 'g-f-primaer g-halo', anker: 'end' })}
    <circle cx="${r - 4}" cy="${y + 20}" r="4" class="g-f-orange"/>
    ${text(r - 12, y + 24, 'Rollhalt 25', { groesse: 10, klasse: 'g-f-orange g-halo', anker: 'end' })}
    ${text(200, 290, 'Bei Piste 07 fliegst du dieselbe Platzrunde links herum.', { groesse: 10, klasse: 'g-f-leise' })}
  `, 'Frei erfundene Platzrunde Altdorf: rechte Platzrunde Piste 25 nördlich der Piste mit Querabflug, Gegenanflug, Queranflug und Endanflug');
}

/** Verkehr nach Uhrzeigerstellung: 12 Uhr ist geradeaus. */
export function uhrzeigerstellung(uhr = 2) {
  const c = 200, cy = 160, rad = 108;
  let ziffern = '';
  for (let i = 1; i <= 12; i++) {
    const [x, y] = aufKreis(c, cy, rad, i * 30);
    ziffern += text(r1(x), r1(y + 4), String(i), { groesse: i % 3 === 0 ? 15 : 12, gewicht: i % 3 === 0 ? 800 : 600, klasse: i === uhr ? 'g-f-orange' : 'g-f-text' });
  }
  const [vx, vy] = aufKreis(c, cy, rad - 34, uhr * 30);
  return svg(400, 300, `
    <rect width="400" height="300" class="g-f-himmel"/>
    <circle cx="${c}" cy="${cy}" r="${rad - 14}" class="g-s-rand" stroke-width="1" stroke-dasharray="3 4" fill="none"/>
    ${ziffern}
    ${flugzeug(c, cy, 0, 46)}
    ${flugzeug(r1(vx), r1(vy), 180 + uhr * 30, 26, 'g-f-orange')}
    ${text(200, 288, `Verkehr auf ${uhr} Uhr · 12 = geradeaus, 3 = rechts, 9 = links, 6 = hinten`, { groesse: 10.5, klasse: 'g-f-leise' })}
  `, `Uhrzeigerstellung: Verkehr auf ${uhr} Uhr`);
}

export const abbildungen = {
  'sichtanflugkarte-xmus': () => sichtanflugkarte(),
  'platzrunde-xalt': () => platzrunde(),
  uhrzeigerstellung: () => uhrzeigerstellung(2),

  'transponder-7000': () => transponder('7000'),

  lesbarkeit() {
    const stufen = [
      ['1', 'unverständlich'],
      ['2', 'zeitweise verständlich'],
      ['3', 'schwer verständlich'],
      ['4', 'verständlich'],
      ['5', 'sehr gut verständlich'],
    ];
    return svg(400, 250, stufen.map(([zahl, wort], i) => {
      const y = 22 + i * 46;
      const breite = 34 + i * 30;
      return `<rect x="16" y="${y}" width="${breite}" height="32" rx="8" class="${i < 2 ? 'g-f-fehler' : i < 3 ? 'g-f-orange' : 'g-f-ok'}" opacity="${0.35 + i * 0.13}"/>
        ${text(36, y + 16, zahl, { groesse: 17, gewicht: 800 })}
        ${text(178, y + 16, wort, { groesse: 15, anker: 'start' })}`;
    }).join(''), 'Verständlichkeitsskala von 1 (unverständlich) bis 5 (sehr gut verständlich)');
  },
};
