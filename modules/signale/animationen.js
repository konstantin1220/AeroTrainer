// Animationen für „Signale“ – selbst gezeichnet, schematisch (js/animation.js).
// Abfangverfahren nach SERA Anlage 2 (Durchführungsverordnung (EU) Nr. 923/2012), Tabelle S11-1.
import { svg, text, flugzeug, sanft, abschnitt, zwischen, glatterWeg, aufWeg, weglaengen } from '../../js/grafik.js';

const r1 = (n) => Math.round(n * 10) / 10;

// Draufsicht: du fliegst in der Mitte nach oben, die Ansicht wandert mit dir mit.
export const DU = [236, 196];
const ANFLUG = glatterWeg([[118, 268], [146, 210], [172, 150]]);
const FOLGEN = glatterWeg([[172, 150], [164, 116], [142, 88], [112, 74]]);
export const ABDREHEN = glatterWeg([[172, 150], [158, 112], [120, 86], [70, 80], [30, 88]]);
const weg = (w, s) => aufWeg(w, s, weglaengen(w));

/** Wackeln mit den Tragflächen: Querlage schwingt zweimal hin und her. */
const wackeln = (t) => Math.sin(t * Math.PI * 4) * 22;

/** Kleiner Kasten oben rechts: das wackelnde Flugzeug von hinten gesehen. */
function vonHinten(wer, querlage) {
  const klasse = wer === 'du' ? 'primaer' : 'text';
  return `<rect x="262" y="12" width="126" height="84" rx="10" class="g-f-weiss" style="stroke: var(--rand); stroke-width: 1"/>
    ${text(325, 26, 'von hinten gesehen', { groesse: 10, klasse: 'g-f-leise' })}
    <g transform="translate(325 58) rotate(${r1(querlage)})">
      <path d="M-44 0h88" class="g-s-${klasse}" stroke-width="4" stroke-linecap="round"/>
      <circle r="8" class="g-f-${klasse}"/>
      <path d="M0-7v-13" class="g-s-${klasse}" stroke-width="3" stroke-linecap="round"/>
    </g>
    ${text(325, 86, wer === 'du' ? 'du wackelst' : 'Abfangjäger wackelt', { groesse: 10, gewicht: 800, klasse: `g-f-${klasse}` })}`;
}

function abfangen(schritt, t) {
  let jaeger, du = 0, kasten = '', marke = '';
  if (schritt === 0) {
    jaeger = weg(ANFLUG, sanft(t));
    marke = t > 0.7 ? text(150, 128, 'etwas über, vor und links von dir', { groesse: 11, gewicht: 700, klasse: 'g-f-text g-halo', anker: 'start' }) : '';
  } else if (schritt === 1) {
    const kurve = sanft(abschnitt(t, 0.5, 1));
    jaeger = weg(FOLGEN, kurve);
    kasten = vonHinten('jaeger', t < 0.5 ? wackeln(abschnitt(t, 0, 0.5)) : 0);
    marke = text(150, 128, t < 0.5 ? 'wackelt: „Du wirst abgefangen“' : 'langsame Kurve: „Folge mir“', { groesse: 11, gewicht: 800, klasse: 'g-f-text g-halo', anker: 'start' });
  } else if (schritt === 2) {
    jaeger = weg(FOLGEN, 1);
    kasten = vonHinten('du', t < 0.5 ? wackeln(abschnitt(t, 0, 0.5)) : 0);
    du = zwischen(0, -60, sanft(abschnitt(t, 0.5, 1)));
    marke = text(20, 240, '121,500 MHz rufen · Transponder 7700', { groesse: 11, gewicht: 800, klasse: 'g-f-primaer g-halo', anker: 'start' });
  } else {
    jaeger = weg(ABDREHEN, sanft(abschnitt(t, 0, 0.6)));
    kasten = t > 0.6 ? vonHinten('du', wackeln(abschnitt(t, 0.6, 1))) : '';
    marke = text(20, 240, 'steigende Kurve weg von dir: „Du darfst weiterfliegen“', { groesse: 11, gewicht: 800, klasse: 'g-f-text g-halo', anker: 'start' });
  }
  // Steigt der Abfangjäger, wirkt er von oben etwas größer
  const groesse = schritt === 3 ? zwischen(30, 36, sanft(abschnitt(t, 0, 0.6))) : 30;
  return svg(400, 270, `
    <rect width="400" height="270" class="g-f-land"/>
    ${[40, 110, 180, 250].map((y) => `<path d="M0 ${y}h400" class="g-s-leise" stroke-width="1" opacity=".25"/>`).join('')}
    ${flugzeug(DU[0], DU[1], r1(du), 32, 'g-f-primaer')}
    ${text(DU[0], DU[1] + 28, 'du', { groesse: 11, gewicht: 800, klasse: 'g-f-primaer g-halo' })}
    ${flugzeug(r1(jaeger.x), r1(jaeger.y), r1(jaeger.winkel), r1(groesse), 'g-f-text')}
    ${marke}
    ${kasten}
  `, 'Abfangen: Das Militärflugzeug setzt sich vor und links neben dich, wackelt mit den Tragflächen und kurvt langsam weg; du wackelst und folgst');
}

export const animationen = {
  abfangen: {
    titel: 'Abgefangen – was jetzt?',
    schritte: [
      { text: 'Ein Militärflugzeug nähert sich und setzt sich **etwas über und vor dich**, normalerweise **links** – dort, wo du als Pilot sitzt und es gut sehen kannst.', dauer: 3.6 },
      { text: 'Es **wackelt mit den Tragflächen** (nachts auch Blinken der Positionslichter) und fliegt dann eine **langsame Kurve** auf den gewünschten Kurs. Das heißt: **„Du wirst abgefangen – folge mir.“**', dauer: 4.4 },
      { text: 'Du antwortest: **Tragflächen wackeln** und **folgen**. Dazu Funkkontakt auf **121,500 MHz** versuchen und den Transpondercode **7700** einstellen, wenn nichts anderes angewiesen wird.', dauer: 4.4 },
      { text: 'Anderes Zeichen: Das Flugzeug dreht **abrupt in einer steigenden Kurve von 90° oder mehr** ab, ohne deinen Weg zu kreuzen. Das heißt: **„Du darfst weiterfliegen.“** Du bestätigst mit **Wackeln**.', dauer: 4.4 },
    ],
    bild: abfangen,
  },
};
