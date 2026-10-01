// Abbildungen für das Modul „Navigation“ – selbst gezeichnet.
// Herzstück ist die Übungskarte eines frei erfundenen Gebiets („Übungsgebiet Mittelland“).
// Sie ist nordausgerichtet; 1 NM entspricht 6⅔ Einheiten, die Karte zeigt also 60 × 60 NM.
import { svg, text, linie, pfeil, flugzeug, aufKreis, esc } from '../../js/grafik.js';

export const NM_PRO_EINHEIT = 60 / 400;

/** Orte der Übungskarte (frei erfunden). */
export const ORTE = {
  altdorf: { name: 'Altdorf', kennung: 'XALT', x: 80, y: 300, art: 'platz' },
  bergen: { name: 'Bergen', kennung: 'XBER', x: 95, y: 80, art: 'platz' },
  seefeld: { name: 'Seefeld', kennung: 'XSEE', x: 330, y: 70, art: 'ul' },
  neuheim: { name: 'Neuheim', kennung: 'XNEU', x: 310, y: 335, art: 'segel' },
  musterstadt: { name: 'Musterstadt', kennung: 'XMUS', x: 225, y: 190, art: 'flughafen' },
};

/** Rechtweisender Kurs (Grad) und Entfernung (NM) zwischen zwei Orten der Karte. */
export function kursUndEntfernung(von, nach) {
  const dx = nach.x - von.x;
  const dy = nach.y - von.y;
  const kurs = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  return { kurs, entfernung: Math.hypot(dx, dy) * NM_PRO_EINHEIT };
}

// ---------- Kartensymbole (vereinfacht nach ICAO-Muster) ----------

function sechseck(x, y, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const w = (Math.PI / 3) * i;
    return `${(x + r * Math.cos(w)).toFixed(1)},${(y + r * Math.sin(w)).toFixed(1)}`;
  }).join(' ');
}

export const SYMBOLE = {
  vor: { name: 'VOR (UKW-Drehfunkfeuer)', zeichnen: (x, y, s = 1) => `<polygon points="${sechseck(x, y, 11 * s)}" class="g-s-luft" stroke-width="${2 * s}"/><circle cx="${x}" cy="${y}" r="${2.2 * s}" class="g-f-luft"/>` },
  dme: { name: 'DME (Entfernungsmessgerät)', zeichnen: (x, y, s = 1) => `<rect x="${x - 10 * s}" y="${y - 10 * s}" width="${20 * s}" height="${20 * s}" class="g-s-luft" stroke-width="${2 * s}"/><circle cx="${x}" cy="${y}" r="${2.2 * s}" class="g-f-luft"/>` },
  vordme: { name: 'VOR/DME', zeichnen: (x, y, s = 1) => `<rect x="${x - 12 * s}" y="${y - 12 * s}" width="${24 * s}" height="${24 * s}" class="g-s-luft" stroke-width="${2 * s}"/><polygon points="${sechseck(x, y, 11 * s)}" class="g-s-luft" stroke-width="${2 * s}"/><circle cx="${x}" cy="${y}" r="${2.2 * s}" class="g-f-luft"/>` },
  ndb: { name: 'NDB (ungerichtetes Funkfeuer)', zeichnen: (x, y, s = 1) => `<circle cx="${x}" cy="${y}" r="${11 * s}" class="g-s-luft" stroke-width="${3 * s}" stroke-dasharray="${0.1} ${4 * s}" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${6 * s}" class="g-s-luft" stroke-width="${2.5 * s}" stroke-dasharray="${0.1} ${3.5 * s}" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${2.2 * s}" class="g-f-luft"/>` },
  hindernis: { name: 'Hindernis', zeichnen: (x, y, s = 1) => `<path d="M${x - 8 * s} ${y + 10 * s}L${x} ${y - 12 * s}L${x + 8 * s} ${y + 10 * s}" class="g-s-text" stroke-width="${2.2 * s}" stroke-linejoin="round"/><circle cx="${x}" cy="${y + 7 * s}" r="${2 * s}" class="g-f-text"/>` },
  hindernisLicht: { name: 'Hindernis mit Befeuerung', zeichnen: (x, y, s = 1) => `${SYMBOLE.hindernis.zeichnen(x, y, s)}<path d="M${x} ${y - 16 * s}v${-6 * s}M${x - 6 * s} ${y - 14 * s}l${-4 * s} ${-4 * s}M${x + 6 * s} ${y - 14 * s}l${4 * s} ${-4 * s}" class="g-s-text" stroke-width="${1.8 * s}" stroke-linecap="round"/>` },
  pflichtmeldepunkt: { name: 'Pflichtmeldepunkt', zeichnen: (x, y, s = 1) => `<path d="M${x} ${y - 10 * s}l${9 * s} ${16 * s}h${-18 * s}z" class="g-f-luft"/>` },
  bedarfsmeldepunkt: { name: 'Meldepunkt auf Anforderung', zeichnen: (x, y, s = 1) => `<path d="M${x} ${y - 10 * s}l${9 * s} ${16 * s}h${-18 * s}z" class="g-s-luft" stroke-width="${2 * s}" stroke-linejoin="round"/>` },
};

