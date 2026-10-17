// Animationen für das Modul „Sprechfunk“ – selbst gezeichnet (js/animation.js).
// Platzrunde am frei erfundenen Flugplatz Altdorf (XALT), rechte Platzrunde Piste 25 –
// dieselbe Lage wie in der Abbildung „platzrunde-xalt“. Meldungen nach NfL 2024-1-3240, Nr. 6.2 (Beispiele).
import { svg, text, linie, flugzeug, glatterWeg, weglaengen, aufWeg, wegPfad, sanft, abschnitt } from '../../js/grafik.js';
import { ALTDORF } from './uebungsgebiet.js';

const r1 = (n) => Math.round(n * 10) / 10;
const PISTE = { l: 120, r: 280, y: 205 };

// Eckpunkte der Runde: Startlauf nach Westen, rechts herum nach Norden, Gegenanflug nach Osten, Landung auf 25.
const ECKEN = [
  [268, 205], [190, 205], [112, 194], // Start und Abflug (upwind)
  [74, 158], [80, 104], [112, 92], // Querabflug
  [296, 92], // Gegenanflug
  [332, 110], [338, 160], // Queranflug
  [316, 198], [284, 205], [206, 205], // Endanflug, Aufsetzen, Ausrollen
];
const PRO = 12;
const WEG = glatterWeg(ECKEN, PRO);
const LAENGEN = weglaengen(WEG);
/** Anteil der Weglänge am Eckpunkt i. */
const beiEcke = (i) => LAENGEN[i * PRO] / LAENGEN.at(-1);

// Die vier Schritte laufen jeweils von einer Ecke zur nächsten markierten.
export const ABSCHNITTE = [[0, 2], [2, 6], [6, 9], [9, 11]].map(([a, b]) => [beiEcke(a), beiEcke(b)]);

const TEILE = [
  { name: 'Start / Abflug', x: 182, y: 183, anker: 'middle' },
  { name: 'Querabflug', x: 98, y: 132, anker: 'start' },
  { name: 'Gegenanflug', x: 204, y: 78, anker: 'middle' },
  { name: 'Queranflug', x: 326, y: 136, anker: 'end' },
  { name: 'Endanflug', x: 330, y: 176, anker: 'end' },
];
// Welche Platzrundenteile in welchem Schritt hervorgehoben sind
const HERVOR = [[0], [1, 2], [3], [4]];

const MELDUNGEN = [
  'D-EKLM, starte Piste 25',
  null,
  'D-EKLM, rechter Queranflug Piste 25, zur Landung',
  'D-EKLM, Piste verlassen, rolle zum Vorfeld',
];

/** Wo das Flugzeug in Schritt `schritt` beim Fortschritt t ist (Anteil der ganzen Runde). */
export function rundenAnteil(schritt, t) {
  const [a, b] = ABSCHNITTE[schritt];
  // Im letzten Schritt rollt das Flugzeug nach dem Aufsetzen langsamer aus
  return a + (b - a) * (schritt === 3 ? Math.sqrt(sanft(t)) : sanft(t));
}

function platzrunde(schritt, t) {
  const s = rundenAnteil(schritt, t);
  const p = aufWeg(WEG, s, LAENGEN);
  const amBoden = s < beiEcke(1) || s > beiEcke(10);
  const meldung = MELDUNGEN[schritt];
  // Meldungen kommen am Anfang des Schritts – die zur Landung erst nach dem Ausrollen
  const sichtbar = meldung ? (schritt === 3 ? sanft(abschnitt(t, 0.7, 0.9)) : sanft(abschnitt(t, 0.05, 0.25))) : 0;
  const teile = TEILE.map((teil, i) => text(teil.x, teil.y, teil.name, {
    groesse: HERVOR[schritt].includes(i) ? 11.5 : 10.5,
    gewicht: HERVOR[schritt].includes(i) ? 800 : 600,
    klasse: `${HERVOR[schritt].includes(i) ? 'g-f-primaer' : 'g-f-leise'} g-halo`,
    anker: teil.anker,
  })).join('');

  return svg(400, 300, `
    <rect width="400" height="300" class="g-f-land"/>
    <g transform="translate(374 270)"><path d="M0-14l6 16-6-4-6 4z" class="g-f-text"/>${text(0, 13, 'N', { groesse: 10, gewicht: 800 })}</g>
    <ellipse cx="300" cy="262" rx="46" ry="20" class="g-f-ort"/>
    ${text(300, 262, 'Ortschaft', { groesse: 10, klasse: 'g-f-leise' })}
    <rect x="${PISTE.l}" y="${PISTE.y - 6}" width="${PISTE.r - PISTE.l}" height="12" rx="2" class="g-f-text"/>
    ${linie(PISTE.l + 8, PISTE.y, PISTE.r - 8, PISTE.y, 'g-s-flaeche', 1, 'stroke-dasharray="7 6"')}
    ${text(PISTE.l - 8, PISTE.y, '07', { groesse: 11, gewicht: 800, anker: 'end' })}${text(PISTE.r + 8, PISTE.y, '25', { groesse: 11, gewicht: 800, anker: 'start' })}
    ${text(200, 226, `Altdorf (${ALTDORF.kennung}) · rechte Platzrunde Piste 25 · ${ALTDORF.platzrunde} ft MSL`, { groesse: 10, klasse: 'g-f-leise g-halo' })}
    <path d="${wegPfad(WEG, 0, 1, LAENGEN)}" class="g-s-rand" stroke-width="2" stroke-dasharray="4 5" fill="none"/>
    <path d="${wegPfad(WEG, 0, s, LAENGEN)}" class="g-s-primaer" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    ${teile}
    ${flugzeug(r1(p.x), r1(p.y), r1(p.winkel), amBoden ? 22 : 26)}
    <g opacity="${r1(sichtbar)}">
      <rect x="12" y="12" width="376" height="42" rx="12" class="g-f-weiss g-s-primaer" stroke-width="1.4"/>
      ${text(26, 26, 'Funk (Beispiel)', { groesse: 9.5, gewicht: 800, klasse: 'g-f-primaer', anker: 'start' })}
      ${text(26, 42, meldung ? `„${meldung}“` : '', { groesse: 12, gewicht: 700, anker: 'start' })}
    </g>
  `, `Platzrunde Altdorf: ${TEILE[HERVOR[schritt][0]].name}${meldung ? `, Meldung: ${meldung}` : ''}`);
}

export const animationen = {
  platzrunde: {
    titel: 'Einmal um die Platzrunde',
    schritte: [
      { text: '**Start** auf Piste 25 nach Westen. An einem Platz ohne Flugverkehrsdienst (RADIO) meldest du zum Beispiel: „D-EKLM, starte Piste 25“.', dauer: 3.6 },
      { text: 'Rechtskurve in den **Querabflug**, dann wieder rechts in den **Gegenanflug** – parallel zur Piste, entgegen der Landerichtung, in Platzrundenhöhe.', dauer: 5 },
      { text: 'Rechtskurve in den **Queranflug**. Jetzt meldest du: „D-EKLM, rechter Queranflug Piste 25, zur Landung“.', dauer: 3.4 },
      { text: 'Im **Endanflug** auf die Piste ausrichten und landen. Ist die Piste frei: „D-EKLM, Piste verlassen, rolle zum Vorfeld“.', dauer: 4.2 },
    ],
    bild: platzrunde,
  },
};
