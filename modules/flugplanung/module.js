// Lernmodul „Flugplanung“ – Inhalte in content/inhalt.json, Planungsdaten des (frei erfundenen)
// Übungsflugzeugs und der Plätze in content/flugzeug.json. Karte und Orte aus dem Thema Navigation.
import { lernmodul } from '../../js/lernmodul.js';
import { erstelleGeneratoren } from './generatoren.js';
import { abbildungenFuer } from './abbildungen.js';
import { interaktivFuer } from './interaktiv.js';
import { animationenFuer } from './animationen.js';

const flugzeug = await fetch(new URL('content/flugzeug.json', import.meta.url)).then((r) => {
  if (!r.ok) throw new Error('Planungsdaten konnten nicht geladen werden.');
  return r.json();
});

export default lernmodul({
  generatoren: erstelleGeneratoren(flugzeug),
  abbildungen: abbildungenFuer(flugzeug),
  interaktiv: interaktivFuer(flugzeug),
  animationen: animationenFuer(flugzeug),
});
