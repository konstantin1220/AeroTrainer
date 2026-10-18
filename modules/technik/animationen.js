// Animationen für „Technik“ – selbst gezeichnet, schematisch (js/animation.js).
import { svg, text, linie, pfeil, aufKreis, sanft, abschnitt, zwischen } from '../../js/grafik.js';
import { kolbenweg, takt } from './rechnen.js';

const r1 = (n) => Math.round(n * 10) / 10;

// ---------- Viertaktmotor ----------

const TAKT_NAME = { ansaugen: 'Ansaugen', verdichten: 'Verdichten', arbeiten: 'Arbeiten', ausstossen: 'Ausstoßen' };
const GAS = { ansaugen: '#93c5fd', verdichten: '#60a5fa', arbeiten: '#f97316', ausstossen: '#9ca3af' };

function viertakt(schritt, t) {
  const grad = schritt * 180 + t * 180; // Kurbelwinkel 0–720°
  // Der Takt richtet sich nach dem Schritt – genau am Totpunkt gehört der Winkel noch zum laufenden Takt
  const name = takt(schritt * 180 + Math.min(t, 0.999) * 180);
  const cx = 150, kurbelY = 236, rKurbel = 32;
  // Kolbenbolzen: Pleuel 3,5 × Kurbelradius (wie in kolbenweg), also 92 (oberer Totpunkt) bis 156 (unterer)
  const kolbenY = kurbelY - rKurbel - 3.5 * rKurbel + kolbenweg(grad) * 2 * rKurbel;
  const [px, py] = aufKreis(cx, kurbelY, rKurbel, grad);
  const einlassOffen = name === 'ansaugen';
  const auslassOffen = name === 'ausstossen';
  const funke = grad >= 352 && grad <= 382;
  const flamme = name === 'arbeiten' ? 1 - abschnitt(grad, 360, 540) * 0.7 : 0;
  const ventil = (x, offen) => `<path d="M${x} ${offen ? 44 : 36}v-22" class="g-s-text" stroke-width="2.4"/><path d="M${x - 11} ${offen ? 46 : 38}h22" class="g-s-text" stroke-width="3"/>`;
  return svg(400, 290, `
    <rect width="400" height="290" class="g-f-flaeche"/>
    <rect x="96" y="34" width="108" height="150" rx="4" class="g-f-weiss g-s-text" stroke-width="2"/>
    <rect x="98" y="38" width="104" height="${r1(kolbenY - 12 - 38)}" fill="${GAS[name]}" opacity="${r1(name === 'arbeiten' ? 0.35 + 0.5 * flamme : 0.55)}"/>
    ${ventil(122, einlassOffen)}${ventil(178, auslassOffen)}
    ${pfeil(70, 18, 112, 18, { farbe: einlassOffen ? 'primaer' : 'leise', breite: 2, spitze: 8 })}
    ${text(52, 18, 'Gemisch', { groesse: 10, gewicht: 700, klasse: einlassOffen ? 'g-f-primaer' : 'g-f-leise', anker: 'end' })}
    ${pfeil(188, 18, 232, 18, { farbe: auslassOffen ? 'orange' : 'leise', breite: 2, spitze: 8 })}
    ${text(238, 18, 'Abgas', { groesse: 10, gewicht: 700, klasse: auslassOffen ? 'g-f-orange' : 'g-f-leise', anker: 'start' })}
    <rect x="146" y="14" width="8" height="22" class="g-f-text"/>
    ${funke ? '<path d="M150 38l-7 10h5l-3 9 9-12h-5l3-7z" fill="#facc15"/>' : ''}
    <rect x="100" y="${r1(kolbenY - 12)}" width="100" height="30" rx="3" class="g-f-rand g-s-text" stroke-width="1.6"/>
    ${linie(cx, r1(kolbenY + 4), r1(px), r1(py), 'g-s-text', 6)}
    <circle cx="${cx}" cy="${kurbelY}" r="${rKurbel + 10}" class="g-s-rand" stroke-width="1.4" fill="none"/>
    ${linie(cx, kurbelY, r1(px), r1(py), 'g-s-text', 8)}
    <circle cx="${cx}" cy="${kurbelY}" r="6" class="g-f-text"/>
    <circle cx="${r1(px)}" cy="${r1(py)}" r="5" class="g-f-orange"/>
    ${text(300, 60, `${schritt + 1}. Takt`, { groesse: 12, gewicht: 700, klasse: 'g-f-leise' })}
    ${text(300, 84, TAKT_NAME[name], { groesse: 20, gewicht: 800 })}
    ${text(300, 112, einlassOffen ? 'Einlass offen' : auslassOffen ? 'Auslass offen' : 'beide Ventile zu', { groesse: 11, gewicht: 700, klasse: 'g-f-leise' })}
    ${funke ? text(300, 136, 'Zündfunke!', { groesse: 12, gewicht: 800, klasse: 'g-f-orange' }) : ''}
    ${text(300, 206, `Kurbelwelle: ${Math.round(grad)}°`, { groesse: 11, gewicht: 700 })}
    ${text(300, 224, `${(grad / 360).toFixed(1).replace('.', ',')} von 2 Umdrehungen`, { groesse: 10.5, klasse: 'g-f-leise' })}
  `, `Viertaktmotor im Takt ${TAKT_NAME[name]} bei ${Math.round(grad)} Grad Kurbelwinkel`);
}

