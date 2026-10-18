// Aufgaben mit wechselnden Werten für „Betriebsverfahren & Notfälle“.
import { gleitstreckeKm } from './rechnen.js';

const komma = (n, s = 1) => Number(n.toFixed(s)).toLocaleString('de-DE', { minimumFractionDigits: s, maximumFractionDigits: s, useGrouping: false });
/** Ganze Zahlen ohne, andere mit einer Nachkommastelle. */
const kurz = (n) => komma(n, Number.isInteger(n) ? 0 : 1);

export const generatoren = {
  /** Umkehrkurve: Zeit und Höhenverlust bei fester Kurvenrate und Sinkrate – wie im Beispiel der FAA. */
  umkehr(z) {
    const rate = z.wahl([3, 3, 6]);
    const winkel = z.wahl([180, 225, 225, 270]);
    const sink = z.wahl([700, 800, 900, 1000, 1200]);
    const reaktion = 4;
    const zeit = reaktion + winkel / rate;
    const verlust = Math.round((zeit * sink) / 60);
    return {
      typ: 'zahl',
      frage: `Nach einem Motorausfall brauchst du ${reaktion} s, um zu reagieren. Dann fliegst du eine Kurve um ${winkel}° mit ${rate}° pro Sekunde${rate === 3 ? ' (Standardkurve)' : ''} und sinkst dabei mit ${sink} ft pro Minute. Wie viele Fuß Höhe verlierst du insgesamt ungefähr?`,
      loesung: verlust,
      toleranz: Math.round(verlust * 0.05),
      einheit: 'ft',
      rechenweg: [
        `Reaktionszeit: **${reaktion} s** – in dieser Zeit sinkst du schon.`,
        `Dauer der Kurve: ${winkel}° ÷ ${rate}° pro s = **${kurz(winkel / rate)} s**.`,
        `Zeit insgesamt: ${reaktion} s + ${kurz(winkel / rate)} s = **${kurz(zeit)} s**.`,
        `Höhenverlust = Zeit × Sinkrate: ${kurz(zeit)} s × ${sink} ft ÷ 60 s ≈ **${verlust} ft**.`,
      ],
      erklaerung: 'Vereinfacht wie im Beispiel der FAA – in der Kurve sinkt ein Flugzeug sogar etwas schneller als geradeaus.',
    };
  },

  /** Wie weit gleitest du ohne Wind? Strecke = Höhe × Gleitzahl. */
  gleitweite(z) {
    const hoehe = z.ganz(1000, 5000, 500);
    const gleitzahl = z.wahl([8, 9, 10, 12]);
    const km = gleitstreckeKm(hoehe, gleitzahl);
    return {
      typ: 'zahl',
      frage: `Dein Motor fällt in ${hoehe} ft über Grund aus. Dein Flugzeug hat eine Gleitzahl von ${gleitzahl}. Wie viele Kilometer kannst du ohne Wind ungefähr gleiten?`,
      loesung: Number(km.toFixed(1)),
      toleranz: Math.max(0.2, Number((km * 0.05).toFixed(1))),
      einheit: 'km',
      rechenweg: [
        `Höhe in Metern: ${hoehe} ft × 0,3048 = **${komma(hoehe * 0.3048, 0)} m**.`,
        `Gleitstrecke = Höhe × Gleitzahl = ${komma(hoehe * 0.3048, 0)} m × ${gleitzahl} ≈ **${komma(hoehe * 0.3048 * gleitzahl, 0)} m**.`,
        `${komma(hoehe * 0.3048 * gleitzahl, 0)} m ÷ 1000 ≈ **${kurz(Number(km.toFixed(1)))} km**.`,
      ],
      erklaerung: 'Plane mit Reserve: Gegenwind, Kurven und Sinken in Abwinden verkürzen die Strecke.',
    };
  },
};
