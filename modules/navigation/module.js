// Lernmodul „Navigation“ – Inhalte in content/inhalt.json, Übungskarte in abbildungen.js.
import { lernmodul } from '../../js/lernmodul.js';
import { generatoren } from './generatoren.js';
import { abbildungen } from './abbildungen.js';
import { interaktiv } from './interaktiv.js';

export default lernmodul({ generatoren, abbildungen, interaktiv });
