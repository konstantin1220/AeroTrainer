// Abbildungen für das Modul „Luftraum & Regeln“ – selbst gezeichnet, schematisch.
// Format: etwa 400 Einheiten breit, damit die Schrift auch auf dem Handy lesbar bleibt.
import { svg, text, linie, pfeil, flugzeug, wolke } from '../../js/grafik.js';

function ausweichBild(inhalt, beschreibung) {
  return svg(400, 200, `<rect width="400" height="200" rx="12" class="g-f-himmel"/>${inhalt}`, beschreibung);
}

export const abbildungen = {
  luftraumschnitt() {
    const gelaende = 'M0 262C60 259 110 251 160 253S240 266 280 263 360 248 400 252';
    return svg(400, 320, `
      <rect width="400" height="320" class="g-f-himmel"/>
      <rect width="400" height="60" class="g-f-mf-hell"/>
      ${linie(0, 60, 400, 60, 'g-s-leise', 1.5, 'stroke-dasharray="7 6"')}
      ${text(392, 48, 'FL 100', { anker: 'end', groesse: 12, klasse: 'g-f-leise', gewicht: 600 })}
      ${text(90, 30, 'Luftraum C', { groesse: 17, gewicht: 700 })}
      ${text(80, 112, 'Luftraum E', { groesse: 17, gewicht: 700 })}
      ${text(80, 132, 'kontrolliert', { groesse: 13, klasse: 'g-f-leise' })}
      <path d="M200 120h190v45H200z" class="g-f-mf-hell g-s-mf" stroke-width="2"/>
      ${text(295, 142, 'Luftraum D', { groesse: 15, gewicht: 700 })}
      <path d="M250 165h90v97h-90z" class="g-f-mf-hell g-s-mf" stroke-width="2"/>
      ${text(295, 190, 'CTR', { groesse: 17, gewicht: 800 })}
      ${text(295, 210, 'Luftraum D', { groesse: 12, klasse: 'g-f-leise' })}
      <path d="M0 202C60 199 110 191 160 193S230 204 250 203M340 192C360 189 380 190 400 191" class="g-s-text" stroke-width="2" stroke-dasharray="8 6"/>
      ${text(8, 184, 'Grenze z. B. 2500 ft GND', { anker: 'start', groesse: 11, klasse: 'g-f-leise' })}
      ${text(80, 220, 'Luftraum G', { groesse: 16, gewicht: 700 })}
      ${text(80, 239, 'unkontrolliert', { groesse: 12, klasse: 'g-f-leise' })}
      ${flugzeug(185, 226, 70, 30)}
      <path d="${gelaende}L400 320H0z" class="g-f-boden"/>
      <path d="${gelaende}" class="g-s-leise" stroke-width="1.5"/>
      <rect x="272" y="258" width="46" height="6" rx="2" class="g-f-text"/>
      ${text(295, 282, 'Flughafen', { groesse: 12, gewicht: 600 })}
      ${text(200, 306, 'Beispiel – vereinfacht, nicht maßstäblich', { groesse: 11, klasse: 'g-f-leise' })}
    `, 'Schnitt durch einen beispielhaften Luftraumaufbau mit den Klassen C, D, E und G sowie einer Kontrollzone');
  },

  wolkenabstand() {
    return svg(400, 240, `
      <rect x="50" y="40" width="240" height="160" rx="16" class="g-s-primaer" stroke-width="2" stroke-dasharray="8 7"/>
      ${wolke(170, 120, 120)}
      ${pfeil(232, 128, 288, 128, { farbe: 'primaer' })}
      ${text(256, 112, '1500 m', { groesse: 15, gewicht: 700, klasse: 'g-f-primaer' })}
      ${pfeil(170, 98, 170, 42, { farbe: 'primaer' })}
      ${text(180, 70, '1000 ft', { groesse: 15, gewicht: 700, klasse: 'g-f-primaer', anker: 'start' })}
      ${flugzeug(350, 128, 270, 40, 'g-f-ok')}
    `, 'Mindestabstand zu Wolken: 1500 Meter waagerecht und 1000 Fuß senkrecht');
  },

  meldepunkte() {
    return svg(400, 160, `
      <path d="M100 30l28 50H72z" class="g-f-text"/>
      ${text(100, 106, 'Pflicht-', { groesse: 15, gewicht: 600 })}
      ${text(100, 126, 'meldepunkt', { groesse: 15, gewicht: 600 })}
      <path d="M300 30l28 50h-56z" class="g-s-text" stroke-width="3.5" stroke-linejoin="round"/>
      ${text(300, 106, 'Meldepunkt', { groesse: 15, gewicht: 600 })}
      ${text(300, 126, 'auf Anforderung', { groesse: 15, gewicht: 600 })}
    `, 'Kartensymbole: ausgefülltes Dreieck für Pflichtmeldepunkt, leeres Dreieck für Meldepunkt auf Anforderung');
  },

  'dreieck-voll'() {
    return svg(200, 110, '<path d="M100 18l32 58H68z" class="g-f-text"/>', 'Kartensymbol: ausgefülltes Dreieck');
  },

  halbkreis() {
    return svg(400, 380, `
      <path d="M200 50a140 140 0 0 1 0 280z" class="g-f-mf-hell"/>
      <path d="M200 50a140 140 0 0 0 0 280z" class="g-f-flaeche"/>
      <circle cx="200" cy="190" r="140" class="g-s-text" stroke-width="2"/>
      ${linie(200, 42, 200, 338, 'g-s-text', 2)}
      ${text(200, 26, 'N 000°', { groesse: 15, gewicht: 700 })}
      ${text(200, 356, 'S 180°', { groesse: 15, gewicht: 700 })}
      ${text(352, 190, 'O', { groesse: 15, gewicht: 700, anker: 'start' })}
      ${text(48, 190, 'W', { groesse: 15, gewicht: 700, anker: 'end' })}
      ${text(266, 132, '000°–179°', { groesse: 16, gewicht: 700 })}
      ${text(266, 164, 'ungerade', { groesse: 15 })}
      ${text(266, 184, 'Tausender', { groesse: 15 })}
      ${text(266, 204, '+ 500 ft', { groesse: 15, gewicht: 700 })}
      ${text(266, 238, '3500 ft', { groesse: 13, klasse: 'g-f-leise' })}
      ${text(266, 256, 'FL 55, FL 75', { groesse: 13, klasse: 'g-f-leise' })}
      ${text(134, 132, '180°–359°', { groesse: 16, gewicht: 700 })}
      ${text(134, 164, 'gerade', { groesse: 15 })}
      ${text(134, 184, 'Tausender', { groesse: 15 })}
      ${text(134, 204, '+ 500 ft', { groesse: 15, gewicht: 700 })}
      ${text(134, 238, '4500 ft', { groesse: 13, klasse: 'g-f-leise' })}
      ${text(134, 256, 'FL 65, FL 85', { groesse: 13, klasse: 'g-f-leise' })}
    `, 'Halbkreisflugregel: Kurse von 000 bis 179 Grad ungerade Tausender plus 500 Fuß, Kurse von 180 bis 359 Grad gerade Tausender plus 500 Fuß');
  },

  'ausweichen-gegenflug'() {
    return ausweichBild(`
      ${flugzeug(80, 100, 90, 48)}
      ${flugzeug(320, 100, 270, 48)}
      ${pfeil(108, 114, 152, 158, { farbe: 'orange', breite: 3 })}
      ${pfeil(292, 86, 248, 42, { farbe: 'orange', breite: 3 })}
      ${text(200, 184, 'Gegenflug: beide weichen nach rechts aus', { groesse: 14, gewicht: 600 })}
    `, 'Gegenflug: Beide Flugzeuge weichen nach rechts aus');
  },

  'ausweichen-kreuzen'() {
    return ausweichBild(`
      ${flugzeug(140, 128, 0, 48, 'g-f-orange')}
      ${flugzeug(300, 62, 270, 48)}
      ${pfeil(156, 100, 196, 70, { farbe: 'orange', breite: 3 })}
      ${text(140, 164, 'weicht aus', { groesse: 13, gewicht: 700, klasse: 'g-f-orange' })}
      ${text(300, 100, 'Vorflug', { groesse: 13, gewicht: 700, klasse: 'g-f-primaer' })}
      ${text(200, 188, 'Wer den anderen rechts sieht, weicht aus', { groesse: 14, gewicht: 600 })}
    `, 'Kreuzende Kurse: Das Flugzeug, das das andere rechts von sich sieht, weicht aus');
  },

  'ausweichen-ueberholen'() {
    return ausweichBild(`
      ${flugzeug(200, 52, 0, 48)}
      ${flugzeug(200, 140, 0, 48, 'g-f-orange')}
      ${pfeil(220, 116, 262, 62, { farbe: 'orange', breite: 3 })}
      ${text(110, 52, 'wird überholt', { groesse: 13, gewicht: 700, klasse: 'g-f-primaer' })}
      ${text(110, 140, 'überholt', { groesse: 13, gewicht: 700, klasse: 'g-f-orange' })}
      ${text(200, 188, 'Der Überholende weicht nach rechts aus', { groesse: 14, gewicht: 600 })}
    `, 'Überholen: Der Überholende weicht nach rechts aus');
  },
};
