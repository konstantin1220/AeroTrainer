// Rechnungen der Themen „Betriebsverfahren & Notfälle“ und „Technik“.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { umkehrkurve, querlageFuer, kurvenradiusFt, gleitstreckeKm, gleitstreckeMitWindKm, wirbelLage } from '../modules/betrieb/rechnen.js';
import { MF4_FAHRT, fahrtBereich, kolbenweg, takt, vergaserGefahr, staudruckAnzeigen, relativeFeuchte } from '../modules/technik/rechnen.js';
import { luftraumAn, transponderAb, transponderPflicht, grenzen } from '../modules/luftraum/luftraeume.js';

test('Umkehrkurve: das Beispiel der FAA (300 ft, Standardkurve, 65 kt, 225°) wird nachgerechnet', () => {
  const querlage = querlageFuer(3, 65);
  assert.ok(Math.abs(kurvenradiusFt(querlage, 65) - 2100) < 30, 'Radius etwa 2100 ft');
  const u = umkehrkurve({ hoeheFt: 300, querlage, lastvielfaches: false });
  assert.ok(Math.abs(u.zeitS - 79) < 0.5, '75 s Kurve plus 4 s Reaktion');
  assert.ok(Math.abs(u.verlustFt - 1316) < 5, 'etwa 1316 ft Höhenverlust');
  assert.ok(u.restFt < -1000, 'über 1000 ft unter der Piste');
  // Steilere Kurve: weniger Höhenverlust, kleinerer Radius
  const steil = umkehrkurve({ hoeheFt: 300, querlage: 45 });
  assert.ok(steil.verlustFt < u.verlustFt && steil.radiusFt < 500);
});

test('Gleiten: Strecke = Höhe × Gleitzahl, Rückenwind verlängert, Gegenwind verkürzt', () => {
  assert.ok(Math.abs(gleitstreckeKm(1000 / 0.3048, 10) - 10) < 1e-9);
  assert.ok(gleitstreckeMitWindKm(3000, 10, 65, 20) > gleitstreckeKm(3000, 10));
  assert.ok(gleitstreckeMitWindKm(3000, 10, 65, -20) < gleitstreckeKm(3000, 10));
});

test('Wirbelschleppen: Seitenwind von 2,5 kt hält den Luv-Wirbel an seiner Stelle', () => {
  const ohne = wirbelLage({ sekunden: 60 });
  assert.ok(ohne.luv < -50 && ohne.lee > 50, 'bei Windstille wandern beide nach außen');
  const mit = wirbelLage({ sekunden: 60, seitenwindKt: 2.5 });
  assert.ok(Math.abs(mit.luv - wirbelLage({ sekunden: 0, seitenwindKt: 2.5 }).luv) < 0.5, 'Luv-Wirbel bleibt stehen');
});

test('Fahrtmesser MF-4: Bereiche passen zu den Markierungen', () => {
  const m = MF4_FAHRT;
  assert.ok(m.vs0 < m.vs1 && m.vs1 < m.vfe && m.vfe < m.vno && m.vno < m.vne);
  assert.equal(fahrtBereich(m.vs0), 'weiss');
  assert.equal(fahrtBereich(70), 'gruen-weiss');
  assert.equal(fahrtBereich(100), 'gruen');
  assert.equal(fahrtBereich(130), 'gelb');
  assert.equal(fahrtBereich(m.vne), 'rot');
});

test('Viertakt: Kolben oben bei 0° und 360°, unten bei 180°; vier Takte in 720°', () => {
  assert.ok(Math.abs(kolbenweg(0)) < 1e-9 && Math.abs(kolbenweg(360)) < 1e-9);
  assert.ok(Math.abs(kolbenweg(180) - 1) < 1e-9);
  assert.deepEqual([10, 190, 370, 550].map(takt), ['ansaugen', 'verdichten', 'arbeiten', 'ausstossen']);
});

test('Vergaservereisung: Bereiche nach PHAK und relative Feuchte aus Taupunkt', () => {
  assert.equal(vergaserGefahr(15, 90), 'hoch');
  assert.equal(vergaserGefahr(30, 60), 'moeglich');
  assert.equal(vergaserGefahr(35, 40), 'gering');
  assert.equal(Math.round(relativeFeuchte(10, 10)), 100);
  assert.ok(relativeFeuchte(20, 10) > 50 && relativeFeuchte(20, 10) < 56);
});

test('Staudruck: Verstopfungen zeigen in die Richtung, die das PHAK beschreibt', () => {
  const normal = staudruckAnzeigen({ hoehe: 4000, fahrt: 100 });
  assert.ok(Math.abs(normal.hoehenmesser - 4000) < 5);
  assert.equal(Math.round(staudruckAnzeigen({ stoerung: 'staurohr', hoehe: 4000, fahrt: 100 }).fahrtmesser), 0);
  const beideSteigen = staudruckAnzeigen({ stoerung: 'staurohrUndAblauf', hoehe: 4500, fahrt: 100 });
  const beideSinken = staudruckAnzeigen({ stoerung: 'staurohrUndAblauf', hoehe: 3500, fahrt: 100 });
  assert.ok(beideSteigen.fahrtmesser > normal.fahrtmesser && beideSinken.fahrtmesser < normal.fahrtmesser, 'wie ein Höhenmesser');
  const statischSteigen = staudruckAnzeigen({ stoerung: 'statisch', hoehe: 4500, fahrt: 100, steigrate: 500 });
  const statischSinken = staudruckAnzeigen({ stoerung: 'statisch', hoehe: 3500, fahrt: 100, steigrate: -500 });
  assert.ok(Math.abs(statischSteigen.hoehenmesser - 4000) < 5, 'Höhenmesser bleibt stehen');
  assert.equal(statischSteigen.variometer, 0);
  assert.ok(statischSteigen.fahrtmesser < normal.fahrtmesser && statischSinken.fahrtmesser > normal.fahrtmesser);
  const ersatz = staudruckAnzeigen({ stoerung: 'ersatz', hoehe: 4000, fahrt: 100 });
  assert.ok(ersatz.hoehenmesser > 4000 && ersatz.fahrtmesser > normal.fahrtmesser, 'beide etwas zu viel');
});

test('Luftraum: Höhen nach AIP VFR ENR 1-1 und Transponderpflicht nach ENR 1-17', () => {
  assert.equal(luftraumAn(3000, 600), 'G'); // G bis 3100 ft MSL
  assert.equal(luftraumAn(3200, 600), 'E');
  assert.equal(luftraumAn(1700, 600, 'flugplatz'), 'E'); // E ab 1000 ft über Grund (1600 ft MSL)
  assert.equal(luftraumAn(10500, 600), 'C');
  assert.equal(luftraumAn(10500, 600, 'alpen'), 'E'); // in den Alpen erst ab FL 130
  assert.equal(grenzen(0).cOben, 66000);
  assert.equal(transponderAb(500), 5000);
  assert.equal(transponderAb(2000), 5500);
  assert.equal(transponderPflicht(6000, 500, false), false, 'Segelflugbetrieb ausgenommen');
});