export function symbolBild(schluessel) {
  return svg(200, 120, SYMBOLE[schluessel].zeichnen(100, 60, 2.6), 'Kartensymbol');
}

// ---------- Übungskarte ----------

function platzSymbol(ort) {
  const { x, y } = ort;
  if (ort.art === 'flughafen') {
    return `<circle cx="${x}" cy="${y}" r="9" class="g-f-luft"/><rect x="${x - 7}" y="${y - 1.6}" width="14" height="3.2" rx="1" class="g-f-weiss" transform="rotate(-80 ${x} ${y})"/>`;
  }
  if (ort.art === 'segel') {
    return `<circle cx="${x}" cy="${y}" r="7.5" class="g-f-weiss g-s-luft" stroke-width="2"/><path d="M${x - 6} ${y}h12M${x} ${y - 2}v5" class="g-s-luft" stroke-width="1.8"/>`;
  }
  if (ort.art === 'ul') {
    return `<circle cx="${x}" cy="${y}" r="7.5" class="g-f-weiss g-s-luft" stroke-width="2"/>${text(x, y + 0.5, 'UL', { groesse: 6.5, gewicht: 800, klasse: 'g-f-luft' })}`;
  }
  return `<circle cx="${x}" cy="${y}" r="7.5" class="g-f-weiss g-s-luft" stroke-width="2"/><rect x="${x - 5.5}" y="${y - 1.4}" width="11" height="2.8" class="g-f-luft" transform="rotate(-70 ${x} ${y})"/>`;
}

