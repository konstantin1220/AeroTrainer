// Tests für die Animationen in Kapiteln (js/animation.js, modules/<thema>/animationen.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { glatterWeg, weglaengen, aufWeg, sanft, abschnitt } from '../js/grafik.js';

const module = readdirSync(new URL('../modules/', import.meta.url), { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(new URL(`../modules/${e.name}/animationen.js`, import.meta.url)))
  .map((e) => e.name);

async function animationenVon(modul) {
  return (await import(`../modules/${modul}/animationen.js`)).animationen;
}

function inhaltBloecke(modul) {
  const pfad = new URL(`../modules/${modul}/content/inhalt.json`, import.meta.url);
  if (!existsSync(pfad)) return [];
  return JSON.parse(readFileSync(pfad, 'utf8')).kapitel.flatMap((k) => k.theorie ?? []);
}

test('Es gibt Animationen in mehreren Themen', () => {
  assert.ok(module.length >= 4, `nur ${module.length} Module mit Animationen`);
});

test('Jede Animation zeichnet in jedem Schritt zu jedem Zeitpunkt ein gültiges Bild', async () => {
  for (const modul of module) {
    for (const [id, anim] of Object.entries(await animationenVon(modul))) {
      assert.ok(anim.titel, `${modul}/${id}: Titel fehlt`);
      assert.ok(anim.schritte.length >= 2, `${modul}/${id}: mindestens zwei Schritte`);
      anim.schritte.forEach((s, i) => {
        assert.ok(s.text?.length > 20, `${modul}/${id} Schritt ${i + 1}: Text fehlt`);
        for (let k = 0; k <= 20; k++) {
          const bild = anim.bild(i, k / 20);
          assert.match(bild, /^<svg[\s\S]*<\/svg>$/, `${modul}/${id} Schritt ${i + 1}: kein SVG`);
          assert.doesNotMatch(bild, /NaN|undefined|Infinity/, `${modul}/${id} Schritt ${i + 1} bei t=${k / 20}`);
        }
      });
    }
  }
});

test('Jede Animation in den Inhalten gibt es auch im Code', async () => {
  for (const modul of readdirSync(new URL('../modules/', import.meta.url))) {
    const benutzt = inhaltBloecke(modul).filter((b) => b.typ === 'animation').map((b) => b.id);
    if (!benutzt.length) continue;
    const vorhanden = module.includes(modul) ? await animationenVon(modul) : {};
    for (const id of benutzt) assert.ok(vorhanden[id], `${modul}: Animation „${id}“ fehlt in animationen.js`);
  }
});

test('Weg-Rechnung: glatter Weg geht durch Anfang und Ende, Kurs stimmt', () => {
  const weg = glatterWeg([[0, 100], [0, 0], [100, 0]], 10);
  const laengen = weglaengen(weg);
  assert.deepEqual(aufWeg(weg, 0, laengen).x, 0);
  assert.equal(Math.round(aufWeg(weg, 1, laengen).x), 100);
  assert.ok(Math.abs(aufWeg(weg, 0.1, laengen).winkel) < 15); // etwa nach Norden
  assert.ok(Math.abs(aufWeg(weg, 0.95, laengen).winkel - 90) < 15); // etwa nach Osten
  assert.equal(sanft(0), 0);
  assert.equal(sanft(1), 1);
  assert.equal(abschnitt(0.5, 0, 1), 0.5);
});

test('Quellwolke: Wolkenbasis passt zur Faustformel des Kapitels', async () => {
  const { luftpaket, kondensationsHoehe, AM_BODEN } = await import('../modules/meteorologie/animationen.js');
  const basis = kondensationsHoehe();
  const paket = luftpaket(basis);
  assert.ok(Math.abs(paket.temperatur - paket.taupunkt) < 1e-9, 'an der Basis sind Temperatur und Taupunkt gleich');
  const faustformelFt = (AM_BODEN.temperatur - AM_BODEN.taupunkt) * 400;
  assert.ok(Math.abs(basis / 0.3048 - faustformelFt) < 150, `Basis ${basis} m passt nicht zu ${faustformelFt} ft`);
});

test('Ausweichregeln: Abstand bleibt, wer ausweicht, fliegt rechts bzw. hinter dem anderen vorbei', async () => {
  const { lagen } = await import('../modules/luftraum/animationen.js');
  const minAbstand = (fall) => Math.min(...Array.from({ length: 201 }, (_, i) => {
    const p = lagen(fall, i / 200);
    return Math.hypot(p.a.x - p.b.x, p.a.y - p.b.y);
  }));
  for (const fall of ['gegenflug', 'kreuzen', 'ueberholen']) assert.ok(minAbstand(fall) > 30, `${fall}: zu nah`);
  // Gegenflug: beim Vorbeifliegen ist A rechts (Osten), B von A aus gesehen links (Westen)
  const mitte = lagen('gegenflug', 0.5);
  assert.ok(mitte.a.x > mitte.b.x);
  // Kreuzen: Wenn A die Spur von B quert, ist B schon vorbei (weiter westlich)
  let vorher = lagen('kreuzen', 0);
  for (let i = 1; i <= 200; i++) {
    const p = lagen('kreuzen', i / 200);
    if (vorher.a.y > p.b.y && p.a.y <= p.b.y) assert.ok(p.b.x < p.a.x - 40, 'A fliegt hinter B vorbei');
    vorher = p;
  }
  // Überholen: rechts vorbei
  const ueber = lagen('ueberholen', 0.55);
  assert.ok(ueber.a.x > ueber.b.x + 30);
});

test('Platzrunde: Rechtsplatzrunde – der Gegenanflug liegt nördlich der Piste und führt nach Osten', async () => {
  const { animationen, ABSCHNITTE, rundenAnteil } = await import('../modules/sprechfunk/animationen.js');
  assert.equal(ABSCHNITTE.length, animationen.platzrunde.schritte.length);
  for (let i = 1; i < ABSCHNITTE.length; i++) assert.equal(ABSCHNITTE[i][0], ABSCHNITTE[i - 1][1]);
  assert.equal(rundenAnteil(0, 0), 0);
  assert.equal(rundenAnteil(3, 1), 1);
  const bild = animationen.platzrunde.bild(1, 1);
  assert.match(bild, /Gegenanflug/);
});

test('Strömung: Auftrieb wächst bis zum kritischen Anstellwinkel, danach reißt die Strömung ab', async () => {
  const { auftriebsbeiwert, abriss } = await import('../modules/aerodynamik/animationen.js');
  assert.ok(auftriebsbeiwert(12) > auftriebsbeiwert(5));
  assert.ok(auftriebsbeiwert(20) < auftriebsbeiwert(15));
  assert.equal(abriss(10), 0);
  assert.equal(abriss(19), 1);
});
