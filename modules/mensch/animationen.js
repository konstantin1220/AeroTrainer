// Animationen für „Mensch im Cockpit“ – selbst gezeichnet, schematisch (js/animation.js).
import { svg, text, linie, sanft, abschnitt, zwischen } from '../../js/grafik.js';

const r1 = (n) => Math.round(n * 10) / 10;

/** Flugzeug von hinten gesehen, Querlage in Grad (positiv = rechte Fläche unten). */
function vonHinten(cx, cy, querlage, klasse) {
  return `<g transform="translate(${cx} ${cy}) rotate(${r1(querlage)})">
    <path d="M-72 0h144" class="${klasse.replace('g-f-', 'g-s-')}" stroke-width="5" stroke-linecap="round"/>
    <circle r="13" class="${klasse}"/>
    <path d="M0-12v-20" class="${klasse.replace('g-f-', 'g-s-')}" stroke-width="4" stroke-linecap="round"/>
    <path d="M-26 -2h52" class="g-s-flaeche" stroke-width="1.5"/>
  </g>`;
}

/** Pilot von hinten (Kopf und Oberkörper), geneigt um neigung Grad. */
function pilot(cx, cy, neigung) {
  return `<g transform="translate(${cx} ${cy}) rotate(${r1(neigung)})"><circle cy="-30" r="9" class="g-f-text"/><path d="M0-20v26" class="g-s-text" stroke-width="5" stroke-linecap="round"/><path d="M-14-12h28" class="g-s-text" stroke-width="4" stroke-linecap="round"/></g>`;
}

// Querlage wirklich und gefühlt in jedem Schritt
export const LEANS = [
  { wirklich: [0, 20], gefuehlt: [0, 0] },
  { wirklich: [20, 20], gefuehlt: [0, 0] },
  { wirklich: [20, 0], gefuehlt: [0, -14] },
  { wirklich: [0, 0], gefuehlt: [-14, -14] },
];

function leans(schritt, t) {
  const s = LEANS[schritt];
  const f = schritt === 2 ? sanft(abschnitt(t, 0, 0.5)) : sanft(t);
  const wirklich = zwischen(s.wirklich[0], s.wirklich[1], f);
  const gefuehlt = zwischen(s.gefuehlt[0], s.gefuehlt[1], f);
  const lage = (q) => (Math.abs(q) < 1 ? 'gerade' : `${Math.round(Math.abs(q))}° ${q > 0 ? 'rechts' : 'links'}`);
  const neigung = schritt === 3 ? sanft(t) * 12 : 0;
  return svg(400, 270, `
    <rect width="400" height="270" class="g-f-himmel"/>
    <rect x="0" y="150" width="400" height="120" class="g-f-boden" opacity=".7"/>
    ${linie(0, 150, 400, 150, 'g-s-leise', 1)}
    ${linie(200, 14, 200, 256, 'g-s-rand', 1, 'stroke-dasharray="4 4"')}
    ${text(100, 24, 'So ist es wirklich', { groesse: 12, gewicht: 800 })}
    ${text(300, 24, 'So fühlt es sich an', { groesse: 12, gewicht: 800, klasse: 'g-f-orange' })}
    ${vonHinten(100, 96, wirklich, 'g-f-primaer')}
    ${vonHinten(300, 96, gefuehlt, 'g-f-orange')}
    ${text(100, 136, `Querlage: ${lage(wirklich)}`, { groesse: 12, gewicht: 700, klasse: 'g-f-primaer g-halo' })}
    ${text(300, 136, `gefühlt: ${lage(gefuehlt)}`, { groesse: 12, gewicht: 700, klasse: 'g-f-orange g-halo' })}
    ${pilot(100, 222, neigung)}
    ${schritt === 3 ? text(100, 250, 'lehnt sich zur alten Kurve', { groesse: 11, gewicht: 700, klasse: 'g-f-fehler g-halo' }) : text(100, 250, 'Pilot', { groesse: 11, klasse: 'g-f-leise' })}
    ${schritt === 0 ? text(300, 200, 'Drehung zu langsam –', { groesse: 11, gewicht: 700, klasse: 'g-f-text g-halo' }) + text(300, 216, 'das Innenohr merkt nichts', { groesse: 11, gewicht: 700, klasse: 'g-f-text g-halo' }) : ''}
    ${schritt === 2 ? text(300, 200, 'Innenohr meldet', { groesse: 11, gewicht: 700, klasse: 'g-f-fehler g-halo' }) + text(300, 216, 'eine Kurve nach links', { groesse: 11, gewicht: 700, klasse: 'g-f-fehler g-halo' }) : ''}
  `, `Die Leans: wirkliche Querlage ${lage(wirklich)}, gefühlt ${lage(gefuehlt)}`);
}

export const animationen = {
  leans: {
    titel: 'Die „Leans“ – wenn das Gefühl lügt',
    schritte: [
      { text: 'Ohne Sicht nach draußen rollst du langsam in eine Kurve – **langsamer als etwa 2° pro Sekunde**. Das Gleichgewichtsorgan bemerkt das nicht: Es fühlt sich an wie **Geradeausflug**.', dauer: 4 },
      { text: 'Du bleibst in der Kurve. Das Innenohr hat sich an die Drehung gewöhnt und meldet weiter: **gerade**.', dauer: 3 },
      { text: 'Jetzt rollst du zügig zurück in die Waagerechte. Das Innenohr meldet eine **Kurve zur anderen Seite** – obwohl du gerade fliegst.', dauer: 3.6 },
      { text: 'Du **lehnst dich unwillkürlich** in die alte Kurvenrichtung – die „Leans“. Glaub dem **Horizont** oder dem **künstlichen Horizont**, nicht dem Gefühl.', dauer: 3.6 },
    ],
    bild: leans,
  },
};