function grundkarte(markiert = []) {
  const meridiane = [];
  for (let x = 400 / 6; x < 400; x += 400 / 6) meridiane.push(linie(x.toFixed(1), 0, x.toFixed(1), 400, 'g-s-rand', 0.8));
  for (let y = 400 / 6; y < 400; y += 400 / 6) meridiane.push(linie(0, y.toFixed(1), 400, y.toFixed(1), 'g-s-rand', 0.8));
  const o = ORTE;
  return `
    <rect width="400" height="400" class="g-f-land"/>
    ${meridiane.join('')}
    <path d="M20 150c30-20 70-15 80 5s-15 45-45 45-55-30-35-50zM260 260c25-15 70-10 85 10s0 50-40 50-70-35-45-60zM340 150c20-10 50 0 55 20s-15 30-40 25-35-35-15-45z" class="g-f-wald" opacity=".9"/>
    <ellipse cx="160" cy="245" rx="26" ry="15" class="g-f-wasser"/>
    <path d="M0 40C60 60 90 120 140 150s50 70 20 95 10 70 60 90 120 30 180 65" class="g-s-wasser" stroke-width="3"/>
    <path d="M0 268C80 262 140 280 210 262s120-30 190-20" class="g-s-strasse" stroke-width="5"/>
    <path d="M0 268C80 262 140 280 210 262s120-30 190-20" class="g-s-flaeche" stroke-width="1.5"/>
    <path d="M60 0C90 80 150 120 225 190s70 120 90 210" class="g-s-text" stroke-width="1.6" stroke-dasharray="6 4"/>
    <ellipse cx="${o.musterstadt.x + 18}" cy="${o.musterstadt.y + 22}" rx="22" ry="14" class="g-f-ort"/>
    <ellipse cx="${o.altdorf.x + 16}" cy="${o.altdorf.y + 14}" rx="12" ry="8" class="g-f-ort"/>
    <ellipse cx="${o.bergen.x - 14}" cy="${o.bergen.y + 12}" rx="10" ry="7" class="g-f-ort"/>
    <ellipse cx="${o.seefeld.x - 16}" cy="${o.seefeld.y + 10}" rx="10" ry="7" class="g-f-ort"/>
    <ellipse cx="${o.neuheim.x - 18}" cy="${o.neuheim.y - 10}" rx="11" ry="7" class="g-f-ort"/>
    <circle cx="${o.musterstadt.x}" cy="${o.musterstadt.y}" r="56" class="g-s-luft" stroke-width="2" stroke-dasharray="7 5"/>
    ${text(o.musterstadt.x + 46, o.musterstadt.y - 44, 'CTR', { groesse: 11, gewicht: 800, klasse: 'g-f-luft g-halo' })}
    ${SYMBOLE.pflichtmeldepunkt.zeichnen(o.musterstadt.x, o.musterstadt.y - 70, 0.8)}
    ${text(o.musterstadt.x + 12, o.musterstadt.y - 72, 'N', { groesse: 10, gewicht: 800, klasse: 'g-f-luft', anker: 'start' })}
    ${SYMBOLE.bedarfsmeldepunkt.zeichnen(o.musterstadt.x - 72, o.musterstadt.y + 8, 0.8)}
    ${text(o.musterstadt.x - 72, o.musterstadt.y + 24, 'W', { groesse: 10, gewicht: 800, klasse: 'g-f-luft' })}
    ${SYMBOLE.vordme.zeichnen(o.musterstadt.x - 30, o.musterstadt.y + 34, 0.7)}
    ${text(o.musterstadt.x - 30, o.musterstadt.y + 50, 'MST', { groesse: 9, gewicht: 700, klasse: 'g-f-luft g-halo' })}
    ${SYMBOLE.hindernisLicht.zeichnen(262, 300, 0.7)}
    ${SYMBOLE.ndb.zeichnen(150, 120, 0.7)}
    ${text(162, 120, 'BGN', { groesse: 9, gewicht: 700, klasse: 'g-f-luft g-halo', anker: 'start' })}
    <path d="M300 0C290 120 270 260 250 400" class="g-s-luft" stroke-width="1.2" stroke-dasharray="3 5"/>
    ${text(286, 120, '3°E', { groesse: 10, gewicht: 700, klasse: 'g-f-luft', anker: 'end' })}
    ${Object.entries(ORTE).map(([schluessel, ort]) => `<g data-ort="${schluessel}" class="${markiert.includes(schluessel) ? 'ort-markiert' : ''}">${markiert.includes(schluessel) ? `<circle cx="${ort.x}" cy="${ort.y}" r="14" class="g-f-orange" opacity=".35"/>` : ''}${platzSymbol(ort)}${text(ort.x, ort.y - 14, ort.name, { groesse: 11, gewicht: 700, klasse: 'g-f-text g-halo' })}<circle cx="${ort.x}" cy="${ort.y - 6}" r="20" fill="transparent"/></g>`).join('')}
    <g transform="translate(372 30)"><path d="M0-18l7 20-7-5-7 5z" class="g-f-text"/>${text(0, 14, 'N', { groesse: 11, gewicht: 800 })}</g>
    <g transform="translate(14 382)">
      <rect x="0" y="-4" width="33.3" height="5" class="g-f-text"/><rect x="33.3" y="-4" width="33.3" height="5" class="g-f-weiss g-s-text"/>
      ${text(0, -12, '0', { groesse: 9 })}${text(33.3, -12, '5', { groesse: 9 })}${text(66.6, -12, '10 NM', { groesse: 9, anker: 'start' })}
    </g>
    <rect x="0.5" y="0.5" width="399" height="399" class="g-s-rand" stroke-width="1"/>`;
}

