// Prüft alle Lerninhalte: Aufbau der Inhaltsdateien, jede Frage, jede Abbildung und
// jede Rechenaufgabe (300 zufällige Durchläufe je Generator). Ausführen mit: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { frageProblem, bewerten, loesungText } from '../js/fragen.js';
import { THEORIE_BLOCKTYPEN_LISTE } from './hilfen.mjs';
import { zufallsquelle } from '../js/zufall.js';

const json = (pfad) => JSON.parse(readFileSync(new URL(pfad, import.meta.url), 'utf8'));
const { module } = json('../modules/index.json');
const aktiv = module.filter((m) => m.status === 'aktiv');

/** Lädt Generatoren und Abbildungen eines Moduls (auch solche, die Daten brauchen). */
async function modulTeile(id) {
  const basis = new URL(`../modules/${id}/`, import.meta.url);
  const laden = async (datei) => (existsSync(new URL(datei, basis)) ? import(new URL(datei, basis)) : {});
  const g = await laden('generatoren.js');
  const a = await laden('abbildungen.js');
  const datenDatei = ['content/flugzeug.json', 'content/plaetze.json'].map((d) => new URL(d, basis)).find((u) => existsSync(u));
  const daten = datenDatei ? JSON.parse(readFileSync(datenDatei, 'utf8')) : null;
  const i = await laden('interaktiv.js');
  return {
    generatoren: g.generatoren ?? g.erstelleGeneratoren?.(daten) ?? {},
    abbildungen: a.abbildungen ?? a.abbildungenFuer?.(daten) ?? {},
    interaktiv: i.interaktiv ?? i.interaktivFuer?.(daten) ?? {},
  };
}

function richtigeAntwort(frage) {
  switch (frage.typ) {
    case 'auswahl': return frage.richtig;
    case 'mehrfach': return [...frage.richtig];
    case 'wahrfalsch': return frage.richtig;
    case 'zahl': return String(frage.loesung);
    case 'zuordnung': return frage.paare.map((p) => p[1]);
    default: return undefined;
  }
}

function frageVollstaendigPruefen(frage, ort, abbildungen) {
  const problem = frageProblem(frage);
  assert.equal(problem, null, `${ort}: ${problem}`);
  assert.ok(bewerten(frage, richtigeAntwort(frage)), `${ort}: die eigene Lösung wird nicht als richtig erkannt`);
  assert.ok(loesungText(frage).length > 0, `${ort}: kein Lösungstext`);
  if (frage.abbildung) assert.ok(abbildungen[frage.abbildung], `${ort}: Abbildung „${frage.abbildung}“ fehlt`);
  if (frage.svg) assert.match(frage.svg, /^<svg[\s\S]*<\/svg>$/, `${ort}: svg ist keine SVG-Grafik`);
  if (frage.typ === 'auswahl') assert.ok(frage.falsch.every((f) => !bewerten(frage, f)), `${ort}: eine falsche Antwort gilt als richtig`);
  if (frage.typ === 'zahl') assert.ok(!bewerten(frage, String(frage.loesung + (frage.toleranz ?? 0) + Math.max(1, Math.abs(frage.loesung) * 0.2))), `${ort}: Toleranz zu groß`);
}

const alleIds = new Set();

