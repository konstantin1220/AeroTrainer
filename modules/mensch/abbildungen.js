// Abbildungen für „Menschliches Leistungsvermögen“ – selbst gezeichnet.
import { svg, text, linie, pfeil, flugzeug, massstab } from '../../js/grafik.js';
import { lage, sauerstoffPartialdruck, sauerstoffPflicht, zeitNutzbarenBewusstseins } from './rechnen.js';

const r1 = (n) => n.toFixed(1);
const komma = (n, s = 0) => Number(n.toFixed(s)).toLocaleString('de-DE', { minimumFractionDigits: s, maximumFractionDigits: s });

/** Wie eine Piste im Anflug aussieht – normal und in den vier typischen Täuschungen. */
export function anflugTaeuschungen() {
  // Piste als Trapez aus Sicht des Piloten: unten breit (Schwelle), oben schmal (Ende)
  const piste = (cx, y, unten, oben, hoehe) => `<path d="M${cx - unten / 2} ${y}L${cx - oben / 2} ${y - hoehe}H${cx + oben / 2}L${cx + unten / 2} ${y}z" fill="#4b5563"/>`
    + `<line x1="${cx}" y1="${y - 4}" x2="${cx}" y2="${y - hoehe + 4}" stroke="#fff" stroke-width="1" stroke-dasharray="5 4"/>`;
  const feld = (x, y, titel, inhalt, wirkung, folge) => `
    <rect x="${x}" y="${y}" width="190" height="150" rx="10" class="g-f-himmel"/>
    <rect x="${x}" y="${y + 70}" width="190" height="80" rx="0" class="g-f-boden" opacity=".7"/>
    ${text(x + 95, y + 18, titel, { groesse: 12, gewicht: 800 })}
    ${inhalt}
    ${text(x + 95, y + 128, wirkung, { groesse: 10.5, gewicht: 700, klasse: 'g-f-text g-halo' })}
    ${text(x + 95, y + 143, folge, { groesse: 10.5, gewicht: 700, klasse: 'g-f-fehler g-halo' })}`;
  return svg(400, 330, `
    ${feld(5, 5, 'Normale Piste', piste(100, 112, 60, 22, 40), 'so sieht es richtig aus', '')}
    ${feld(205, 5, 'Schmale Piste', piste(300, 112, 36, 14, 46), 'wirkt, als wärst du zu hoch', '→ Gefahr: zu tiefer Anflug')}
    ${feld(5, 170, 'Breite Piste', piste(100, 277, 96, 36, 32), 'wirkt, als wärst du zu tief', '→ Gefahr: zu hoch abfangen')}
    ${feld(205, 170, 'Ansteigende Piste', piste(300, 277, 60, 30, 56), 'wirkt, als wärst du zu hoch', '→ Gefahr: zu tiefer Anflug')}
  `, 'Vier Ansichten einer Piste im Anflug: normal, schmal, breit und ansteigend, mit der Täuschung, die sie auslösen');
}

/** Leistung und Belastung – schematisch: zu wenig und zu viel Belastung schaden. */
export function leistungskurve() {
  const l = 46, r = 384, o = 26, u = 210;
  const px = (x) => l + x * (r - l);
  const py = (y) => u - y * (u - o);
  let pfad = '';
  for (let i = 0; i <= 50; i++) {
    const x = i / 50;
    const y = 0.15 + 0.8 * Math.exp(-((x - 0.45) ** 2) / 0.05);
    pfad += `${i ? 'L' : 'M'}${r1(px(x))} ${r1(py(y))}`;
  }
  return svg(400, 250, `
    <rect x="${px(0.3)}" y="${o}" width="${r1(px(0.6) - px(0.3))}" height="${u - o}" class="g-f-ok" opacity=".12"/>
    ${linie(l, u, r, u, 'g-s-text', 1.4)}${linie(l, u, l, o, 'g-s-text', 1.4)}
    <path d="${pfad}" class="g-s-primaer" stroke-width="2.6" fill="none"/>
    ${text(px(0.13), u - 12, 'unterfordert', { groesse: 11, gewicht: 700, klasse: 'g-f-leise' })}
    ${text(px(0.45), o + 16, 'beste Leistung', { groesse: 11, gewicht: 800, klasse: 'g-f-ok' })}
    ${text(px(0.84), u - 12, 'überfordert', { groesse: 11, gewicht: 700, klasse: 'g-f-fehler' })}
    ${text((l + r) / 2, u + 22, 'Belastung (Stress) →', { groesse: 11, klasse: 'g-f-leise' })}
    ${text(16, (o + u) / 2, 'Leistung →', { groesse: 11, klasse: 'g-f-leise', extra: `transform="rotate(-90 16 ${(o + u) / 2})"` })}
    ${text(r, 16, 'schematisch', { groesse: 10, klasse: 'g-f-leise', anker: 'end' })}
  `, 'Schematische Kurve: Die Leistung ist bei mittlerer Belastung am besten, bei zu wenig und zu viel Belastung schlechter');
}

