// Abbildungen für das Modul „Signale“ – selbst gezeichnet nach den Beschreibungen in SERA, Anlage 1.
// Signalfarben sind echte Farben (rot, grün, weiß, gelb) und bleiben im Dunkelmodus gleich.
import { svg, text } from '../../js/grafik.js';

const FARBE = { gruen: '#22c55e', rot: '#ef4444', weiss: '#ffffff' };
const GELB = '#f7c514';
const ROT = '#d62d2d';

/** Lichtsignal vom Turm: farbe gruen|rot|weiss, art dauer|blinken. */
export function lichtsignal(farbe, art) {
  const f = FARBE[farbe];
  const strahl = art === 'dauer'
    ? `<path d="M108 66L392 30V122L108 86z" fill="${f}" opacity=".55"/>`
    : [0, 1, 2, 3].map((i) => `<path class="signal-blinken" style="animation-delay:${i * 0.1}s" d="M${120 + i * 70} ${64 - i * 9}L${170 + i * 70} ${58 - i * 9}V${94 + i * 9}L${120 + i * 70} ${88 + i * 9}z" fill="${f}" opacity=".75"/>`).join('');
  return svg(400, 170, `
    <rect width="400" height="170" rx="12" fill="#0f1e33"/>
    <path d="M40 160V70h10l6-24h34l6 24h10v90z" fill="#2c3e57"/>
    <rect x="52" y="52" width="46" height="16" rx="3" fill="#8fb3d9" opacity=".6"/>
    <circle cx="102" cy="76" r="11" fill="${f}" ${art === 'blinken' ? 'class="signal-blinken"' : ''}/>
    ${strahl}
    ${text(390, 156, art === 'dauer' ? 'Dauerlicht' : 'Blinkfolge', { groesse: 13, gewicht: 700, anker: 'end', klasse: '', extra: 'fill="#dce6f2"' })}
  `, `Lichtsignal vom Turm: ${farbe === 'gruen' ? 'grün' : farbe === 'rot' ? 'rot' : 'weiß'}, ${art === 'dauer' ? 'Dauerlicht' : 'Blinkfolge'}`);
}

export function rotesFeuerwerk() {
  const strahlen = Array.from({ length: 10 }, (_, i) => {
    const w = (i / 10) * Math.PI * 2;
    return `<line x1="${(260 + Math.cos(w) * 10).toFixed(1)}" y1="${(56 + Math.sin(w) * 10).toFixed(1)}" x2="${(260 + Math.cos(w) * 30).toFixed(1)}" y2="${(56 + Math.sin(w) * 30).toFixed(1)}" stroke="${FARBE.rot}" stroke-width="3" stroke-linecap="round"/>`;
  }).join('');
  return svg(400, 170, `
    <rect width="400" height="170" rx="12" fill="#0f1e33"/>
    <path d="M40 160V70h10l6-24h34l6 24h10v90z" fill="#2c3e57"/>
    <path d="M100 70Q180 40 252 58" stroke="#ffb4a8" stroke-width="2" fill="none" stroke-dasharray="3 5"/>
    <circle cx="260" cy="56" r="8" fill="${FARBE.rot}"/>${strahlen}
    ${text(390, 156, 'rote Leuchtrakete', { groesse: 13, gewicht: 700, anker: 'end', klasse: '', extra: 'fill="#dce6f2"' })}
  `, 'Rote Leuchtrakete vom Boden');
}

function feld(inhalt, beschreibung, hintergrund = true) {
  return svg(400, 200, `${hintergrund ? '<rect width="400" height="200" rx="12" class="g-f-boden"/>' : ''}${inhalt}`, beschreibung);
}

