// Lernmodul „METAR lesen“: vier Lernstufen (stufen.js) und Wissenskapitel mit Wiederholung (content/inhalt.json).
import { lernmodul } from '../../js/lernmodul.js';
import { erstelleGeneratoren } from './generatoren.js';
import { interaktiv } from './interaktiv.js';
import { STUFEN, stufenUebersicht, stufe1, stufe2, stufe3, stufe4, pruefZusatz } from './stufen.js';

async function laden(datei) {
  const antwort = await fetch(new URL(datei, import.meta.url));
  if (!antwort.ok) throw new Error(`${datei} konnte nicht geladen werden.`);
  return antwort.json();
}

const [gruppen, beispiele, plaetze] = await Promise.all([
  laden('content/gruppen.json'),
  laden('content/beispiele.json'),
  laden('content/plaetze.json'),
]);

const daten = {
  gruppen: gruppen.gruppen,
  beispiele: [...beispiele.beispiele].sort((a, b) => a.schwierigkeit - b.schwierigkeit),
  plaetze,
};

export default lernmodul({
  generatoren: erstelleGeneratoren(plaetze),
  interaktiv,
  seiten: {
    1: (el, rest, ctx) => stufe1(el, rest, ctx, daten),
    2: (el, rest, ctx) => stufe2(el, rest, ctx, daten),
    3: (el, rest, ctx) => stufe3(el, rest, ctx, daten),
    4: (el, rest, ctx) => stufe4(el, rest, ctx, daten),
  },
  uebersichtZusatz: (ctx) => stufenUebersicht(ctx, daten),
  pruefZusatz: (ctx) => pruefZusatz(ctx, daten),
});

export { STUFEN };