/** Draufsicht und Blick durch die Frontscheibe: Bleibt der andere an derselben Stelle, ist es ein Kollisionskurs. */
export function kollisionsBild(eigen, anderer, t, dauer) {
  const NM_PX = 22, cx = 200, cy = 150;
  const P = (p) => [cx + p.x * NM_PX, cy - p.y * NM_PX];
  const jetzt = lage(eigen, anderer, t);
  let spuren = '';
  for (let s = 0; s <= dauer; s += 0.5) {
    const l = lage(eigen, anderer, s);
    const [ax, ay] = P(l.a), [bx, by] = P(l.b);
    if (s <= t) spuren += linie(r1(ax), r1(ay), r1(bx), r1(by), 'g-s-orange', 0.9, 'stroke-dasharray="2 3" opacity=".7"');
    spuren += `<circle cx="${r1(ax)}" cy="${r1(ay)}" r="2" class="g-f-primaer" opacity=".5"/><circle cx="${r1(bx)}" cy="${r1(by)}" r="2" class="g-f-fehler" opacity=".5"/>`;
  }
  const [ax, ay] = P(jetzt.a), [bx, by] = P(jetzt.b);
  // Frontscheibe: Peilung −60°…+60° auf die Breite, Größe wächst mit kleinerem Abstand
  const sx = (grad) => 60 + ((grad + 60) / 120) * 280;
  const groesse = Math.min(30, 6 + 24 / Math.max(jetzt.abstand, 0.6));
  const sichtbar = Math.abs(jetzt.peilung) <= 60;
  return svg(400, 330, `
    <rect width="400" height="250" class="g-f-himmel"/>
    ${spuren}
    ${flugzeug(r1(ax), r1(ay), eigen.kurs, 24, 'g-f-primaer')}
    ${flugzeug(r1(bx), r1(by), anderer.kurs, 24, 'g-f-fehler')}
    ${text(r1(ax + 16), r1(ay + 4), 'Du', { groesse: 11, gewicht: 800, klasse: 'g-f-primaer g-halo', anker: 'start' })}
    ${massstab(12, 238, NM_PX, '1 NM')}
    <rect x="40" y="258" width="320" height="64" rx="16" fill="#1f2937"/>
    <rect x="52" y="266" width="296" height="48" rx="10" fill="#9fc6ee"/>
    ${linie(52, 290, 348, 290, '', 1, 'stroke="#6b7280"')}
    ${linie(200, 266, 200, 314, '', 1, 'stroke="#374151" stroke-dasharray="3 3"')}
    ${sichtbar ? `<g transform="translate(${r1(sx(jetzt.peilung))} 290)"><circle r="${r1(groesse / 2)}" fill="#c93636" opacity=".9"/></g>` : text(200, 294, 'nicht im Blickfeld', { groesse: 11, extra: 'fill="#374151"' })}
    ${text(200, 252, `Blick nach vorn · Peilung ${Math.round(jetzt.peilung)}° · Abstand ${komma(jetzt.abstand, 1)} NM`, { groesse: 11, gewicht: 700 })}
  `, `Draufsicht mit zwei Luftfahrzeugen und Blick durch die Frontscheibe: Peilung ${Math.round(jetzt.peilung)} Grad, Abstand ${komma(jetzt.abstand, 1)} NM`);
}

