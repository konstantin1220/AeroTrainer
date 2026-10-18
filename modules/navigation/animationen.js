// Animationen für „Navigation“ – selbst gezeichnet, maßstäblich (js/animation.js).
import { svg, text, linie, pfeil, flugzeug, sanft, abschnitt, zwischen } from '../../js/grafik.js';
import { winddreieck } from './generatoren.js';

const r1 = (n) => Math.round(n * 10) / 10;

// Beispiel: Kurs 090°, Eigengeschwindigkeit 100 kt, Wind aus 030° mit 20 kt
export const BEISPIEL = { kurs: 90, tas: 100, windRichtung: 30, windStaerke: 20 };
const PX_KT = 2; // 1 kt ≙ 2 px (Vektoren für eine Stunde, verkleinert) – maßstäblich untereinander
const A = [60, 190], B = [350, 190];
/** Vektor in Richtung (Grad, 0 = Norden) mit Länge in kt → Pixel. */
const vektor = (richtung, kt) => [Math.sin((richtung * Math.PI) / 180) * kt * PX_KT, -Math.cos((richtung * Math.PI) / 180) * kt * PX_KT];
const drei = (grad) => String(Math.round(grad)).padStart(3, '0');
export const ERGEBNIS = (() => {
  const { luv, gs } = winddreieck(BEISPIEL.kurs, BEISPIEL.tas, BEISPIEL.windRichtung, BEISPIEL.windStaerke);
  return { luv: Math.round(Math.abs(luv)), seite: luv < 0 ? 'links' : 'rechts', steuerkurs: drei(BEISPIEL.kurs + luv), gs: Math.round(gs) };
})();

