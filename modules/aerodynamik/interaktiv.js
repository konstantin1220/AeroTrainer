// Interaktive Darstellungen für „Aerodynamik“.
import { h } from '../../js/ui.js';
import { regler, wertanzeige, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { svg, text, linie, pfeil } from '../../js/grafik.js';

const RAD = Math.PI / 180;
const r1 = (n) => n.toFixed(1);
const komma = (n, s = 0) => Number(n.toFixed(s)).toLocaleString('de-DE', { useGrouping: false });
const PROFIL = 'M0 0C0-14 30-34 90-36S240-18 290 0C220 6 120 10 50 10S0 6 0 0z';
const KRITISCH = 16;

/** Vereinfachte Auftriebskurve eines gewölbten Profils (Beiwert über Anstellwinkel). */
export function auftriebsbeiwert(alpha) {
  const punkte = [[-4, -0.2], [0, 0.2], [4, 0.6], [8, 1.0], [12, 1.32], [15, 1.45], [16, 1.47], [17, 1.42], [19, 1.15], [22, 0.95]];
  if (alpha <= punkte[0][0]) return punkte[0][1];
  for (let i = 1; i < punkte.length; i++) {
    const [a1, c1] = punkte[i - 1];
    const [a2, c2] = punkte[i];
    if (alpha <= a2) return c1 + ((alpha - a1) / (a2 - a1)) * (c2 - c1);
  }
  return punkte.at(-1)[1];
}

function profilBild(alpha) {
  const abriss = alpha > KRITISCH;
  const lx = 70, ly = 150;
  // Stromlinien: unten anliegend, oben anliegend oder abgerissen (Wirbel hinter dem Profil)
  const anstieg = Math.tan(alpha * RAD) * 290;
  const oben = abriss
    ? `<path d="M10 90H70C110 ${92 - anstieg * 0.4} 150 ${70 - anstieg * 0.3} 190 ${68 - anstieg * 0.2}" class="g-s-primaer" stroke-width="1.4"/>
       ${[0, 1, 2].map((i) => `<path d="M${200 + i * 52} ${112 + i * 10}c-14-16 14-30 26-12s-6 30-20 18" class="g-s-fehler" stroke-width="1.3"/>`).join('')}`
    : `<path d="M10 90H70C130 ${90 - anstieg * 0.25} 250 ${100 - anstieg * 0.05} 390 ${112 + anstieg * 0.15}" class="g-s-primaer" stroke-width="1.4"/>
       <path d="M10 115H60C130 ${114 - anstieg * 0.18} 260 ${128 + anstieg * 0.05} 390 ${138 + anstieg * 0.2}" class="g-s-primaer" stroke-width="1.4"/>`;
  const unten = `<path d="M10 200H60C140 ${200 + anstieg * 0.1} 260 ${206 + anstieg * 0.12} 390 ${206 + anstieg * 0.2}" class="g-s-primaer" stroke-width="1.4"/>`;
  return svg(400, 250, `
    <rect width="400" height="250" class="g-f-himmel"/>
    ${oben}${unten}
    <g transform="translate(${lx} ${ly}) rotate(${alpha})">
      <path d="${PROFIL}" class="${abriss ? 'g-f-fehler' : 'g-f-mf'}" opacity=".85"/>
      ${linie(0, 0, 290, 0, 'g-s-flaeche', 0.8, 'stroke-dasharray="5 4"')}
    </g>
    ${linie(lx, ly, lx + 120, ly, 'g-s-leise', 1)}
    ${text(392, 30, `α = ${alpha}°`, { groesse: 18, gewicht: 800, klasse: abriss ? 'g-f-fehler' : 'g-f-text', anker: 'end' })}
    ${pfeil(14, 236, 60, 236, { farbe: 'leise', breite: 1.4, spitze: 7 })}
    ${text(66, 236, 'Anströmung', { groesse: 11, klasse: 'g-f-leise', anker: 'start' })}
  `, abriss ? 'Profil mit abgerissener Strömung auf der Oberseite' : 'Profil mit anliegender Strömung');
}

function kurvenBild(querlage, n) {
  const cx = 200, cy = 170, g = 80;
  const laenge = Math.min(g * n, 200);
  const spitzeX = cx - Math.sin(querlage * RAD) * laenge;
  const spitzeY = cy - Math.cos(querlage * RAD) * laenge;
  return svg(400, 300, `
    <rect width="400" height="300" class="g-f-himmel"/>
    <g transform="rotate(${-querlage} ${cx} ${cy})">
      <rect x="${cx - 140}" y="${cy - 5}" width="280" height="10" rx="5" class="g-f-mf-hell g-s-mf" stroke-width="1.3"/>
      <circle cx="${cx}" cy="${cy}" r="17" class="g-f-flaeche g-s-text" stroke-width="1.3"/>
      <path d="M${cx - 4} ${cy - 17}l4-24 4 24" class="g-f-rand g-s-text" stroke-width="1"/>
    </g>
    ${querlage > 0 ? linie(r1(spitzeX), r1(spitzeY), cx, r1(spitzeY), 'g-s-primaer', 1.4, 'stroke-dasharray="4 4"') + linie(cx, cy, cx, r1(spitzeY), 'g-s-ok', 1.4, 'stroke-dasharray="4 4"') : ''}
    ${pfeil(cx, cy, spitzeX, spitzeY, { farbe: 'ok', breite: 2.4, spitze: 10.1 })}
    ${querlage > 0 ? (() => {
      // Querlage = Winkel zwischen Tragfläche und Waagerechter, rechts am hochgehenden Flügel
      const rb = 112;
      const [ex, ey] = [cx + Math.cos(querlage * RAD) * rb, cy - Math.sin(querlage * RAD) * rb];
      const [tx, ty] = [cx + Math.cos(querlage * RAD / 2) * 156, cy - Math.sin(querlage * RAD / 2) * 156 + 4];
      return `${linie(cx + 20, cy, cx + 168, cy, 'g-s-leise', 1, 'stroke-dasharray="4 4"')}${text(cx + 168, cy + 15, 'waagerecht', { groesse: 10, klasse: 'g-f-leise', anker: 'end' })}<path d="M${cx + rb} ${cy}A${rb} ${rb} 0 0 0 ${r1(ex)} ${r1(ey)}" class="g-s-text" stroke-width="1.2"/>${text(r1(tx), r1(ty), `${querlage}°`, { groesse: 12, gewicht: 800, anker: 'start' })}`;
    })() : ''}
    ${pfeil(cx, cy + 4, cx, cy + 4 + g, { farbe: 'fehler', breite: 2.4, spitze: 8.6 })}
    ${text(cx + 12, cy + 52, 'Gewicht', { groesse: 12, gewicht: 700, klasse: 'g-f-fehler', anker: 'start' })}
    ${text(r1(Math.max(52, spitzeX)), r1(spitzeY - 14), `Auftrieb ×${komma(n, 2)}`, { groesse: 12, gewicht: 700, klasse: 'g-f-ok' })}
  `, `Flugzeug von vorn mit ${querlage} Grad Querlage; der Auftrieb ist ${n.toFixed(2)}-mal so groß wie das Gewicht`);
}

function gleitBild(hoehe, strecke, ohneWind) {
  const l = 30, r = 380, o = 40, u = 210;
  const sMax = Math.max(strecke, ohneWind, 1);
  const px = (km) => l + (km / sMax) * (r - l);
  return svg(400, 250, `
    <rect width="400" height="250" class="g-f-himmel"/>
    <rect x="0" y="${u}" width="400" height="40" class="g-f-boden"/>
    ${linie(l, o, r1(px(ohneWind)), u, 'g-s-leise', 1.4, 'stroke-dasharray="6 5"')}
    ${linie(l, o, r1(px(strecke)), u, 'g-s-primaer', 2.4)}
    ${linie(l, o, l, u, 'g-s-text', 1)}
    <circle cx="${l}" cy="${o}" r="6" class="g-f-primaer"/>
    <circle cx="${r1(px(strecke))}" cy="${u}" r="6" class="g-f-orange"/>
    ${text(l + 8, o - 4, `${komma(hoehe)} m`, { groesse: 12, gewicht: 700, anker: 'start' })}
    ${text(r1(px(strecke)), u + 18, `${komma(strecke, 1)} km`, { groesse: 13, gewicht: 800, klasse: 'g-f-orange' })}
    ${Math.abs(strecke - ohneWind) > 0.05 ? text(r1(Math.min(px(ohneWind), 392)), u - 12, `ohne Wind ${komma(ohneWind, 1)} km`, { groesse: 10, klasse: 'g-f-leise', anker: 'end' }) : ''}
    ${text(200, 246, 'Höhe stark überhöht dargestellt', { groesse: 10, klasse: 'g-f-leise' })}
  `, 'Gleitpfad mit und ohne Wind');
}

export const interaktiv = {
  anstellwinkel: {
    titel: 'Anstellwinkel und Strömungsabriss',
    kurz: 'Vergrößere den Anstellwinkel – bis die Strömung abreißt.',
    symbol: 'warnung',
    anleitung: "Vergrößere mit dem oberen Regler den Anstellwinkel. Die blauen Linien zeigen die Luftströmung; ab dem kritischen Anstellwinkel löst sie sich oben vom Flügel ab (rote Wirbel).",
    legende: [["primaer", "Luftströmung"], ["mf", "Flügelprofil"], ["fehler", "abgerissene Strömung"]],
    probier: ["Bei welchem Anstellwinkel reißt die Strömung ab?", "Halbiere die Fahrt: Wie viel Auftrieb bleibt übrig?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const alpha = regler({ name: 'Anstellwinkel α', min: -4, max: 22, wert: 6, format: (w) => `${w}°`, beiAenderung: zeichnen });
      const fahrt = regler({ name: 'Fahrt', min: 40, max: 140, schritt: 5, wert: 90, format: (w) => `${w} kt`, beiAenderung: zeichnen });
      function zeichnen() {
        const ca = auftriebsbeiwert(alpha.wert);
        const relativ = (ca * fahrt.wert ** 2) / (0.6 * 90 ** 2);
        bild.zeichnen(profilBild(alpha.wert));
        werte.setzen([
          { titel: 'Auftriebsbeiwert cA', wert: komma(ca, 2) },
          { titel: 'Auftrieb', wert: `${Math.round(relativ * 100)} %`, hinweis: 'bezogen auf α = 4° bei 90 kt', art: alpha.wert > KRITISCH ? 'schlecht' : '' },
        ]);
        if (alpha.wert > KRITISCH) hinweis.setzen('Strömungsabriss! Über dem kritischen Anstellwinkel bricht der Auftrieb ein – Anstellwinkel verringern.', 'fehler');
        else if (alpha.wert >= 13) hinweis.setzen('Kurz vor dem kritischen Anstellwinkel: Die Überziehwarnung würde jetzt ansprechen.', 'warnung');
        else hinweis.setzen('Die Strömung liegt an. Mehr Anstellwinkel bringt mehr Auftrieb – aber auch mehr Widerstand.', 'ok');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(alpha.el, fahrt.el), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Vereinfachte Werte für ein typisches gewölbtes Profil (kritischer Anstellwinkel hier etwa 16°). Der Auftrieb wächst mit cA und dem Quadrat der Fahrt.'));
    },
  },

  kurvenflug: {
    titel: 'Kurvenflug: Lastvielfaches und Überziehgeschwindigkeit',
    kurz: 'Mehr Querlage – mehr Last, höhere Überziehgeschwindigkeit, engere Kurve.',
    symbol: 'flugzeug',
    anleitung: "Stelle die Querlage ein. Das Flugzeug (von vorn gesehen) neigt sich, der grüne Pfeil zeigt den nötigen Auftrieb. Darunter stehen Lastvielfaches, Überziehgeschwindigkeit und Kurvenradius.",
    legende: [["ok", "Auftrieb (und sein senkrechter Anteil)"], ["fehler", "Gewicht"], ["primaer", "Anteil, der in die Kurve zieht"]],
    probier: ["Wie groß ist das Lastvielfache bei 60° Querlage?", "Bei 50 kt Überziehgeschwindigkeit und 70 kt Fahrt: Ab welcher Querlage wird es knapp?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const querlage = regler({ name: 'Querlage', min: 0, max: 75, schritt: 5, wert: 30, format: (w) => `${w}°`, beiAenderung: zeichnen });
      const vs = regler({ name: 'Überziehgeschwindigkeit geradeaus', min: 40, max: 70, wert: 50, format: (w) => `${w} kt`, beiAenderung: zeichnen });
      const tas = regler({ name: 'Fluggeschwindigkeit', min: 60, max: 140, schritt: 5, wert: 90, format: (w) => `${w} kt`, beiAenderung: zeichnen });
      function zeichnen() {
        const n = 1 / Math.cos(querlage.wert * RAD);
        const vsKurve = vs.wert * Math.sqrt(n);
        const v = tas.wert * 0.5144;
        const radius = querlage.wert > 0 ? (v * v) / (9.81 * Math.tan(querlage.wert * RAD)) : null;
        bild.zeichnen(kurvenBild(querlage.wert, n));
        werte.setzen([
          { titel: 'Lastvielfaches', wert: komma(n, 2), einheit: 'g' },
          { titel: 'Überziehgeschw. in der Kurve', wert: Math.round(vsKurve), einheit: 'kt', art: vsKurve >= tas.wert ? 'schlecht' : vsKurve > tas.wert * 0.85 ? 'warnung' : '' },
          { titel: 'Kurvenradius', wert: radius ? komma(Math.round(radius / 10) * 10) : '–', einheit: radius ? 'm' : '' },
          { titel: 'Zeit für 360°', wert: radius ? Math.round((2 * Math.PI * radius) / v) : '–', einheit: radius ? 's' : '' },
        ]);
        if (vsKurve >= tas.wert) hinweis.setzen('Zu langsam für diese Querlage – das Flugzeug würde überziehen!', 'fehler');
        else if (vsKurve > tas.wert * 0.85) hinweis.setzen('Wenig Reserve zur Überziehgeschwindigkeit.', 'warnung');
        else hinweis.setzen('');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, querlage.el), vs.el, tas.el), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Gestrichelt: Der senkrechte Anteil des Auftriebs trägt das Gewicht, der waagerechte zieht das Flugzeug in die Kurve. Je steiler die Kurve, desto größer muss der Auftrieb sein.'));
    },
  },

  gleitflug: {
    titel: 'Wie weit gleite ich?',
    kurz: 'Gleitzahl, Höhe und Wind bestimmen, wie weit du ohne Motor kommst.',
    symbol: 'ziel',
    anleitung: "Stelle Gleitzahl, Höhe, Fahrt und Wind ein. Die blaue Linie zeigt deinen Gleitweg bis zum Boden, die gestrichelte den Weg ohne Wind.",
    legende: [["primaer", "Gleitweg mit Wind"], ["leise", "Gleitweg ohne Wind"]],
    probier: ["Motorflugzeug (1 : 9) aus 600 m: Wie weit kommst du ohne Wind?", "Wie stark verkürzen 30 km/h Gegenwind die Strecke?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const gleitzahl = regler({ name: 'Gleitzahl 1 :', min: 5, max: 50, wert: 9, format: (w) => `1 : ${w}`, beiAenderung: zeichnen });
      const hoehe = regler({ name: 'Höhe über Grund', min: 100, max: 2000, schritt: 50, wert: 600, format: (w) => `${komma(w)} m`, beiAenderung: zeichnen });
      const fahrt = regler({ name: 'Fahrt (bestes Gleiten)', min: 60, max: 200, schritt: 5, wert: 120, format: (w) => `${w} km/h`, beiAenderung: zeichnen });
      const wind = regler({ name: 'Wind', min: -50, max: 50, schritt: 5, wert: -20, format: (w) => (w === 0 ? 'Windstille' : `${Math.abs(w)} km/h ${w < 0 ? 'Gegenwind' : 'Rückenwind'}`), beiAenderung: zeichnen });
      function zeichnen() {
        const ohneWind = (hoehe.wert * gleitzahl.wert) / 1000;
        const faktor = Math.max(0, (fahrt.wert + wind.wert) / fahrt.wert);
        const strecke = ohneWind * faktor;
        const sinkzeit = (ohneWind * 1000) / (fahrt.wert / 3.6) / 60;
        bild.zeichnen(gleitBild(hoehe.wert, strecke, ohneWind));
        werte.setzen([
          { titel: 'Gleitstrecke über Grund', wert: komma(strecke, 1), einheit: 'km', art: 'gut' },
          { titel: 'ohne Wind', wert: komma(ohneWind, 1), einheit: 'km' },
          { titel: 'Zeit bis zum Boden', wert: komma(sinkzeit, 1), einheit: 'min' },
        ]);
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(gleitzahl.el, hoehe.el, fahrt.el, h('div', { class: 'breit' }, wind.el)), werte.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Motorflugzeug mit stehendem Propeller etwa 1 : 8 bis 1 : 10, Segelflugzeug 1 : 30 bis über 1 : 50. Gegenwind verkürzt die Strecke über Grund, die Zeit in der Luft bleibt gleich. Plane immer mit Reserve!'));
    },
  },
};
