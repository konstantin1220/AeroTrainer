// Animationen für das Modul „Luftraum & Regeln“ – selbst gezeichnet (js/animation.js).
// Ausweichregeln nach SERA.3210, von oben gesehen. Orange: muss ausweichen, Blau: hat Vorflug.
import { svg, text, flugzeug, sanft, abschnitt } from '../../js/grafik.js';

const r1 = (n) => Math.round(n * 10) / 10;

/** Ausweichen nach rechts und zurück: 0 → 1 (zwischen a und b) → 0 (zwischen c und d). */
const ausschlag = (t, a, b, c, d) => sanft(abschnitt(t, a, b)) - sanft(abschnitt(t, c, d));

/**
 * Wo die beiden Luftfahrzeuge zum Zeitpunkt t (0 bis 1) sind – für jeden der drei Fälle.
 * Kurs in Grad (0 = oben/Norden, im Uhrzeigersinn).
 */
export function lagen(fall, t) {
  if (fall === 'gegenflug') {
    const aus = 38 * ausschlag(t, 0.12, 0.38, 0.66, 0.9);
    return { a: { x: 186 + aus, y: 232 - 216 * t }, b: { x: 214 - aus, y: 12 + 216 * t } };
  }
  if (fall === 'kreuzen') {
    // A fliegt nach Norden und sieht B rechts von sich: A dreht nach rechts und fliegt hinter B vorbei.
    const kurs = (u) => 58 * ausschlag(u, 0.12, 0.3, 0.62, 0.8);
    let x = 150, y = 236;
    const n = 80;
    for (let i = 0; i < n * t; i++) {
      const w = (kurs(i / n) * Math.PI) / 180;
      x += (200 / n) * Math.sin(w);
      y -= (200 / n) * Math.cos(w);
    }
    return { a: { x, y }, b: { x: 392 - 340 * t, y: 96 } };
  }
  // Überholen: A ist schneller und überholt rechts
  const aus = 42 * ausschlag(t, 0.1, 0.32, 0.84, 1);
  return { a: { x: 200 + aus, y: 236 - 210 * t }, b: { x: 200, y: 150 - 72 * t } };
}

/** Kurs aus der Bewegung zwischen t und t + dt. */
function kurse(fall, t) {
  const dt = 0.01;
  const jetzt = lagen(fall, Math.min(t, 1 - dt));
  const bald = lagen(fall, Math.min(t, 1 - dt) + dt);
  const kurs = (p, q) => (Math.atan2(q.x - p.x, -(q.y - p.y)) * 180) / Math.PI;
  return { a: kurs(jetzt.a, bald.a), b: kurs(jetzt.b, bald.b) };
}

/** Bisherige Spur als gepunktete Linie. */
function spur(fall, t, wer, klasse) {
  let d = '';
  for (let i = 0; i <= 30; i++) {
    const p = lagen(fall, (t * i) / 30)[wer];
    d += `${i ? 'L' : 'M'}${r1(p.x)} ${r1(p.y)}`;
  }
  return `<path d="${d}" class="${klasse}" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round" fill="none" opacity=".7"/>`;
}

const FAELLE = [
  { fall: 'gegenflug', titel: 'Gegenflug', farbeB: 'orange', merksatz: 'Beide weichen nach rechts aus.' },
  { fall: 'kreuzen', titel: 'Kreuzende Kurse', farbeB: 'primaer', merksatz: 'Wer den anderen rechts sieht, weicht aus.' },
  { fall: 'ueberholen', titel: 'Überholen', farbeB: 'primaer', merksatz: 'Wer überholt, weicht nach rechts aus.' },
];

function ausweichBild(schritt, t) {
  const { fall, titel, farbeB, merksatz } = FAELLE[schritt];
  const p = lagen(fall, t);
  const k = kurse(fall, t);
  let hinweise = '';
  if (fall === 'gegenflug' && t > 0.15 && t < 0.85) {
    hinweise += text(r1(p.a.x + 26), r1(p.a.y + 4), 'rechts', { groesse: 11, gewicht: 800, klasse: 'g-f-orange g-halo', anker: 'start' });
    hinweise += text(r1(p.b.x - 26), r1(p.b.y - 4), 'rechts', { groesse: 11, gewicht: 800, klasse: 'g-f-orange g-halo', anker: 'end' });
  }
  if (fall === 'kreuzen') {
    hinweise += text(r1(p.b.x), 72, 'Vorflug: Kurs halten', { groesse: 11, gewicht: 800, klasse: 'g-f-primaer g-halo' });
    if (t < 0.5) hinweise += text(r1(p.a.x - 24), r1(p.a.y + 2), 'sieht B rechts', { groesse: 11, gewicht: 800, klasse: 'g-f-orange g-halo', anker: 'end' });
    else hinweise += text(r1(p.a.x - 24), r1(p.a.y + 2), 'hinter B vorbei', { groesse: 11, gewicht: 800, klasse: 'g-f-orange g-halo', anker: 'end' });
  }
  if (fall === 'ueberholen') {
    hinweise += text(176, r1(p.b.y), 'langsamer', { groesse: 11, gewicht: 800, klasse: 'g-f-primaer g-halo', anker: 'end' });
    if (t > 0.1 && t < 0.9) hinweise += text(r1(p.a.x + 24), r1(p.a.y + 2), 'rechts vorbei', { groesse: 11, gewicht: 800, klasse: 'g-f-orange g-halo', anker: 'start' });
  }
  return svg(400, 260, `
    <rect width="400" height="260" class="g-f-himmel"/>
    <rect x="10" y="10" width="${r1(titel.length * 7.6 + 24)}" height="26" rx="13" class="g-f-weiss"/>
    ${text(22, 23, titel, { groesse: 12, gewicht: 800, anker: 'start' })}
    ${spur(fall, t, 'a', 'g-s-orange')}
    ${spur(fall, t, 'b', `g-s-${farbeB}`)}
    ${flugzeug(r1(p.b.x), r1(p.b.y), r1(k.b), 36, `g-f-${farbeB}`)}
    ${flugzeug(r1(p.a.x), r1(p.a.y), r1(k.a), 36, 'g-f-orange')}
    ${text(r1(p.a.x), r1(p.a.y + 26), 'A', { groesse: 11, gewicht: 800, klasse: 'g-f-orange g-halo' })}
    ${text(r1(p.b.x), r1(p.b.y + (fall === 'gegenflug' ? -26 : 26)), 'B', { groesse: 11, gewicht: 800, klasse: `g-f-${farbeB} g-halo` })}
    ${hinweise}
    <rect x="10" y="226" width="380" height="26" rx="13" class="g-f-weiss"/>
    ${text(200, 239, merksatz, { groesse: 12, gewicht: 700 })}
  `, `${titel}: ${merksatz}`);
}

export const animationen = {
  ausweichregeln: {
    titel: 'Wer weicht wem aus?',
    schritte: [
      { text: '**Gegenflug:** Zwei Flugzeuge fliegen frontal aufeinander zu. **Beide weichen nach rechts aus** und fliegen danach wieder auf ihren Kurs.', dauer: 4.2 },
      { text: '**Kreuzende Kurse:** A sieht B **rechts** von sich – A weicht aus und fliegt **hinter** B vorbei. B hat Vorflug und behält Kurs und Geschwindigkeit bei.', dauer: 4.6 },
      { text: '**Überholen:** A ist schneller. Wer überholt, weicht aus – und zwar **nach rechts**. B fliegt unverändert weiter.', dauer: 4.4 },
    ],
    bild: ausweichBild,
  },
};
