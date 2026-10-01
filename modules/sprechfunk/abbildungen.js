// Abbildungen für das Modul „Sprechfunk“ – selbst gezeichnet.
import { svg, text, esc } from '../../js/grafik.js';

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

export const abbildungen = {
  'transponder-7000': () => transponder('7000'),

  lesbarkeit() {
    const stufen = [
      ['1', 'unverständlich'],
      ['2', 'zeitweise verständlich'],
      ['3', 'schwer verständlich'],
      ['4', 'verständlich'],
      ['5', 'einwandfrei verständlich'],
    ];
    return svg(400, 250, stufen.map(([zahl, wort], i) => {
      const y = 22 + i * 46;
      const breite = 34 + i * 30;
      return `<rect x="16" y="${y}" width="${breite}" height="32" rx="8" class="${i < 2 ? 'g-f-fehler' : i < 3 ? 'g-f-orange' : 'g-f-ok'}" opacity="${0.35 + i * 0.13}"/>
        ${text(36, y + 16, zahl, { groesse: 17, gewicht: 800 })}
        ${text(178, y + 16, wort, { groesse: 15, anker: 'start' })}`;
    }).join(''), 'Lesbarkeitsskala von 1 (unverständlich) bis 5 (einwandfrei verständlich)');
  },
};
