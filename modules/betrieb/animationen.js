// Animationen für „Betriebsverfahren & Notfälle“ – selbst gezeichnet, schematisch (js/animation.js).
import { svg, text, linie, pfeil, flugzeug, glatterWeg, weglaengen, aufWeg, wegPfad, sanft, abschnitt, zwischen } from '../../js/grafik.js';

const r1 = (n) => Math.round(n * 10) / 10;

/** Segelflugzeug von oben: lange, schmale Flügel. Winkel 0 = Nase nach oben. */
function segler(x, y, winkel = 0, groesse = 30, klasse = 'g-f-primaer') {
  const s = groesse / 24;
  return `<g transform="translate(${x} ${y}) rotate(${winkel}) scale(${s}) translate(-12 -12)"><path class="${klasse}" d="M11.3 3.5h1.4l.4 5.6 10.4.5v1.3l-10.4.6-.3 7.5 2.4.6v1h-6.4v-1l2.4-.6-.3-7.5-10.4-.6V9.6l10.4-.5z"/></g>`;
}

/** Teilstrecken eines Wegs: Schritt i läuft von Ecke abschnitte[i][0] bis abschnitte[i][1]. */
function wegMitSchritten(ecken, schrittEcken, pro = 12) {
  const weg = glatterWeg(ecken, pro);
  const laengen = weglaengen(weg);
  const anteil = (i) => laengen[i * pro] / laengen.at(-1);
  return { weg, laengen, schritte: schrittEcken.map(([a, b]) => [anteil(a), anteil(b)]) };
}

// ---------- Motorausfall im Reiseflug ----------

// Wind aus Westen: gelandet wird nach Westen. Der Gegenanflug führt nach Osten, nördlich am Feld vorbei.
const NOT = wegMitSchritten(
  [[40, 58], [140, 66], [200, 92], [262, 122], [370, 130], [388, 162], [352, 190], [300, 190], [262, 190]],
  [[0, 1], [1, 2], [2, 3], [3, 8]],
);
export const NOTLANDUNG_SCHRITTE = NOT.schritte;