/** Höhe, Sauerstoff-Partialdruck und die Regeln aus NCO.OP.190 – maßstäblich, darunter die Flugdauer (feste Achse 0–120 min). */
export function sauerstoffBild(hoeheFt, dauerMin = 0) {
  const l = 70, r = 384, o = 20, u = 270, hMax = 25000, pMax = 220;
  const py = (ft) => u - (ft / hMax) * (u - o);
  const px = (hpa) => l + 10 + (hpa / pMax) * (r - l - 20);
  let achse = '';
  for (let ft = 0; ft <= hMax; ft += 5000) achse += linie(l, r1(py(ft)), r, r1(py(ft)), 'g-s-rand', 0.6) + text(l - 6, r1(py(ft) + 4), ft === 0 ? 'MSL' : `${komma(ft)} ft`, { groesse: 10, klasse: 'g-f-leise', anker: 'end' });
  // Kurve des Partialdrucks
  let kurve = '';
  for (let ft = 0; ft <= hMax; ft += 500) kurve += `${ft ? 'L' : 'M'}${r1(px(sauerstoffPartialdruck(ft)))} ${r1(py(ft))}`;
  const p = sauerstoffPartialdruck(hoeheFt);
  const pflicht = sauerstoffPflicht(hoeheFt, dauerMin);
  const tuc = zeitNutzbarenBewusstseins(hoeheFt);
  const xp = px(p), yp = py(hoeheFt);
  // Beschriftung der Bänder dorthin, wo sie den Wert nicht verdeckt: oben im Band, unten im Band oder knapp darunter
  const belegt = [yp - 22, yp + (tuc ? 24 : 6)];
  const frei = (y) => y + 2 < belegt[0] || y - 10 > belegt[1];
  // Das Band, in dem die eingestellte Höhe liegt, wird kräftiger gezeichnet
  const zone = (von, bis, klasse, beschr, aktiv, auchDarunter) => {
    const plaetze = [py(bis) + 13, py(von) - 5, ...(auchDarunter ? [py(von) + 12] : [])];
    const y = plaetze.find(frei) ?? plaetze[0];
    return `<rect x="${l}" y="${r1(py(bis))}" width="${r - l}" height="${r1(py(von) - py(bis))}" class="${klasse}" opacity="${aktiv ? 0.24 : 0.1}"/>${text(r - 4, r1(y), beschr, { groesse: 10, gewicht: 700, klasse, anker: 'end' })}`;
  };
  const rechtsFrei = xp + 118 < r;
  // Zeitleiste: maßstäblich 0–120 min, Marke bei 30 min (NCO.OP.190 b 1)
  const zl = l, zr = r, zy = 318, tMax = 120;
  const tx = (min) => zl + (Math.min(min, tMax) / tMax) * (zr - zl);
  const farbe = pflicht === 'alle' ? 'fehler' : pflicht === 'besatzung' ? 'orange' : 'primaer';
  const imBand = hoeheFt > 10000 && hoeheFt <= 13000;
  let zeit = `<rect x="${zl}" y="${zy - 6}" width="${zr - zl}" height="12" rx="6" class="g-f-rand" opacity=".55"/>`;
  if (imBand && dauerMin > 30) {
    zeit += `<rect x="${zl}" y="${zy - 6}" width="${r1(tx(30) - zl)}" height="12" rx="6" class="g-f-primaer"/>`;
    zeit += `<rect x="${r1(tx(30))}" y="${zy - 6}" width="${r1(tx(dauerMin) - tx(30))}" height="12" class="g-f-orange"/>`;
  } else if (dauerMin > 0) {
    zeit += `<rect x="${zl}" y="${zy - 6}" width="${r1(tx(dauerMin) - zl)}" height="12" rx="6" class="g-f-${farbe}"/>`;
  }
  for (let t = 0; t <= tMax; t += 30) zeit += linie(r1(tx(t)), zy + 7, r1(tx(t)), zy + 11, 'g-s-leise', 1) + text(r1(tx(t)), zy + 22, t === tMax ? `${t} min` : `${t}`, { groesse: 10, klasse: 'g-f-leise', anker: t === tMax ? 'end' : 'middle' });
  zeit += linie(r1(tx(30)), zy - 10, r1(tx(30)), zy + 10, 'g-s-orange', 1.5);
  return svg(400, 350, `
    ${zone(10000, 13000, 'g-f-orange', 'über 30 min: Sauerstoff für die Besatzung', imBand, true)}
    ${zone(13000, hMax, 'g-f-fehler', 'Sauerstoff für alle an Bord', hoeheFt > 13000)}
    ${achse}
    <path d="${kurve}" class="g-s-primaer" stroke-width="2" fill="none" opacity=".45"/>
    ${linie(l, r1(yp), r1(xp), r1(yp), 'g-s-primaer', 6, 'stroke-linecap="butt"')}
    <circle cx="${r1(xp)}" cy="${r1(yp)}" r="5" class="g-f-primaer"/>
    ${text(r1(rechtsFrei ? xp + 8 : xp - 8), r1(yp - 8), `${Math.round(p)} hPa Sauerstoff`, { groesse: 11, gewicht: 800, klasse: 'g-f-primaer g-halo', anker: rechtsFrei ? 'start' : 'end' })}
    ${tuc ? text(r1(l + 8), r1(yp + 18), `Zeit nutzbaren Bewusstseins: ${tuc}`, { groesse: 11, gewicht: 800, klasse: 'g-f-fehler g-halo', anker: 'start' }) : ''}
    ${linie(r1(px(0)), u, r1(px(0)), u + 5, 'g-s-leise', 1)}${linie(r1(px(100)), u, r1(px(100)), u + 5, 'g-s-leise', 1)}${linie(r1(px(200)), u, r1(px(200)), u + 5, 'g-s-leise', 1)}
    ${text(r1(px(0)), u + 16, '0', { groesse: 10, klasse: 'g-f-leise' })}${text(r1(px(100)), u + 16, '100', { groesse: 10, klasse: 'g-f-leise' })}${text(r1(px(200)), u + 16, '200 hPa', { groesse: 10, anker: 'end', klasse: 'g-f-leise' })}
    ${text(l, u + 16, 'Partialdruck:', { groesse: 10, klasse: 'g-f-leise', anker: 'end' })}
    ${text(zl, zy - 12, `Dauer in dieser Höhe: ${dauerMin} min`, { groesse: 11, gewicht: 700, klasse: `g-f-${farbe === 'primaer' ? 'text' : farbe}`, anker: 'start' })}
    ${zeit}
  `, `In ${hoeheFt} Fuß beträgt der Sauerstoff-Partialdruck etwa ${Math.round(p)} Hektopascal, Dauer ${dauerMin} Minuten`);
}

export const abbildungen = {
  'anflug-taeuschungen': anflugTaeuschungen,
  leistungskurve,
  kollision: () => kollisionsBild({ x: 0, y: -3, kurs: 0, kt: 100 }, { x: 4, y: 1, kurs: 270, kt: 100 }, 1.2, 2.4),
};
