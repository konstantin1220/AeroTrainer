// Prüft die Funkgespräche (modules/sprechfunk/content/funkgespraeche.json) und die gesprochene
// Form von Zahlen nach der Bekanntmachung über die Sprechfunkverfahren (NfL 2024-1-3266, Nr. 10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { zufallsquelle } from '../js/zufall.js';
import { szenarioWerte, fuellen, freitextPruefen, bausteine, einzelwoerter, reihenfolgePruefen, normalisieren, wortschatz, abstand, geruest } from '../modules/sprechfunk/funklogik.js';
import { STATIONEN } from '../modules/sprechfunk/uebungsgebiet.js';
import { abbildungen } from '../modules/sprechfunk/abbildungen.js';
import * as funk from '../modules/sprechfunk/funkwerte.js';

const { szenarien } = JSON.parse(readFileSync(new URL('../modules/sprechfunk/content/funkgespraeche.json', import.meta.url), 'utf8'));
const RADIO_STATIONEN = ['altdorf', 'bergen'];
const WOERTER = wortschatz(szenarien);

test('Zahlen werden nach NfL 2024-1-3266 gesprochen', () => {
  // Beispiele aus der Bekanntmachung, Nr. 10
  assert.equal(funk.frequenz('118.005', 'en'), 'one one eight decimal zero zero five');
  assert.equal(funk.frequenz('118.000', 'de'), 'eins eins acht komma null');
  assert.equal(funk.frequenz('118.100', 'en'), 'one one eight decimal one');
  assert.equal(funk.qnh(1009, 'en'), 'one zero zero niner');
  assert.equal(funk.qnh(1000, 'de'), 'ein tausend');
  assert.equal(funk.qnh(993, 'de'), 'neun neun drei');
  assert.equal(funk.squawk('2400', 'de'), 'zwo vier null null');
  assert.equal(funk.squawk('1000', 'en'), 'one thousand');
  assert.equal(funk.squawk('2000', 'de'), 'zwo tausend');
  assert.equal(funk.hoehe(800, 'en'), 'eight hundred');
  assert.equal(funk.hoehe(3400, 'de'), 'drei tausend vier hundert');
  assert.equal(funk.hoehe(12000, 'en'), 'one two thousand');
  assert.equal(funk.hoehe(1700, 'de'), 'ein tausend sieben hundert');
  assert.equal(funk.kurzform('D-EKLM'), 'D-LM');
  assert.equal(funk.sprechen('D-EKLM, Piste 27, QNH 1013', 'de'), 'Delta Echo Kilo Lima Mike, Piste zwo sieben, QNH eins null eins drei');
  assert.equal(funk.sprechen('traffic 10 o\'clock, squawk 7000', 'en'), 'traffic ten o\'clock, squawk seven thousand');
});

