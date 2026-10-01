// Rechenaufgaben für „Meteorologie“ – mit den üblichen Faustwerten:
// Wolkenbasis ≈ Spread × 400 ft, ISA: 15 °C − 2 °C je 1000 ft, 1 hPa ≈ 30 ft.

const vorzeichen = (n) => (n > 0 ? `+${n}` : String(n).replace('-', '−'));

export const generatoren = {
  wolkenbasis(z) {
    const taupunkt = z.ganz(-2, 14);
    const spread = z.ganz(3, 12);
    const temperatur = taupunkt + spread;
    return {
      typ: 'zahl',
      frage: `Am Boden misst du **${vorzeichen(temperatur)} °C** und einen Taupunkt von **${vorzeichen(taupunkt)} °C**. In welcher Höhe über Grund liegt ungefähr die Basis der Quellwolken?`,
      hinweis: 'Faustformel: Spread × 400 ft (bzw. × 125 m).',
      loesung: spread * 400,
      toleranz: Math.max(100, spread * 400 * 0.05),
      einheit: 'ft',
      erklaerung: `Spread = ${vorzeichen(temperatur)} − (${vorzeichen(taupunkt)}) = ${spread} °C → ${spread} × 400 ft = ${spread * 400} ft über Grund.`,
    };
  },

  isaTemperatur(z) {
    const hoehe = z.ganz(1, 12) * 1000;
    const isa = 15 - 2 * (hoehe / 1000);
    return {
      typ: 'zahl',
      frage: `Welche Temperatur hat die ICAO-Standardatmosphäre in **${hoehe} ft**?`,
      loesung: isa,
      toleranz: 0.5,
      einheit: '°C',
      erklaerung: `15 °C − 2 °C × ${hoehe / 1000} = ${vorzeichen(isa)} °C.`,
    };
  },

  isaAbweichung(z) {
    const hoehe = z.ganz(1, 8) * 1000;
    const isa = 15 - 2 * (hoehe / 1000);
    const abweichung = z.wahl([-15, -10, -8, -5, 5, 8, 10, 12, 15]);
    const gemessen = isa + abweichung;
    return {
      typ: 'zahl',
      frage: `In **${hoehe} ft** misst du **${vorzeichen(gemessen)} °C**. Um wie viel Grad weicht die Luft von der Standardatmosphäre ab? (wärmer = plus, kälter = minus)`,
      loesung: abweichung,
      toleranz: 0.5,
      einheit: '°C',
      erklaerung: `ISA in ${hoehe} ft: ${vorzeichen(isa)} °C. Gemessen ${vorzeichen(gemessen)} °C → ISA ${vorzeichen(abweichung)} °C.`,
    };
  },

  hoehenmesserFehler(z) {
    const richtig = z.ganz(995, 1030);
    const eingestellt = richtig + z.wahl([-12, -10, -8, -6, -5, 5, 6, 8, 10, 12]);
    const anzeige = z.ganz(15, 45) * 100;
    const wahr = anzeige - (eingestellt - richtig) * 30;
    return {
      typ: 'zahl',
      frage: `Am Höhenmesser sind **${eingestellt} hPa** eingestellt, das aktuelle QNH ist aber **${richtig} hPa**. Der Höhenmesser zeigt **${anzeige} ft**. Wie hoch bist du wirklich über MSL?`,
      hinweis: 'Rechne mit 1 hPa ≈ 30 ft.',
      loesung: wahr,
      toleranz: 30,
      einheit: 'ft',
      erklaerung: `${eingestellt > richtig ? 'Zu hoch' : 'Zu niedrig'} eingestellt um ${Math.abs(eingestellt - richtig)} hPa ≈ ${Math.abs(eingestellt - richtig) * 30} ft. Der Höhenmesser zeigt also ${eingestellt > richtig ? 'zu viel' : 'zu wenig'}: wahre Höhe ≈ ${wahr} ft.`,
    };
  },

  druckhoehe(z) {
    const platz = z.ganz(2, 30) * 100;
    const qnh = z.ganz(990, 1035);
    const druckhoehe = platz + (1013 - qnh) * 30;
    return {
      typ: 'zahl',
      frage: `Platzhöhe **${platz} ft**, QNH **${qnh} hPa**. Wie groß ist die Druckhöhe am Platz?`,
      hinweis: 'Druckhöhe = Höhe + (1013 − QNH) × 30 ft.',
      loesung: druckhoehe,
      toleranz: 30,
      einheit: 'ft',
      erklaerung: `${platz} + (1013 − ${qnh}) × 30 = ${platz} ${qnh <= 1013 ? '+' : '−'} ${Math.abs(1013 - qnh) * 30} = ${druckhoehe} ft.`,
    };
  },

  dichtehoehe(z) {
    const druckhoehe = z.ganz(5, 30) * 100;
    const isa = 15 - 2 * (druckhoehe / 1000);
    const temperatur = Math.round(isa + z.ganz(5, 20));
    const dichtehoehe = druckhoehe + 120 * (temperatur - isa);
    return {
      typ: 'zahl',
      frage: `Druckhöhe **${druckhoehe} ft**, Außentemperatur **${vorzeichen(temperatur)} °C**. Wie groß ist ungefähr die Dichtehöhe?`,
      hinweis: 'Faustformel: Dichtehöhe ≈ Druckhöhe + 120 ft × (Temperatur − ISA-Temperatur).',
      loesung: Math.round(dichtehoehe),
      toleranz: Math.max(100, Math.round(dichtehoehe * 0.04)),
      einheit: 'ft',
      erklaerung: `ISA in ${druckhoehe} ft: ${vorzeichen(Number(isa.toFixed(1)))} °C. Abweichung ${vorzeichen(Number((temperatur - isa).toFixed(1)))} °C × 120 ft ≈ ${Math.round(120 * (temperatur - isa))} ft → Dichtehöhe ≈ ${Math.round(dichtehoehe)} ft. Das Flugzeug „fühlt“ sich so, als wäre es höher.`,
    };
  },
};
