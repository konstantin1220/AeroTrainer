// Abbildungen für „Technik“ – selbst gezeichnet, schematisch (nach den Beschreibungen in PHAK Kap. 7 und 8).
import { svg, text, linie, pfeil } from '../../js/grafik.js';

const r1 = (n) => Math.round(n * 10) / 10;
const zeiger = (x1, y1, x2, y2) => linie(x1, y1, x2, y2, 'g-s-leise', 1);

/** Seitenansicht eines Hochdeckers mit den wichtigsten Bauteilen. */
export function bauteile() {
  return svg(400, 250, `
    <rect width="400" height="250" class="g-f-himmel"/>
    <path d="M58 132c0-14 10-22 28-24l210-6 54-28h12l-6 34-30 18-238 12c-18 0-30-2-30-6z" class="g-f-weiss g-s-text" stroke-width="1.6"/>
    <path d="M108 106l4-14h120l4 14z" class="g-f-mf-hell g-s-text" stroke-width="1.4"/>
    <path d="M310 82l42-4 -4 26-36 4z" class="g-f-mf-hell g-s-text" stroke-width="1.2"/>
    <path d="M352 78l12-2-4 26-12 2z" class="g-f-orange" opacity=".55"/>
    <path d="M296 110h62l-4 8h-58z" class="g-f-mf-hell g-s-text" stroke-width="1.2"/>
    <path d="M354 110h16l-3 8h-17z" class="g-f-orange" opacity=".55"/>
    <rect x="366" y="111" width="6" height="5" class="g-f-fehler"/>
    ${linie(150, 130, 136, 106, 'g-s-text', 1.4)}
    <rect x="44" y="104" width="6" height="56" rx="2" class="g-f-text"/>
    <circle cx="66" cy="168" r="9" class="g-f-text"/>${linie(70, 138, 66, 160, 'g-s-text', 2)}
    <circle cx="170" cy="168" r="11" class="g-f-text"/>${linie(162, 140, 170, 158, 'g-s-text', 2)}
    ${text(170, 22, 'Tragfläche (Hochdecker)', { groesse: 11, gewicht: 700 })}${zeiger(170, 30, 170, 92)}
    ${text(330, 40, 'Seitenflosse', { groesse: 11, gewicht: 700, anker: 'end' })}${zeiger(312, 46, 326, 84)}
    ${text(390, 58, 'Seitenruder', { groesse: 11, gewicht: 700, klasse: 'g-f-orange', anker: 'end' })}${zeiger(370, 64, 360, 82)}
    ${text(300, 150, 'Höhenflosse', { groesse: 11, gewicht: 700, anker: 'end' })}${zeiger(292, 142, 312, 117)}
    ${text(392, 158, 'Höhenruder', { groesse: 11, gewicht: 700, klasse: 'g-f-orange', anker: 'end' })}${zeiger(360, 150, 360, 119)}
    ${text(392, 178, 'Trimmklappe', { groesse: 10.5, gewicht: 700, klasse: 'g-f-fehler', anker: 'end' })}${zeiger(374, 170, 369, 117)}
    ${text(230, 122, 'Rumpf', { groesse: 11, gewicht: 700 })}
    ${text(30, 92, 'Propeller', { groesse: 11, gewicht: 700, anker: 'start' })}
    ${text(66, 196, 'Bugrad', { groesse: 11, gewicht: 700 })}
    ${text(170, 196, 'Hauptfahrwerk', { groesse: 11, gewicht: 700 })}
    ${text(200, 228, 'Querruder und Landeklappen sitzen an der Hinterkante der Tragfläche.', { groesse: 10.5, klasse: 'g-f-leise' })}
  `, 'Seitenansicht eines Hochdeckers: Propeller, Tragfläche, Rumpf, Bugrad, Hauptfahrwerk, Seitenflosse mit Seitenruder, Höhenflosse mit Höhenruder und Trimmklappe');
}

