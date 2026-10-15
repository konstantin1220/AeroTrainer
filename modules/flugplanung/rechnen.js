// Rechnungen der Flugplanung – reine Funktionen ohne Oberfläche (werden mit node --test geprüft).
// Karte und Orte stammen aus dem Thema Navigation (frei erfundenes Übungsgebiet).
import { ORTE, NM_PRO_EINHEIT } from '../navigation/abbildungen.js';
import { winddreieck } from '../navigation/generatoren.js';

export const MISSWEISUNG = 3; // 3° Ost laut Isogone auf der Übungskarte
const RAD = Math.PI / 180;
const norm = (g) => ((g % 360) + 360) % 360;

/** Wegpunkte: Flugplätze plus Meldepunkte und Funkfeuer der Übungskarte. */
export const WEGPUNKTE = {
  ...Object.fromEntries(Object.entries(ORTE).map(([id, o]) => [id, { name: o.name, kurz: o.kennung, x: o.x, y: o.y, art: o.art }])),
  whiskey: { name: 'Meldepunkt Whiskey', kurz: 'W', x: ORTE.musterstadt.x - 72, y: ORTE.musterstadt.y + 8, art: 'meldepunkt' },
  november: { name: 'Meldepunkt November', kurz: 'N', x: ORTE.musterstadt.x, y: ORTE.musterstadt.y - 70, art: 'meldepunkt' },
  bgn: { name: 'Funkfeuer BGN', kurz: 'BGN', x: 150, y: 120, art: 'funkfeuer' },
};

/** Kontrollzone Musterstadt auf der Übungskarte (Kreis). */
export const KONTROLLZONE = { x: ORTE.musterstadt.x, y: ORTE.musterstadt.y, r: 56 };

/** Rechtweisender Kurs (°) und Entfernung (NM) zwischen zwei Wegpunkten. */
export function kursEntfernung(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return { kurs: norm(Math.atan2(dx, -dy) / RAD), nm: Math.hypot(dx, dy) * NM_PRO_EINHEIT };
}

/** Kleinster Abstand (in Karteneinheiten) einer Strecke a–b von einem Punkt. */
function abstandStrecke(a, b, p) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y);
}

/** Führt die direkte Strecke durch die Kontrollzone Musterstadt? (Start oder Ziel in der CTR zählt auch.) */
export function durchKontrollzone(a, b) {
  return abstandStrecke(a, b, KONTROLLZONE) < KONTROLLZONE.r;
}

/**
 * Eine Etappe des Navigationsflugplans.
 * Ergebnis: { rwk, luv, rwsk, mwsk, gs, nm, minuten }
 */
export function etappe(a, b, { tas, windRichtung, windStaerke, missweisung = MISSWEISUNG }) {
  const { kurs, nm } = kursEntfernung(a, b);
  const { luv, gs } = winddreieck(kurs, tas, windRichtung, windStaerke);
  const rwsk = norm(kurs + luv);
  return { rwk: kurs, luv, rwsk, mwsk: norm(rwsk - missweisung), gs, nm, minuten: (nm / gs) * 60 };
}

/**
 * Kraftstoffplan nach NCO.OP.125 mit der Endreserve aus AMC1 NCO.OP.125(b).
 * minuten = geplante Flugzeit, zuschlag = Anteil für Unvorhergesehenes (z. B. 0,1 = 10 %).
 * Ergebnis in Litern: { rollen, strecke, zuschlag, reserve, gesamt }
 */
export function kraftstoffPlan({ minuten, verbrauch, rollen = 0, zuschlag = 0.1, reserveMinuten = 30 }) {
  const strecke = (minuten / 60) * verbrauch;
  const plus = strecke * zuschlag;
  const reserve = (reserveMinuten / 60) * verbrauch;
  return { rollen, strecke, zuschlag: plus, reserve, gesamt: rollen + strecke + plus + reserve };
}

/** Endreserve in Minuten für Flugzeuge (AMC1 NCO.OP.125(b)). */
export function endreserveMinuten({ nacht = false, inSichtDesStartplatzes = false } = {}) {
  if (nacht) return 45;
  return inSichtDesStartplatzes ? 10 : 30;
}

/** Wie lange reicht der Kraftstoff? (Minuten) */
export function flugdauer(liter, verbrauch) {
  return (liter / verbrauch) * 60;
}

/** Halbkreisflugregel (SERA Anlage 3): passende VFR-Reiseflughöhen in Hundert Fuß für einen Kurs über Grund. */
export function reiseflughoehen(kursUeberGrund) {
  const ost = norm(kursUeberGrund) < 180;
  const liste = [];
  for (let tausend = 3; tausend <= 19; tausend++) if ((tausend % 2 === 1) === ost) liste.push(tausend * 10 + 5);
  return liste;
}

/** Lineare Interpolation in einer Tabelle (Zeilen: hoehen, Spalten: temperaturen), außerhalb wird begrenzt. */
function tabelle(t, hoehe, temperatur) {
  const stelle = (achse, wert) => {
    const w = Math.max(achse[0], Math.min(achse.at(-1), wert));
    let i = 0;
    while (i < achse.length - 2 && w > achse[i + 1]) i++;
    return [i, (w - achse[i]) / (achse[i + 1] - achse[i])];
  };
  const [zi, za] = stelle(t.hoehen, hoehe);
  const [si, sa] = stelle(t.temperaturen, temperatur);
  const w = (z, s) => t.werte[z][s];
  const oben = w(zi, si) + (w(zi, si + 1) - w(zi, si)) * sa;
  const unten = w(zi + 1, si) + (w(zi + 1, si + 1) - w(zi + 1, si)) * sa;
  return oben + (unten - oben) * za;
}

/**
 * Startstrecke nach dem (erfundenen) Flughandbuch des MF-4.
 * wind: positiv = Gegenwind, negativ = Rückenwind (kt); belag: 'asphalt' | 'grasTrocken' | 'grasNass'
 * Ergebnis: { basis, faktor, startstrecke, rollstrecke, schritte: [Text] }
 */
export function startstrecke(flugzeug, { hoehe, temperatur, masse, wind = 0, belag = 'asphalt' }) {
  const t = flugzeug.startstrecke;
  const k = t.korrekturen;
  const basis = tabelle(t, hoehe, temperatur);
  const schritte = [];
  let faktor = 1;
  const anwenden = (anteil, text) => { if (Math.abs(anteil) > 1e-9) { faktor *= 1 + anteil; schritte.push(`${text}: ${anteil > 0 ? '+' : '−'}${Math.round(Math.abs(anteil) * 100)} %`); } };
  if (masse < flugzeug.mtom) anwenden(((flugzeug.mtom - masse) / 100) * k.je100kgUnterMtom, `${flugzeug.mtom - masse} kg unter MTOM`);
  if (wind > 0) anwenden((wind / 10) * k.gegenwindJe10kt, `${wind} kt Gegenwind`);
  if (wind < 0) anwenden((-wind / 2) * k.rueckenwindJe2kt, `${-wind} kt Rückenwind`);
  if (belag === 'grasTrocken') anwenden(k.grasTrocken, 'trockenes Gras');
  if (belag === 'grasNass') anwenden(k.grasNass, 'nasses Gras');
  const strecke = basis * faktor;
  return { basis, faktor, startstrecke: strecke, rollstrecke: strecke * t.rollAnteil, schritte };
}

/** Druckhöhe aus Platzhöhe und QNH (1 hPa ≈ 30 ft). */
export function druckhoehe(platzhoehe, qnh) {
  return platzhoehe + (1013 - qnh) * 30;
}