/** Kompassrose um einen Punkt (Hilfe zum Kurs-Ablesen). */
function kompassrose(x, y, r) {
  let striche = '';
  for (let grad = 0; grad < 360; grad += 10) {
    const lang = grad % 30 === 0;
    const [x1, y1] = aufKreis(x, y, r - (lang ? 9 : 5), grad);
    const [x2, y2] = aufKreis(x, y, r, grad);
    striche += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="g-s-primaer" stroke-width="${lang ? 1.6 : 1}"/>`;
    if (lang) {
      const [tx, ty] = aufKreis(x, y, r + 9, grad);
      striche += text(tx.toFixed(1), ty.toFixed(1), String(grad).padStart(3, '0'), { groesse: 8, gewicht: 700, klasse: 'g-f-primaer' });
    }
  }
  return `<circle cx="${x}" cy="${y}" r="${r}" class="g-s-primaer" stroke-width="1.2" opacity=".8"/>${striche}`;
}

export function uebungskarte({ von, nach, rose = false, markiert = [] } = {}) {
  let zusatz = '';
  if (von && nach) {
    zusatz += pfeil(von.x, von.y, nach.x, nach.y, { farbe: 'orange', breite: 3, spitze: 12 });
    if (rose) zusatz += kompassrose(von.x, von.y, 52);
  }
  return svg(400, 400, grundkarte(markiert) + zusatz, 'Übungskarte eines frei erfundenen Gebiets mit Flugplätzen, Kontrollzone, Funkfeuern und Gelände');
}

/** Legende der Übungskarte: alle Zeichen, die auf der Karte vorkommen. */
export function kartenlegende() {
  const ort = (art) => (x, y) => platzSymbol({ x, y, art });
  const eintraege = [
    ['Flughafen mit Kontrollzone', ort('flughafen')],
    ['Flugplatz', ort('platz')],
    ['Segelfluggelände', ort('segel')],
    ['Ultraleicht-Gelände', ort('ul')],
    ['Kontrollzone (CTR)', (x, y) => `<path d="M${x - 11} ${y + 7}a14 14 0 0 1 22 0" class="g-s-luft" stroke-width="2" stroke-dasharray="5 4"/>`],
    ['Pflichtmeldepunkt', (x, y) => SYMBOLE.pflichtmeldepunkt.zeichnen(x, y + 2, 0.8)],
    ['Meldepunkt auf Anforderung', (x, y) => SYMBOLE.bedarfsmeldepunkt.zeichnen(x, y + 2, 0.8)],
    ['VOR/DME', (x, y) => SYMBOLE.vordme.zeichnen(x, y, 0.6)],
    ['NDB', (x, y) => SYMBOLE.ndb.zeichnen(x, y, 0.7)],
    ['Hindernis mit Befeuerung', (x, y) => SYMBOLE.hindernisLicht.zeichnen(x, y + 3, 0.6)],
    ['Isogone (gleiche Missweisung)', (x, y) => linie(x - 12, y + 8, x + 12, y - 8, 'g-s-luft', 1.2, 'stroke-dasharray="3 4"')],
    ['Autobahn', (x, y) => `${linie(x - 13, y, x + 13, y, 'g-s-strasse', 5)}${linie(x - 13, y, x + 13, y, 'g-s-flaeche', 1.5)}`],
    ['Bahnlinie', (x, y) => linie(x - 13, y, x + 13, y, 'g-s-text', 1.6, 'stroke-dasharray="6 4"')],
    ['Fluss und See', (x, y) => `<path d="M${x - 13} ${y + 3}c6-8 10 4 16-3" class="g-s-wasser" stroke-width="3" fill="none"/><ellipse cx="${x + 9}" cy="${y + 2}" rx="5" ry="4" class="g-f-wasser"/>`],
    ['Wald', (x, y) => `<rect x="${x - 12}" y="${y - 7}" width="24" height="14" rx="6" class="g-f-wald"/>`],
    ['Ortschaft', (x, y) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="7" class="g-f-ort"/>`],
  ];
  const zeilen = Math.ceil(eintraege.length / 2);
  return svg(400, zeilen * 30 + 12, `
    <rect width="400" height="${zeilen * 30 + 12}" rx="6" class="g-f-land"/>
    ${eintraege.map(([name, zeichnen], i) => {
      const spalte = i < zeilen ? 0 : 1;
      const x = 22 + spalte * 196;
      const y = 22 + (i % zeilen) * 30;
      return `${zeichnen(x, y)}${text(x + 22, y + 4, name, { groesse: name.length > 26 ? 9.5 : 11, gewicht: 600, anker: 'start' })}`;
    }).join('')}
  `, 'Legende der Übungskarte');
}

// ---------- Weitere Abbildungen ----------

