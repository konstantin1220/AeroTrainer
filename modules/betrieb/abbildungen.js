// Abbildungen für „Betriebsverfahren & Notfälle“ – selbst gezeichnet, schematisch, frei erfundene Felder.
import { svg, text, linie, pfeil } from '../../js/grafik.js';

/** Fünf Felder von oben: eines gut geeignet, vier mit typischen Fallen. */
export function feldauswahl() {
  // Füllung über Klassen (hell/dunkel), Rand als Stil – eine g-s-Klasse würde die Füllung abschalten
  const feld = (x, y, b, h, fuellung, rand) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="4" class="${fuellung}" style="stroke: var(--${rand}); stroke-width: 2"/>`;
  const mast = (x, y) => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" class="g-f-text"/>`;
  return svg(400, 300, `
    <rect width="400" height="300" class="g-f-land"/>
    ${pfeil(372, 30, 312, 30, { farbe: 'primaer', breite: 2.4, spitze: 10 })}
    ${text(372, 46, 'Wind', { groesse: 11, gewicht: 800, klasse: 'g-f-primaer', anker: 'end' })}

    ${feld(20, 60, 220, 62, 'g-f-wald', 'ok')}
    ${text(30, 82, 'gut: lang, eben, niedriges Gras', { groesse: 12, gewicht: 800, klasse: 'g-f-ok', anker: 'start' })}
    ${text(30, 102, 'Landung gegen den Wind möglich', { groesse: 11, anker: 'start' })}

    ${feld(256, 60, 124, 62, 'g-f-ort', 'fehler')}
    ${[0, 1, 2, 3, 4, 5].map((i) => linie(266 + i * 20, 66, 266 + i * 20, 116, 'g-s-leise', 1, 'opacity=".5"')).join('')}
    ${text(318, 82, 'hoher Mais', { groesse: 12, gewicht: 800, klasse: 'g-f-fehler' })}
    ${text(318, 102, 'überschlägt', { groesse: 11 })}

    ${feld(20, 140, 160, 70, 'g-f-wald', 'fehler')}
    ${linie(10, 175, 190, 158, 'g-s-text', 1.4, 'stroke-dasharray="5 3"')}
    ${mast(10, 175)}${mast(190, 158)}
    ${text(100, 192, 'Leitung im Anflug', { groesse: 12, gewicht: 800, klasse: 'g-f-fehler' })}

    ${feld(200, 140, 70, 70, 'g-f-wald', 'fehler')}
    <circle cx="214" cy="198" r="9" class="g-f-ok" opacity=".75"/><circle cx="232" cy="200" r="8" class="g-f-ok" opacity=".75"/><circle cx="250" cy="197" r="9" class="g-f-ok" opacity=".75"/>
    ${text(235, 158, 'zu kurz,', { groesse: 11, gewicht: 800, klasse: 'g-f-fehler' })}
    ${text(235, 174, 'Bäume', { groesse: 11, gewicht: 800, klasse: 'g-f-fehler' })}

    ${feld(286, 140, 94, 70, 'g-f-boden', 'fehler')}
    ${linie(333, 142, 333, 208, 'g-s-wasser', 3)}
    ${text(333, 160, 'Wechsel im', { groesse: 11, gewicht: 800, klasse: 'g-f-fehler g-halo' })}
    ${text(333, 176, 'Bewuchs:', { groesse: 11, gewicht: 800, klasse: 'g-f-fehler g-halo' })}
    ${text(333, 192, 'Graben', { groesse: 11, gewicht: 800, klasse: 'g-f-fehler g-halo' })}

    <rect x="0" y="232" width="400" height="14" class="g-f-strasse"/>
    ${[30, 130, 230, 330].map((x) => mast(x, 254)).join('')}
    ${linie(30, 254, 330, 254, 'g-s-text', 1, 'stroke-dasharray="5 3"')}
    ${text(200, 272, 'Entlang von Straßen laufen fast immer Leitungen', { groesse: 11, gewicht: 700 })}
  `, 'Fünf Felder von oben: ein langes, ebenes Feld mit niedrigem Gras ist gut geeignet; Fallen sind hoher Mais, eine Leitung im Anflug, ein zu kurzes Feld mit Bäumen und ein Graben zwischen zwei Kulturen');
}

export const abbildungen = {
  feldauswahl,
};
