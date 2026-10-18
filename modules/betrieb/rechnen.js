// Rechnungen für „Betriebsverfahren & Notfälle“ – reine Funktionen, mit node --test geprüft.

const G = 9.81; // m/s²
const KT = 0.514444; // m/s je Knoten
const FT = 0.3048; // m je Fuß

/** Kurvenrate in Grad pro Sekunde bei Querneigung (Grad) und Geschwindigkeit (kt): ω = g · tan φ / v. */
export function kurvenrate(querlage, fahrtKt) {
  return ((G * Math.tan((querlage * Math.PI) / 180)) / (fahrtKt * KT)) * (180 / Math.PI);
}

/** Querneigung (Grad) für eine bestimmte Kurvenrate. Standardkurve: 3° pro Sekunde. */
export function querlageFuer(rateGradProS, fahrtKt) {
  return (Math.atan(((rateGradProS * Math.PI) / 180) * fahrtKt * KT / G) * 180) / Math.PI;
}

/** Kurvenradius in Fuß: r = v² / (g · tan φ). */
export function kurvenradiusFt(querlage, fahrtKt) {
  const v = fahrtKt * KT;
  return (v * v) / (G * Math.tan((querlage * Math.PI) / 180)) / FT;
}

/** Sinkrate in der Kurve: Mit dem Lastvielfachen n = 1/cos φ steigt sie etwa mit n^1,5 (gleicher Anstellwinkel, vereinfacht). */
export function sinkrateInKurve(sinkGeradeFpm, querlage) {
  const n = 1 / Math.cos((querlage * Math.PI) / 180);
  return sinkGeradeFpm * n ** 1.5;
}

/**
 * Umkehrkurve nach Motorausfall kurz nach dem Start – vereinfachtes Modell wie im Beispiel der FAA
 * (Airplane Flying Handbook, Kapitel 18): Reaktionszeit, dann eine Kurve um `winkel` Grad (180° plus
 * etwa 45°, um wieder auf die Piste zu zeigen) mit fester Querneigung. Ergebnis: Zeit, Höhenverlust, Resthöhe.
 * lastvielfaches=false rechnet wie das FAA-Beispiel mit gleichbleibender Sinkrate.
 */
export function umkehrkurve({ hoeheFt, querlage, fahrtKt = 65, sinkFpm = 1000, reaktionS = 4, winkel = 225, lastvielfaches = true }) {
  const rate = kurvenrate(querlage, fahrtKt);
  const kurveS = winkel / rate;
  const sinkKurve = lastvielfaches ? sinkrateInKurve(sinkFpm, querlage) : sinkFpm;
  const verlustFt = (reaktionS * sinkFpm) / 60 + (kurveS * sinkKurve) / 60;
  return {
    rate,
    radiusFt: kurvenradiusFt(querlage, fahrtKt),
    zeitS: reaktionS + kurveS,
    verlustFt,
    restFt: hoeheFt - verlustFt,
    seitlichFt: 2 * kurvenradiusFt(querlage, fahrtKt),
  };
}

/** Gleitstrecke ohne Wind in Kilometern: Höhe (ft) × Gleitzahl. */
export function gleitstreckeKm(hoeheFt, gleitzahl) {
  return (hoeheFt * FT * gleitzahl) / 1000;
}

/**
 * Gleitstrecke mit Wind in Kilometern (Gegenwind negativ, Rückenwind positiv, in kt):
 * Die Flugzeit bleibt gleich (Höhe ÷ Sinkrate), der Wind verschiebt nur den Weg über Grund.
 */
export function gleitstreckeMitWindKm(hoeheFt, gleitzahl, fahrtKt, windKt) {
  const zeitS = (hoeheFt * FT) / ((fahrtKt * KT) / gleitzahl);
  return ((fahrtKt + windKt) * KT * zeitS) / 1000;
}

/**
 * Wirbelschleppen nahe dem Boden (schematisch nach FAA PHAK, Kapitel 14): Die Wirbel liegen etwas weniger
 * als eine Spannweite auseinander und wandern mit 2 bis 3 kt nach außen; Seitenwind bremst den Wirbel auf der
 * Luvseite und beschleunigt den auf der Leeseite. Seitenwind von links positiv (in kt). Ergebnis: Abstand von
 * der Pistenmitte in Metern (links negativ).
 */
export function wirbelLage({ sekunden, seitenwindKt = 0, spannweiteM = 60, auswaertsKt = 2.5 }) {
  const halb = 0.4 * spannweiteM;
  const aus = auswaertsKt * KT * sekunden;
  const wind = seitenwindKt * KT * sekunden;
  return { luv: -halb - aus + wind, lee: halb + aus + wind };
}