/** Doppelzündung: zwei Magnete, je eine Kerze pro Zylinder. */
export function zuendung() {
  const zylinder = [70, 150, 230, 310];
  return svg(400, 230, `
    <rect width="400" height="230" class="g-f-flaeche"/>
    ${zylinder.map((x, i) => `<rect x="${x - 28}" y="30" width="56" height="62" rx="6" class="g-f-weiss g-s-text" stroke-width="1.4"/>${text(x, 22, `Zylinder ${i + 1}`, { groesse: 10.5, gewicht: 700 })}<circle cx="${x - 12}" cy="48" r="5" class="g-f-orange"/><circle cx="${x + 12}" cy="76" r="5" class="g-f-primaer"/>`).join('')}
    <rect x="40" y="150" width="120" height="40" rx="8" class="g-f-orange" opacity=".22"/>
    <rect x="40" y="150" width="120" height="40" rx="8" class="g-s-orange" stroke-width="1.6" fill="none"/>
    ${text(100, 170, 'Magnet links', { groesse: 12, gewicht: 800, klasse: 'g-f-orange' })}
    <rect x="240" y="150" width="120" height="40" rx="8" class="g-f-primaer" opacity=".18"/>
    <rect x="240" y="150" width="120" height="40" rx="8" class="g-s-primaer" stroke-width="1.6" fill="none"/>
    ${text(300, 170, 'Magnet rechts', { groesse: 12, gewicht: 800, klasse: 'g-f-primaer' })}
    ${zylinder.map((x) => `<path d="M100 150C100 120 ${x - 12} 120 ${x - 12} 53" class="g-s-orange" stroke-width="1.4" fill="none"/>`).join('')}
    ${zylinder.map((x) => `<path d="M300 150C300 125 ${x + 12} 125 ${x + 12} 81" class="g-s-primaer" stroke-width="1.4" fill="none"/>`).join('')}
    ${text(200, 212, 'Jeder Magnet zündet eine Kerze pro Zylinder – unabhängig vom Bordnetz.', { groesse: 10.5, gewicht: 700 })}
  `, 'Doppelzündung: Der linke Magnet zündet je eine Kerze in jedem Zylinder, der rechte Magnet die andere');
}

/** Kraftstoffsystem: Fallbenzin beim Hochdecker, Pumpe beim Tiefdecker. */
export function kraftstoffsystem() {
  const kasten = (x, y, b, h, inhalt, klasse = 'g-s-text') => `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="6" class="g-f-weiss ${klasse}" stroke-width="1.4"/>${text(x + b / 2, y + h / 2, inhalt, { groesse: 10, gewicht: 700 })}`;
  return svg(400, 260, `
    <rect width="400" height="260" class="g-f-flaeche"/>
    ${text(100, 16, 'Hochdecker: Fallbenzin', { groesse: 12, gewicht: 800 })}
    ${kasten(14, 30, 70, 26, 'Tank links', 'g-s-orange')}${kasten(116, 30, 70, 26, 'Tank rechts', 'g-s-orange')}
    ${linie(49, 56, 49, 80, 'g-s-orange', 2)}${linie(151, 56, 151, 80, 'g-s-orange', 2)}${linie(49, 80, 151, 80, 'g-s-orange', 2)}
    ${linie(100, 80, 100, 96, 'g-s-orange', 2)}
    ${kasten(50, 96, 100, 26, 'Tankwahlschalter')}
    ${linie(100, 122, 100, 138, 'g-s-orange', 2)}
    ${kasten(50, 138, 100, 26, 'Filter mit Ablass')}
    ${linie(100, 164, 100, 180, 'g-s-orange', 2)}
    ${kasten(50, 180, 100, 26, 'Vergaser')}
    ${linie(100, 206, 100, 220, 'g-s-orange', 2)}
    ${kasten(50, 220, 100, 26, 'Motor')}
    ${text(300, 16, 'Tiefdecker: mit Pumpe', { groesse: 12, gewicht: 800 })}
    ${kasten(214, 220, 70, 26, 'Tank links', 'g-s-orange')}${kasten(316, 220, 70, 26, 'Tank rechts', 'g-s-orange')}
    ${linie(249, 220, 249, 202, 'g-s-orange', 2)}${linie(351, 220, 351, 202, 'g-s-orange', 2)}${linie(249, 202, 351, 202, 'g-s-orange', 2)}
    ${linie(300, 202, 300, 188, 'g-s-orange', 2)}
    ${kasten(250, 162, 100, 26, 'Tankwahlschalter')}
    ${linie(300, 162, 300, 148, 'g-s-orange', 2)}
    ${kasten(250, 122, 100, 26, 'Zusatzpumpe')}
    ${linie(300, 122, 300, 108, 'g-s-orange', 2)}
    ${kasten(250, 82, 100, 26, 'Motorpumpe')}
    ${linie(300, 82, 300, 68, 'g-s-orange', 2)}
    ${kasten(250, 42, 100, 26, 'Motor')}
    ${linie(200, 30, 200, 250, 'g-s-rand', 1, 'stroke-dasharray="4 4"')}
  `, 'Kraftstoffsystem: beim Hochdecker fließt der Kraftstoff aus den Tanks über Tankwahlschalter, Filter und Vergaser zum Motor; beim Tiefdecker fördern Pumpen den Kraftstoff von den Tanks zum Motor');
}

