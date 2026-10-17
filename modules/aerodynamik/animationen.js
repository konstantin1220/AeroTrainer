// Animationen für das Modul „Aerodynamik“ – selbst gezeichnet, schematisch (js/animation.js).
import { svg, text, linie, pfeil, sanft, zwischen } from '../../js/grafik.js';

const r1 = (n) => Math.round(n * 10) / 10;

// Profil wie in den Abbildungen dieses Moduls (Sehne 290 Einheiten), hier verkleinert
const PROFIL = 'M0 0C0-14 30-34 90-36S240-18 290 0C220 6 120 10 50 10S0 6 0 0z';
const NASE = { x: 112, y: 132 };
const MASS = 0.6;
const SEHNE = 290 * MASS;

/** Auftriebsbeiwert, stark vereinfacht: wächst mit dem Anstellwinkel bis etwa 15°, danach bricht er ein. */
export function auftriebsbeiwert(alpha) {
  if (alpha <= 15) return 0.1 * alpha;
  return Math.max(0.9, 1.5 - 0.12 * (alpha - 15));
}

/** Wie stark die Strömung an der Oberseite abgerissen ist: 0 (anliegend) bis 1 (ganz abgerissen). */
export function abriss(alpha) {
  return sanft((alpha - 15) / 4);
}

const ANSTELLWINKEL = [() => 5, (t) => zwischen(5, 14, sanft(t)), (t) => zwischen(14, 20, sanft(t))];

function stromlinien(alpha, t) {
  const f = abriss(alpha);
  let linien = '';
  // Oberseite: schneller (Striche wandern schneller), stärker umgelenkt
  for (let i = 0; i < 4; i++) {
    const y0 = NASE.y - 30 - 19 * i;
    const nah = 1 - i * 0.22;
    const hub = (10 + 1.1 * alpha) * nah;
    const ab = 0.9 * alpha * nah;
    let d;
    if (i < 2 && f > 0) {
      // Abgerissene Strömung: Hinter der dicksten Stelle wird es wirbelig
      d = `M0 ${y0}C70 ${y0} 90 ${r1(y0 - hub)} 170 ${r1(y0 - hub * 0.9)}`;
      for (let x = 180; x <= 400; x += 10) d += `L${x} ${r1(y0 - hub * 0.9 * (1 - f * 0.6) + Math.sin(x / 9 + t * 14 + i) * 7 * f - (x - 180) * 0.12 * f)}`;
    } else {
      d = `M0 ${y0}C70 ${y0} 90 ${r1(y0 - hub)} 170 ${r1(y0 - hub * 0.9)}S300 ${r1(y0 + ab * 0.4)} 400 ${r1(y0 + ab)}`;
    }
    linien += `<path d="${d}" class="g-s-primaer" stroke-width="1.6" fill="none" stroke-dasharray="12 10" stroke-dashoffset="${r1(-t * 640 * (1 - 0.5 * f * (i < 2 ? 1 : 0)))}" opacity="${r1(0.85 - 0.12 * i)}"/>`;
  }
  // Unterseite: langsamer, leicht nach unten – die Linien weichen der Hinterkante aus, die mit dem Anstellwinkel tiefer liegt
  const tief = SEHNE * Math.sin((alpha * Math.PI) / 180);
  for (let j = 0; j < 3; j++) {
    const y0 = r1(NASE.y + 22 + 18 * j + 0.35 * tief);
    const ab = 0.5 * alpha * (1 - j * 0.25);
    const d = `M0 ${y0}C80 ${y0} 120 ${r1(y0 + 0.3 * alpha)} 200 ${r1(y0 + 0.5 * tief)}S320 ${r1(y0 + tief + ab)} 400 ${r1(y0 + tief + ab * 1.1)}`;
    linien += `<path d="${d}" class="g-s-primaer" stroke-width="1.6" fill="none" stroke-dasharray="12 10" stroke-dashoffset="${r1(-t * 380)}" opacity="${r1(0.75 - 0.15 * j)}"/>`;
  }
  // Wirbel über der hinteren Oberseite, wenn die Strömung abreißt
  if (f > 0.05) {
    for (let k = 0; k < 3; k++) {
      const cx = 232 + k * 42, cy = NASE.y - 30 + Math.sin(t * 6 + k) * 4;
      linien += `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(8 + 3 * k)}" class="g-s-fehler" stroke-width="1.6" fill="none" stroke-dasharray="14 6" stroke-dashoffset="${r1(t * 120 * (k % 2 ? -1 : 1))}" opacity="${r1(f)}"/>`;
    }
  }
  return linien;
}