test('Freie Eingabe: tolerant bei Schreibweise, streng bei Inhalt', () => {
  assert.equal(normalisieren('D-EKLM, Rolle zum Rollhalt Piste 27.'), 'deklm rolle zum rollhalt piste 27');
  assert.equal(normalisieren('2500 Fuß, 123,505'), '2500 ft 123.505');
  // gesprochene Zahlen und buchstabierte Rufzeichen
  assert.equal(normalisieren('Delta Echo Kilo Lima Mike, Piste zwo sieben, QNH eins null eins drei'), 'd e k l m piste 27 qnh 1013');
  assert.equal(normalisieren('zwo tausend fünf hundert Fuß, 2.500 ft, 8NM'), '2500 ft 2500 ft 8 nm');
  assert.equal(normalisieren('eins eins neun komma eins acht null'), normalisieren('119.180'));
  assert.equal(normalisieren('squawk seven thousand, ten o\'clock'), 'squawk 7000 10 oclock');
  assert.equal(abstand('rollhalt', 'rollhatl'), 1);

  const pflicht = ['Rollhalt', '27', 'D-EKLM'];
  const pruefe = (eingabe, teile = pflicht) => freitextPruefen(eingabe, teile, WOERTER);
  assert.ok(pruefe('rolle zum rollhalt piste 27 deklm').ok);
  assert.ok(pruefe('D-EKLM, ROLLE ZUM ROLLHALT PISTE 27').ok, 'Großschreibung');
  assert.ok(pruefe('Delta Echo Kilo Lima Mike, rolle zum Roll halt Piste zwo sieben').ok, 'gesprochen, getrennt geschrieben');
  const tipp = pruefe('d-eklm rolle zum Rolhalt piste 27');
  assert.ok(tipp.ok, 'kleiner Tippfehler');
  assert.deepEqual(tipp.tippfehler, [{ soll: 'Rollhalt', du: 'Rolhalt' }]);
  assert.ok(pruefe('D-EKLM taxiing to holdign piont runway 27', ['D-LM|D-EKLM', 'holding point', '27']).ok, 'Tippfehler und volles statt abgekürztes Rufzeichen');
  assert.ok(pruefe('Delta Lima Mike Whiskey 2500 ft', ['D-LM|D-EKLM', 'Whiskey', '2500']).ok, 'buchstabiert ohne Kommas');
  assert.ok(pruefe('Musterstadt Turm, D-EKLM, nördlich, Information D', ['Musterstadt Turm', 'noerdlich', 'Information Delta']).ok, 'Umlaute, ATIS als Buchstabe');

  // streng: Zahlen, Rufzeichen und andere echte Funkwörter sind nie ein Tippfehler
  const fehlt = pruefe('rolle zum rollhalt, D-EKLM');
  assert.equal(fehlt.ok, false);
  assert.deepEqual(fehlt.fehlend, ['27']);
  assert.deepEqual(pruefe('D-EKLM rolle zum rollhalt piste 25').fehlend, ['27']);
  assert.deepEqual(pruefe('D-EKLN rolle zum rollhalt piste 27').fehlend, ['D-EKLM']);
  assert.deepEqual(pruefe('D-EKLM verlasse Queranflug 2500', ['Querabflug']).fehlend, ['Querabflug']);
  assert.deepEqual(pruefe('5 NM west of Whiskey', ['5 NM', 'east']).fehlend, ['east']);
  assert.deepEqual(pruefe('Altdorf Info, D-EKLM, Radio Check', ['Altdorf Radio']).fehlend, ['Altdorf Radio']);
  assert.deepEqual(pruefe('D-EKLM, QNH 1031', ['QNH 1013']).fehlend, ['QNH 1013']);
  // Teile, die nicht hineingehören, und die Reihenfolge beim Erstanruf
  const frei = freitextPruefen('D-EKLM, Start frei Piste 25', ['D-EKLM', 'starte', '25'], WOERTER, { tabu: ['frei'] });
  assert.equal(frei.ok, false);
  assert.deepEqual(frei.teile.filter((t) => t.status === 'tabu').map((t) => t.du), ['frei']);
  const reihe = { reihenfolge: ['Mittelland Information', 'D-EKLM'] };
  assert.ok(freitextPruefen('Mittelland Information, D-EKLM', ['Mittelland Information', 'D-EKLM'], WOERTER, reihe).ok);
  assert.equal(freitextPruefen('D-EKLM, Mittelland Information', ['Mittelland Information', 'D-EKLM'], WOERTER, reihe).reihenfolgeFalsch, true);

  assert.equal(geruest('Rolle zum Rollhalt, D-LM'), 'R···· z·· R·······, D-L·');
});

test('Bausteine: große Satzteile und einzelne Wörter', () => {
  const z = zufallsquelle(7);
  const fein = einzelwoerter('Rolle zum Rollhalt Piste 27, D-LM', ['Verstanden, D-LM', 'Rolle zum Rollhalt, D-LM', 'Wilco, D-LM'], z);
  assert.deepEqual(fein.teile, ['Rolle', 'zum', 'Rollhalt', 'Piste', '27', 'D-LM']);
  assert.deepEqual(fein.auswahl.filter((b) => b.id.startsWith('f')).map((b) => b.t).sort(), ['Verstanden', 'Wilco']);
  assert.ok(reihenfolgePruefen(['rolle', 'zum', 'rollhalt', 'piste', '27', 'd-lm'], fein.teile).ok, 'Groß/klein egal');
  const falsch = reihenfolgePruefen(['Rolle', 'Rollhalt', 'zum'], fein.teile);
  assert.deepEqual(falsch.plaetze, [true, false, false]);
  assert.equal(falsch.fehlen, 3);
});

