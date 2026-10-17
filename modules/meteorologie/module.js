// Lernmodul „Meteorologie“ – Inhalte in content/inhalt.json.
import { lernmodul } from '../../js/lernmodul.js';
import { generatoren } from './generatoren.js';
import { abbildungen } from './abbildungen.js';
import { interaktiv } from './interaktiv.js';
import { animationen } from './animationen.js';

export default lernmodul({ generatoren, abbildungen, interaktiv, animationen });
