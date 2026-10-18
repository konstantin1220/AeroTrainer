// Extra-Thema „Fliegen ganz einfach – für Tim“: nutzt die Abbildungen der großen Themen.
import { abbildungen as aerodynamik } from '../aerodynamik/abbildungen.js';
import { abbildungen as mensch } from '../mensch/abbildungen.js';
import { abbildungen as navigation } from '../navigation/abbildungen.js';

export const abbildungen = { ...aerodynamik, ...mensch, ...navigation };
