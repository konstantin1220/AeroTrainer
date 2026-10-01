// Service Worker: macht die App offline nutzbar.
//
// Wichtig für Mitwirkende: Vor jeder Veröffentlichung im Projektordner
//   node tools/sw-aktualisieren.mjs
// ausführen. Das trägt alle Dateien in DATEIEN ein und erhöht VERSION – dann laden alle
// Geräte die Dateien beim nächsten Start frisch und alte Zwischenspeicher werden gelöscht.

const VERSION = 'v15';
const CACHE = `aerotrainer-${VERSION}`;

const DATEIEN = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/fragen.js',
  'js/grafik.js',
  'js/icons.js',
  'js/interaktiv.js',
  'js/lernmodul.js',
  'js/lexikon.js',
  'js/merkliste.js',
  'js/quiz.js',
  'js/srs.js',
  'js/storage.js',
  'js/stufe.js',
  'js/ui.js',
  'js/zufall.js',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'modules/aerodynamik/abbildungen.js',
  'modules/aerodynamik/content/inhalt.json',
  'modules/aerodynamik/generatoren.js',
  'modules/aerodynamik/interaktiv.js',
  'modules/aerodynamik/module.js',
  'modules/impressum.json',
  'modules/index.json',
  'modules/lexikon.json',
  'modules/luftraum/abbildungen.js',
  'modules/luftraum/content/inhalt.json',
  'modules/luftraum/generatoren.js',
  'modules/luftraum/interaktiv.js',
  'modules/luftraum/module.js',
  'modules/masse-schwerpunkt/abbildungen.js',
  'modules/masse-schwerpunkt/content/flugzeug.json',
  'modules/masse-schwerpunkt/content/inhalt.json',
  'modules/masse-schwerpunkt/generatoren.js',
  'modules/masse-schwerpunkt/interaktiv.js',
  'modules/masse-schwerpunkt/module.js',
  'modules/masse-schwerpunkt/rechnen.js',
  'modules/metar/aufgaben.js',
  'modules/metar/content/beispiele.json',
  'modules/metar/content/gruppen.json',
  'modules/metar/content/inhalt.json',
  'modules/metar/content/plaetze.json',
  'modules/metar/erzeugen.js',
  'modules/metar/generatoren.js',
  'modules/metar/interaktiv.js',
  'modules/metar/metar.js',
  'modules/metar/module.js',
  'modules/metar/stufen.js',
  'modules/meteorologie/abbildungen.js',
  'modules/meteorologie/content/inhalt.json',
  'modules/meteorologie/generatoren.js',
  'modules/meteorologie/interaktiv.js',
  'modules/meteorologie/module.js',
  'modules/navigation/abbildungen.js',
  'modules/navigation/content/inhalt.json',
  'modules/navigation/generatoren.js',
  'modules/navigation/interaktiv.js',
  'modules/navigation/module.js',
  'modules/quellen.json',
  'modules/signale/abbildungen.js',
  'modules/signale/content/inhalt.json',
  'modules/signale/generatoren.js',
  'modules/signale/interaktiv.js',
  'modules/signale/module.js',
  'modules/sprechfunk/abbildungen.js',
  'modules/sprechfunk/aussprache.js',
  'modules/sprechfunk/content/inhalt.json',
  'modules/sprechfunk/generatoren.js',
  'modules/sprechfunk/interaktiv.js',
  'modules/sprechfunk/module.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(DATEIEN.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(
        namen.filter((n) => n.startsWith('aerotrainer-') && n !== CACHE).map((n) => caches.delete(n)),
      ))
      .then(() => self.clients.claim()),
  );
});

// Sofort aus dem Zwischenspeicher antworten und im Hintergrund aktualisieren
// („stale-while-revalidate“). Änderungen erscheinen so spätestens beim übernächsten Start.
self.addEventListener('fetch', (event) => {
  const anfrage = event.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;

  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const gespeichert = await cache.match(anfrage, { ignoreSearch: true });
    const ausDemNetz = fetch(anfrage)
      .then((antwort) => {
        if (antwort.ok) cache.put(anfrage, antwort.clone());
        return antwort;
      })
      .catch(() => null);

    if (gespeichert) {
      event.waitUntil(ausDemNetz);
      return gespeichert;
    }
    return (await ausDemNetz) ?? new Response('Offline – diese Datei ist nicht gespeichert.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }));
});
