// Prüft die Gliederung nach Prüfungsfächern, die Scheinauswahl und die Rechnungen des Fachs
// „Menschliches Leistungsvermögen“.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { passtZumSchein, scheinHinweis, SCHEINE } from '../js/schein.js';
import { sauerstoffPartialdruck, sauerstoffPflicht, tauglichkeitMonate, zeitNutzbarenBewusstseins, wartezeitNachTauchen, lage } from '../modules/mensch/rechnen.js';

const json = (pfad) => JSON.parse(readFileSync(new URL(pfad, import.meta.url), 'utf8'));
const index = json('../modules/index.json');

test('Prüfungsfächer: neun Sachgebiete, jedes Modul gehört zu einem', () => {
  assert.equal(index.faecher.length, 9, 'FCL.120/FCL.215 und SFCL.135 nennen neun Sachgebiete');
  const faecher = new Set(index.faecher.map((f) => f.id));
  for (const m of index.module) {
    assert.ok(faecher.has(m.fach), `${m.id}: Fach „${m.fach}“ unbekannt`);
    for (const s of m.scheine ?? []) assert.ok(SCHEINE[s], `${m.id}: Schein „${s}“ unbekannt`);
    if (m.status === 'aktiv') assert.ok(existsSync(new URL(`../${m.pfad}module.js`, import.meta.url)), `${m.id}: module.js fehlt`);
  }
});

test('Scheinauswahl filtert nur, was ausdrücklich markiert ist', () => {
  assert.equal(passtZumSchein({}, ['spl']), true, 'ohne Markierung gilt ein Inhalt für alle');
  assert.equal(passtZumSchein({ scheine: ['ppl', 'ul'] }, []), true, 'ohne Auswahl wird alles gezeigt');
  assert.equal(passtZumSchein({ scheine: ['ppl', 'ul'] }, ['spl']), false);
  assert.equal(passtZumSchein({ scheine: ['ppl', 'ul'] }, ['spl', 'ul']), true);
  assert.equal(scheinHinweis({ scheine: ['spl'] }), 'nur SPL');
  assert.equal(scheinHinweis({}), null);
  // Alle Markierungen in den Inhalten müssen gültige Scheine nennen
  for (const m of index.module.filter((x) => x.status === 'aktiv')) {
    const pfad = new URL(`../${m.pfad}content/inhalt.json`, import.meta.url);
    if (!existsSync(pfad)) continue;
    for (const k of JSON.parse(readFileSync(pfad, 'utf8')).kapitel) {
      for (const eintrag of [k, ...(k.fragen ?? [])]) for (const s of eintrag.scheine ?? []) assert.ok(SCHEINE[s], `${m.id}/${k.id}: Schein „${s}“ unbekannt`);
    }
  }
});

test('Mensch: Sauerstoff, Tauglichkeit, Tauchen, Kollisionskurs', () => {
  const meer = sauerstoffPartialdruck(0);
  assert.ok(Math.abs(meer - 212.3) < 0.5, 'Partialdruck am Meer ≈ 212 hPa');
  assert.ok(Math.abs(sauerstoffPartialdruck(18000) / meer - 0.5) < 0.03, 'in etwa 18 000 ft halbiert');
  assert.equal(sauerstoffPflicht(9500, 120), 'keine');
  assert.equal(sauerstoffPflicht(11500, 25), 'keine');
  assert.equal(sauerstoffPflicht(11500, 40), 'besatzung');
  assert.equal(sauerstoffPflicht(13500, 5), 'alle');
  assert.equal(tauglichkeitMonate('klasse2', 30), 60);
  assert.equal(tauglichkeitMonate('klasse2', 45), 24);
  assert.equal(tauglichkeitMonate('klasse2', 55), 12);
  assert.equal(tauglichkeitMonate('lapl', 55), 24);
  assert.equal(zeitNutzbarenBewusstseins(25000), '3 bis 5 Minuten');
  assert.equal(zeitNutzbarenBewusstseins(15000), null);
  assert.equal(wartezeitNachTauchen({ hoeheFt: 5000 }), 12);
  assert.equal(wartezeitNachTauchen({ hoeheFt: 9000 }), 24);
  assert.equal(wartezeitNachTauchen({ dekompression: true, hoeheFt: 3000 }), 24);
  // Kollisionskurs: gleiche Peilung bei schrumpfendem Abstand
  const eigen = { x: 0, y: -3, kurs: 0, kt: 100 }, anderer = { x: 4, y: 1, kurs: 270, kt: 100 };
  const a = lage(eigen, anderer, 0), b = lage(eigen, anderer, 1.5);
  assert.ok(Math.abs(a.peilung - b.peilung) < 0.01 && b.abstand < a.abstand);
});
