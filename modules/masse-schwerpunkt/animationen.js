// Animation für „Masse & Schwerpunkt“: das Beispiel aus dem Kapitel „Schwerpunkt berechnen“ Last für Last (js/animation.js).
// Hebelarme maßstäblich (1 m ≙ 100 px), Flugzeug schematisch; Werte aus rechnen.js mit den Daten des Übungsflugzeugs MF-4.
import { svg, text, linie, sanft, abschnitt, zwischen } from '../../js/grafik.js';
import { beladungRechnen, bewertung } from './rechnen.js';

const r1 = (n) => Math.round(n * 10) / 10;
const komma = (n, stellen) => n.toFixed(stellen).replace('.', ',');

// Beladung nach jedem Schritt (wie in der Beispieltabelle; zuletzt 60 l verbraucht)
export const BELADUNGEN = [
  {},
  { vorn: 160 },
  { vorn: 160, hinten: 70 },
  { vorn: 160, hinten: 70, kraftstoff: 100 },
  { vorn: 160, hinten: 70, kraftstoff: 100, gepaeck: 20 },
  { vorn: 160, hinten: 70, kraftstoff: 40, gepaeck: 20 },
];

const xArm = (arm) => 30 + arm * 100; // Bezugsebene bei x = 30
const ACHSE = 146;

function person(x, deckkraft) {
  return `<g opacity="${r1(deckkraft)}"><circle cx="${r1(x)}" cy="66" r="6.5" class="g-f-text"/><path d="M${r1(x)} 74v20M${r1(x - 8)} 80h16" class="g-s-text" stroke-width="5" stroke-linecap="round"/></g>`;
}

function flugzeugSeite() {
  return `<path d="M30 76L92 74L120 52H250L290 72L350 80L368 40H388L392 92L290 100L240 112H60L30 104L22 96L22 82z" class="g-f-weiss" style="stroke: var(--rand-stark); stroke-width: 1.5"/>
    <path d="M100 52L120 52L96 74z" class="g-f-himmel"/>
    <rect x="16" y="68" width="5" height="48" rx="2.5" class="g-f-leise"/>
    <rect x="100" y="108" width="110" height="7" rx="3.5" class="g-f-flaeche" style="stroke: var(--rand-stark); stroke-width: 1"/>
    <rect x="338" y="84" width="54" height="5" rx="2.5" class="g-f-flaeche" style="stroke: var(--rand-stark); stroke-width: 1"/>
    ${linie(150, 114, 150, 124, 'g-s-text', 2)}<circle cx="150" cy="125" r="6" class="g-f-text"/>
    ${linie(52, 110, 52, 125, 'g-s-text', 2)}<circle cx="52" cy="126" r="5" class="g-f-text"/>
    ${linie(0, 131, 400, 131, 'g-s-leise', 1)}`;
}

