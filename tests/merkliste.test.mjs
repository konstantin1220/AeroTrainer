// Merkliste: Schlüssel für feste und erzeugte Fragen, Merken und Entfernen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merkSchluessel, frageText } from '../js/merkliste.js';
import * as lernstand from '../js/storage.js';

test('Schlüssel: feste Fragen über Modul und ID, erzeugte zusätzlich über den Inhalt', () => {
  assert.equal(merkSchluessel({ modul: 'luftraum', id: 'lr-ctr-06', erzeugt: false }, { frage: 'egal' }), 'luftraum/lr-ctr-06');
  const frage = { typ: 'zahl', frage: 'Wie groß ist der Luvwinkel?', loesung: 7, einheit: '°' };
  const info = { modul: 'navigation', id: 'nav-wd-01', erzeugt: true };
  const a = merkSchluessel(info, frage);
  assert.match(a, /^navigation\/nav-wd-01\/[0-9a-z]+$/);
  assert.equal(merkSchluessel(info, JSON.parse(JSON.stringify(frage))), a, 'gespeicherte Kopie muss denselben Schlüssel ergeben');
  assert.notEqual(merkSchluessel(info, { ...frage, loesung: 8 }), a, 'andere Zahlen = andere Aufgabe');
});

test('Fragetext für Listen', () => {
  assert.equal(frageText({ typ: 'wahrfalsch', aussage: 'A' }), 'A');
  assert.equal(frageText({ typ: 'auswahl', frage: 'B' }), 'B');
});

test('Merken, doppelt merken und entfernen', () => {
  const eintrag = { schluessel: 'test/x-1', modul: 'test', id: 'x-1' };
  lernstand.merken(eintrag);
  lernstand.merken(eintrag);
  assert.equal(lernstand.merkliste().filter((e) => e.schluessel === 'test/x-1').length, 1);
  assert.ok(lernstand.istGemerkt('test/x-1'));
  assert.ok(lernstand.merkliste()[0].gemerkt, 'Datum wird gesetzt');
  lernstand.vergessen('test/x-1');
  assert.ok(!lernstand.istGemerkt('test/x-1'));
});
