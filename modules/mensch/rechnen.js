// Reine Rechnungen für „Menschliches Leistungsvermögen“ (ohne Oberfläche, mit node --test geprüft).
import { isa } from '../meteorologie/interaktiv.js';

/** Sauerstoff-Partialdruck (hPa) in der Standardatmosphäre: 20,95 % des Luftdrucks. */
export function sauerstoffPartialdruck(hoeheFt) {
  return 0.2095 * isa(hoeheFt).p;
}

/**
 * Zeit nutzbaren Bewusstseins ohne Zusatzsauerstoff (FAA Pilot's Handbook of Aeronautical Knowledge,
 * Kapitel 17, Abbildung 17-1). Unter 20 000 ft gibt die Tabelle keinen Wert an.
 */
export const ZEIT_NUTZBAREN_BEWUSSTSEINS = [
  [20000, '30 Minuten oder mehr'],
  [22000, '5 bis 10 Minuten'],
  [25000, '3 bis 5 Minuten'],
  [28000, '2½ bis 3 Minuten'],
  [30000, '1 bis 2 Minuten'],
  [35000, '30 bis 60 Sekunden'],
  [40000, '15 bis 20 Sekunden'],
  [45000, '9 bis 15 Sekunden'],
];

export function zeitNutzbarenBewusstseins(hoeheFt) {
  let wert = null;
  for (const [hoehe, text] of ZEIT_NUTZBAREN_BEWUSSTSEINS) if (hoeheFt >= hoehe) wert = text;
  return wert;
}

/**
 * Zusatzsauerstoff für Flugzeuge nach NCO.OP.190 b – für den Fall, dass der Pilot nicht selbst
 * feststellen kann, wie sich Sauerstoffmangel auswirkt. Druckhöhe in der Kabine (ft), Dauer (min).
 * Ergebnis: 'alle' | 'besatzung' | 'keine'
 */
export function sauerstoffPflicht(hoeheFt, minuten) {
  if (hoeheFt > 13000) return 'alle';
  if (hoeheFt > 10000 && minuten > 30) return 'besatzung';
  return 'keine';
}

/**
 * Gültigkeit eines neu ausgestellten Tauglichkeitszeugnisses in Monaten (MED.A.045 a).
 * klasse: 'klasse2' | 'lapl'. Begrenzungen am 42. bzw. 51. Geburtstag werden nicht berücksichtigt.
 */
export function tauglichkeitMonate(klasse, alter) {
  if (klasse === 'lapl') return alter < 40 ? 60 : 24;
  if (alter < 40) return 60;
  if (alter <= 50) return 24;
  return 12;
}

/** Wartezeit nach dem Tauchen vor dem Fliegen in Stunden (FAA PHAK, Kapitel 17). */
export function wartezeitNachTauchen({ dekompression = false, hoeheFt = 5000 } = {}) {
  if (hoeheFt > 8000 || dekompression) return 24;
  return 12;
}

/**
 * Kollisionskurs: Zwei Luftfahrzeuge auf geradem Kurs. Bleibt die Peilung (Richtung, in der man
 * den anderen sieht) gleich, während der Abstand schrumpft, treffen sie sich.
 * Positionen in NM, Geschwindigkeiten in kt, Kurse in Grad. Ergebnis für den Zeitpunkt t (Minuten).
 */
export function lage(eigen, anderer, t) {
  const RAD = Math.PI / 180;
  const pos = (f) => ({ x: f.x + Math.sin(f.kurs * RAD) * f.kt * (t / 60), y: f.y + Math.cos(f.kurs * RAD) * f.kt * (t / 60) });
  const a = pos(eigen);
  const b = pos(anderer);
  const dx = b.x - a.x, dy = b.y - a.y;
  const abstand = Math.hypot(dx, dy);
  const peilung = ((Math.atan2(dx, dy) / RAD - eigen.kurs) % 360 + 540) % 360 - 180; // relativ zur Flugrichtung, −180…180
  return { a, b, abstand, peilung };
}
