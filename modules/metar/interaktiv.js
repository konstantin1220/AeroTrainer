// Interaktive Darstellungen für „METAR lesen“: METAR-Baukasten und Seitenwind-Rechner.
import { h } from '../../js/ui.js';
import { regler, umschalter, wertanzeige, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { svg, text, linie, pfeil, flugzeug, aufKreis } from '../../js/grafik.js';
import { zerlegen } from './metar.js';
import { windKomponenten } from './aufgaben.js';

const zwei = (n) => String(n).padStart(2, '0');
const drei = (n) => String(n).padStart(3, '0');
const r1 = (n) => n.toFixed(1);
const RAD = Math.PI / 180;
const temp = (n) => (n < 0 ? `M${zwei(-n)}` : zwei(n));

/**
 * Baut ein METAR aus Einstellungen und liefert Hinweise auf Regelverstöße.
 * e = { wind, staerke, boeen, sicht, wetter, schicht1, hoehe1, art1, schicht2, hoehe2, t, td, qnh, trend }
 */
export function metarBauen(e) {
  const hinweise = [];
  const teile = ['METAR', 'XMUS', '121420Z'];
  let windGruppe = e.staerke === 0 ? '00000KT' : `${drei(e.wind || 360)}${zwei(e.staerke)}`;
  if (e.staerke > 0) {
    if (e.boeen > 0 && e.boeen >= e.staerke + 10) windGruppe += `G${zwei(e.boeen)}`;
    else if (e.boeen > 0) hinweise.push(`Böen bis ${e.boeen} kt werden nicht gemeldet – erst ab 10 kt über dem Mittelwind (also ab ${e.staerke + 10} kt).`);
    windGruppe += 'KT';
  }
  teile.push(windGruppe);

  const schichten = [[e.schicht1, e.hoehe1, e.art1], [e.schicht2, e.hoehe2, '']]
    .filter(([menge]) => menge)
    .sort((a, b) => a[1] - b[1]);
  if (schichten.length === 2 && schichten[0][1] === schichten[1][1]) hinweise.push('Zwei Schichten in derselben Höhe – die zweite wird nicht gemeldet.');
  const einmalig = schichten.filter((s, i) => i === 0 || s[1] !== schichten[i - 1][1]);
  const rang = { FEW: 1, SCT: 2, BKN: 3, OVC: 4 };
  if (einmalig.length === 2 && !einmalig[1][2] && rang[einmalig[1][0]] < 2) hinweise.push('Die zweite Schicht wird erst ab SCT (3 Achtel) gemeldet.');
  if (einmalig.length === 2 && einmalig[0][0] === 'OVC') hinweise.push('Über einer geschlossenen Decke (OVC) kann man keine weitere Schicht beobachten.');
  const cbOderTcu = einmalig.some((s) => s[2]);

  const cavok = e.sicht >= 10000 && !e.wetter && !cbOderTcu && einmalig.every(([, hoehe]) => hoehe >= 5000);
  if (cavok) {
    teile.push('CAVOK');
    hinweise.push('Sicht 10 km oder mehr, kein Wetter und keine Wolken unter 5000 ft – dafür steht CAVOK.');
  } else {
    teile.push(e.sicht >= 10000 ? '9999' : String(e.sicht).padStart(4, '0'));
    if (e.wetter) teile.push(e.wetter);
    if (einmalig.length) teile.push(...einmalig.map(([menge, hoehe, art]) => `${menge}${drei(Math.round(hoehe / 100))}${art}`));
    else teile.push('NSC');
  }
  if (e.wetter === 'FG' && e.sicht >= 1000) hinweise.push('Nebel (FG) wird nur bei einer Sicht unter 1000 m gemeldet – sonst ist es feuchter Dunst (BR).');
  if (e.wetter === 'BR' && (e.sicht < 1000 || e.sicht > 5000)) hinweise.push('Feuchter Dunst (BR) passt zu einer Sicht von 1000 bis 5000 m.');
  if (e.wetter && /TS/.test(e.wetter) && !einmalig.some((s) => s[2] === 'CB')) hinweise.push('Bei Gewitter gehört eine Wolkenschicht mit CB dazu.');
  if (e.wetter && /SN/.test(e.wetter) && e.t > 3) hinweise.push(`Schnee bei ${e.t} °C ist sehr unwahrscheinlich.`);
  if (e.td > e.t) hinweise.push('Der Taupunkt kann nicht über der Temperatur liegen.');
  teile.push(`${temp(e.t)}/${temp(Math.min(e.td, e.t))}`, `Q${String(e.qnh).padStart(4, '0')}`);
  if (e.trend) teile.push(...e.trend.split(' '));
  return { text: teile.join(' '), hinweise };
}

function pistenBild(piste, windRichtung, staerke, k) {
  const c = 200, cy = 170, laenge = 125;
  const kurs = piste * 10;
  const runde = (n) => Math.round(n);
  const [ax, ay] = aufKreis(c, cy, laenge, kurs + 180);
  const [ex, ey] = aufKreis(c, cy, laenge, kurs);
  const nummer = (n) => zwei(((n - 1 + 36) % 36) + 1);
  const [nx1, ny1] = aufKreis(c, cy, laenge - 22, kurs + 180);
  const [nx2, ny2] = aufKreis(c, cy, laenge - 22, kurs);
  // Flugzeug im Endanflug vor der Schwelle
  const [fx, fy] = aufKreis(c, cy, laenge + 26, kurs + 180);
  // Wind: Pfeil von außen auf die Pistenmitte
  const [wx, wy] = aufKreis(c, cy, 158, windRichtung);
  const [wx2, wy2] = aufKreis(c, cy, 24, windRichtung);
  // Komponenten ab der Pistenmitte, 4,5 Pixel je Knoten (höchstens 100)
  const massstab = (kt) => Math.min(100, kt * 4.5);
  const gegenRichtung = kurs + (k.gegen >= 0 ? 180 : 0);
  const [gx, gy] = aufKreis(c, cy, massstab(Math.abs(k.gegen)), gegenRichtung);
  const seitenRichtung = kurs + (k.vonRechts ? -90 : 90);
  const [sx, sy] = aufKreis(c, cy, massstab(k.seite), seitenRichtung);
  // Beschriftung neben einen Punkt, in Richtung (dx, dy) versetzt – der Text läuft von der Piste weg
  // und bleibt im Bild
  const marke = (x, y, [dx, dy], abstand, inhalt, klasse) => {
    const anker = dx > 0.3 ? 'start' : dx < -0.3 ? 'end' : 'middle';
    const breiteText = inhalt.length * 6.3;
    let tx = x + dx * abstand;
    const links = anker === 'start' ? tx : anker === 'end' ? tx - breiteText : tx - breiteText / 2;
    tx += Math.max(0, 4 - links) - Math.max(0, links + breiteText - 396);
    const ty = Math.min(334, Math.max(12, y + dy * abstand + (anker === 'middle' ? (dy > 0 ? 8 : 0) : 4)));
    return text(r1(tx), r1(ty), inhalt, { groesse: 11, gewicht: 800, klasse, anker });
  };
  const richtung = (grad) => [Math.sin(grad * RAD), -Math.cos(grad * RAD)];
  const [gmx, gmy] = aufKreis(c, cy, massstab(Math.abs(k.gegen)) / 2, gegenRichtung);
  const gegenText = `${k.gegen >= 0 ? 'Gegenwind' : 'Rückenwind'} ${runde(Math.abs(k.gegen))} kt`;
  return svg(400, 340, `
    <rect width="400" height="340" class="g-f-himmel"/>
    <line x1="${r1(ax)}" y1="${r1(ay)}" x2="${r1(ex)}" y2="${r1(ey)}" stroke="#4b5563" stroke-width="34" stroke-linecap="butt"/>
    <line x1="${r1(ax)}" y1="${r1(ay)}" x2="${r1(ex)}" y2="${r1(ey)}" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="12 10"/>
    ${text(r1(nx1), r1(ny1), nummer(piste), { groesse: 14, gewicht: 800, klasse: '', extra: `fill="#fff" dominant-baseline="middle" transform="rotate(${kurs} ${r1(nx1)} ${r1(ny1)})"` })}
    ${text(r1(nx2), r1(ny2), nummer(piste + 18), { groesse: 14, gewicht: 800, klasse: '', extra: `fill="#fff" dominant-baseline="middle" transform="rotate(${kurs + 180} ${r1(nx2)} ${r1(ny2)})"` })}
    ${flugzeug(r1(fx), r1(fy), kurs, 28, 'g-f-text')}
    ${staerke > 0 ? pfeil(wx, wy, wx2, wy2, { farbe: 'orange', breite: 2.2, spitze: 10 }) : ''}
    ${staerke > 0 ? text(10, 24, `Wind ${drei(windRichtung)}° / ${staerke} kt`, { groesse: 13, gewicht: 800, klasse: 'g-f-orange', anker: 'start' }) : ''}
    ${staerke > 0 && Math.abs(k.gegen) >= 0.5 ? pfeil(c, cy, gx, gy, { farbe: k.gegen >= 0 ? 'ok' : 'fehler', breite: 2.4, spitze: 9 }) : ''}
    ${staerke > 0 && Math.abs(k.gegen) >= 0.5 ? marke(gmx, gmy, richtung(seitenRichtung + 180), 24, gegenText, k.gegen >= 0 ? 'g-f-ok' : 'g-f-fehler') : ''}
    ${staerke > 0 && k.seite >= 0.5 ? pfeil(c, cy, sx, sy, { farbe: 'primaer', breite: 2.4, spitze: 9 }) : ''}
    ${staerke > 0 && k.seite >= 0.5 ? marke(c, cy, richtung(seitenRichtung), Math.max(massstab(k.seite) + 8, 26), `Seitenwind ${runde(k.seite)} kt`, 'g-f-primaer') : ''}
    <circle cx="${c}" cy="${cy}" r="3" class="g-f-text"/>
    <g transform="translate(374 30)"><path d="M0-16l6 18-6-5-6 5z" class="g-f-text"/>${text(0, 14, 'N', { groesse: 11, gewicht: 800 })}</g>
  `, `Piste ${zwei(piste)} mit Wind aus ${windRichtung} Grad und seinen Komponenten`);
}

export const interaktiv = {
  baukasten: {
    titel: 'METAR-Baukasten',
    kurz: 'Stelle das Wetter ein – das METAR entsteht live, mit Hinweisen auf die Melderegeln.',
    symbol: 'metar',
    anleitung: "Stelle Wind, Sicht, Wetter, Wolken, Temperatur und Luftdruck ein. Oben entsteht das METAR Gruppe für Gruppe in der richtigen Reihenfolge. Hinweise darunter erklären, wenn etwas den Melderegeln widerspricht. Unter „Klartext anzeigen“ steht, was jede Gruppe bedeutet.",
    probier: ["Mach daraus einen CAVOK-Tag – was musst du dafür einstellen?", "Stelle Nebel (FG) ein und verringere die Sicht, bis der Hinweis verschwindet.", "Füge Böen hinzu – ab welchem Wert erscheinen sie im METAR?"],
    erstellen() {
      const ausgabe = h('div', { class: 'metar metar-anzeige', 'aria-live': 'polite' });
      const klartext = h('ol', { class: 'bau-beschreibung' });
      const hinweise = h('ul', { class: 'regel-hinweise' });
      const e = {};
      const r = (schluessel, optionen) => regler({ ...optionen, beiAenderung: (w) => { e[schluessel] = w; zeichnen(); } });
      const u = (schluessel, optionen) => umschalter({ ...optionen, beiAenderung: (w) => { e[schluessel] = w; zeichnen(); } });
      const elemente = {
        wind: r('wind', { name: 'Wind aus', min: 10, max: 360, schritt: 10, wert: 240, format: (w) => `${drei(w)}°` }),
        staerke: r('staerke', { name: 'Windstärke', min: 0, max: 35, wert: 12, format: (w) => (w ? `${w} kt` : 'Windstille') }),
        boeen: r('boeen', { name: 'Böen', min: 0, max: 50, wert: 0, format: (w) => (w ? `${w} kt` : 'keine') }),
        sicht: u('sicht', { name: 'Sicht', optionen: [[10000, '≥ 10 km'], [8000, '8 km'], [5000, '5 km'], [3000, '3000 m'], [1500, '1500 m'], [800, '800 m'], [300, '300 m']], wert: 10000 }),
        wetter: u('wetter', { name: 'Wetter', optionen: [['', 'keins'], ['-RA', '-RA'], ['RA', 'RA'], ['-SHRA', '-SHRA'], ['TSRA', 'TSRA'], ['-DZ', '-DZ'], ['BR', 'BR'], ['FG', 'FG'], ['-SN', '-SN']], wert: '' }),
        schicht1: u('schicht1', { name: '1. Wolkenschicht', optionen: [['', 'keine'], ['FEW', 'FEW'], ['SCT', 'SCT'], ['BKN', 'BKN'], ['OVC', 'OVC']], wert: 'FEW' }),
        hoehe1: r('hoehe1', { name: 'Höhe 1. Schicht', min: 100, max: 8000, schritt: 100, wert: 3500, format: (w) => `${w} ft` }),
        art1: u('art1', { name: 'Wolkenart 1. Schicht', optionen: [['', 'normal'], ['CB', 'CB'], ['TCU', 'TCU']], wert: '' }),
        schicht2: u('schicht2', { name: '2. Wolkenschicht', optionen: [['', 'keine'], ['FEW', 'FEW'], ['SCT', 'SCT'], ['BKN', 'BKN'], ['OVC', 'OVC']], wert: '' }),
        hoehe2: r('hoehe2', { name: 'Höhe 2. Schicht', min: 100, max: 9000, schritt: 100, wert: 6000, format: (w) => `${w} ft` }),
        t: r('t', { name: 'Temperatur', min: -15, max: 35, wert: 18, format: (w) => `${w} °C` }),
        td: r('td', { name: 'Taupunkt', min: -20, max: 30, wert: 9, format: (w) => `${w} °C` }),
        qnh: r('qnh', { name: 'QNH', min: 975, max: 1045, wert: 1013, format: (w) => `${w} hPa` }),
        trend: u('trend', { name: 'Trend', optionen: [['NOSIG', 'NOSIG'], ['BECMG BKN015', 'BECMG BKN015'], ['TEMPO 3000 SHRA', 'TEMPO 3000 SHRA']], wert: 'NOSIG' }),
      };
      for (const [k, el] of Object.entries(elemente)) e[k] = el.wert;

      function zeichnen() {
        const { text: metar, hinweise: liste } = metarBauen(e);
        const gruppen = zerlegen(metar);
        ausgabe.replaceChildren(...gruppen.map((g) => h('span', { class: 'gruppe', 'data-typ': g.typ, 'data-trend': g.imTrend }, g.text)));
        klartext.replaceChildren(...gruppen.slice(3).map((g) => h('li', { class: g.imTrend ? 'im-trend' : '' }, h('code', {}, g.text), ' – ', g.bedeutung)));
        hinweise.replaceChildren(...liste.map((t) => h('li', {}, t)));
        hinweise.hidden = liste.length === 0;
      }
      zeichnen();
      const gruppe = (titel, ...kinder) => h('fieldset', { class: 'baugruppe' }, h('legend', {}, titel), bedienfeld(...kinder));
      return h('div', {},
        h('div', { class: 'baukasten-ausgabe' }, ausgabe),
        hinweise,
        gruppe('Wind', elemente.wind.el, elemente.staerke.el, h('div', { class: 'breit' }, elemente.boeen.el)),
        gruppe('Sicht und Wetter', h('div', { class: 'breit' }, elemente.sicht.el), h('div', { class: 'breit' }, elemente.wetter.el)),
        gruppe('Wolken', h('div', { class: 'breit' }, elemente.schicht1.el), elemente.hoehe1.el, elemente.art1.el, h('div', { class: 'breit' }, elemente.schicht2.el), elemente.hoehe2.el),
        gruppe('Temperatur, Druck und Trend', elemente.t.el, elemente.td.el, elemente.qnh.el, elemente.trend.el),
        h('details', { class: 'aufloesung' }, h('summary', {}, 'Klartext anzeigen'), klartext),
        h('p', { class: 'interaktiv-erklaerung' }, 'Der Flugplatz XMUS ist frei erfunden. Das METAR oben aktualisiert sich bei jeder Änderung.'));
    },
  },

  seitenwind: {
    titel: 'Seitenwind auf der Piste',
    kurz: 'Wähle Piste und Wind – Gegen- und Seitenwindkomponente werden berechnet und gezeichnet.',
    symbol: 'metar',
    anleitung: "Wähle die Piste und stelle den Wind ein. Die Grafik zeigt die Piste von oben, den Wind und seine Zerlegung in Gegen- bzw. Rückenwind und Seitenwind.",
    legende: [["orange", "Wind"], ["ok", "Gegenwindanteil"], ["fehler", "Rückenwindanteil"], ["primaer", "Seitenwindanteil"]],
    probier: ["Bei welcher Windrichtung ist der Seitenwind auf Piste 25 am größten?", "Wind aus 280° mit 16 kt: Passt das Ergebnis zur Faustregel (30° → ½)?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const piste = regler({ name: 'Piste', min: 1, max: 36, wert: 25, format: (w) => zwei(w), beiAenderung: zeichnen });
      const richtung = regler({ name: 'Wind aus', min: 10, max: 360, schritt: 10, wert: 280, format: (w) => `${drei(w)}°`, beiAenderung: zeichnen });
      const staerke = regler({ name: 'Windstärke', min: 0, max: 35, wert: 16, format: (w) => `${w} kt`, beiAenderung: zeichnen });
      const boeen = regler({ name: 'Böen', min: 0, max: 50, wert: 26, format: (w) => (w ? `${w} kt` : 'keine'), beiAenderung: zeichnen });
      function zeichnen() {
        const k = windKomponenten(richtung.wert, staerke.wert, zwei(piste.wert));
        const b = windKomponenten(richtung.wert, Math.max(boeen.wert, staerke.wert), zwei(piste.wert));
        bild.zeichnen(pistenBild(piste.wert, richtung.wert, staerke.wert, k));
        werte.setzen([
          { titel: k.gegen >= 0 ? 'Gegenwind' : 'Rückenwind', wert: Math.round(Math.abs(k.gegen)), einheit: 'kt', art: k.gegen < -0.5 ? 'schlecht' : 'gut' },
          { titel: `Seitenwind ${k.seite < 0.5 ? '' : k.vonRechts ? 'von rechts' : 'von links'}`, wert: Math.round(k.seite), einheit: 'kt' },
          boeen.wert > staerke.wert && { titel: 'Seitenwind in Böen', wert: Math.round(b.seite), einheit: 'kt', art: b.seite > 15 ? 'schlecht' : '' },
        ]);
        if (k.gegen < -0.5) hinweis.setzen(`Rückenwind auf Piste ${zwei(piste.wert)} – die Gegenrichtung ${zwei(((piste.wert + 17) % 36) + 1)} ist besser.`, 'fehler');
        else if (Math.max(k.seite, b.seite) > 15) hinweis.setzen('Mehr als 15 kt Seitenwind – mehr als die nachgewiesenen 15 kt des Übungsflugzeugs MF-4.', 'warnung');
        else hinweis.setzen('');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(piste.el, richtung.el, staerke.el, boeen.el), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Die Missweisung ist hier vernachlässigt. Faustregel für den Seitenwind: Winkel 30° → ½, 45° → 0,7, 60° → 0,9 der Windstärke.'));
    },
  },
};
