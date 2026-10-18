// Animationen für das Modul „Luftraum & Regeln“ – selbst gezeichnet (js/animation.js).
// Ausweichregeln nach SERA.3210, von oben gesehen. Orange: muss ausweichen, Blau: hat Vorflug.
import { svg, text, linie, flugzeug, sanft, abschnitt, zwischen } from '../../js/grafik.js';
import { grenzen, transponderAb } from './luftraeume.js';
import { ALTDORF } from '../sprechfunk/uebungsgebiet.js';

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
    return { a: { x: 186 + aus, y: 206 - 154 * t }, b: { x: 214 - aus, y: 52 + 154 * t } };
  }
  if (fall === 'kreuzen') {
    // A fliegt nach Norden und sieht B rechts von sich: A dreht nach rechts und fliegt hinter B vorbei.
    const kurs = (u) => 58 * ausschlag(u, 0.12, 0.3, 0.62, 0.8);
    let x = 150, y = 206;
    const n = 80;
    for (let i = 0; i < n * t; i++) {
      const w = (kurs(i / n) * Math.PI) / 180;
      x += (160 / n) * Math.sin(w);
      y -= (160 / n) * Math.cos(w);
    }
    return { a: { x, y }, b: { x: 360 - 290 * t, y: 96 } };
  }
  // Überholen: A ist schneller und überholt rechts
  const aus = 42 * ausschlag(t, 0.1, 0.32, 0.84, 1);
  return { a: { x: 200 + aus, y: 206 - 156 * t }, b: { x: 200, y: 140 - 40 * t } };
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

/** Beschriftung so verschieben, dass sie im freien Bereich zwischen Titel und Merksatz bleibt. */
const imBild = (x, y, breite, anker) => {
  const links = anker === 'end' ? x - breite : anker === 'start' ? x : x - breite / 2;
  const dx = Math.max(10 - links, Math.min(0, 390 - (links + breite)));
  return [x + dx, Math.max(46, Math.min(216, y))];
};
const marke = (x, y, inhalt, klasse, anker = 'middle') => {
  const [mx, my] = imBild(x, y, inhalt.length * 6.6, anker);
  return text(r1(mx), r1(my), inhalt, { groesse: 11, gewicht: 800, klasse: `${klasse} g-halo`, anker });
};

function ausweichBild(schritt, t) {
  const { fall, titel, farbeB, merksatz } = FAELLE[schritt];
  const p = lagen(fall, t);
  const k = kurse(fall, t);
  let hinweise = '';
  if (fall === 'gegenflug' && t > 0.15 && t < 0.85) {
    hinweise += marke(p.a.x + 26, p.a.y + 4, 'rechts', 'g-f-orange', 'start');
    hinweise += marke(p.b.x - 26, p.b.y - 4, 'rechts', 'g-f-orange', 'end');
  }
  if (fall === 'kreuzen') {
    hinweise += marke(p.b.x, 72, 'B hat Vorflug: Kurs halten', 'g-f-primaer');
    hinweise += marke(p.a.x - 24, p.a.y + 2, t < 0.5 ? 'sieht B rechts' : 'hinter B vorbei', 'g-f-orange', 'end');
  }
  if (fall === 'ueberholen') {
    hinweise += marke(176, p.b.y, 'langsamer', 'g-f-primaer', 'end');
    if (t > 0.1 && t < 0.9) hinweise += marke(p.a.x + 24, p.a.y + 2, 'rechts vorbei', 'g-f-orange', 'start');
  }
  return svg(400, 260, `
    <rect width="400" height="260" class="g-f-himmel"/>
    <rect x="10" y="10" width="${r1(titel.length * 7.6 + 24)}" height="26" rx="13" class="g-f-weiss"/>
    ${text(22, 23, titel, { groesse: 12, gewicht: 800, anker: 'start' })}
    ${spur(fall, t, 'a', 'g-s-orange')}
    ${spur(fall, t, 'b', `g-s-${farbeB}`)}
    ${flugzeug(r1(p.b.x), r1(p.b.y), r1(k.b), 36, `g-f-${farbeB}`)}
    ${flugzeug(r1(p.a.x), r1(p.a.y), r1(k.a), 36, 'g-f-orange')}
    ${marke(p.a.x, p.a.y + 24, 'A', 'g-f-orange')}
    ${fall === 'kreuzen' ? '' : marke(p.b.x, p.b.y + (fall === 'gegenflug' ? -24 : 24), 'B', `g-f-${farbeB}`)}
    ${hinweise}
    <rect x="10" y="226" width="380" height="26" rx="13" class="g-f-weiss"/>
    ${text(200, 239, merksatz, { groesse: 12, gewicht: 700 })}
  `, `${titel}: ${merksatz}`);
}

// ---------- Steigflug durch die Lufträume (maßstäblich, Höhen nach AIP VFR ENR 1-1) ----------

const ACHSE = 11000; // ft
const yFt = (ft) => 262 - (ft / ACHSE) * 238;
const PLATZ = ALTDORF.hoehe; // 1450 ft MSL
/** Höhe (ft MSL) am Anfang und Ende jedes Schritts. */
export const STEIGFLUG = [[PLATZ, 2900], [2900, 4600], [4600, 6500], [6500, 9500]];