function notlandung(schritt, t) {
  const [a, b] = NOT.schritte[schritt];
  const s = zwischen(a, b, schritt === 3 ? sanft(t) : t);
  const p = aufWeg(NOT.weg, s, NOT.laengen);
  const reichweite = zwischen(150, 30, s);
  const gewaehlt = schritt >= 1;
  const checkliste = ['Kraftstoff', 'Gemisch', 'Vorwärmung', 'Zündung', 'MAYDAY · 7700'];
  const haken = schritt === 2 ? Math.floor(sanft(t) * (checkliste.length + 0.99)) : schritt > 2 ? checkliste.length : 0;
  // Füllung über Klassen (hell/dunkel), Rand als Stil – eine g-s-Klasse würde die Füllung abschalten
  const feld = (x, y, b, h, klasse) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="3" class="${klasse}" style="stroke: var(--leise); stroke-width: 1"/>`;
  const kreuz = (x, y) => `${linie(x - 6, y - 6, x + 6, y + 6, 'g-s-fehler', 2.4)}${linie(x + 6, y - 6, x - 6, y + 6, 'g-s-fehler', 2.4)}`;
  return svg(400, 290, `
    <rect width="400" height="290" class="g-f-land"/>
    ${feld(250, 175, 122, 30, 'g-f-wald')}
    ${feld(140, 150, 70, 46, 'g-f-ort')}
    ${feld(40, 120, 80, 60, 'g-f-wald')}
    ${linie(30, 132, 130, 168, 'g-s-text', 1.2, 'stroke-dasharray="5 3"')}
    <circle cx="70" cy="232" r="18" class="g-f-ok" opacity=".75"/><circle cx="96" cy="240" r="15" class="g-f-ok" opacity=".75"/><circle cx="120" cy="230" r="17" class="g-f-ok" opacity=".75"/>
    ${pfeil(300, 26, 362, 26, { farbe: 'primaer', breite: 2.4, spitze: 10 })}
    ${text(330, 42, 'Wind aus Westen', { groesse: 11, gewicht: 700, klasse: 'g-f-primaer' })}
    ${gewaehlt ? `<rect x="246" y="171" width="130" height="38" rx="5" class="g-s-ok" stroke-width="2.6" fill="none"/>${kreuz(175, 173)}${kreuz(80, 150)}${text(284, 222, 'gewählt: lang, eben, gegen den Wind', { groesse: 10.5, gewicht: 800, klasse: 'g-f-ok g-halo' })}` : ''}
    ${schritt <= 1 ? `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${r1(reichweite)}" class="g-s-orange" stroke-width="1.6" stroke-dasharray="6 5" fill="none"/>` : ''}
    <path d="${wegPfad(NOT.weg, 0, s, NOT.laengen)}" class="g-s-primaer" stroke-width="2" stroke-dasharray="3 4" fill="none"/>
    ${flugzeug(r1(p.x), r1(p.y), r1(p.winkel), 24, 'g-f-fehler')}
    ${schritt === 0 ? text(r1(Math.min(p.x + 18, 300)), r1(p.y - 16), 'Motor aus', { groesse: 11, gewicht: 800, klasse: 'g-f-fehler g-halo', anker: 'start' }) : ''}
    ${schritt >= 2 ? `<rect x="10" y="252" width="380" height="28" rx="10" class="g-f-weiss"/>${checkliste.map((c, i) => text(r1(46 + i * 74), 266, `${i < haken ? '✓ ' : ''}${c}`, { groesse: 9.5, gewicht: 700, klasse: i < haken ? 'g-f-ok' : 'g-f-leise' })).join('')}` : ''}
    ${schritt === 3 ? text(r1(Math.min(388, Math.max(60, p.x))), r1(p.y < 160 ? p.y - 16 : p.y + 20), s > 0.9 ? 'Endanflug gegen den Wind' : s > 0.75 ? 'Queranflug' : 'Gegenanflug', { groesse: 10.5, gewicht: 800, klasse: 'g-f-primaer g-halo', anker: p.x > 300 ? 'end' : 'middle' }) : ''}
  `, `Motorausfall im Reiseflug, Schritt ${schritt + 1}`);
}

// ---------- Außenlandung mit dem Segelflugzeug ----------

// Wind aus Osten: gelandet wird nach Osten. Landeeinteilung nach dem Glider Flying Handbook der FAA.
const AUSSEN = wegMitSchritten(
  [[146, 34], [158, 64], [168, 104], [172, 214], [340, 216], [348, 120], [160, 118], [138, 150], [158, 170], [204, 170], [252, 170]],
  [[0, 1], [1, 2], [2, 5], [5, 10]],
);
const HOEHEN = [[2400, 2000], [2000, 1500], [1500, 1000], [1000, 0]];
export const AUSSENLANDUNG_SCHRITTE = AUSSEN.schritte;

function aussenlandung(schritt, t) {
  const [a, b] = AUSSEN.schritte[schritt];
  const s = zwischen(a, b, schritt === 3 ? sanft(t) : t);
  const p = aufWeg(AUSSEN.weg, s, AUSSEN.laengen);
  const hoehe = zwischen(HOEHEN[schritt][0], HOEHEN[schritt][1], schritt === 3 ? sanft(t) : t);
  const hy = (ft) => 262 - (ft / 2500) * 230;
  const marke = (ft, inhalt, aktiv) => `${linie(26, r1(hy(ft)), 52, r1(hy(ft)), aktiv ? 'g-s-orange' : 'g-s-leise', aktiv ? 2 : 1)}`
    + text(56, r1(hy(ft)), `${ft} ft`, { groesse: 10, gewicht: 800, klasse: aktiv ? 'g-f-orange' : 'g-f-leise', anker: 'start' })
    + text(56, r1(hy(ft) + 12), inhalt, { groesse: 9.5, gewicht: 700, klasse: aktiv ? 'g-f-orange' : 'g-f-leise', anker: 'start' });
  const feldGewaehlt = schritt >= 1;
  return svg(400, 290, `
    <rect width="400" height="290" class="g-f-land"/>
    <rect x="0" y="0" width="132" height="290" class="g-f-weiss" opacity=".7"/>
    ${linie(38, r1(hy(2500)), 38, r1(hy(0)), 'g-s-leise', 1.4)}
    ${marke(2000, 'Gebiet', schritt === 0)}
    ${marke(1500, 'Feld', schritt === 1)}
    ${marke(1000, 'Entscheidung', schritt === 2)}
    ${text(56, r1(hy(0)), 'Boden', { groesse: 9.5, klasse: 'g-f-leise', anker: 'start' })}
    <path d="M30 ${r1(hy(hoehe))}l-10-6v12z" class="g-f-primaer"/>
    <rect x="190" y="152" width="134" height="36" rx="3" class="g-f-wald" style="stroke: var(${feldGewaehlt ? '--ok' : '--leise'}); stroke-width: ${feldGewaehlt ? 2.6 : 1}"/>
    <rect x="200" y="210" width="90" height="34" rx="3" class="g-f-ort" style="stroke: var(--leise); stroke-width: 1"/>
    <rect x="300" y="60" width="80" height="40" rx="3" class="g-f-boden" style="stroke: var(--leise); stroke-width: 1"/>
    ${pfeil(380, 270, 322, 270, { farbe: 'primaer', breite: 2.4, spitze: 10 })}
    ${text(352, 256, 'Wind', { groesse: 11, gewicht: 700, klasse: 'g-f-primaer' })}
    <path d="${wegPfad(AUSSEN.weg, 0, s, AUSSEN.laengen)}" class="g-s-primaer" stroke-width="2" stroke-dasharray="3 4" fill="none"/>
    ${segler(r1(p.x), r1(p.y), r1(p.winkel), 30)}
    <rect x="248" y="14" width="140" height="26" rx="13" class="g-f-weiss"/>
    ${text(318, 27, `Höhe ${Math.round(hoehe / 50) * 50} ft über Grund`, { groesse: 10.5, gewicht: 800, klasse: 'g-f-primaer' })}
  `, `Außenlandung: Schritt ${schritt + 1}, ${Math.round(hoehe)} Fuß über Grund`);
}

export const animationen = {
  notlandung: {
    titel: 'Motorausfall im Reiseflug',
    schritte: [
      { text: '**Motor aus.** Sofort die Nase senken und die Geschwindigkeit des **besten Gleitens** fliegen. Der Kreis zeigt, wie weit du noch kommst – er wird mit jeder Sekunde kleiner.', dauer: 3.4 },
      { text: '**Gebiet und Feld wählen:** in Reichweite, lang und eben, ohne Leitungen und hohe Kulturen – und so, dass du **gegen den Wind** landen kannst.', dauer: 3.4 },
      { text: '**Ursache suchen** nach der Notfall-Checkliste deines Musters – typisch: Kraftstoff, Gemisch, Vergaservorwärmung, Zündung. Läuft der Motor nicht wieder an: **MAYDAY** und Transponder **7700**.', dauer: 4.4 },
      { text: '**Landeeinteilung** wie eine Platzrunde: Gegenanflug neben dem Feld, Queranflug, **Endanflug gegen den Wind**. Kurz vor dem Aufsetzen Kraftstoff und Zündung aus – und fliegen bis zum Stillstand.', dauer: 5.2 },
    ],
    bild: notlandung,
  },
  aussenlandung: {
    titel: 'Außenlandung mit dem Segelflugzeug',
    schritte: [
      { text: '**2000 ft über Grund:** Spätestens jetzt ein **Landegebiet** wählen. Mit dem Wind kommst du weiter und hast mehr Felder zur Auswahl.', dauer: 3.4 },
      { text: '**1500 ft:** das **Feld** wählen – Wind, Größe, Neigung, Hindernisse und Bewuchs prüfen.', dauer: 3.2 },
      { text: 'Bis **1000 ft** das Feld **von allen Seiten** ansehen: Queranflug auf der Leeseite, längs des Feldes gegen den Wind, Queranflug auf der Luvseite. Ab 1000 ft ist die Landung **beschlossen**.', dauer: 5 },
      { text: '**Gegenanflug, Queranflug, Endanflug gegen den Wind.** Den Winkel zum Aufsetzpunkt halten, mit der kleinsten sicheren Fahrt aufsetzen, dann die Radbremse.', dauer: 5 },
    ],
    bild: aussenlandung,
  },
};
