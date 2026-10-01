// Prüft den METAR-Generator (3000 zufällige METARs müssen lesbar sein und die Melderegeln
// einhalten) sowie die Aufgaben der Lernstufen 2–4.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metarErzeugen, LAGEN, STATIONEN } from '../modules/metar/erzeugen.js';
import { zerlegen, auswerten } from '../modules/metar/metar.js';
import { zufallsquelle } from '../js/zufall.js';
import { readFileSync } from 'node:fs';
import { entschluesselnFragen, bauenVergleichen, beschreibung, szenarioErzeugen, windKomponenten, ctrEntscheidung } from '../modules/metar/aufgaben.js';
import { frageProblem, bewerten } from '../js/fragen.js';

const z = zufallsquelle(4711);
const beispiele = [];
for (let i = 0; i < 3000; i++) {
  const stufe = (i % 5) + 1;
  beispiele.push(metarErzeugen(z, { stufe }));
}

test('alle Lagen kommen vor', () => {
  const lagen = new Set(beispiele.map((b) => b.lage));
  for (const liste of Object.values(LAGEN)) for (const lage of liste) assert.ok(lagen.has(lage), lage);
});

test('jede Gruppe wird erkannt', () => {
  for (const { text } of beispiele) {
    const unbekannt = zerlegen(text).filter((g) => g.typ === 'unbekannt');
    assert.deepEqual(unbekannt.map((g) => g.text), [], text);
  }
});

test('Melderegeln werden eingehalten', () => {
  for (const { text } of beispiele) {
    const a = auswerten(text);
    const g = a.gruppen;
    const aktuell = g.filter((x) => !x.imTrend);
    // Wind
    if (a.wind?.boeen) assert.ok(a.wind.boeen >= a.wind.staerke + 10, `Böen zu schwach: ${text}`);
    if (a.wind?.vrb) assert.ok(a.wind.staerke <= 3, `VRB bei starkem Wind: ${text}`);
    if (a.windvariabel) {
      const spanne = (a.windvariabel.bis - a.windvariabel.von + 360) % 360;
      assert.ok(spanne >= 60 && spanne < 180, `Schwankung ${spanne}°: ${text}`);
      assert.ok(a.wind.staerke >= 3, `Schwankungsgruppe bei < 3 kt: ${text}`);
    }
    // Sicht und Wetter
    if (a.wetter.includes('FG')) assert.ok(a.sicht < 1000, `FG bei Sicht ${a.sicht}: ${text}`);
    if (a.wetter.includes('BR')) assert.ok(a.sicht >= 1000 && a.sicht <= 5000, `BR bei Sicht ${a.sicht}: ${text}`);
    if (a.wetter.some((w) => /TS/.test(w))) assert.ok(aktuell.some((x) => /CB$/.test(x.text)), `Gewitter ohne CB: ${text}`);
    if (a.wetter.some((w) => /SN/.test(w))) assert.ok(a.temperatur <= 2, `Schnee bei ${a.temperatur} °C: ${text}`);
    if (a.wetter.some((w) => /FZ/.test(w))) assert.ok(a.temperatur <= 0, `gefrierend bei ${a.temperatur} °C: ${text}`);
    // CAVOK
    if (a.cavok) assert.ok(!aktuell.some((x) => x.typ === 'wolken' || x.typ === 'wetter'), `CAVOK mit Wolken/Wetter: ${text}`);
    if (!a.cavok && a.sicht >= 10000 && a.wetter.length === 0) {
      assert.ok(a.wolken.some((w) => (w.hoehe !== null && w.hoehe < 5000) || w.art), `hätte CAVOK sein müssen: ${text}`);
    }
    // Wolken: aufsteigend, 2. Schicht ≥ SCT, 3. ≥ BKN
    const schichten = a.wolken.filter((w) => ['FEW', 'SCT', 'BKN', 'OVC'].includes(w.menge) && !w.art);
    const rang = { FEW: 1, SCT: 2, BKN: 3, OVC: 4 };
    schichten.forEach((w, i) => {
      if (i === 1) assert.ok(rang[w.menge] >= 2, `2. Schicht < SCT: ${text}`);
      if (i >= 2) assert.ok(rang[w.menge] >= 3, `3. Schicht < BKN: ${text}`);
      if (i > 0) assert.ok(w.hoehe > schichten[i - 1].hoehe, `Schichten nicht aufsteigend: ${text}`);
    });
    // Temperatur
    assert.ok(a.taupunkt <= a.temperatur, `Taupunkt über Temperatur: ${text}`);
    // RVR nur bei schlechter Sicht
    if (g.some((x) => x.typ === 'rvr')) assert.ok(a.sicht < 1500, `RVR bei Sicht ${a.sicht}: ${text}`);
  }
});