export const abbildungen = {
  uebungskarte: () => uebungskarte(),

  kartenlegende: () => kartenlegende(),

  kartensymbole() {
    const liste = ['vor', 'dme', 'vordme', 'ndb', 'hindernis', 'hindernisLicht', 'pflichtmeldepunkt', 'bedarfsmeldepunkt'];
    return svg(400, liste.length * 46 + 8, liste.map((k, i) => {
      const y = i * 46 + 28;
      return `${SYMBOLE[k].zeichnen(40, y, 1.2)}${text(80, y, SYMBOLE[k].name, { groesse: 15, gewicht: 600, anker: 'start' })}`;
    }).join(''), 'Kartensymbole: VOR, DME, VOR/DME, NDB, Hindernis, Hindernis mit Befeuerung, Pflichtmeldepunkt, Meldepunkt auf Anforderung');
  },

  nordrichtungen() {
    const mx = 200;
    const my = 230;
    const [ex, ey] = aufKreis(mx, my, 170, 15);
    return svg(400, 260, `
      ${pfeil(mx, my, mx, 50, { farbe: 'text', breite: 3 })}
      ${text(mx, 34, 'rechtweisend Nord', { groesse: 13, gewicht: 700 })}
      ${pfeil(mx, my, ex, ey, { farbe: 'luft', breite: 3 })}
      ${text(ex + 6, ey - 12, 'missweisend Nord', { groesse: 13, gewicht: 700, klasse: 'g-f-luft', anker: 'start' })}
      <path d="M${mx} ${my - 110}A110 110 0 0 1 ${aufKreis(mx, my, 110, 15).map((n) => n.toFixed(1)).join(' ')}" class="g-s-orange" stroke-width="3"/>
      ${text(mx + 30, my - 128, 'MW', { groesse: 14, gewicht: 800, klasse: 'g-f-orange' })}
      ${pfeil(mx, my, aufKreis(mx, my, 150, 70)[0], aufKreis(mx, my, 150, 70)[1], { farbe: 'primaer', breite: 3, gestrichelt: true })}
      ${text(aufKreis(mx, my, 160, 70)[0] - 30, aufKreis(mx, my, 160, 70)[1] + 20, 'Kurs', { groesse: 13, gewicht: 700, klasse: 'g-f-primaer' })}
      <circle cx="${mx}" cy="${my}" r="4" class="g-f-text"/>
      ${text(mx - 90, my - 20, 'Ostmissweisung:', { groesse: 12, klasse: 'g-f-leise' })}
      ${text(mx - 90, my - 2, 'mwK = rwK − MW', { groesse: 13, gewicht: 700 })}
    `, 'Rechtweisend Nord und missweisend Nord mit der Missweisung dazwischen');
  },

  winddreieck() {
    // Kurs 090°, TAS-Vektor nach Nordost-Ost, Wind aus Nord – schematisch
    return svg(400, 250, `
      ${pfeil(40, 170, 340, 170, { farbe: 'text', breite: 3 })}
      ${text(190, 192, 'Kurs über Grund (Grundgeschwindigkeit GS)', { groesse: 12, gewicht: 600 })}
      ${pfeil(40, 170, 300, 90, { farbe: 'primaer', breite: 3 })}
      ${text(150, 104, 'Steuerkurs (TAS)', { groesse: 12, gewicht: 700, klasse: 'g-f-primaer' })}
      ${pfeil(300, 90, 340, 170, { farbe: 'orange', breite: 3 })}
      ${text(352, 120, 'Wind', { groesse: 12, gewicht: 700, klasse: 'g-f-orange', anker: 'start' })}
      <path d="M100 170A60 60 0 0 0 97.4 152.5" class="g-s-text" stroke-width="2"/>
      ${text(116, 156, 'L', { groesse: 13, gewicht: 800 })}
      ${text(200, 230, 'L = Luvwinkel (WCA): so viel hältst du gegen den Wind vor', { groesse: 11, klasse: 'g-f-leise' })}
    `, 'Winddreieck aus Steuerkurs mit Eigengeschwindigkeit, Windvektor und Kurs über Grund');
  },

  einszusechzig() {
    return svg(400, 200, `
      ${linie(30, 150, 370, 150, 'g-s-text', 2, 'stroke-dasharray="7 5"')}
      ${text(300, 168, 'geplanter Kurs', { groesse: 12, klasse: 'g-f-leise' })}
      ${pfeil(30, 150, 210, 100, { farbe: 'orange', breite: 3 })}
      ${linie(210, 100, 210, 150, 'g-s-primaer', 2)}
      ${text(220, 126, 'Ablage', { groesse: 12, gewicht: 700, klasse: 'g-f-primaer', anker: 'start' })}
      ${linie(210, 100, 370, 150, 'g-s-ok', 2.5, 'stroke-dasharray="4 4"')}
      ${text(120, 110, 'zurückgelegt', { groesse: 12, gewicht: 600, klasse: 'g-f-orange' })}
      <circle cx="370" cy="150" r="5" class="g-f-ok"/>
      ${text(370, 132, 'Ziel', { groesse: 12, gewicht: 700, klasse: 'g-f-ok' })}
      ${text(200, 186, 'Kursfehler (°) = Ablage (NM) × 60 ÷ zurückgelegte Strecke (NM)', { groesse: 11, klasse: 'g-f-leise' })}
    `, 'Eins-zu-sechzig-Regel: aus Ablage und zurückgelegter Strecke den Kursfehler bestimmen');
  },
};

export { esc, flugzeug };
