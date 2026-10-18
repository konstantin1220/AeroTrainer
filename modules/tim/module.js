// Extra-Thema „Fliegen ganz einfach – für Tim“ – Inhalte in content/inhalt.json.
// Steht nicht auf der Startseite (in modules/index.json "versteckt": true), sondern ist über #/tim erreichbar.
import { lernmodul } from '../../js/lernmodul.js';
import { abbildungen } from './abbildungen.js';
import { animationen } from './animationen.js';

export default lernmodul({ abbildungen, animationen });
