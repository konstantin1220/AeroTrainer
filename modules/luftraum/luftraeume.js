// Höhen der Lufträume in Deutschland – vereinfacht nach AIP VFR, ENR 1-1 (Luftraumstruktur in Deutschland).
// Ohne Kontrollzonen (D CTR), Luftraum D (nicht CTR) und Nahverkehrsbereiche (C) um große Flughäfen:
// Deren Grenzen stehen für jeden Ort auf der Luftfahrtkarte. Reine Rechnungen, mit node --test geprüft.

/** Obergrenze von Luftraum G über Grund: meist 2500 ft, um manche Flugplätze nur 1000 ft. */
export const G_OBERGRENZE_GND = { normal: 2500, flugplatz: 1000 };
/** Untergrenze von Luftraum C als Flugfläche: FL 100, im Alpengebiet FL 130. C reicht bis FL 660. */
export const C_UNTERGRENZE_FL = { normal: 100, alpen: 130 };
export const C_OBERGRENZE_FL = 660;
/** Transponder für motorgetriebene Luftfahrzeuge: oberhalb 5000 ft MSL oder 3500 ft über Grund – der höhere Wert gilt (AIP VFR ENR 1-17). */
export const TRANSPONDER = { msl: 5000, gnd: 3500 };

/**
 * Grenzen an einem Ort in ft MSL. Flugflächen sind vereinfacht in Fuß umgerechnet (FL 100 ≈ 10 000 ft bei Standarddruck).
 * gebiet: 'normal' | 'flugplatz' (Flugplatz mit Instrumentenverkehr in der Nähe) | 'alpen'
 */
export function grenzen(gelaende, gebiet = 'normal') {
  const cUnten = (gebiet === 'alpen' ? C_UNTERGRENZE_FL.alpen : C_UNTERGRENZE_FL.normal) * 100;
  const gOben = Math.min(cUnten, gelaende + (gebiet === 'flugplatz' ? G_OBERGRENZE_GND.flugplatz : G_OBERGRENZE_GND.normal));
  return { gOben, cUnten, cOben: C_OBERGRENZE_FL * 100 };
}

/** Luftraumklasse in hoehe (ft MSL) über Gelände gelaende (ft MSL). */
export function luftraumAn(hoehe, gelaende, gebiet = 'normal') {
  const g = grenzen(gelaende, gebiet);
  if (hoehe < g.gOben) return 'G';
  if (hoehe < g.cUnten) return 'E';
  return 'C';
}

/** Ab welcher Höhe (ft MSL) ein motorgetriebenes Luftfahrzeug einen Transponder braucht. */
export function transponderAb(gelaende) {
  return Math.max(TRANSPONDER.msl, gelaende + TRANSPONDER.gnd);
}

/** Braucht dieses Luftfahrzeug in dieser Höhe einen Transponder? Segelflugbetrieb ist ausgenommen. */
export function transponderPflicht(hoehe, gelaende, motor = true) {
  return motor && hoehe > transponderAb(gelaende);
}

/** Was in der Klasse für VFR-Flüge gilt (SERA Anlage 4, in Deutschland). */
export const REGELN = {
  C: { freigabe: true, funk: true, kontrolliert: true },
  D: { freigabe: true, funk: true, kontrolliert: true },
  E: { freigabe: false, funk: false, kontrolliert: true },
  G: { freigabe: false, funk: false, kontrolliert: false },
};