// ---------- Aufgaben der Stufen 2–4 ----------

const plaetze = JSON.parse(readFileSync(new URL('../modules/metar/content/plaetze.json', import.meta.url), 'utf8'));
const richtigeAntwort = (f) => ({ auswahl: f.richtig, wahrfalsch: f.richtig, zahl: String(f.loesung), mehrfach: f.richtig })[f.typ];

test('Stufe 2: alle Entschlüsselungsfragen sind gültig', () => {
  for (const { text } of beispiele.slice(0, 1000)) {
    const fragen = entschluesselnFragen(z, text);
    assert.ok(fragen.length >= 5, `zu wenige Fragen: ${text}`);
    for (const f of fragen) {
      assert.equal(frageProblem(f), null, `${frageProblem(f)}: ${f.frage} – ${text}`);
      assert.ok(bewerten(f, richtigeAntwort(f)), `${f.frage} – ${text}`);
      assert.ok(f.gruppen.some((g) => g.markiert), `nichts markiert: ${f.frage} – ${text}`);
    }
  }
});

test('Stufe 3: Beschreibung und Vergleich', () => {
  for (const { text } of beispiele.slice(0, 300)) {
    assert.equal(beschreibung(text).length, text.split(' ').length);
    assert.ok(bauenVergleichen(text.toLowerCase() + '=', text).richtig);
    const teile = text.split(' ');
    const ohne = [...teile.slice(0, 3), ...teile.slice(4)].join(' ');
    const ergebnis = bauenVergleichen(ohne, text);
    assert.ok(!ergebnis.richtig);
    assert.equal(ergebnis.soll.filter((t) => !t.ok).length, 1, `genau eine Gruppe fehlt: ${text}`);
  }
});

test('Stufe 4: Szenarien liefern gültige Fragen', () => {
  for (let i = 0; i < 500; i++) {
    const { fragen, platz } = szenarioErzeugen(z, plaetze);
    assert.ok(fragen.length >= 2, `zu wenige Fragen für ${platz.kennung}`);
    for (const f of fragen) {
      assert.equal(frageProblem(f), null, f.frage);
      assert.ok(bewerten(f, richtigeAntwort(f)), f.frage);
    }
  }
});

test('Windkomponenten und Kontrollzonen-Minima', () => {
  const k = windKomponenten(280, 16, '25');
  assert.ok(Math.abs(k.seite - 8) < 0.01 && k.vonRechts);
  assert.ok(Math.abs(k.gegen - 13.86) < 0.01);
  assert.ok(!windKomponenten(220, 10, '25').vonRechts);
  assert.equal(ctrEntscheidung(5000, 1500), 'vfr');
  assert.equal(ctrEntscheidung(10000, null), 'vfr');
  assert.equal(ctrEntscheidung(4900, 3000), 'sonder');
  assert.equal(ctrEntscheidung(8000, 1400), 'sonder');
  assert.equal(ctrEntscheidung(1500, 600), 'sonder');
  assert.equal(ctrEntscheidung(1400, 2000), 'nein');
  assert.equal(ctrEntscheidung(3000, 500), 'nein');
});

test('Übungs-METARs nutzen nur erfundene Plätze des Übungsgebiets', () => {
  const plaetze = JSON.parse(readFileSync(new URL('../modules/metar/content/plaetze.json', import.meta.url), 'utf8')).plaetze;
  for (const station of STATIONEN) {
    const platz = plaetze.find((p) => p.kennung === station.kennung);
    assert.ok(platz, `${station.kennung} fehlt in plaetze.json`);
    assert.deepEqual(station.pisten, platz.pisten, `${station.kennung}: Pisten passen nicht zur Übungskarte`);
  }
  for (const m of beispiele) assert.match(zerlegen(m.text).find((g) => g.typ === 'station').text, /^X/, `echte Kennung im erzeugten METAR: ${m.text}`);
  const feste = JSON.parse(readFileSync(new URL('../modules/metar/content/beispiele.json', import.meta.url), 'utf8')).beispiele;
  for (const b of feste) assert.match(zerlegen(b.metar).find((g) => g.typ === 'station').text, /^X/, `${b.id}: echte Kennung im Beispiel-METAR`);
});