function stroemung(schritt, t) {
  const alpha = ANSTELLWINKEL[schritt](t);
  const ca = auftriebsbeiwert(alpha);
  const f = abriss(alpha);
  const laenge = 22 + 62 * (ca / 1.5);
  // Auftrieb greift etwa bei einem Viertel der Sehne an (Druckpunkt) – senkrecht zur Anströmung
  const w = (alpha * Math.PI) / 180;
  const px = NASE.x + SEHNE * 0.28 * Math.cos(w);
  const py = NASE.y + SEHNE * 0.28 * Math.sin(w) - 12;
  const bogen = 54;
  const ex = NASE.x + bogen * Math.cos(w), ey = NASE.y + bogen * Math.sin(w);
  return svg(400, 260, `
    <rect width="400" height="260" class="g-f-himmel"/>
    ${stromlinien(alpha, t)}
    <g transform="translate(${NASE.x} ${NASE.y}) rotate(${r1(alpha)}) scale(${MASS})"><path d="${PROFIL}" class="g-f-weiss g-s-text" stroke-width="${r1(2 / MASS)}"/></g>
    ${linie(NASE.x - 40, NASE.y, NASE.x + 70, NASE.y, 'g-s-leise', 1, 'stroke-dasharray="4 4"')}
    ${linie(NASE.x, NASE.y, r1(NASE.x + 70 * Math.cos(w)), r1(NASE.y + 70 * Math.sin(w)), 'g-s-text', 1, 'stroke-dasharray="2 3"')}
    <path d="M${NASE.x + bogen} ${NASE.y}A${bogen} ${bogen} 0 0 1 ${r1(ex)} ${r1(ey)}" class="g-s-orange" stroke-width="2" fill="none"/>
    ${text(NASE.x + bogen + 8, r1(NASE.y + 8 + alpha * 0.5), `α ${Math.round(alpha)}°`, { groesse: 12, gewicht: 800, klasse: 'g-f-orange g-halo', anker: 'start' })}
    ${pfeil(r1(px), r1(py), r1(px), r1(py - laenge), { farbe: f > 0.3 ? 'fehler' : 'ok', breite: 3, spitze: 11 })}
    ${text(r1(px + 10), r1(py - laenge + 6), f > 0.3 ? 'Auftrieb bricht ein' : 'Auftrieb', { groesse: 12, gewicht: 800, klasse: `${f > 0.3 ? 'g-f-fehler' : 'g-f-ok'} g-halo`, anker: 'start' })}
    ${f > 0.3
    ? text(388, 34, 'Oberseite: Strömung reißt ab', { groesse: 11, gewicht: 800, klasse: 'g-f-fehler g-halo', anker: 'end' })
    : text(388, 34, 'Oberseite: schnell, Sog', { groesse: 11, gewicht: 700, klasse: 'g-f-primaer g-halo', anker: 'end' })}
    ${text(388, 242, 'Unterseite: langsamer, leichter Überdruck', { groesse: 11, gewicht: 700, klasse: 'g-f-leise g-halo', anker: 'end' })}
    ${text(16, 20, 'Anströmung →', { groesse: 11, gewicht: 700, klasse: 'g-f-leise', anker: 'start' })}
  `, `Profil mit Anstellwinkel ${Math.round(alpha)} Grad${f > 0.3 ? ', Strömung abgerissen' : ''}`);
}

export const animationen = {
  stroemung: {
    titel: 'Wie der Flügel Auftrieb erzeugt',
    schritte: [
      { text: 'An der **Oberseite** strömt die Luft **schneller** – dort entsteht ein **Sog**. Unten ist sie langsamer, es entsteht ein leichter **Überdruck**. Zusammen ergibt das den **Auftrieb**.', dauer: 4 },
      { text: 'Mehr **Anstellwinkel**: Die Luft wird stärker umgelenkt, der **Auftrieb wächst** – aber nur bis zum kritischen Anstellwinkel.', dauer: 4 },
      { text: 'Über den **kritischen Anstellwinkel** (bei vielen Profilen etwa 15 bis 18°) hinaus kann die Luft der Oberseite nicht mehr folgen: Die Strömung **reißt ab**, der Auftrieb bricht ein.', dauer: 4.2 },
    ],
    bild: stroemung,
  },
};
