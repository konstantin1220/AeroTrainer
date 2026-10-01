// Tests für den METAR-Parser. Ausführen im Projektordner mit: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { zerlegen, wetterText } from '../modules/metar/metar.js';

const json = (pfad) => JSON.parse(readFileSync(new URL(pfad, import.meta.url), 'utf8'));
const { beispiele } = json('../modules/metar/content/beispiele.json');
const { gruppen: texte } = json('../modules/metar/content/gruppen.json');

const gruppe = (metar, text) => zerlegen(metar).find((g) => g.text === text);

test('alle Beispiel-METARs werden vollständig erkannt', () => {
  for (const b of beispiele) {
    const unbekannt = zerlegen(b.metar).filter((g) => g.typ === 'unbekannt').map((g) => g.text);
    assert.deepEqual(unbekannt, [], `${b.id}: ${unbekannt.join(' ')}`);
  }
});

test('zu jedem vorkommenden Gruppentyp gibt es eine Erklärung', () => {
  for (const b of beispiele) {
    for (const g of zerlegen(b.metar)) assert.ok(texte[g.typ], `Erklärung für „${g.typ}“ fehlt`);
  }
});

test('Beispiel-IDs sind eindeutig', () => {
  const ids = beispiele.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('Wind', () => {
  assert.equal(gruppe('METAR EDDS 011020Z 24008KT CAVOK', '24008KT').bedeutung, 'Wind aus 240° mit 8 kt');
  assert.equal(gruppe('METAR EDDS 011020Z 23015G28KT 9999', '23015G28KT').bedeutung, 'Wind aus 230° mit 15 kt, Böen bis 28 kt');
  assert.equal(gruppe('METAR EDDS 011020Z VRB03KT 9999', 'VRB03KT').bedeutung, 'Wind aus wechselnden Richtungen mit 3 kt');
  assert.equal(gruppe('METAR EDDS 011020Z 00000KT 9999', '00000KT').bedeutung, 'Windstille');
});

test('Sicht und geringste Sicht', () => {
  const g = zerlegen('METAR EDDN 060450Z 00000KT 1500 0800NE BCFG');
  assert.equal(g[4].typ, 'sicht');
  assert.equal(g[4].bedeutung, 'Sicht 1500 m');
  assert.equal(g[5].typ, 'mindestsicht');
  assert.equal(gruppe('METAR EDDS 011020Z 24008KT 9999', '9999').bedeutung, 'Sicht 10 km oder mehr');
});

test('Wettererscheinungen', () => {
  assert.equal(wetterText('-SHRA'), 'Schauer mit Regen – leicht');
  assert.equal(wetterText('+TSRA'), 'Gewitter mit Regen – stark');
  assert.equal(wetterText('RA'), 'Regen – mäßig');
  assert.equal(wetterText('VCSH'), 'Schauer – in der Umgebung (8–16 km vom Flugplatz)');
  assert.equal(wetterText('BR'), 'Feuchter Dunst');
  assert.equal(wetterText('FZFG'), 'Gefrierender Nebel');
  assert.equal(wetterText('BCFG'), 'Nebelschwaden');
  assert.equal(wetterText('RASN'), 'Regen und Schnee – mäßig');
  assert.equal(wetterText('BLSN'), 'Schneetreiben (2 m hoch oder mehr) – mäßig');
  assert.equal(wetterText('NSC'), null);
  assert.equal(wetterText('Q1013'), null);
});

test('Hauptwolkenuntergrenze ist die niedrigste BKN/OVC-Schicht außerhalb des Trends', () => {
  const g = zerlegen('METAR EDDN 030620Z 27012KT 4000 -RA BR SCT005 BKN008 OVC015 11/10 Q1003 BECMG BKN004');
  const markiert = g.filter((x) => x.hauptwolkenuntergrenze).map((x) => x.text);
  assert.deepEqual(markiert, ['BKN008']);
});

test('Temperatur mit Minuswerten und Spread', () => {
  assert.equal(gruppe('METAR EDDS 041750Z 08004KT 9999 M02/M05', 'M02/M05').bedeutung,
    'Temperatur −2 °C, Taupunkt −5 °C, Spread 3 °C');
  assert.match(gruppe('METAR EDDS 041750Z 08004KT 0400 FG 08/08', '08/08').bedeutung, /sehr feuchte Luft/);
});

test('Trend-Gruppen werden markiert', () => {
  const g = zerlegen('METAR EDDH 071320Z 19012KT 9999 SCT030 23/14 Q1012 TEMPO FM1400 TL1500 4000 TSRA');
  assert.equal(g.find((x) => x.text === '9999').imTrend, false);
  assert.equal(g.find((x) => x.text === '4000').imTrend, true);
  assert.equal(g.find((x) => x.text === '4000').typ, 'sicht');
  assert.equal(g.find((x) => x.text === 'FM1400').bedeutung, 'Ab 14:00 UTC');
});

test('RVR, Windscherung, RMK', () => {
  assert.equal(gruppe('METAR EDDS 020550Z 00000KT 0400 R25/0550D FG', 'R25/0550D').bedeutung,
    'Pistensichtweite auf Piste 25: 550 m, abnehmend');
  assert.equal(gruppe('METAR EDDS 020550Z 00000KT 0400 R25/P2000N', 'R25/P2000N').bedeutung,
    'Pistensichtweite auf Piste 25: mehr als 2000 m, gleichbleibend');
  assert.equal(gruppe('METAR EDDF 011020Z 24008KT 9999 Q1013 WS R25C', 'WS R25C').typ, 'windscherung');
  const rmk = zerlegen('METAR XXXX 011020Z 24008KT 9999 Q1013 RMK AO2 SLP132').at(-1);
  assert.equal(rmk.typ, 'rmk');
  assert.equal(rmk.text, 'RMK AO2 SLP132');
});