// ---------- Vergaservereisung ----------

/** Eismenge (0–1) und Drehzahl in jedem Schritt (Festpropeller, schematisch). */
export const VEREISUNG = [
  { eis: [0, 0.55], drehzahl: [2400, 2300], vorwaermung: false },
  { eis: [0.55, 1], drehzahl: [2300, 2050], vorwaermung: false },
  { eis: [1, 0.45], drehzahl: [2050, 1950], vorwaermung: true },
  { eis: [0.45, 0], drehzahl: [1950, 2300], vorwaermung: true },
];

function vergaservereisung(schritt, t) {
  const s = VEREISUNG[schritt];
  const f = sanft(t);
  const eis = zwischen(s.eis[0], s.eis[1], f);
  const drehzahl = zwischen(s.drehzahl[0], s.drehzahl[1], f);
  const rau = schritt === 1 && f > 0.6 ? Math.sin(t * 60) * 2 : 0;
  // Vergaser: Luft strömt von unten nach oben, Engstelle (Venturi) bei y 170, Drosselklappe bei y 106
  const wand = 'M70 270V196C70 178 92 172 92 160S70 140 70 124V40M170 270V196C170 178 148 172 148 160S170 140 170 124V40';
  const eisFlecken = [[94, 158], [146, 162], [100, 112], [140, 104], [92, 168], [148, 150]].slice(0, Math.ceil(eis * 6))
    .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${r1(5 + 6 * eis)}" ry="${r1(3 + 4 * eis)}" fill="#dbeafe" stroke="#60a5fa" stroke-width="1" opacity="${r1(Math.min(1, eis * 1.6 - i * 0.1 + 0.3))}"/>`).join('');
  const luft = s.vorwaermung ? '#f97316' : '#60a5fa';
  const w = (rpm) => -120 + (rpm / 3000) * 240;
  const dx = 326, dy = 150;
  const [nx, ny] = aufKreis(dx + rau, dy, 50, w(drehzahl));
  let skala = '';
  for (let rpm = 0; rpm <= 3000; rpm += 500) {
    const [x1, y1] = aufKreis(dx, dy, 51, w(rpm));
    const [x2, y2] = aufKreis(dx, dy, 58, w(rpm));
    const [tx, ty] = aufKreis(dx, dy, 41, w(rpm));
    skala += `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="#f3f4f6" stroke-width="1.4"/>`
      + (rpm % 1000 === 0 ? `<text x="${r1(tx)}" y="${r1(ty)}" fill="#e5e7eb" font-size="10" font-weight="700" text-anchor="middle" dominant-baseline="middle">${rpm / 1000}</text>` : '');
  }
  return svg(400, 290, `
    <rect width="400" height="290" class="g-f-flaeche"/>
    <path d="${wand}" class="g-s-text" stroke-width="3" fill="none"/>
    ${[100, 120, 140].map((x, i) => pfeil(x, 262 - i * 4, x, 214 - i * 4, { farbe: s.vorwaermung ? 'orange' : 'primaer', breite: 2, spitze: 8 })).join('')}
    ${text(120, 282, s.vorwaermung ? 'warme Luft (Vorwärmung)' : 'kalte, feuchte Luft', { groesse: 10.5, gewicht: 800, klasse: s.vorwaermung ? 'g-f-orange' : 'g-f-primaer' })}
    <path d="M40 176h52" class="g-s-orange" stroke-width="3"/>
    ${text(58, 164, 'Kraftstoff', { groesse: 10, gewicht: 700, klasse: 'g-f-orange' })}
    ${linie(96, r1(110 - 14 * (1 - eis * 0.6)), 144, r1(102 + 14 * (1 - eis * 0.6)), 'g-s-text', 3)}
    <circle cx="120" cy="106" r="3" class="g-f-text"/>
    ${eisFlecken}
    ${pfeil(120, 70, 120, 28, { farbe: 'leise', breite: 2, spitze: 8 })}
    ${text(120, 16, 'zum Motor', { groesse: 10.5, gewicht: 700, klasse: 'g-f-leise' })}
    ${text(184, 160, 'Engstelle', { groesse: 10, klasse: 'g-f-leise', anker: 'start' })}
    ${text(184, 106, 'Drosselklappe', { groesse: 10, klasse: 'g-f-leise', anker: 'start' })}
    <circle cx="${dx}" cy="${dy}" r="62" fill="#1f2937"/>
    ${skala}
    <line x1="${dx + rau}" y1="${dy}" x2="${r1(nx)}" y2="${r1(ny)}" stroke="#f9fafb" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="${dx}" cy="${dy}" r="4" fill="#f9fafb"/>
    <text x="${dx}" y="${dy + 30}" fill="#9ca3af" font-size="9" font-weight="700" text-anchor="middle" dominant-baseline="middle">U/min × 1000</text>
    ${text(dx, 236, `${Math.round(drehzahl / 10) * 10} U/min`, { groesse: 14, gewicht: 800 })}
    ${text(dx, 256, s.vorwaermung ? 'Vorwärmung: an' : 'Vorwärmung: aus', { groesse: 10.5, gewicht: 700, klasse: s.vorwaermung ? 'g-f-orange' : 'g-f-leise' })}
    ${eis > 0.05 ? text(r1(184), 132, `Eis ${Math.round(eis * 100)} %`, { groesse: 10.5, gewicht: 800, klasse: 'g-f-primaer', anker: 'start' }) : ''}
  `, `Vergaser mit ${Math.round(eis * 100)} Prozent Vereisung, Drehzahl ${Math.round(drehzahl)} pro Minute`);
}

