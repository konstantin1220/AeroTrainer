// Aktualisiert die Dateiliste im Service Worker (sw.js) und erhöht dessen VERSION.
// Aufruf im Projektordner: node tools/sw-aktualisieren.mjs
// Danach sind alle Dateien aus js/, css/, icons/ und modules/ offline verfügbar.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';

const wurzel = new URL('../', import.meta.url);
const dateien = ['./', 'index.html', 'manifest.webmanifest'];

function sammeln(ordner) {
  for (const name of readdirSync(new URL(ordner, wurzel)).sort()) {
    if (name.startsWith('.')) continue;
    const pfad = `${ordner}${name}`;
    if (statSync(new URL(pfad, wurzel)).isDirectory()) sammeln(`${pfad}/`);
    else dateien.push(pfad);
  }
}
['css/', 'js/', 'icons/', 'modules/'].forEach(sammeln);

const swPfad = new URL('sw.js', wurzel);
let sw = readFileSync(swPfad, 'utf8');
sw = sw.replace(/const DATEIEN = \[[\s\S]*?\];/, `const DATEIEN = [\n${dateien.map((d) => `  '${d}',`).join('\n')}\n];`);
sw = sw.replace(/const VERSION = 'v(\d+)';/, (_, n) => `const VERSION = 'v${Number(n) + 1}';`);
writeFileSync(swPfad, sw);
console.log(`sw.js aktualisiert: ${dateien.length} Dateien, ${sw.match(/const VERSION = '(v\d+)'/)[1]}`);