function steigflug(schritt, t) {
  const g = grenzen(PLATZ);
  const tp = transponderAb(PLATZ);
  const [von, bis] = STEIGFLUG[schritt];
  const f = sanft(t);
  const hoehe = zwischen(von, bis, f);
  const x = zwischen(48, 318, (schritt + f) / STEIGFLUG.length);
  // Steigwinkel in der Seitenansicht (nur fürs Bild): steiler beim Steigen, waagerecht am Ende
  const neigung = schritt === 3 && f > 0.85 ? 0 : -12;
  const zeile = (ft, inhalt, aktiv, klasse) => `${linie(0, r1(yFt(ft)), 340, r1(yFt(ft)), klasse.replace('g-f-', 'g-s-'), aktiv ? 1.8 : 1, 'stroke-dasharray="6 4"')}`
    + text(10, r1(yFt(ft) - 8), inhalt, { groesse: 10.5, gewicht: aktiv ? 800 : 600, klasse: `${aktiv ? klasse : 'g-f-leise'} g-halo`, anker: 'start' });
  let achse = '';
  for (let ft = 0; ft <= 10000; ft += 2000) achse += linie(340, r1(yFt(ft)), 346, r1(yFt(ft)), 'g-s-leise', 1) + text(350, r1(yFt(ft)), ft ? `${ft / 1000}000` : '0 ft', { groesse: 9.5, klasse: 'g-f-leise', anker: 'start' });
  return svg(400, 280, `
    <rect width="400" height="280" class="g-f-himmel"/>
    <rect x="0" y="0" width="340" height="${r1(yFt(g.cUnten))}" class="g-f-primaer" opacity=".22"/>
    <rect x="0" y="${r1(yFt(g.cUnten))}" width="340" height="${r1(yFt(g.gOben) - yFt(g.cUnten))}" class="g-f-primaer" opacity=".08"/>
    <rect x="0" y="${r1(yFt(g.gOben))}" width="340" height="${r1(yFt(PLATZ) - yFt(g.gOben))}" class="g-f-weiss" opacity=".75"/>
    ${zeile(3000, '3000 ft MSL: jetzt 5 km Sicht, Abstand zu Wolken', schritt === 1, 'g-f-orange')}
    ${zeile(g.gOben, `${g.gOben} ft (2500 ft über Grund): Luftraum E`, schritt === 1, 'g-f-primaer')}
    ${zeile(tp, `${tp} ft MSL: Transponder (Motorflugzeug)`, schritt === 2, 'g-f-orange')}
    ${zeile(g.cUnten, 'FL 100: Luftraum C – nur mit Freigabe', schritt === 3, 'g-f-fehler')}
    ${text(300, 30, 'C', { groesse: 18, gewicht: 800, klasse: 'g-f-primaer' })}
    ${text(300, r1((yFt(g.cUnten) + yFt(g.gOben)) / 2 + 20), 'E', { groesse: 18, gewicht: 800, klasse: 'g-f-primaer' })}
    ${text(300, r1((yFt(g.gOben) + yFt(PLATZ)) / 2 + 6), 'G', { groesse: 18, gewicht: 800, klasse: 'g-f-text' })}
    <rect x="0" y="${r1(yFt(PLATZ))}" width="340" height="${r1(280 - yFt(PLATZ))}" class="g-f-boden"/>
    <rect x="30" y="${r1(yFt(PLATZ) - 3)}" width="60" height="6" rx="2" class="g-f-text"/>
    ${text(60, r1(yFt(PLATZ) + 13), `Altdorf ${PLATZ} ft`, { groesse: 10, gewicht: 700 })}
    ${linie(340, 10, 340, 280, 'g-s-leise', 1)}
    ${achse}
    ${flugzeug(r1(x), r1(yFt(hoehe)), 90 + neigung, 26)}
    <rect x="218" y="248" width="116" height="24" rx="12" class="g-f-weiss"/>
    ${text(276, 260, `Höhe ${Math.round(hoehe / 50) * 50} ft MSL`, { groesse: 11, gewicht: 800, klasse: 'g-f-primaer' })}
  `, `Steigflug ab Altdorf: ${Math.round(hoehe)} Fuß MSL`);
}

export const animationen = {
  steigflug: {
    titel: 'Steigflug durch die Lufträume',
    schritte: [
      { text: 'Start in **Altdorf** (1450 ft MSL). Du bist im **Luftraum G**, unkontrolliert. Bis **3000 ft MSL** genügen dort 1,5 km Flugsicht (bis 140 kt), frei von Wolken und mit Erdsicht.', dauer: 3.6 },
      { text: 'Über **3000 ft MSL** brauchst du **5 km Sicht** und **1500 m / 1000 ft** Abstand zu Wolken. Bei **2500 ft über Grund** – hier 3950 ft MSL – beginnt **Luftraum E**: kontrolliert, aber ohne Freigabe.', dauer: 4.4 },
      { text: 'Oberhalb **5000 ft MSL** – oder 3500 ft über Grund, der höhere Wert gilt – braucht ein **Motorflugzeug einen Transponder**: Code 7000 mit Höhenübermittlung.', dauer: 3.8 },
      { text: 'Bei **FL 100** beginnt **Luftraum C** (im Alpengebiet erst bei FL 130). Ohne Freigabe bleibst du darunter – nach Osten zum Beispiel in **9500 ft** (Halbkreisflugregel).', dauer: 4.2 },
    ],
    bild: steigflug,
  },

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
