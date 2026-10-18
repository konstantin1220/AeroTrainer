// Extra-Thema „Fliegen ganz einfach – für Tim“: nutzt die Animationen der großen Themen.
import { animationen as luftraum } from '../luftraum/animationen.js';
import { animationen as meteorologie } from '../meteorologie/animationen.js';
import { animationen as sprechfunk } from '../sprechfunk/animationen.js';
import { animationen as aerodynamik } from '../aerodynamik/animationen.js';

export const animationen = { ...luftraum, ...meteorologie, ...sprechfunk, ...aerodynamik };