function winddreieckBild(schritt, t) {
  const { kurs, tas, windRichtung, windStaerke } = BEISPIEL;
  const { luv, gs } = winddreieck(kurs, tas, windRichtung, windStaerke);
  const steuerkurs = kurs + luv;
  const windNach = (windRichtung + 180) % 360;
  const [wx, wy] = vektor(windNach, windStaerke);
  const f = sanft(t);
  let inhalt = '';
  // Kurslinie A → B
  const bisX = schritt === 0 ? zwischen(A[0], B[0], f) : B[0];
  inhalt += linie(A[0], A[1], r1(bisX), B[1], 'g-s-text', 2, 'stroke-dasharray="8 5"');
  inhalt += `<circle cx="${A[0]}" cy="${A[1]}" r="5" class="g-f-text"/>${text(A[0], A[1] + 18, 'A', { groesse: 12, gewicht: 800 })}`;
  inhalt += `<circle cx="${B[0]}" cy="${B[1]}" r="5" class="g-f-text"/>${text(B[0], B[1] + 18, 'B', { groesse: 12, gewicht: 800 })}`;
  if (schritt === 0) inhalt += text(205, 176, `Kurs über Grund ${String(kurs).padStart(3, '0')}°`, { groesse: 12, gewicht: 700, klasse: 'g-f-text g-halo' });
  // Wind-Pfeil oben links
  inhalt += pfeil(40, 40, r1(40 + wx), r1(40 + wy), { farbe: 'primaer', breite: 2.4, spitze: 9 }) + text(76, 34, `Wind aus ${String(windRichtung).padStart(3, '0')}° mit ${windStaerke} kt`, { groesse: 11, gewicht: 700, klasse: 'g-f-primaer', anker: 'start' });
  if (schritt === 1) {
    // Ohne Vorhalt: Nase auf Kurs, der Wind versetzt
    const [tx, ty] = vektor(kurs, tas);
    const ende = [A[0] + (tx + wx) * f, A[1] + (ty + wy) * f];
    inhalt += linie(A[0], A[1], r1(ende[0]), r1(ende[1]), 'g-s-fehler', 2.2);
    inhalt += flugzeug(r1(ende[0]), r1(ende[1]), kurs, 24, 'g-f-fehler');
    if (f > 0.6) inhalt += text(r1(ende[0] - 8), r1(ende[1] + 26), 'ohne Vorhalt: versetzt', { groesse: 11, gewicht: 800, klasse: 'g-f-fehler g-halo' });
  }
  if (schritt >= 2) {
    const [hx, hy] = vektor(steuerkurs, tas);
    const tasF = schritt === 2 ? sanft(abschnitt(t, 0, 0.5)) : 1;
    const windF = schritt === 2 ? sanft(abschnitt(t, 0.5, 1)) : 1;
    const spitze = [A[0] + hx * tasF, A[1] + hy * tasF];
    inhalt += pfeil(A[0], A[1], r1(spitze[0]), r1(spitze[1]), { farbe: 'ok', breite: 2.6, spitze: 10 });
    inhalt += text(r1(A[0] + hx * 0.5 - 6), r1(A[1] + hy * 0.5 - 14), `TAS ${tas} kt, Steuerkurs ${String(Math.round(steuerkurs)).padStart(3, '0')}°`, { groesse: 11, gewicht: 800, klasse: 'g-f-ok g-halo' });
    if (windF > 0) {
      inhalt += pfeil(r1(A[0] + hx), r1(A[1] + hy), r1(A[0] + hx + wx * windF), r1(A[1] + hy + wy * windF), { farbe: 'primaer', breite: 2.6, spitze: 10 });
    }
    if (schritt === 3) {
      const gsEnde = [A[0] + hx + wx, A[1] + hy + wy];
      inhalt += pfeil(A[0], A[1] + 0.01, r1(gsEnde[0]), r1(gsEnde[1]), { farbe: 'orange', breite: 3, spitze: 11 });
      inhalt += text(r1((A[0] + gsEnde[0]) / 2), A[1] + 36, `über Grund: ${Math.round(gs)} kt auf Kurs ${String(kurs).padStart(3, '0')}°`, { groesse: 12, gewicht: 800, klasse: 'g-f-orange g-halo' });
      const x = zwischen(A[0], B[0], f);
      inhalt += flugzeug(r1(x), A[1], r1(steuerkurs), 24, 'g-f-ok');
      inhalt += text(330, 250, `Luvwinkel ${Math.round(Math.abs(luv))}° ${luv < 0 ? 'links' : 'rechts'}`, { groesse: 12, gewicht: 800, anker: 'end' });
    }
  }
  return svg(400, 270, `<rect width="400" height="270" class="g-f-land"/>${inhalt}`, `Winddreieck: Kurs ${kurs} Grad, Wind aus ${windRichtung} Grad mit ${windStaerke} Knoten`);
}

export const animationen = {
  winddreieck: {
    titel: 'So entsteht das Winddreieck',
    schritte: [
      { text: `Auf der Karte misst du den **Kurs über Grund** von A nach B: hier **${drei(BEISPIEL.kurs)}°**.`, dauer: 2.8 },
      { text: `Fliegst du einfach mit der Nase auf ${drei(BEISPIEL.kurs)}°, **versetzt** dich der Wind (aus ${drei(BEISPIEL.windRichtung)}°, ${BEISPIEL.windStaerke} kt) nach Süden – du kommst nicht bei B an.`, dauer: 3.6 },
      { text: '**Vorhalten:** Die Nase zeigt etwas in den Wind (**Steuerkurs**). Deine Eigengeschwindigkeit (grün) plus der Wind (blau) ergibt den Weg über Grund – genau auf der Kurslinie.', dauer: 4.4 },
      { text: `Ergebnis: **Luvwinkel** ${ERGEBNIS.luv}° nach ${ERGEBNIS.seite}, **Steuerkurs** ${ERGEBNIS.steuerkurs}°, **Grundgeschwindigkeit** ${ERGEBNIS.gs} kt. Damit rechnest du die Flugzeit.`, dauer: 4 },
    ],
    bild: winddreieckBild,
  },
};
