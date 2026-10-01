// Lernmodul „Masse & Schwerpunkt“ – Inhalte in content/inhalt.json, Hebel-Wippe und
// Beladungsrechner in interaktiv.js. Die Daten des (frei erfundenen) Übungsflugzeugs
// stehen in content/flugzeug.json.
import { lernmodul } from '../../js/lernmodul.js';
import { erstelleGeneratoren } from './generatoren.js';
import { abbildungenFuer } from './abbildungen.js';
import { interaktivFuer } from './interaktiv.js';

const flugzeug = await fetch(new URL('content/flugzeug.json', import.meta.url)).then((r) => {
  if (!r.ok) throw new Error('Flugzeugdaten konnten nicht geladen werden.');
  return r.json();
});

export default lernmodul({
  generatoren: erstelleGeneratoren(flugzeug),
  abbildungen: abbildungenFuer(flugzeug),
  interaktiv: interaktivFuer(flugzeug),
});