for (const modul of aktiv) {
  const pfad = `../modules/${modul.id}/content/inhalt.json`;
  if (!existsSync(new URL(pfad, import.meta.url))) continue;

  test(`Inhalte: ${modul.titel}`, async () => {
    const inhalt = json(pfad);
    const { generatoren, abbildungen, interaktiv } = await modulTeile(modul.id);
    for (const [id, element] of Object.entries(interaktiv)) {
      assert.ok(element.titel && element.kurz && typeof element.erstellen === 'function', `interaktives Element „${id}“ unvollständig`);
      assert.ok(typeof element.anleitung === 'string' && element.anleitung.length > 40, `interaktives Element „${id}“: Anleitung fehlt`);
      assert.ok(!element.probier || (Array.isArray(element.probier) && element.probier.every((t) => typeof t === 'string' && t)), `interaktives Element „${id}“: „probier“ muss eine Liste von Texten sein`);
      for (const [farbe, beschreibung] of element.legende ?? []) {
        assert.ok(['text', 'leise', 'primaer', 'orange', 'ok', 'fehler', 'luft', 'mf'].includes(farbe) && beschreibung, `interaktives Element „${id}“: Legendenfarbe „${farbe}“ unbekannt`);
      }
    }
    assert.ok(Array.isArray(inhalt.kapitel) && inhalt.kapitel.length > 0, 'keine Kapitel');
    assert.ok('_geprueft' in inhalt, '_geprueft fehlt');

    const kapitelIds = new Set();
    for (const kapitel of inhalt.kapitel) {
      assert.ok(kapitel.id && !kapitelIds.has(kapitel.id), `Kapitel-ID doppelt oder leer: ${kapitel.id}`);
      kapitelIds.add(kapitel.id);
      assert.ok(kapitel.titel, `${kapitel.id}: Titel fehlt`);
      assert.ok((kapitel.fragen ?? []).length >= 3, `${kapitel.id}: zu wenige Fragen`);
      assert.ok(Array.isArray(kapitel.kern) && kapitel.kern.length >= 2, `${kapitel.id}: „kern“ (Das Wichtigste) fehlt`);
      assert.ok((kapitel.theorie ?? []).some((b) => b.typ === 'einfach'), `${kapitel.id}: „Einfach erklärt“ fehlt`);

      for (const block of kapitel.theorie ?? []) {
        assert.ok(THEORIE_BLOCKTYPEN_LISTE.includes(block.typ), `${kapitel.id}: Blocktyp „${block.typ}“ unbekannt`);
        if (block.typ === 'abbildung') {
          assert.ok(abbildungen[block.id], `${kapitel.id}: Abbildung „${block.id}“ fehlt`);
          assert.match(abbildungen[block.id](), /^<svg[\s\S]*<\/svg>$/);
        }
        if (block.typ === 'interaktiv') assert.ok(interaktiv[block.id], `${kapitel.id}: interaktives Element „${block.id}“ fehlt`);
        if (block.typ === 'tabelle') {
          for (const zeile of block.zeilen) assert.equal(zeile.length, block.kopf?.length ?? zeile.length, `${kapitel.id}: Tabellenzeile hat falsche Spaltenzahl`);
        }
      }

      for (const quelle of kapitel.fragen) {
        assert.ok(quelle.id, `${kapitel.id}: Frage ohne ID`);
        assert.ok(!alleIds.has(quelle.id), `Frage-ID doppelt: ${quelle.id}`);
        alleIds.add(quelle.id);
        if (quelle.typ === 'generator') {
          const generator = generatoren[quelle.generator];
          assert.ok(generator, `${quelle.id}: Generator „${quelle.generator}“ fehlt`);
          const z = zufallsquelle(quelle.id.length * 7919);
          for (let i = 0; i < 300; i++) {
            const frage = generator(z, quelle);
            frageVollstaendigPruefen(frage, `${quelle.id} (Durchlauf ${i})`, abbildungen);
            // Gemerkte Rechenaufgaben werden als JSON gespeichert – das muss verlustfrei gehen.
            assert.deepStrictEqual(JSON.parse(JSON.stringify(frage)), frage, `${quelle.id}: erzeugte Frage lässt sich nicht verlustfrei speichern`);
          }
        } else {
          frageVollstaendigPruefen(quelle, quelle.id, abbildungen);
        }
      }
    }
  });
}

test('Service Worker kennt alle Dateien der App', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const liste = [...sw.matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1]);
  const wurzel = new URL('../', import.meta.url);
  const alle = [];
  const sammeln = (ordner) => {
    for (const name of readdirSync(new URL(ordner, wurzel))) {
      const pfad = `${ordner}${name}`;
      if (statSync(new URL(pfad, wurzel)).isDirectory()) sammeln(`${pfad}/`);
      else if (!name.startsWith('.')) alle.push(pfad);
    }
  };
  ['js/', 'css/', 'icons/', 'modules/'].forEach(sammeln);
  for (const datei of alle) assert.ok(liste.includes(datei), `sw.js: ${datei} fehlt in DATEIEN`);
  for (const datei of liste.filter((d) => d !== './')) assert.ok(existsSync(new URL(datei, wurzel)), `sw.js: ${datei} gibt es nicht`);
});