test('Funkgespräche: Aufbau, Platzhalter, Antworten', () => {
  const ids = new Set();
  for (const s of szenarien) {
    assert.ok(!ids.has(s.id), `doppelte ID ${s.id}`);
    ids.add(s.id);
    assert.ok(s.titel && s.kurz && s.lage, `${s.id}: Titel, Kurztext oder Lage fehlt`);
    assert.ok(['radio', 'kontrolliert', 'unterwegs', 'notfall'].includes(s.thema), `${s.id}: unbekanntes Thema`);
    assert.ok(STATIONEN[s.station], `${s.id}: unbekannte Station ${s.station}`);
    assert.ok(!s.karte || abbildungen[s.karte], `${s.id}: Karte ${s.karte} fehlt`);
    assert.ok(s.schritte.some((x) => x.wer === 'du'), `${s.id}: keine eigene Meldung`);
    for (let seed = 1; seed <= 50; seed++) {
      const werte = szenarioWerte(zufallsquelle(seed * 31 + s.id.length), s);
      for (const sprache of ['de', 'en']) {
        const w = werte[sprache];
        assert.ok(!/\{\w+\}/.test(fuellen(s.lage, w)), `${s.id}: Platzhalter in der Lage bleibt übrig`);
        s.schritte.forEach((schritt, i) => {
          const ort = `${s.id} Schritt ${i + 1} (${sprache})`;
          if (schritt.wer === 'info') { assert.ok(schritt.text, `${ort}: Erzähltext fehlt`); return; }
          const text = fuellen(schritt[sprache], w);
          assert.ok(text && !/\{\w+\}/.test(text), `${ort}: Text fehlt oder Platzhalter bleibt übrig: ${text}`);
          if (schritt.wer === 'station') {
            if (RADIO_STATIONEN.includes(s.station)) {
              assert.ok(!/QNH|\d+ Grad|\d+ Knoten|degrees|knots/.test(text), `${ort}: RADIO-Station nennt QNH oder genaue Windwerte (NfL 2024-1-3240): ${text}`);
            }
            return;
          }
          assert.equal(schritt.wer, 'du', `${ort}: unbekannte Rolle`);
          assert.ok(schritt.aufgabe && schritt.erklaerung, `${ort}: Aufgabe oder Erklärung fehlt`);
          const falsch = (schritt.falsch?.[sprache] ?? []).map((f) => fuellen(f, w));
          assert.ok(falsch.length >= 2, `${ort}: mindestens zwei falsche Antworten nötig`);
          assert.ok(!falsch.includes(text), `${ort}: falsche Antwort gleicht der richtigen`);
          assert.equal(new Set(falsch).size, falsch.length, `${ort}: falsche Antworten doppelt`);
          const pflicht = (schritt.pflicht?.[sprache] ?? []).map((p) => fuellen(p, w));
          assert.ok(pflicht.length >= 1, `${ort}: Pflichtteile für die freie Eingabe fehlen`);
          const regeln = { tabu: (schritt.tabu?.[sprache] ?? []).map((t) => fuellen(t, w)), reihenfolge: (schritt.reihenfolge ?? []).map((t) => fuellen(t, w)) };
          for (const t of regeln.reihenfolge) assert.ok(pflicht.includes(t), `${ort}: „${t}“ aus der Reihenfolge fehlt bei den Pflichtteilen`);
          const pruefe = (eingabe) => freitextPruefen(eingabe, pflicht, WOERTER, regeln);
          assert.ok(pruefe(text).ok, `${ort}: Pflichtteile stecken nicht in der richtigen Antwort: ${pruefe(text).fehlend}`);
          // Die Musterlösung wird auch in anderer Schreibweise erkannt …
          assert.ok(pruefe(text.toUpperCase()).ok, `${ort}: in Großbuchstaben nicht erkannt`);
          assert.ok(pruefe(text.replace(/,/g, ' ').toLowerCase()).ok, `${ort}: ohne Satzzeichen nicht erkannt`);
          assert.ok(pruefe(funk.sprechen(text, sprache)).ok, `${ort}: gesprochene Form nicht erkannt: ${funk.sprechen(text, sprache)} → ${pruefe(funk.sprechen(text, sprache)).fehlend}`);
          // … auch mit einem Buchstabendreher im längsten Wort
          const lang = text.split(/[\s,]+/).filter((w) => /^\p{L}{7,}$/u.test(w)).sort((a, b) => b.length - a.length)[0];
          if (lang) {
            const dreher = lang.slice(0, 3) + lang[4] + lang[3] + lang.slice(5);
            assert.ok(pruefe(text.replace(lang, dreher)).ok, `${ort}: Tippfehler „${dreher}“ nicht toleriert`);
          }
          // … aber keine der falschen Antworten geht durch
          for (const f of falsch) assert.equal(pruefe(f).ok, false, `${ort}: falsche Antwort wird bei freier Eingabe akzeptiert: ${f}`);
          const b = bausteine(text, falsch, zufallsquelle(seed));
          assert.equal(b.teile.join(', '), text, `${ort}: Bausteine ergeben nicht die Meldung`);
          assert.ok(b.auswahl.length >= b.teile.length, `${ort}: Bausteine fehlen`);
          const fein = einzelwoerter(text, falsch, zufallsquelle(seed));
          assert.equal(fein.teile.join(' '), text.replace(/,/g, ''), `${ort}: Wörter ergeben nicht die Meldung`);
          assert.ok(reihenfolgePruefen(fein.teile, fein.teile).ok);
          assert.ok(fein.auswahl.length > fein.teile.length, `${ort}: keine Störwörter`);
        });
      }
    }
  }
});