/** Propellerblatt: Blattwinkel nimmt von der Nabe zur Spitze ab. */
export function propellerblatt() {
  const profil = (cx, cy, winkel, s) => `<g transform="translate(${cx} ${cy}) rotate(${-winkel}) scale(${s})"><path d="M-30 0C-30-6-18-10 0-10S26-4 30 0C18 3 6 4-12 4S-30 3-30 0z" class="g-f-mf-hell g-s-mf" stroke-width="${r1(1.6 / s)}"/></g>`;
  return svg(400, 230, `
    <rect width="400" height="230" class="g-f-himmel"/>
    <path d="M36 104c0-10 8-16 18-16h20l300 8c8 0 12 4 12 8s-4 8-12 8l-300 8H54c-10 0-18-6-18-16z" class="g-f-weiss g-s-text" stroke-width="1.4"/>
    <circle cx="44" cy="104" r="14" class="g-f-text"/>
    ${text(44, 136, 'Nabe', { groesse: 11, gewicht: 700 })}
    ${text(372, 136, 'Spitze', { groesse: 11, gewicht: 700, anker: 'end' })}
    ${profil(110, 176, 30, 0.9)}${profil(220, 176, 18, 0.9)}${profil(330, 176, 9, 0.9)}
    ${text(110, 214, 'steil (≈ 30°)', { groesse: 11, gewicht: 700 })}${text(220, 214, 'mittel', { groesse: 11, gewicht: 700 })}${text(330, 214, 'flach (≈ 10°)', { groesse: 11, gewicht: 700 })}
    ${linie(110, 118, 110, 150, 'g-s-leise', 1, 'stroke-dasharray="3 3"')}${linie(220, 116, 220, 150, 'g-s-leise', 1, 'stroke-dasharray="3 3"')}${linie(330, 114, 330, 150, 'g-s-leise', 1, 'stroke-dasharray="3 3"')}
    ${pfeil(110, 46, 140, 46, { farbe: 'orange', breite: 2, spitze: 8 })}${pfeil(220, 46, 278, 46, { farbe: 'orange', breite: 2, spitze: 8 })}${pfeil(330, 46, 392, 46, { farbe: 'orange', breite: 2, spitze: 8 })}
    ${text(200, 22, 'Bahngeschwindigkeit: außen viel schneller als innen', { groesse: 11, gewicht: 700, klasse: 'g-f-orange' })}
  `, 'Propellerblatt von oben mit drei Querschnitten: an der Nabe steil angestellt, zur Spitze hin immer flacher, weil die Spitze sich schneller bewegt');
}

/** Staudrucksystem: Staurohr und statische Öffnung, angeschlossen an Fahrtmesser, Höhenmesser und Variometer. */
export function pitotstatik() {
  const instrument = (x, inhalt) => `<circle cx="${x}" cy="176" r="30" class="g-f-weiss g-s-text" stroke-width="1.6"/>${text(x, 176, inhalt, { groesse: 10.5, gewicht: 800 })}`;
  return svg(400, 240, `
    <rect width="400" height="240" class="g-f-flaeche"/>
    <rect x="20" y="46" width="70" height="12" rx="6" class="g-f-text"/>
    <circle cx="70" cy="58" r="2.5" class="g-f-weiss"/>
    ${pfeil(4, 52, 22, 52, { farbe: 'primaer', breite: 2, spitze: 7 })}
    ${text(52, 34, 'Staurohr', { groesse: 11, gewicht: 800 })}
    ${text(70, 76, 'Ablauf', { groesse: 9.5, klasse: 'g-f-leise' })}
    <rect x="300" y="44" width="80" height="18" rx="4" class="g-f-rand"/>
    <circle cx="340" cy="53" r="4" class="g-f-text"/>
    ${text(340, 32, 'statische Öffnung', { groesse: 11, gewicht: 800 })}
    ${linie(90, 52, 120, 52, 'g-s-primaer', 2.4)}${linie(120, 52, 120, 146, 'g-s-primaer', 2.4)}
    ${linie(340, 62, 340, 110, 'g-s-orange', 2.4)}${linie(110, 110, 340, 110, 'g-s-orange', 2.4)}
    ${linie(110, 110, 110, 146, 'g-s-orange', 2.4)}${linie(200, 110, 200, 146, 'g-s-orange', 2.4)}${linie(290, 110, 290, 146, 'g-s-orange', 2.4)}
    ${instrument(115, 'Fahrt')}${instrument(200, 'Höhe')}${instrument(290, 'Vario')}
    <rect x="236" y="76" width="96" height="24" rx="6" class="g-f-weiss g-s-orange" stroke-width="1.2"/>
    ${text(284, 88, 'Ersatz in der Kabine', { groesse: 9.5, gewicht: 700, klasse: 'g-f-orange' })}
    ${linie(284, 100, 284, 110, 'g-s-orange', 1.4, 'stroke-dasharray="2 2"')}
    ${linie(20, 224, 40, 224, 'g-s-primaer', 2.4)}${text(46, 224, 'Gesamtdruck', { groesse: 10.5, gewicht: 700, anker: 'start' })}
    ${linie(160, 224, 180, 224, 'g-s-orange', 2.4)}${text(186, 224, 'statischer Druck', { groesse: 10.5, gewicht: 700, anker: 'start' })}
  `, 'Staudrucksystem: Das Staurohr liefert den Gesamtdruck an den Fahrtmesser, die statische Öffnung den statischen Druck an Fahrtmesser, Höhenmesser und Variometer; dazu eine Ersatz-Druckquelle in der Kabine');
}

export const abbildungen = { bauteile, zuendung, kraftstoffsystem, propellerblatt, pitotstatik };
