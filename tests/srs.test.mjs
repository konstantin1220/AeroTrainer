// Verteilte Wiederholung und Fortschritt in vier Stufen (js/srs.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { karteBewerten, lernstufe, fortschrittsPunkte, statistik, statistikSumme, SICHER_AB_BOX } from '../js/srs.js';

const HEUTE = '2026-10-18';
/** Karte nach einer Folge von Antworten (true = richtig). */
const nach = (antworten) => antworten.reduce((karte, richtig) => karteBewerten(karte, richtig, HEUTE), undefined);

test('Lernstufen: ungelernt → angefangen → fortgeschritten → fertig, ein Fehler setzt zurück', () => {
  assert.equal(lernstufe(undefined), 'ungelernt');
  assert.equal(lernstufe(nach([true])), 'angefangen');
  assert.equal(lernstufe(nach([false])), 'angefangen', 'auch eine falsche Antwort ist ein Anfang');
  assert.equal(lernstufe(nach([true, true])), 'fortgeschritten');
  assert.equal(lernstufe(nach([true, true, true])), 'fortgeschritten');
  assert.equal(lernstufe(nach([true, true, true, true])), 'fertig');
  assert.equal(SICHER_AB_BOX, 4);
  assert.equal(lernstufe(nach([true, true, true, true, false])), 'angefangen');
});

test('Fortschritt wächst schon mit der ersten richtigen Antwort', () => {
  assert.equal(fortschrittsPunkte(undefined), 0);
  assert.equal(fortschrittsPunkte(nach([true])), 0.25);
  assert.equal(fortschrittsPunkte(nach([true, true])), 0.5);
  assert.equal(fortschrittsPunkte(nach([true, true, true, true, true])), 1, 'mehr als fertig gibt es nicht');
  // Alte Lernstände können Karten mit Fach 0 enthalten – sie zählen wie angefangen.
  assert.equal(lernstufe({ b: 0, f: HEUTE }), 'angefangen');
  assert.equal(fortschrittsPunkte({ b: 0, f: HEUTE }), 0.25);
});

test('Statistik zählt die Stufen und lässt sich über Themen addieren', () => {
  const karten = { a: nach([true]), b: nach([true, true]), c: nach([true, true, true, true]) };
  const s = statistik(['a', 'b', 'c', 'd'], karten, HEUTE);
  assert.deepEqual([s.ungelernt, s.angefangen, s.fortgeschritten, s.fertig], [1, 1, 1, 1]);
  assert.equal(s.sicher, s.fertig);
  assert.equal(s.gesehen, 3);
  assert.equal(s.fortschritt, (0.25 + 0.5 + 1) / 4);
  const summe = statistikSumme([s, statistik(['x'], {}, HEUTE)]);
  assert.equal(summe.gesamt, 5);
  assert.equal(summe.fortschritt, (0.25 + 0.5 + 1) / 5);
  assert.equal(statistikSumme([]).fortschritt, 0);
});
