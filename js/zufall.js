// Zufallshelfer für Übungsaufgaben. Mit einem Startwert (seed) sind die Zahlen
// wiederholbar – praktisch für Tests. Ohne Startwert wird Math.random verwendet.

export function zufallsquelle(startwert) {
  let zustand = startwert >>> 0;
  const zahl = startwert === undefined
    ? Math.random
    : () => {
        // mulberry32 – kleiner, bewährter Pseudozufallsgenerator
        zustand = (zustand + 0x6d2b79f5) >>> 0;
        let t = zustand;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };

  const z = {
    zahl,
    /** ganze Zahl von min bis max (beide eingeschlossen), optional in Schritten */
    ganz(min, max, schritt = 1) {
      const anzahl = Math.floor((max - min) / schritt) + 1;
      return min + Math.floor(zahl() * anzahl) * schritt;
    },
    wahl(liste) {
      return liste[Math.floor(zahl() * liste.length)];
    },
    mischen(liste) {
      const kopie = [...liste];
      for (let i = kopie.length - 1; i > 0; i--) {
        const j = Math.floor(zahl() * (i + 1));
        [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
      }
      return kopie;
    },
    /** mehrere verschiedene Elemente ziehen */
    ziehen(liste, anzahl) {
      return z.mischen(liste).slice(0, anzahl);
    },
    janein(wahrscheinlichkeit = 0.5) {
      return zahl() < wahrscheinlichkeit;
    },
  };
  return z;
}

export const zufall = zufallsquelle();