export const animationen = {
  viertakt: {
    titel: 'Der Viertaktmotor',
    schritte: [
      { text: '**Ansaugen:** Der Kolben geht nach unten, das **Einlassventil** ist offen – Kraftstoff-Luft-Gemisch strömt in den Zylinder.', dauer: 2.6 },
      { text: '**Verdichten:** Beide Ventile sind zu, der Kolben drückt das Gemisch zusammen. Kurz vor dem oberen Punkt springt der **Zündfunke** über.', dauer: 2.6 },
      { text: '**Arbeiten:** Das Gemisch verbrennt, der Druck treibt den Kolben nach unten. Das ist der einzige Takt, der **Kraft** liefert.', dauer: 2.6 },
      { text: '**Ausstoßen:** Das **Auslassventil** öffnet, der Kolben schiebt die Abgase hinaus. Nach **zwei Umdrehungen** beginnt alles von vorn.', dauer: 2.6 },
    ],
    bild: viertakt,
  },
  vergaservereisung: {
    titel: 'Vergaservereisung',
    schritte: [
      { text: 'In der **Engstelle** des Vergasers sinkt der Druck, und verdunstender Kraftstoff kühlt die Luft stark ab. Ist sie feucht, bildet sich **Eis** – an der Drosselklappe und in der Engstelle.', dauer: 3.6 },
      { text: 'Das Eis verengt den Durchlass. Beim Festpropeller **fällt die Drehzahl**, später läuft der Motor **rau**.', dauer: 3.6 },
      { text: '**Vergaservorwärmung ziehen:** Warme Luft strömt ein. Die Drehzahl **fällt zuerst weiter** – warme Luft ist dünner, und Schmelzwasser geht durch den Motor.', dauer: 3.6 },
      { text: 'Ist das Eis geschmolzen, **steigt die Drehzahl** wieder. Mit Vorwärmung bleibt sie etwas niedriger als vorher. Weiter nach Flughandbuch.', dauer: 3.6 },
    ],
    bild: vergaservereisung,
  },
};