export function animationenFuer(flugzeug) {
  const stand = BELADUNGEN.map((b) => {
    const e = beladungRechnen(flugzeug, b);
    return { ...e, ok: bewertung(flugzeug, e) === 'ok' };
  });
  const station = Object.fromEntries(flugzeug.stationen.map((s) => [s.id, s]));
  const kg = (id, wert) => Math.round(id === 'kraftstoff' ? wert * flugzeug.kraftstoffDichte : wert);

  // Hüllkurve unten: Schwerpunkt 0,85–1,20 m, Masse 700–1200 kg
  const l = 70, r = 380, o = 200, u = 304;
  const xC = (cg) => l + ((cg - 0.85) / 0.35) * (r - l);
  const yC = (m) => u - ((m - 700) / 500) * (u - o);

  function bild(schritt, t) {
    const neu = sanft(abschnitt(t, 0, 0.35));
    const wandern = sanft(abschnitt(t, 0.3, 0.9));
    const jetzt = stand[schritt];
    const vorher = stand[Math.max(0, schritt - 1)];
    const cg = schritt === 0 ? jetzt.schwerpunkt : zwischen(vorher.schwerpunkt, jetzt.schwerpunkt, wandern);
    const masse = schritt === 0 ? jetzt.masse : zwischen(vorher.masse, jetzt.masse, wandern);
    const b = BELADUNGEN[schritt];
    const bVorher = BELADUNGEN[Math.max(0, schritt - 1)];
    const ist = (id) => b[id] && !bVorher[id];
    let lasten = '';
    if (b.vorn) lasten += person(xArm(station.vorn.arm), ist('vorn') ? neu : 1);
    if (b.hinten) lasten += person(xArm(station.hinten.arm), ist('hinten') ? neu : 1);
    if (b.gepaeck) lasten += `<rect x="${r1(xArm(station.gepaeck.arm) - 9)}" y="80" width="18" height="16" rx="2" class="g-f-orange" opacity="${r1(ist('gepaeck') ? neu : 1)}"/>`;
    if (b.kraftstoff) {
      const liter = schritt === 5 ? zwischen(100, 40, wandern) : 100;
      const breite = (liter / 150) * 56;
      lasten += `<rect x="${r1(xArm(station.kraftstoff.arm) - breite / 2)}" y="109" width="${r1(breite)}" height="5" rx="2" class="g-f-primaer" opacity="${r1(ist('kraftstoff') ? neu : 1)}"/>`;
    }
    // Beschriftung nur für die Last, die gerade dazukommt
    const marken = {
      1: ['vorn', '+ 160 kg'], 2: ['hinten', '+ 70 kg'], 3: ['kraftstoff', `+ ${kg('kraftstoff', 100)} kg (100 l)`],
      4: ['gepaeck', '+ 20 kg'], 5: ['kraftstoff', `− ${kg('kraftstoff', 60)} kg (60 l verbraucht)`],
    };
    let marke = '';
    if (marken[schritt]) {
      const [id, beschriftung] = marken[schritt];
      const x = Math.min(Math.max(xArm(station[id].arm), 70), 330);
      marke = text(r1(x), 34, beschriftung, { groesse: 11, gewicht: 800, klasse: schritt === 5 ? 'g-f-fehler g-halo' : 'g-f-orange g-halo' })
        + linie(r1(xArm(station[id].arm)), 42, r1(xArm(station[id].arm)), 52, 'g-s-leise', 1);
    }
    // Hebelarm-Achse
    let achse = linie(30, ACHSE, 392, ACHSE, 'g-s-leise', 1.2) + linie(30, 22, 30, ACHSE, 'g-s-leise', 1, 'stroke-dasharray="3 3"');
    for (let m = 0; m <= 3.5; m += 0.5) achse += linie(r1(xArm(m)), ACHSE - 3, r1(xArm(m)), ACHSE + 3, 'g-s-leise', 1) + text(r1(xArm(m)), ACHSE + 12, m === 0 ? '0' : `${komma(m, m % 1 ? 1 : 0)} m`, { groesse: 9, klasse: 'g-f-leise' });
    achse += text(34, 16, 'Bezugsebene', { groesse: 10, klasse: 'g-f-leise', anker: 'start' });
    // Schwerpunkt-Zeichen
    const xs = r1(xArm(cg));
    const sp = `${linie(xs, 92, xs, ACHSE, 'g-s-fehler', 1.2, 'stroke-dasharray="3 3"')}
      <circle cx="${xs}" cy="${ACHSE}" r="7" class="g-f-weiss" style="stroke: var(--fehler); stroke-width: 1.5"/>
      <path d="M${xs} ${ACHSE}V${ACHSE - 7}A7 7 0 0 1 ${r1(xs + 7)} ${ACHSE}zM${xs} ${ACHSE}V${ACHSE + 7}A7 7 0 0 1 ${r1(xs - 7)} ${ACHSE}z" class="g-f-fehler"/>
      ${text(xs, ACHSE + 27, `Schwerpunkt ${komma(cg, 3)} m`, { groesse: 11, gewicht: 800, klasse: 'g-f-fehler g-halo' })}`;
    // Hüllkurve mit Spur
    const flaeche = flugzeug.huellkurve.map(([x, y]) => `${r1(xC(x))},${r1(yC(y))}`).join(' ');
    let raster = '';
    for (const x of [0.9, 1.0, 1.1]) raster += linie(r1(xC(x)), o, r1(xC(x)), u, 'g-s-rand', 0.8) + text(r1(xC(x)), u + 11, `${komma(x, 1)} m`, { groesse: 9, klasse: 'g-f-leise' });
    for (const m of [800, 1000]) raster += linie(l, r1(yC(m)), r, r1(yC(m)), 'g-s-rand', 0.8) + text(l - 5, r1(yC(m)), String(m), { groesse: 9, klasse: 'g-f-leise', anker: 'end' });
    const spur = stand.slice(0, schritt).map((s) => `<circle cx="${r1(xC(s.schwerpunkt))}" cy="${r1(yC(s.masse))}" r="3" class="g-f-leise"/>`).join('');
    const ok = schritt === 0 || wandern >= 1 ? jetzt.ok : true;
    return svg(400, 330, `
      <rect width="400" height="330" class="g-f-land"/>
      ${achse}
      ${flugzeugSeite()}
      ${lasten}${marke}${sp}
      ${raster}
      <polygon points="${flaeche}" class="g-f-mf-hell g-s-mf" stroke-width="2"/>
      ${linie(l, r1(yC(flugzeug.mtom)), r, r1(yC(flugzeug.mtom)), 'g-s-fehler', 1.2, 'stroke-dasharray="5 4"')}
      ${text(l - 5, r1(yC(flugzeug.mtom)), String(flugzeug.mtom), { groesse: 9, klasse: 'g-f-fehler', anker: 'end' })}
      ${spur}
      <circle cx="${r1(xC(cg))}" cy="${r1(yC(masse))}" r="6" class="${ok ? 'g-f-ok' : 'g-f-fehler'}" style="stroke: var(--flaeche); stroke-width: 2"/>
      ${text(l - 5, o - 10, 'kg', { groesse: 9, klasse: 'g-f-leise', anker: 'end' })}
      ${text(r, o - 10, `${Math.round(masse)} kg · ${komma(cg, 3)} m${ok ? ' · im Bereich' : ''}`, { groesse: 11, gewicht: 800, klasse: ok ? 'g-f-ok' : 'g-f-fehler', anker: 'end' })}
      ${text(r, 324, 'Schwerpunkt-Hüllkurve des MF-4', { groesse: 9, klasse: 'g-f-leise', anker: 'end' })}
    `, `Beladung des MF-4: ${Math.round(masse)} kg, Schwerpunkt ${komma(cg, 3)} m hinter der Bezugsebene`);
  }

  const s = stand;
  return {
    beladen: {
      titel: 'Last für Last: Wohin wandert der Schwerpunkt?',
      schritte: [
        { text: `Das **leere** Übungsflugzeug MF-4: **${Math.round(s[0].masse)} kg**, Schwerpunkt **${komma(s[0].schwerpunkt, 2)} m** hinter der Bezugsebene. Unten siehst du den Punkt in der **Hüllkurve**.`, dauer: 3.2 },
        { text: `**Pilot und Fluggast vorn** (160 kg) sitzen bei ${komma(station.vorn.arm, 2)} m – knapp **vor** dem Schwerpunkt. Er wandert ein kleines Stück nach vorn: **${komma(s[1].schwerpunkt, 3)} m**.`, dauer: 3.6 },
        { text: `Auf der **Rückbank** (70 kg) ist der Hebelarm lang (${komma(station.hinten.arm, 2)} m). Schon wenig Masse schiebt den Schwerpunkt deutlich **nach hinten**: **${komma(s[2].schwerpunkt, 3)} m**.`, dauer: 3.6 },
        { text: `**100 l Kraftstoff** sind ${kg('kraftstoff', 100)} kg (0,72 kg/l) bei ${komma(station.kraftstoff.arm, 2)} m: **${Math.round(s[3].masse)} kg**, **${komma(s[3].schwerpunkt, 3)} m**.`, dauer: 3.6 },
        { text: `**Gepäck** (20 kg) ganz hinten bei ${komma(station.gepaeck.arm, 2)} m. Ergebnis: **${Math.round(s[4].masse)} kg** und **${komma(s[4].schwerpunkt, 3)} m** – der Punkt liegt **in der Hüllkurve**, der Start ist erlaubt.`, dauer: 4 },
        { text: `Im Flug verbrauchst du **60 l**. Der Tank liegt hinter dem Schwerpunkt, also wandert er zur Landung etwas **nach vorn**: **${Math.round(s[5].masse)} kg**, **${komma(s[5].schwerpunkt, 3)} m**. Auch dieser Punkt muss in der Hüllkurve liegen.`, dauer: 4.2 },
      ],
      bild,
    },
  };
}
