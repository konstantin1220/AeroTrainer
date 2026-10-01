// Abbildungen für „Masse & Schwerpunkt“ – selbst gezeichnet.
import { svg, text, linie, pfeil } from '../../js/grafik.js';

/** Schwerpunkt-Hüllkurve mit optionalen Punkten [{ schwerpunkt, masse, art: 'start'|'landung' }]. */
export function huellkurve(flugzeug, punkte = []) {
  const xMin = 0.85, xMax = 1.25, yMin = 700, yMax = 1200;
  const l = 58, r = 384, o = 18, u = 252;
  const px = (x) => l + ((x - xMin) / (xMax - xMin)) * (r - l);
  const py = (y) => u - ((y - yMin) / (yMax - yMin)) * (u - o);
  const f = (n) => n.toFixed(1);

  let raster = '';
  for (let x = 0.9; x <= 1.2501; x += 0.05) {
    raster += linie(f(px(x)), o, f(px(x)), u, 'g-s-rand', 0.8);
    raster += text(f(px(x)), u + 14, x.toFixed(2).replace('.', ','), { groesse: 11, klasse: 'g-f-leise' });
  }
  for (let y = 700; y <= 1200; y += 100) {
    raster += linie(l, f(py(y)), r, f(py(y)), 'g-s-rand', 0.8);
    raster += text(l - 6, f(py(y)), String(y), { groesse: 11, klasse: 'g-f-leise', anker: 'end' });
  }
  const flaeche = flugzeug.huellkurve.map(([x, y]) => `${f(px(x))},${f(py(y))}`).join(' ');
  const marken = punkte.map((p) => {
    const x = f(px(Math.min(Math.max(p.schwerpunkt, xMin), xMax)));
    const y = f(py(Math.min(Math.max(p.masse, yMin), yMax)));
    const klasse = p.zulaessig ? 'g-f-ok' : 'g-f-fehler';
    return p.art === 'landung'
      ? `<circle cx="${x}" cy="${y}" r="6" class="g-f-weiss ${p.zulaessig ? 'g-s-ok' : 'g-s-fehler'}" stroke-width="3"/>`
      : `<circle cx="${x}" cy="${y}" r="7" class="${klasse}"/><circle cx="${x}" cy="${y}" r="7" class="g-s-flaeche" stroke-width="2"/>`;
  }).join('');
  const verbindung = punkte.length === 2
    ? linie(f(px(punkte[0].schwerpunkt)), f(py(punkte[0].masse)), f(px(punkte[1].schwerpunkt)), f(py(punkte[1].masse)), 'g-s-leise', 1.5, 'stroke-dasharray="4 4"')
    : '';

  return svg(400, 290, `
    ${raster}
    <polygon points="${flaeche}" class="g-f-mf-hell g-s-mf" stroke-width="2.5"/>
    ${linie(l, f(py(flugzeug.mtom)), r, f(py(flugzeug.mtom)), 'g-s-fehler', 1.5, 'stroke-dasharray="6 4"')}
    ${text(r - 4, f(py(flugzeug.mtom) - 9), `MTOM ${flugzeug.mtom} kg`, { groesse: 11, gewicht: 700, klasse: 'g-f-fehler', anker: 'end' })}
    ${verbindung}${marken}
    ${text(f((l + r) / 2), 284, 'Schwerpunkt (m hinter der Bezugsebene)', { groesse: 11, klasse: 'g-f-leise' })}
    ${text(14, f((o + u) / 2), 'Masse (kg)', { groesse: 11, klasse: 'g-f-leise', extra: `transform="rotate(-90 14 ${f((o + u) / 2)})"` })}
  `, 'Schwerpunkt-Hüllkurve: zulässiger Bereich von Masse und Schwerpunkt');
}

export function abbildungenFuer(flugzeug) {
  return {
    huellkurve: () => huellkurve(flugzeug),

    hebel() {
      // 1 m = 120 Einheiten ab der Bezugsebene bei x = 40
      // 60 kg bei 1,0 m und 30 kg bei 2,5 m → Momente 60 und 75 kg·m → Schwerpunkt 135 ÷ 90 = 1,5 m
      const x = (m) => 40 + m * 120;
      return svg(400, 236, `
        ${linie(40, 26, 40, 140, 'g-s-text', 1.5, 'stroke-dasharray="4 3"')}
        ${text(44, 16, 'Bezugsebene (0 m)', { groesse: 11, gewicht: 700, anker: 'start' })}
        ${pfeil(40, 46, x(1), 46, { farbe: 'primaer', breite: 1.6, spitze: 8 })}
        ${text((40 + x(1)) / 2, 40, 'Hebelarm 1,0 m', { groesse: 11, gewicht: 700, klasse: 'g-f-primaer' })}
        ${pfeil(40, 72, x(2.5), 72, { farbe: 'orange', breite: 1.6, spitze: 8 })}
        ${text((40 + x(2.5)) / 2 + 30, 66, 'Hebelarm 2,5 m', { groesse: 11, gewicht: 700, klasse: 'g-f-orange' })}
        <rect x="${x(1) - 22}" y="88" width="44" height="40" rx="5" class="g-f-primaer"/>
        ${text(x(1), 108, '60 kg', { groesse: 12, gewicht: 800, klasse: 'g-f-weiss' })}
        <rect x="${x(2.5) - 18}" y="98" width="36" height="30" rx="5" class="g-f-orange"/>
        ${text(x(2.5), 113, '30 kg', { groesse: 11, gewicht: 800, klasse: 'g-f-weiss' })}
        <rect x="24" y="128" width="356" height="8" rx="3" class="g-f-mf"/>
        <path d="M${x(1.5)} 136l-13 22h26z" class="g-f-text"/>
        ${text(x(1), 154, 'Moment 60 kg·m', { groesse: 11, gewicht: 700, klasse: 'g-f-primaer' })}
        ${text(x(2.5), 154, 'Moment 75 kg·m', { groesse: 11, gewicht: 700, klasse: 'g-f-orange' })}
        ${text(x(1.5), 176, 'Schwerpunkt bei 1,5 m – hier ist alles im Gleichgewicht', { groesse: 11, gewicht: 800 })}
        ${text(200, 204, 'Moment = Masse × Hebelarm', { groesse: 13, gewicht: 800 })}
        ${text(200, 224, 'Schwerpunkt = (60 + 75) kg·m ÷ (60 + 30) kg = 1,5 m', { groesse: 11, klasse: 'g-f-leise' })}
      `, 'Hebelgesetz: 60 Kilogramm bei 1,0 Meter und 30 Kilogramm bei 2,5 Meter hinter der Bezugsebene; der gemeinsame Schwerpunkt liegt bei 1,5 Meter');
    },
  };
}
