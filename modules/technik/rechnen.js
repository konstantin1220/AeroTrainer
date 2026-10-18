// Rechnungen für „Technik“ – reine Funktionen, mit node --test geprüft.
import { isa } from '../meteorologie/interaktiv.js';

/**
 * Fahrtmesser-Markierungen des frei erfundenen Übungsflugzeugs MF-4 (IAS in kt). Ausgedacht, passend zu seiner
 * Reisefahrt von 100 kt – für echte Flüge gilt nur das Flughandbuch.
 */
export const MF4_FAHRT = { vs0: 48, vs1: 54, vfe: 85, vno: 120, vne: 150 };

/** In welchem Bereich des Fahrtmessers liegt eine Geschwindigkeit? (PHAK, Kapitel 8: Farbmarkierungen) */
export function fahrtBereich(ias, m = MF4_FAHRT) {
  if (ias >= m.vne) return 'rot';
  if (ias > m.vno) return 'gelb';
  if (ias >= m.vs1) return ias <= m.vfe ? 'gruen-weiss' : 'gruen';
  if (ias >= m.vs0) return 'weiss';
  return 'unter';
}

/** Kurbeltrieb des Viertaktmotors: Kolbenweg (0 = oberer Totpunkt, 1 = unterer) beim Kurbelwinkel in Grad. */
export function kolbenweg(kurbelGrad, pleuelVerhaeltnis = 3.5) {
  const w = (kurbelGrad * Math.PI) / 180;
  const r = 0.5, l = r * pleuelVerhaeltnis;
  const x = r * Math.cos(w) + Math.sqrt(l * l - (r * Math.sin(w)) ** 2); // Abstand Kurbelwelle–Kolbenbolzen
  return (r + l - x) / (2 * r);
}

/** Takt beim Kurbelwinkel 0–720°: Ansaugen, Verdichten, Arbeiten, Ausstoßen (je 180°, zwei Umdrehungen). */
export function takt(kurbelGrad) {
  const g = ((kurbelGrad % 720) + 720) % 720;
  return ['ansaugen', 'verdichten', 'arbeiten', 'ausstossen'][Math.floor(g / 180)];
}

/**
 * Gefahr der Vergaservereisung – vereinfacht nach PHAK Kapitel 7 (Abb. 7-12): am größten unter etwa 21 °C bei
 * mehr als 80 % relativer Feuchte, möglich bis 38 °C und schon ab 50 % Feuchte. Auch außerhalb ist Vereisung möglich.
 */
export function vergaserGefahr(temperatur, feuchte) {
  if (temperatur >= -7 && temperatur <= 21 && feuchte >= 80) return 'hoch';
  if (temperatur >= -7 && temperatur <= 38 && feuchte >= 50) return 'moeglich';
  return 'gering';
}

// ---------- Staudruck-System (Fahrtmesser, Höhenmesser, Variometer) ----------

const KT = 0.514444; // m/s
const FT = 0.3048; // m
const RHO0 = 1.225; // kg/m³ (Standardatmosphäre in Meereshöhe)

const druck = (ft) => isa(ft).p * 100; // Pa
/** Höhe in ft zu einem statischen Druck (Umkehrung der Standardatmosphäre bis 36 000 ft). */
export function hoeheAusDruck(pa) {
  return ((1 - (pa / 101325) ** (1 / 5.25588)) / 2.25577e-5) / FT;
}
/** Angezeigte Fahrt (kt) aus Gesamtdruck und statischem Druck (inkompressibel gerechnet). */
const fahrtAus = (gesamt, statisch) => Math.sqrt(Math.max(0, (2 * (gesamt - statisch)) / RHO0)) / KT;
/** Gesamtdruck im Staurohr bei wahrer Fahrt (kt) in einer Höhe (ft). */
function gesamtdruck(fahrtKt, ft) {
  const rho = RHO0 * isa(ft).dichte; // isa() liefert die Dichte relativ zur Meereshöhe
  return druck(ft) + 0.5 * rho * (fahrtKt * KT) ** 2;
}

/**
 * Was zeigen Fahrtmesser, Höhenmesser und Variometer bei einer Störung? (PHAK Kapitel 8)
 * stoerung: 'keine' | 'staurohr' (Staurohr zu, Ablauf offen) | 'staurohrUndAblauf' | 'statisch' | 'ersatz' (alternative statische Quelle in der Kabine)
 * Die Störung beginnt in hoeheStoerung bei fahrtStoerung; danach fliegt das Flugzeug in hoehe mit fahrt und steigt mit steigrate (ft/min).
 */
export function staudruckAnzeigen({ stoerung = 'keine', hoehe, fahrt, steigrate = 0, hoeheStoerung = 4000, fahrtStoerung = 100 }) {
  const ps = druck(hoehe);
  const pt = gesamtdruck(fahrt, hoehe);
  const kabine = 150; // Pa – der Druck in der Kabine ist durch die Umströmung des Rumpfs etwas geringer
  let statisch = ps, gesamt = pt, vario = steigrate;
  if (stoerung === 'staurohr') gesamt = ps;
  if (stoerung === 'staurohrUndAblauf') gesamt = gesamtdruck(fahrtStoerung, hoeheStoerung);
  if (stoerung === 'statisch') { statisch = druck(hoeheStoerung); vario = 0; }
  if (stoerung === 'ersatz') { statisch = ps - kabine; gesamt = pt; }
  return {
    fahrtmesser: fahrtAus(gesamt, statisch),
    hoehenmesser: hoeheAusDruck(statisch),
    variometer: vario,
    wahr: { fahrt: fahrtAus(pt, ps), hoehe },
  };
}

/** Relative Feuchte (%) aus Temperatur und Taupunkt (°C) – Magnus-Formel, wie man sie aus einem METAR bekommt. */
export function relativeFeuchte(temperatur, taupunkt) {
  const e = (t) => Math.exp((17.625 * t) / (243.04 + t));
  return Math.min(100, (100 * e(taupunkt)) / e(temperatur));
}
