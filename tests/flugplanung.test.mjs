// Prüft die Rechnungen der Flugplanung und dass die Zahlen in den Kapiteln dazu passen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WEGPUNKTE, etappe, kraftstoffPlan, endreserveMinuten, reiseflughoehen, startstrecke, druckhoehe, durchKontrollzone } from '../modules/flugplanung/rechnen.js';
import { beispielEtappen } from '../modules/flugplanung/abbildungen.js';

const json = (pfad) => JSON.parse(readFileSync(new URL(pfad, import.meta.url), 'utf8'));
const flugzeug = json('../modules/flugplanung/content/flugzeug.json');
const inhalt = json('../modules/flugplanung/content/inhalt.json');
const kapitel = (id) => inhalt.kapitel.find((k) => k.id === id);
const grad3 = (g) => `${String(Math.round(((g % 360) + 360) % 360) || 360).padStart(3, '0')}°`;

test('Endreserve nach AMC1 NCO.OP.125(b) und Kraftstoffplan', () => {
  assert.equal(endreserveMinuten(), 30);
  assert.equal(endreserveMinuten({ inSichtDesStartplatzes: true }), 10);
  assert.equal(endreserveMinuten({ nacht: true }), 45);
  const p = kraftstoffPlan({ minuten: 40, verbrauch: 30, rollen: 3, zuschlag: 0.1, reserveMinuten: 30 });
  assert.deepEqual(p, { rollen: 3, strecke: 20, zuschlag: 2, reserve: 15, gesamt: 40 });
});

test('Halbkreisflugregel (SERA Anlage 3)', () => {
  assert.deepEqual(reiseflughoehen(90).slice(0, 3), [35, 55, 75]);
  assert.deepEqual(reiseflughoehen(270).slice(0, 3), [45, 65, 85]);
  assert.equal(reiseflughoehen(179)[0], 35);
  assert.equal(reiseflughoehen(180)[0], 45);
});

test('Startstrecke: Tabelle, Korrekturen und Richtung der Einflüsse', () => {
  const basis = { hoehe: 0, temperatur: 20, masse: flugzeug.mtom, wind: 0, belag: 'asphalt' };
  assert.equal(Math.round(startstrecke(flugzeug, basis).startstrecke), 545);
  const s = (aenderung) => startstrecke(flugzeug, { ...basis, ...aenderung }).startstrecke;
  assert.ok(s({ temperatur: 30 }) > s({}), 'wärmer muss länger sein');
  assert.ok(s({ hoehe: 3000 }) > s({}), 'höher muss länger sein');
  assert.ok(s({ wind: 10 }) < s({}), 'Gegenwind muss kürzer sein');
  assert.ok(s({ wind: -4 }) > s({}), 'Rückenwind muss länger sein');
  assert.ok(s({ belag: 'grasNass' }) > s({ belag: 'grasTrocken' }) && s({ belag: 'grasTrocken' }) > s({}), 'Gras muss länger sein');
  assert.ok(s({ masse: 950 }) < s({}), 'leichter muss kürzer sein');
  assert.equal(druckhoehe(1450, 1003), 1750);
});

test('Kontrollzone Musterstadt auf der Übungskarte', () => {
  assert.equal(durchKontrollzone(WEGPUNKTE.altdorf, WEGPUNKTE.seefeld), true, 'XALT–XSEE führt durch die CTR');
  assert.equal(durchKontrollzone(WEGPUNKTE.altdorf, WEGPUNKTE.bgn), false);
  assert.equal(durchKontrollzone(WEGPUNKTE.bgn, WEGPUNKTE.seefeld), false, 'der Umweg über BGN bleibt draußen');
  assert.equal(durchKontrollzone(WEGPUNKTE.altdorf, WEGPUNKTE.bergen), false);
});

test('Beispielflug: Tabellen in den Kapiteln passen zur Rechnung', () => {
  const etappen = beispielEtappen();
  for (const id of ['navlog', 'beispiel']) {
    const tabelle = kapitel(id).theorie.find((b) => b.typ === 'tabelle' && b.zeilen[0][0] === 'XALT–W');
    assert.ok(tabelle, `${id}: Tabelle des Beispielflugs fehlt`);
    const spalte = (name) => tabelle.kopf.indexOf(name);
    etappen.forEach((e, i) => {
      const z = tabelle.zeilen[i];
      assert.equal(z[spalte('rwK')], grad3(e.rwk), `${id}: rwK Etappe ${i + 1}`);
      assert.equal(z[spalte('mwSK')], grad3(e.mwsk), `${id}: mwSK Etappe ${i + 1}`);
      assert.equal(z[spalte('Luvwinkel')], `${e.luv < 0 ? '−' : '+'}${Math.abs(Math.round(e.luv))}°`, `${id}: Luvwinkel Etappe ${i + 1}`);
      assert.equal(z[spalte('NM')], e.nm.toFixed(1).replace('.', ','), `${id}: Entfernung Etappe ${i + 1}`);
      assert.equal(z[spalte('GS')], `${Math.round(e.gs)} kt`, `${id}: GS Etappe ${i + 1}`);
      assert.equal(z[spalte('Zeit')], `${Math.round(e.minuten)} min`, `${id}: Zeit Etappe ${i + 1}`);
    });
    const summe = tabelle.zeilen[etappen.length];
    assert.equal(summe[spalte('Zeit')], `${Math.round(etappen.reduce((s, e) => s + e.minuten, 0))} min`, `${id}: Summe Zeit`);
  }
});

test('Zahlen in den Texten: Bergen, Altdorf, Kraftstoff, Masse', () => {
  const ber = flugzeug.plaetze.find((p) => p.kennung === 'XBER');
  const e = startstrecke(flugzeug, { hoehe: ber.hoehe, temperatur: 25, masse: 1100, wind: 5, belag: ber.belag });
  assert.equal(Math.round(e.basis / 5) * 5, 655, 'Tabellenwert Bergen');
  assert.equal(Math.round(e.startstrecke / 10) * 10, 710, 'Startstrecke Bergen');
  assert.ok(e.startstrecke > ber.laenge, 'in Bergen muss die Piste im Beispiel zu kurz sein');
  const alt = flugzeug.plaetze.find((p) => p.kennung === 'XALT');
  const a = startstrecke(flugzeug, { hoehe: druckhoehe(alt.hoehe, 1016), temperatur: 18, masse: 960, wind: 12, belag: 'asphalt' });
  assert.equal(Math.round(a.basis / 5) * 5, 595, 'Tabellenwert Altdorf');
  assert.equal(Math.round(a.startstrecke / 5) * 5, 425, 'Startstrecke Altdorf');
  // Hin- und Rückflug: 2 × Rollen + 2 × Strecke (25 min) + 10 % + einmal Endreserve
  const strecke = (25 / 60) * flugzeug.verbrauch;
  assert.equal(Math.round(2 * flugzeug.rollKraftstoff + 2 * strecke * 1.1 + 0.5 * flugzeug.verbrauch), 49);
  assert.equal(735 + 82 + 75 + 10 + 80 * flugzeug.kraftstoffDichte, 959.6);
});