export const BODENSIGNALE = {
  landeverbot: {
    bedeutung: 'Landen verboten – das Verbot gilt voraussichtlich länger',
    zeichnen: () => feld(`<rect x="130" y="30" width="140" height="140" fill="${ROT}"/><path d="M134 34l132 132M266 34L134 166" stroke="${GELB}" stroke-width="16"/>`, 'Rotes Quadrat mit zwei gelben Diagonalen'),
  },
  vorsicht: {
    bedeutung: 'Beim Anflug und bei der Landung besondere Vorsicht – Rollfeld in schlechtem Zustand',
    zeichnen: () => feld(`<rect x="130" y="30" width="140" height="140" fill="${ROT}"/><path d="M134 34l132 132" stroke="${GELB}" stroke-width="16"/>`, 'Rotes Quadrat mit einer gelben Diagonale'),
  },
  hantel: {
    bedeutung: 'Starten, Landen und Rollen nur auf Pisten und Rollwegen',
    zeichnen: () => feld('<circle cx="110" cy="100" r="44" fill="#fff" stroke="#9aa5b5" stroke-width="2"/><circle cx="290" cy="100" r="44" fill="#fff" stroke="#9aa5b5" stroke-width="2"/><rect x="140" y="86" width="120" height="28" fill="#fff"/>', 'Weiße Hantel'),
  },
  hantelStreifen: {
    bedeutung: 'Starten und Landen nur auf Pisten – sonstiges Rollen auch außerhalb erlaubt',
    zeichnen: () => feld('<circle cx="110" cy="100" r="44" fill="#fff" stroke="#9aa5b5" stroke-width="2"/><circle cx="290" cy="100" r="44" fill="#fff" stroke="#9aa5b5" stroke-width="2"/><rect x="140" y="86" width="120" height="28" fill="#fff"/><rect x="100" y="56" width="20" height="88" fill="#111"/><rect x="280" y="56" width="20" height="88" fill="#111"/>', 'Weiße Hantel mit je einem schwarzen Streifen quer über den Kreisen'),
  },
  landeT: {
    bedeutung: 'Lande- und Startrichtung: parallel zum Längsbalken in Richtung Querbalken',
    zeichnen: () => feld('<rect x="70" y="84" width="220" height="32" fill="#fff" stroke="#9aa5b5" stroke-width="2"/><rect x="290" y="30" width="34" height="140" fill="#fff" stroke="#9aa5b5" stroke-width="2"/>', 'Weißes Lande-T, Längsbalken waagerecht, Querbalken rechts'),
  },
  rechtsverkehr: {
    bedeutung: 'Vor der Landung und nach dem Start Rechtskurven fliegen',
    zeichnen: () => feld(`<path d="M120 160V90a50 50 0 0 1 50-50h70" fill="none" stroke="#f28c28" stroke-width="26"/><path d="M236 4l70 36-70 36z" fill="#f28c28"/>`, 'Auffälliger Pfeil, der nach rechts abbiegt'),
  },
  meldestelle: {
    bedeutung: 'Hier ist die Meldestelle der Flugverkehrsdienste (ARO)',
    zeichnen: () => feld(`<rect x="140" y="25" width="120" height="150" fill="${GELB}"/><text x="200" y="102" font-size="120" font-weight="800" fill="#111" text-anchor="middle" dominant-baseline="middle">C</text>`, 'Schwarzes C auf gelbem Grund', false),
  },
  sperrkreuz: {
    bedeutung: 'Dieser Teil der Piste oder des Rollwegs ist nicht benutzbar',
    zeichnen: () => feld('<rect x="20" y="70" width="360" height="60" fill="#5b6472"/><path d="M170 74l60 52M230 74l-60 52" stroke="#fff" stroke-width="12"/>', 'Weißes Kreuz auf einer Piste'),
  },
};

export const abbildungen = {
  'licht-gruen-dauer': () => lichtsignal('gruen', 'dauer'),
  'licht-rot-dauer': () => lichtsignal('rot', 'dauer'),
  'licht-gruen-blinken': () => lichtsignal('gruen', 'blinken'),
  'licht-rot-blinken': () => lichtsignal('rot', 'blinken'),
  'licht-weiss-blinken': () => lichtsignal('weiss', 'blinken'),
  'licht-rakete': () => rotesFeuerwerk(),
  ...Object.fromEntries(Object.entries(BODENSIGNALE).map(([k, s]) => [`boden-${k}`, s.zeichnen])),
  'sar-zeichen'() {
    const zeichen = [['V', 'Hilfe benötigt'], ['X', 'Ärztliche Hilfe benötigt'], ['N', 'Nein'], ['Y', 'Ja'], ['↑', 'Wir gehen in diese Richtung']];
    return svg(400, 5 * 44 + 8, zeichen.map(([z, b], i) => `
      <rect x="10" y="${8 + i * 44}" width="54" height="36" rx="6" class="g-f-boden"/>
      ${text(37, 26 + i * 44, z, { groesse: 24, gewicht: 800 })}
      ${text(80, 26 + i * 44, b, { groesse: 15, anker: 'start' })}`).join(''), 'Boden-Luft-Sichtzeichen für Überlebende: V, X, N, Y und Pfeil');
  },
};