test('Lexikon: Aufbau und Verweise', () => {
  const { begriffe } = json('../modules/lexikon.json');
  const ids = new Set();
  const varianten = new Map();
  const themen = new Set(module.map((m) => m.id));
  for (const b of begriffe) {
    assert.ok(b.id && !ids.has(b.id), `Lexikon: ID doppelt oder leer: ${b.id}`);
    ids.add(b.id);
    assert.ok(b.begriff && b.kurz && b.kurz.length > 20, `${b.id}: Begriff oder Erklärung fehlt`);
    assert.ok(Array.isArray(b.suche) && b.suche.length > 0, `${b.id}: „suche“ fehlt`);
    if (b.thema) assert.ok(themen.has(b.thema), `${b.id}: Thema „${b.thema}“ unbekannt`);
    for (const v of b.suche) {
      assert.ok(!varianten.has(v), `Lexikon: Schreibweise „${v}“ doppelt (${varianten.get(v)} und ${b.id})`);
      varianten.set(v, b.id);
    }
  }
  assert.ok(begriffe.length >= 80);
});

test('Quellen: jedes Thema hat Einträge, Verweise und Status stimmen', () => {
  const daten = json('../modules/quellen.json');
  const quellen = new Set(daten.quellen.map((q) => q.id));
  assert.equal(quellen.size, daten.quellen.length, 'doppelte Quellen-ID');
  assert.match(daten.abgleich, /^\d{4}-\d{2}-\d{2}$/, 'Datum des Abgleichs im Format JJJJ-MM-TT');
  for (const q of daten.quellen) {
    assert.ok(q.titel && q.voll && q.art, `Quelle „${q.id}“ unvollständig`);
    if (q.link) assert.match(q.link, /^https:\/\//, `Quelle „${q.id}“: Link muss mit https:// beginnen`);
  }
  for (const m of aktiv) assert.ok(daten.themen.some((t) => t.modul === m.id), `Für das Thema „${m.id}“ fehlen Quellenangaben`);
  for (const thema of daten.themen) {
    assert.ok(aktiv.some((m) => m.id === thema.modul), `Quellen für unbekanntes Thema „${thema.modul}“`);
    for (const p of thema.punkte) {
      assert.ok(p.inhalt, `${thema.modul}: Eintrag ohne Inhalt`);
      assert.ok(['abgeglichen', 'grundlage', 'herleitung', 'erfunden', 'offen'].includes(p.status), `${thema.modul}: unbekannter Status „${p.status}“`);
      if (p.status !== 'erfunden') assert.ok(quellen.has(p.quelle), `${thema.modul}: Quelle „${p.quelle}“ fehlt in der Quellenliste`);
      if (p.status === 'abgeglichen') assert.ok(p.fundstelle, `${thema.modul}: „${p.inhalt}“ ist abgeglichen, aber ohne Fundstelle`);
    }
  }
});

test('Impressum: entweder leer oder mit Name und Anschrift', () => {
  const daten = json('../modules/impressum.json');
  assert.ok(Array.isArray(daten.anschrift), 'anschrift muss eine Liste von Zeilen sein');
  if (daten.name) {
    assert.ok(daten.anschrift.length >= 2, 'Impressum braucht eine vollständige (ladungsfähige) Anschrift');
    if (daten.email) {
      assert.ok(!daten.email.includes('@'), 'E-Mail bitte verschleiert eintragen („name (at) domain.de“), damit Spam-Bots sie nicht finden');
      assert.match(daten.email, /^[^@\s]+ [[(]at[\])] [^@\s]+\.[^@\s]+$/, 'E-Mail im Format „name (at) domain.de“ oder „name [at] domain.de“ eintragen');
    }
  }
});
