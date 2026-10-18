// Rechenaufgaben für „Aerodynamik“: Lastvielfaches, Überziehgeschwindigkeit, Gleitflug, Auftrieb.

const RAD = Math.PI / 180;
const komma = (wert, stellen) => Number(wert.toFixed(stellen)).toLocaleString('de-DE', { useGrouping: false });

export const generatoren = {
  lastvielfaches(z) {
    const querlage = z.wahl([15, 20, 30, 40, 45, 50, 60, 70]);
    const n = 1 / Math.cos(querlage * RAD);
    return {
      typ: 'zahl',
      frage: `Wie groß ist das Lastvielfache in einer horizontalen Kurve mit **${querlage}° Querlage**?`,
      loesung: Number(n.toFixed(2)),
      toleranz: 0.05,
      einheit: 'g',
      rechenweg: [
        'In der Kurve muss der Auftrieb das Gewicht tragen **und** das Flugzeug um die Kurve ziehen. Dafür gilt: **n = 1 ÷ cos(Querlage)**.',
        `cos ${querlage}° ≈ ${komma(Math.cos(querlage * RAD), 3)}.`,
        `n = 1 ÷ ${komma(Math.cos(querlage * RAD), 3)} ≈ **${komma(n, 2)} g**.`,
      ],
      erklaerung: 'Merkwerte: 30° → 1,15 · 45° → 1,41 · 60° → 2.',
    };
  },

  ueberziehenKurve(z) {
    const vs = z.ganz(40, 65);
    const querlage = z.wahl([30, 45, 60]);
    const n = 1 / Math.cos(querlage * RAD);
    const vsk = vs * Math.sqrt(n);
    return {
      typ: 'zahl',
      frage: `Die Überziehgeschwindigkeit im Geradeausflug beträgt **${vs} kt**. Wie groß ist sie in einer horizontalen Kurve mit **${querlage}° Querlage**?`,
      loesung: Math.round(vsk),
      toleranz: 1,
      einheit: 'kt',
      rechenweg: [
        `Lastvielfaches in der Kurve: n = 1 ÷ cos ${querlage}° ≈ **${komma(n, 2)}**.`,
        'Die Überziehgeschwindigkeit steigt mit der **Wurzel** des Lastvielfachen: **vS Kurve = vS × √n**.',
        `√${komma(n, 2)} ≈ ${komma(Math.sqrt(n), 3)} → ${vs} kt × ${komma(Math.sqrt(n), 3)} ≈ **${Math.round(vsk)} kt**.`,
      ],
    };
  },

  ueberziehenMasse(z) {
    const vs = z.ganz(42, 60);
    const m1 = z.ganz(80, 115) * 10;
    const m2 = m1 + z.wahl([-150, -100, 100, 150, 200]);
    const vs2 = vs * Math.sqrt(m2 / m1);
    return {
      typ: 'zahl',
      frage: `Bei **${m1} kg** beträgt die Überziehgeschwindigkeit **${vs} kt**. Wie groß ist sie ungefähr bei **${m2} kg**?`,
      loesung: Math.round(vs2),
      toleranz: 1,
      einheit: 'kt',
      rechenweg: [
        'Die Überziehgeschwindigkeit ändert sich mit der **Wurzel des Massenverhältnisses**: vS neu = vS × √(Masse neu ÷ Masse alt).',
        `${m2} ÷ ${m1} ≈ ${komma(m2 / m1, 3)} → √${komma(m2 / m1, 3)} ≈ **${komma(Math.sqrt(m2 / m1), 3)}**.`,
        `${vs} kt × ${komma(Math.sqrt(m2 / m1), 3)} ≈ **${Math.round(vs2)} kt**.`,
      ],
      erklaerung: m2 > m1 ? 'Schwerer heißt: Der Flügel braucht mehr Auftrieb – du überziehst schon bei höherer Fahrt.' : 'Leichter heißt: Der Flügel braucht weniger Auftrieb – du überziehst erst bei geringerer Fahrt.',
    };
  },

  gleitstrecke(z) {
    if (z.janein()) {
      const gleitzahl = z.wahl([25, 30, 35, 40, 45]);
      const hoehe = z.ganz(4, 15) * 100;
      const km = (hoehe * gleitzahl) / 1000;
      return {
        typ: 'zahl',
        frage: `Ein Segelflugzeug hat eine Gleitzahl von **1 : ${gleitzahl}**. Wie weit kommt es bei Windstille aus **${hoehe} m** Höhe über Grund?`,
        loesung: Number(km.toFixed(1)),
        toleranz: Math.max(0.3, Number((km * 0.03).toFixed(1))),
        einheit: 'km',
        rechenweg: [
          `Gleitzahl 1 : ${gleitzahl} heißt: Aus **1 m** Höhe kommst du **${gleitzahl} m** weit.`,
          `Gleitstrecke = Höhe × Gleitzahl = ${hoehe} m × ${gleitzahl} = **${komma(hoehe * gleitzahl, 0)} m**.`,
          `${komma(hoehe * gleitzahl, 0)} m ÷ 1000 = **${komma(km, 1)} km**.`,
        ],
        erklaerung: 'In der Praxis plant man mit deutlicher Sicherheitsreserve – Gegenwind und Abwind verkürzen die Strecke.',
      };
    }
    const gleitzahl = z.wahl([8, 9, 10]);
    const hoehe = z.ganz(15, 50) * 100;
    const nm = (hoehe * gleitzahl) / 6076;
    return {
      typ: 'zahl',
      frage: `Ein Motorflugzeug gleitet mit ausgefallenem Motor etwa **1 : ${gleitzahl}**. Wie weit kommt es bei Windstille aus **${hoehe} ft** über Grund (in NM)?`,
      hinweis: '1 NM ≈ 6076 ft.',
      loesung: Number(nm.toFixed(1)),
      toleranz: 0.3,
      einheit: 'NM',
      rechenweg: [
        `Gleitzahl 1 : ${gleitzahl} heißt: Aus **1 ft** Höhe kommst du **${gleitzahl} ft** weit.`,
        `${hoehe} ft × ${gleitzahl} = **${hoehe * gleitzahl} ft**.`,
        `In NM: ${hoehe * gleitzahl} ft ÷ 6076 ft ≈ **${komma(nm, 1)} NM**.`,
      ],
    };
  },

  auftriebGeschwindigkeit(z) {
    const [faktor, richtig, falsch, quadrat] = z.wahl([
      ['verdoppelst', 'Er wird viermal so groß', ['Er wird doppelt so groß', 'Er bleibt gleich', 'Er wird halb so groß'], '2² = 2 × 2 = **4**'],
      ['verdreifachst', 'Er wird neunmal so groß', ['Er wird dreimal so groß', 'Er wird sechsmal so groß', 'Er bleibt gleich'], '3² = 3 × 3 = **9**'],
      ['halbierst', 'Er sinkt auf ein Viertel', ['Er sinkt auf die Hälfte', 'Er bleibt gleich', 'Er wird doppelt so groß'], '(½)² = ½ × ½ = **¼**'],
    ]);
    return {
      typ: 'auswahl',
      frage: `Du ${faktor} die Geschwindigkeit bei gleichem Anstellwinkel. Wie ändert sich der Auftrieb?`,
      richtig,
      falsch,
      rechenweg: [
        'Formel: **A = cA · ½ ρ v² · S** – die Geschwindigkeit v steht im **Quadrat**, alles andere bleibt gleich.',
        `Geschwindigkeit mal Faktor → Auftrieb mal Faktor²: ${quadrat}.`,
        `Also: **${richtig}**.`,
      ],
    };
  },
};
