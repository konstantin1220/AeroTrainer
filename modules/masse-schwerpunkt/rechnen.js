// Rechenkern für Masse und Schwerpunkt – ohne Oberfläche, wird auch von den Tests genutzt.

export const runden = (wert, stellen = 0) => Number(wert.toFixed(stellen));

/** Massen je Station in kg (Kraftstoff wird von Litern umgerechnet). */
export function stationsMasse(flugzeug, station, wert) {
  return station.einheit === 'l' ? wert * flugzeug.kraftstoffDichte : wert;
}

/** Berechnet Gesamtmasse, Gesamtmoment und Schwerpunkt einer Beladung { stationId: Wert }. */
export function beladungRechnen(flugzeug, beladung) {
  const zeilen = [{ name: 'Leermasse', masse: flugzeug.leermasse, arm: flugzeug.leerArm }];
  for (const station of flugzeug.stationen) {
    const wert = beladung[station.id] ?? 0;
    zeilen.push({ name: station.name, masse: stationsMasse(flugzeug, station, wert), arm: station.arm, wert, einheit: station.einheit });
  }
  for (const z of zeilen) z.moment = z.masse * z.arm;
  const masse = zeilen.reduce((s, z) => s + z.masse, 0);
  const moment = zeilen.reduce((s, z) => s + z.moment, 0);
  return { zeilen, masse, moment, schwerpunkt: moment / masse };
}

/** Vorderer und hinterer Schwerpunkt-Grenzwert bei einer bestimmten Masse (Schnitt mit der Hüllkurve). */
export function grenzen(huellkurve, masse) {
  const schnitte = [];
  for (let i = 0; i < huellkurve.length; i++) {
    const [x1, y1] = huellkurve[i];
    const [x2, y2] = huellkurve[(i + 1) % huellkurve.length];
    if ((masse >= Math.min(y1, y2)) && (masse <= Math.max(y1, y2)) && y1 !== y2) {
      schnitte.push(x1 + ((masse - y1) / (y2 - y1)) * (x2 - x1));
    }
  }
  return schnitte.length ? { vorn: Math.min(...schnitte), hinten: Math.max(...schnitte) } : null;
}

/** Bewertet eine Beladung: 'ok', 'schwer', 'vorn' oder 'hinten'. */
export function bewertung(flugzeug, ergebnis) {
  if (ergebnis.masse > flugzeug.mtom + 1e-9) return 'schwer';
  const g = grenzen(flugzeug.huellkurve, ergebnis.masse);
  if (!g) return 'schwer';
  if (ergebnis.schwerpunkt < g.vorn - 1e-9) return 'vorn';
  if (ergebnis.schwerpunkt > g.hinten + 1e-9) return 'hinten';
  return 'ok';
}

export const BEWERTUNG_TEXT = {
  ok: 'Ja – Masse und Schwerpunkt liegen im zulässigen Bereich',
  schwer: 'Nein – die höchstzulässige Startmasse ist überschritten',
  vorn: 'Nein – der Schwerpunkt liegt zu weit vorn',
  hinten: 'Nein – der Schwerpunkt liegt zu weit hinten',
};
