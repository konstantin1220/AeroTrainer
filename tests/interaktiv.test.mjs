// Prüft die Rechenlogik hinter den interaktiven Darstellungen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vmcMinima, ctrErgebnis, vorflug } from '../modules/luftraum/interaktiv.js';
import { kondensationsHoehe, isa } from '../modules/meteorologie/interaktiv.js';
import { auftriebsbeiwert } from '../modules/aerodynamik/interaktiv.js';
import { sprechweise, buchstabieren } from '../modules/sprechfunk/interaktiv.js';
import { metarBauen } from '../modules/metar/interaktiv.js';
import { zerlegen } from '../modules/metar/metar.js';

test('Sichtflugbedingungen', () => {
  assert.equal(vmcMinima('G', 500, 2000).abstand, 'frei von Wolken, mit Erdsicht');
  assert.equal(vmcMinima('G', 500, 2000).sicht, '1,5 km');
  assert.equal(vmcMinima('E', 500, 2000).abstand, '1500 m waagerecht, 1000 ft senkrecht');
  assert.equal(vmcMinima('G', 2800, 3500).frei, true, '1000 ft GND = 3800 ft MSL ist höher als 3000 ft');
  assert.equal(vmcMinima('G', 2800, 3900).frei, false);
  assert.equal(vmcMinima('G', 0, 10500).sicht, '8 km');
});

test('Kontrollzone', () => {
  assert.equal(ctrErgebnis(5000, 1500), 'vfr');
  assert.equal(ctrErgebnis(4900, 1500), 'sonder');
  assert.equal(ctrErgebnis(1500, 600), 'sonder');
  assert.equal(ctrErgebnis(1400, 3000), 'nein');
  assert.equal(ctrErgebnis(8000, 500), 'nein');
});

test('Ausweichregeln', () => {
  assert.equal(vorflug('motor', 'motor', 'rechts').du, 'ausweichen');
  assert.equal(vorflug('motor', 'motor', 'links').du, 'vorflug');
  assert.equal(vorflug('motor', 'segel', 'links').du, 'ausweichen');
  assert.equal(vorflug('segel', 'motor', 'rechts').du, 'vorflug');
  assert.equal(vorflug('segel', 'ballon', 'links').du, 'ausweichen');
  assert.equal(vorflug('ballon', 'segel', 'rechts').du, 'vorflug');
  assert.equal(vorflug('motor', 'schlepp', 'links').du, 'ausweichen');
  assert.equal(vorflug('segel', 'schlepp', 'rechts').du, 'unklar');
  assert.equal(vorflug('schlepp', 'ballon', 'links').du, 'ausweichen');
  assert.equal(vorflug('ballon', 'schlepp', 'rechts').du, 'vorflug');
  assert.match(vorflug('motor', 'ballon', 'links').text, /einem Ballon/);
  assert.match(vorflug('ballon', 'segel', 'rechts').text, /^Das Segelflugzeug/);
  assert.equal(vorflug('segel', 'ballon', 'gegen').du, 'beide');
  assert.equal(vorflug('ballon', 'motor', 'ueberholen').du, 'ausweichen');
});

test('Meteorologie', () => {
  assert.equal(kondensationsHoehe(20, 12), 1000);
  const meer = isa(0);
  assert.ok(Math.abs(meer.t - 15) < 0.01 && Math.abs(meer.p - 1013.25) < 0.01 && Math.abs(meer.dichte - 1) < 0.001);
  assert.ok(Math.abs(isa(18000).p - 506) < 8, 'in 18 000 ft etwa halber Druck');
  assert.ok(Math.abs(isa(40000).t + 56.5) < 0.01);
  assert.ok(Math.abs(isa(10000).t - (15 - 0.0065 * 3048)) < 0.01);
});

test('Aerodynamik: Auftriebsbeiwert steigt bis zum kritischen Anstellwinkel', () => {
  let vorher = -Infinity;
  for (let a = -4; a <= 16; a++) { assert.ok(auftriebsbeiwert(a) > vorher); vorher = auftriebsbeiwert(a); }
  assert.ok(auftriebsbeiwert(19) < auftriebsbeiwert(16));
});

test('Sprechfunk', () => {
  assert.equal(sprechweise('frequenz', '121,5').text, 'one two one decimal five');
  assert.equal(sprechweise('frequenz', '118.050').text, 'one one eight decimal zero five zero');
  assert.equal(sprechweise('qnh', '998').text, 'QNH niner niner eight');
  assert.equal(sprechweise('hoehe', '2500').text, 'two thousand five hundred feet');
  assert.equal(sprechweise('hoehe', '10000').text, 'one zero thousand feet');
  assert.equal(sprechweise('kurs', '0').text, 'heading three six zero');
  assert.equal(sprechweise('kurs', '90').text, 'heading zero niner zero');
  assert.equal(sprechweise('squawk', '7000').text, 'squawk seven zero zero zero');
  assert.ok(sprechweise('squawk', '7800').fehler);
  assert.equal(sprechweise('wind', '240/12').text, 'wind two four zero degrees one two knots');
  assert.deepEqual(buchstabieren('D-EK2', 'deutsch').map((t) => t.wort), ['Delta', 'Echo', 'Kilo', 'zwo']);
});

const STANDARD = { wind: 240, staerke: 12, boeen: 0, sicht: 10000, wetter: '', schicht1: 'FEW', hoehe1: 3500, art1: '', schicht2: '', hoehe2: 6000, t: 18, td: 9, qnh: 1013, trend: 'NOSIG' };

test('METAR-Baukasten', () => {
  assert.equal(metarBauen(STANDARD).text, 'METAR XMUS 121420Z 24012KT 9999 FEW035 18/09 Q1013 NOSIG');
  assert.equal(metarBauen({ ...STANDARD, hoehe1: 6000 }).text, 'METAR XMUS 121420Z 24012KT CAVOK 18/09 Q1013 NOSIG');
  assert.equal(metarBauen({ ...STANDARD, boeen: 18 }).text.includes('G18'), false, 'Böen unter Mittelwind + 10 werden nicht gemeldet');
  assert.ok(metarBauen({ ...STANDARD, boeen: 25 }).text.includes('24012G25KT'));
  assert.ok(metarBauen({ ...STANDARD, staerke: 0 }).text.includes('00000KT'));
  assert.ok(metarBauen({ ...STANDARD, qnh: 998 }).text.includes('Q0998'));
  assert.ok(metarBauen({ ...STANDARD, wetter: 'FG', sicht: 3000 }).hinweise.length > 0);
  // alles, was der Baukasten erzeugt, muss der Parser verstehen
  for (const sicht of [10000, 3000, 300]) for (const wetter of ['', '-SHRA', 'TSRA', 'FG']) for (const schicht1 of ['', 'BKN']) {
    const { text } = metarBauen({ ...STANDARD, sicht, wetter, schicht1, art1: wetter === 'TSRA' ? 'CB' : '', t: -3, td: -5 });
    assert.deepEqual(zerlegen(text).filter((g) => g.typ === 'unbekannt'), [], text);
  }
});
