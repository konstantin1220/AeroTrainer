// Interaktive Darstellungen für „Navigation“.
import { h } from '../../js/ui.js';
import { regler, wertanzeige, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { svg, text, linie, pfeil, flugzeug, aufKreis } from '../../js/grafik.js';
import { winddreieck } from './generatoren.js';
import { ORTE, kursUndEntfernung, uebungskarte, kartenlegende } from './abbildungen.js';

const RAD = Math.PI / 180;
const grad3 = (g) => String(Math.round(((g % 360) + 360) % 360) || 360).padStart(3, '0');
const r1 = (n) => n.toFixed(1);

/** Vektorpfeil in Nord-oben-Koordinaten (Richtung in Grad, Länge in Einheiten). */
function vektor(winkel, laenge) {
  return [Math.sin(winkel * RAD) * laenge, -Math.cos(winkel * RAD) * laenge];
}

function winddreieckBild(kurs, tas, windRichtung, wind, luv, gs) {
  const steuerkurs = kurs + luv;
  const a = vektor(steuerkurs, tas);
  const w = vektor(windRichtung + 180, wind);
  const b = [a[0] + w[0], a[1] + w[1]];
  const punkte = [[0, 0], a, b];
  const xs = punkte.map((p) => p[0]);
  const ys = punkte.map((p) => p[1]);
  const breite = Math.max(...xs) - Math.min(...xs) || 1;
  const hoehe = Math.max(...ys) - Math.min(...ys) || 1;
  const s = Math.min(330 / breite, 230 / hoehe, 3);
  const ox = 200 - ((Math.max(...xs) + Math.min(...xs)) / 2) * s;
  const oy = 150 - ((Math.max(...ys) + Math.min(...ys)) / 2) * s;
  const P = (p) => [ox + p[0] * s, oy + p[1] * s];
  const [x0, y0] = P([0, 0]);
  const [xa, ya] = P(a);
  const [xb, yb] = P(b);
  const kursEnde = P(vektor(kurs, Math.hypot(b[0], b[1]) * 1.15));
  const mitte = [(x0 + xa + xb) / 3, (y0 + ya + yb) / 3];
  // Liegen Wind und Kurs (fast) auf einer Linie, den Windpfeil etwas zur Seite schieben, damit er sichtbar bleibt
  const abstandA = Math.abs((xb - x0) * (ya - y0) - (yb - y0) * (xa - x0)) / (Math.hypot(xb - x0, yb - y0) || 1);
  const [vx, vy] = (() => {
    if (abstandA >= 10 || wind === 0) return [0, 0];
    const l = Math.hypot(xb - xa, yb - ya) || 1;
    return [((yb - ya) / l) * (10 - abstandA), (-(xb - xa) / l) * (10 - abstandA)];
  })();
  const [wa, wb] = [[xa + vx, ya + vy], [xb + vx, yb + vy]];
  // Beschriftung neben die Mitte einer Seite setzen – senkrecht zur Seite, vom Dreieck weg
  // (liegt alles auf einer Linie, entscheidet die bevorzugte Seite), und nie über den Rand
  const beschriftung = ([x1, y1], [x2, y2], inhalt, klasse, bevorzugt) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const laenge = Math.hypot(x2 - x1, y2 - y1) || 1;
    const [ux, uy] = [(x2 - x1) / laenge, (y2 - y1) / laenge];
    let nx = -uy, ny = ux;
    const aussen = nx * (mx - mitte[0]) + ny * (my - mitte[1]);
    const seite = Math.abs(aussen) > 3 ? Math.sign(aussen) : bevorzugt;
    nx *= seite; ny *= seite;
    const anker = nx > 0.4 ? 'start' : nx < -0.4 ? 'end' : 'middle';
    const platzieren = (zeilen) => {
      const breiteText = Math.max(...zeilen.map((z) => z.length)) * 7;
      // schräge Linien: weiter weg, damit die Textenden die Linie nicht berühren
      const abstand = 10 + (anker === 'middle' ? Math.min(24, Math.abs(uy) * breiteText * 0.45) : 0);
      const x0 = mx + nx * abstand;
      const links = anker === 'start' ? x0 : anker === 'end' ? x0 - breiteText : x0 - breiteText / 2;
      const schieben = Math.max(0, 6 - links) - Math.max(0, links + breiteText - 394);
      return { x: x0 + schieben, y: my + ny * (abstand + 4) + 4, schieben };
    };
    let zeilen = [inhalt];
    let lage = platzieren(zeilen);
    if (Math.abs(lage.schieben) > 4 && inhalt.includes(' ')) {
      const teil = inhalt.indexOf(' ');
      zeilen = [inhalt.slice(0, teil), inhalt.slice(teil + 1)];
      lage = platzieren(zeilen);
    }
    const y = Math.min(292 - (zeilen.length - 1) * 14, Math.max(14, lage.y - (zeilen.length - 1) * 7));
    return zeilen.map((z, i) => text(r1(lage.x), r1(y + i * 14), z, { groesse: 12, gewicht: 700, klasse, anker })).join('');
  };
  return svg(400, 300, `
    <rect width="400" height="300" class="g-f-himmel"/>
    ${linie(r1(x0), r1(y0), r1(kursEnde[0]), r1(kursEnde[1]), 'g-s-leise', 1, 'stroke-dasharray="6 6"')}
    ${pfeil(x0, y0, xa, ya, { farbe: 'primaer', breite: 2.1, spitze: 9.4 })}
    ${wind > 0 ? pfeil(wa[0], wa[1], wb[0], wb[1], { farbe: 'orange', breite: 2.1, spitze: 9.4 }) : ''}
    ${pfeil(x0, y0, xb, yb, { farbe: 'text', breite: 2.1, spitze: 9.4 })}
    ${flugzeug(x0, y0, steuerkurs, 34)}
    ${beschriftung([x0, y0], [xa, ya], `TAS ${tas} kt`, 'g-f-primaer', -1)}
    ${wind > 0 ? beschriftung(wa, wb, `Wind ${wind} kt`, 'g-f-orange', -1) : ''}
    ${beschriftung([x0, y0], [xb, yb], `GS ${Math.round(gs)} kt`, 'g-f-text', 1)}
    ${Math.abs(luv) >= 1 ? (() => {
      const rb = 58;
      const [k1, k2] = vektor(kurs, rb);
      const [s1, s2] = vektor(steuerkurs, rb);
      const [t1, t2] = Math.abs(luv) < 16 ? vektor(steuerkurs + Math.sign(luv) * 9, rb + 4) : vektor(kurs + luv / 2, rb + 16);
      return `<path d="M${r1(x0 + k1)} ${r1(y0 + k2)}A${rb} ${rb} 0 0 ${luv > 0 ? 1 : 0} ${r1(x0 + s1)} ${r1(y0 + s2)}" class="g-s-orange" stroke-width="1.6"/>${text(r1(x0 + t1), r1(y0 + t2), `${Math.abs(Math.round(luv))}°`, { groesse: 11, gewicht: 800, klasse: 'g-f-orange' })}`;
    })() : ''}
    <g transform="translate(372 34)"><path d="M0-16l6 18-6-5-6 5z" class="g-f-text"/>${text(0, 14, 'N', { groesse: 11, gewicht: 800 })}</g>
  `, 'Winddreieck: Steuerkurs mit Eigengeschwindigkeit, Wind und Kurs über Grund');
}

function kompassBild(rwk, mw, dev) {
  const c = 200, cy = 175, r = 130;
  const strahl = (grad, farbe, laenge, gestrichelt = false) => {
    const [x, y] = aufKreis(c, cy, laenge, grad);
    return pfeil(c, cy, x, y, { farbe, breite: 1.8, spitze: 8.6, gestrichelt });
  };
  let skala = '';
  for (let g = 0; g < 360; g += 10) {
    const [x1, y1] = aufKreis(c, cy, r - (g % 30 ? 5 : 10), g);
    const [x2, y2] = aufKreis(c, cy, r, g);
    skala += linie(r1(x1), r1(y1), r1(x2), r1(y2), 'g-s-rand', g % 30 ? 1 : 2);
  }
  const [kx, ky] = aufKreis(c, cy, r + 4, rwk);
  return svg(400, 330, `
    <circle cx="${c}" cy="${cy}" r="${r}" class="g-f-flaeche g-s-rand" stroke-width="1.3"/>
    ${skala}
    ${strahl(0, 'text', r - 14)}
    ${strahl(mw, 'luft', r - 30)}
    ${strahl(mw + dev, 'orange', r - 46)}
    ${pfeil(c, cy, kx, ky, { farbe: 'primaer', breite: 2.4, spitze: 10.1 })}
    <circle cx="${c}" cy="${cy}" r="5" class="g-f-text"/>
    ${text(c, cy - r - 14, 'rechtweisend Nord', { groesse: 12, gewicht: 700 })}
    ${text(14, 300, '■', { groesse: 14, anker: 'start', klasse: 'g-f-luft' })}${text(30, 300, 'missweisend Nord', { groesse: 12, anker: 'start' })}
    ${text(150, 300, '■', { groesse: 14, anker: 'start', klasse: 'g-f-orange' })}${text(166, 300, 'Kompass-Nord', { groesse: 12, anker: 'start' })}
    ${text(270, 300, '■', { groesse: 14, anker: 'start', klasse: 'g-f-primaer' })}${text(286, 300, 'Kurs', { groesse: 12, anker: 'start' })}
    ${text(c, 322, 'Winkel übertrieben dargestellt, wenn Missweisung und Deviation klein sind', { groesse: 10, klasse: 'g-f-leise' })}
  `, 'Kompassrose mit rechtweisend Nord, missweisend Nord, Kompass-Nord und Kurs');
}

function einszusechzigBild(geflogen, ablage, rest) {
  const gesamt = geflogen + rest;
  const s = 340 / gesamt;
  const x0 = 30, y0 = 200;
  const xp = x0 + geflogen * s;
  const yp = y0 - Math.min(ablage * s * 4, 150);
  const xz = x0 + gesamt * s;
  return svg(400, 250, `
    <rect width="400" height="250" class="g-f-himmel"/>
    ${linie(x0, y0, xz, y0, 'g-s-text', 1.4, 'stroke-dasharray="7 5"')}
    ${pfeil(x0, y0, xp, yp, { farbe: 'orange', breite: 1.8 })}
    ${linie(r1(xp), r1(yp), r1(xp), y0, 'g-s-primaer', 1.4)}
    ${pfeil(xp, yp, xz - 4, y0 - 2, { farbe: 'ok', breite: 1.8, gestrichelt: true })}
    <circle cx="${x0}" cy="${y0}" r="6" class="g-f-text"/><circle cx="${r1(xz)}" cy="${y0}" r="6" class="g-f-ok"/>
    ${flugzeug(xp, yp, 90 - Math.atan2(y0 - yp, xp - x0) / RAD, 26, 'g-f-orange')}
    ${text(x0, y0 - 16, 'Start', { groesse: 12, gewicht: 700 })}
    ${text(r1(xz), y0 - 16, 'Ziel', { groesse: 12, gewicht: 700, klasse: 'g-f-ok' })}
    ${text(r1(xp + 8), r1((yp + y0) / 2), `${ablage} NM`, { groesse: 12, gewicht: 700, klasse: 'g-f-primaer', anker: 'start' })}
    ${text(r1((x0 + xp) / 2), y0 + 22, `${geflogen} NM geflogen`, { groesse: 11, klasse: 'g-f-leise' })}
    ${text(r1((xp + xz) / 2), y0 + 22, `${rest} NM Rest`, { groesse: 11, klasse: 'g-f-leise' })}
  `, 'Eins-zu-sechzig-Regel mit Ablage, geflogener Strecke und Reststrecke');
}

export const interaktiv = {
  winddreieck: {
    titel: 'Winddreieck',
    kurz: 'Verändere Kurs, Geschwindigkeit und Wind – und sieh, wie Luvwinkel und Grundgeschwindigkeit sich ändern.',
    symbol: 'karte',
    anleitung: "Stelle mit den Reglern Kurs, Eigengeschwindigkeit und Wind ein. Die Grafik zeigt drei Pfeile: wohin die Nase zeigt (TAS), wohin der Wind dich schiebt (Wind) und wohin du dich tatsächlich über dem Boden bewegst (GS). Der orange Bogen ist der Luvwinkel.",
    legende: [["primaer", "Steuerkurs mit Eigengeschwindigkeit (TAS)"], ["orange", "Wind und Luvwinkel"], ["text", "Kurs über Grund mit Grundgeschwindigkeit (GS)"]],
    probier: ["Stell den Wind genau von rechts ein (Kurs 090°, Wind aus 180°). Wohin musst du vorhalten?", "Dreh den Wind auf Gegenwind (Wind aus 090°). Was passiert mit Luvwinkel und Grundgeschwindigkeit?", "Verdopple die Windgeschwindigkeit – wird der Luvwinkel auch ungefähr doppelt so groß?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const kurs = regler({ name: 'Kurs (rwK)', min: 0, max: 355, schritt: 5, wert: 90, format: (w) => `${grad3(w)}°`, beiAenderung: zeichnen });
      const tas = regler({ name: 'Eigengeschwindigkeit (TAS)', min: 60, max: 150, schritt: 5, wert: 100, format: (w) => `${w} kt`, beiAenderung: zeichnen });
      const wr = regler({ name: 'Wind aus', min: 0, max: 350, schritt: 10, wert: 30, format: (w) => `${grad3(w)}°`, beiAenderung: zeichnen });
      const ws = regler({ name: 'Windgeschwindigkeit', min: 0, max: 40, wert: 20, format: (w) => `${w} kt`, beiAenderung: zeichnen });
      function zeichnen() {
        const { luv, gs } = winddreieck(kurs.wert, tas.wert, wr.wert, ws.wert);
        const theta = (wr.wert - kurs.wert) * RAD;
        const gegen = ws.wert * Math.cos(theta);
        bild.zeichnen(winddreieckBild(kurs.wert, tas.wert, wr.wert, ws.wert, luv, gs));
        werte.setzen([
          { titel: 'Luvwinkel', wert: `${Math.abs(Math.round(luv))}°`, hinweis: Math.round(luv) === 0 ? 'kein Vorhalt' : `nach ${luv > 0 ? 'rechts' : 'links'}` },
          { titel: 'Steuerkurs (rwSK)', wert: `${grad3(kurs.wert + luv)}°` },
          { titel: 'Grundgeschwindigkeit', wert: Math.round(gs), einheit: 'kt', art: gs < tas.wert - 1 ? 'warnung' : gs > tas.wert + 1 ? 'gut' : '' },
          { titel: gegen >= 0 ? 'Gegenwind' : 'Rückenwind', wert: Math.abs(Math.round(gegen)), einheit: 'kt' },
          { titel: 'Faustformel max. Luvwinkel', wert: `${Math.round((60 * ws.wert) / tas.wert)}°`, hinweis: '60 × Wind ÷ TAS' },
        ]);
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(kurs.el, tas.el, wr.el, ws.el), werte.el);
    },
  },

  kurskette: {
    titel: 'Vom Kartenkurs zum Kompasskurs',
    kurz: 'Rechtweisender Kurs, Missweisung und Deviation – rechne den Kompasskurs Schritt für Schritt.',
    symbol: 'karte',
    anleitung: "Stelle den Kurs aus der Karte (rwK), die Missweisung und die Deviation ein. Die Pfeile zeigen die drei Nordrichtungen und deinen Kurs; darunter steht der Rechenweg Schritt für Schritt.",
    legende: [["text", "rechtweisend Nord (Karte)"], ["luft", "missweisend Nord (Magnetfeld)"], ["orange", "Kompass-Nord (mit Deviation)"], ["primaer", "dein Kurs"]],
    probier: ["Stelle 3° Ost ein: Ist der missweisende Kurs größer oder kleiner als der rechtweisende?", "Wechsle auf West-Missweisung – was ändert sich am Rechenweg?", "Bei welchen Einstellungen sind alle drei Kurse gleich?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const rwk = regler({ name: 'Rechtweisender Kurs (rwK)', min: 0, max: 359, wert: 245, format: (w) => `${grad3(w)}°`, beiAenderung: zeichnen });
      const mw = regler({ name: 'Missweisung (MW)', min: -15, max: 15, wert: 3, format: (w) => (w === 0 ? '0°' : `${Math.abs(w)}° ${w > 0 ? 'Ost' : 'West'}`), beiAenderung: zeichnen });
      const dev = regler({ name: 'Deviation (Dev)', min: -6, max: 6, wert: -2, format: (w) => `${w > 0 ? '+' : ''}${w}°`, beiAenderung: zeichnen });
      function zeichnen() {
        const mwk = rwk.wert - mw.wert;
        const kk = mwk - dev.wert;
        bild.zeichnen(kompassBild(rwk.wert, mw.wert * 3, dev.wert * 3));
        werte.setzen([
          { titel: 'rwK', wert: `${grad3(rwk.wert)}°` },
          { titel: `− MW (${mw.wert > 0 ? '+' : ''}${mw.wert}°)`, wert: `${grad3(mwk)}°`, hinweis: 'missweisender Kurs (mwK)' },
          { titel: `− Dev (${dev.wert > 0 ? '+' : ''}${dev.wert}°)`, wert: `${grad3(kk)}°`, hinweis: 'Kompasskurs (KK)', art: 'gut' },
        ]);
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, rwk.el), mw.el, dev.el), werte.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Ost wird abgezogen, West dazugezählt. In der Grafik sind die Winkel von Missweisung und Deviation dreifach vergrößert, damit man sie sieht.'));
    },
  },

  kartemessen: {
    titel: 'Übungskarte: Kurs und Entfernung',
    kurz: 'Tippe zwei Orte auf der Übungskarte an – Kurs, Entfernung und Flugzeit werden berechnet.',
    symbol: 'karte',
    anleitung: "Tippe zuerst den Startort, dann das Ziel auf der Karte an. Die App zeichnet die Strecke, legt eine Kursrose um den Start und berechnet Kurs, Entfernung und Flugzeit.",
    legende: [["orange", "geplante Strecke"], ["primaer", "Kursrose in Grad um den Startort"], ["luft", "Lufträume, Funkfeuer, Meldepunkte"]],
    probier: ["Lies den Kurs von Altdorf nach Seefeld zuerst selbst an der Kursrose ab – stimmt dein Wert?", "Wie ändert sich die Flugzeit, wenn du die Grundgeschwindigkeit von 95 auf 120 kt erhöhst?", "Welche Strecken führen durch die Kontrollzone von Musterstadt?"],
    erstellen() {
      let von = 'altdorf';
      let nach = 'seefeld';
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const gs = regler({ name: 'Grundgeschwindigkeit', min: 60, max: 150, schritt: 5, wert: 95, format: (w) => `${w} kt`, beiAenderung: zeichnen });
      bild.el.addEventListener('click', (e) => {
        const ort = e.target.closest('[data-ort]')?.dataset.ort;
        if (!ort) return;
        if (!von || nach) { von = ort; nach = null; } else if (ort !== von) nach = ort;
        zeichnen();
      });
      function zeichnen() {
        const a = ORTE[von];
        const b = nach ? ORTE[nach] : null;
        bild.zeichnen(uebungskarte({ von: a, nach: b ?? undefined, rose: Boolean(b), markiert: [von, nach].filter(Boolean) }));
        if (!b) {
          werte.setzen([]);
          hinweis.setzen(`Start: ${a.name}. Tippe jetzt das Ziel an.`);
          return;
        }
        const { kurs, entfernung } = kursUndEntfernung(a, b);
        const minuten = (entfernung / gs.wert) * 60;
        hinweis.setzen(`${a.name} → ${b.name}. Tippe einen Ort an, um neu zu beginnen.`, 'ok');
        werte.setzen([
          { titel: 'rechtweisender Kurs', wert: `${grad3(kurs)}°` },
          { titel: 'missweisender Kurs', wert: `${grad3(kurs - 3)}°`, hinweis: 'Missweisung 3° Ost (Isogone)' },
          { titel: 'Entfernung', wert: Math.round(entfernung), einheit: 'NM', hinweis: `≈ ${Math.round(entfernung * 1.852)} km` },
          { titel: 'Flugzeit', wert: Math.round(minuten), einheit: 'min', hinweis: `bei ${gs.wert} kt` },
        ]);
      }
      zeichnen();
      const legende = h('div', { class: 'abbildung-grafik' });
      legende.innerHTML = kartenlegende();
      return h('div', {}, bild.el, hinweis.el, werte.el, bedienfeld(h('div', { class: 'breit' }, gs.el)),
        h('details', { class: 'karten-legende' }, h('summary', {}, 'Kartenlegende: Was bedeuten die Zeichen?'), legende),
        h('p', { class: 'interaktiv-erklaerung' }, 'Frei erfundenes Übungsgebiet, 60 × 60 NM. Kurse ohne Wind – im Flug kommt noch der Luvwinkel dazu.'));
    },
  },

  einszusechzig: {
    titel: '1:60-Regel',
    kurz: 'Wie groß ist der Kursfehler – und wie viel musst du korrigieren, um das Ziel zu erreichen?',
    symbol: 'ziel',
    anleitung: "Stelle ein, wie weit du schon geflogen bist, wie weit du neben dem Kurs liegst und wie weit es noch bis zum Ziel ist. Die App rechnet mit der 1:60-Regel aus, um wie viel Grad du korrigieren musst.",
    legende: [["text", "geplanter Kurs"], ["orange", "tatsächlich geflogen"], ["primaer", "Ablage"], ["ok", "neuer Kurs direkt zum Ziel"]],
    probier: ["Nach 60 NM bist du 1 NM daneben – wie groß ist der Kursfehler?", "Halbiere die Reststrecke: Was passiert mit dem Schließwinkel?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const geflogen = regler({ name: 'Geflogene Strecke', min: 10, max: 80, schritt: 5, wert: 30, format: (w) => `${w} NM`, beiAenderung: zeichnen });
      const ablage = regler({ name: 'Ablage vom Kurs', min: 0.5, max: 6, schritt: 0.5, wert: 2, format: (w) => `${String(w).replace('.', ',')} NM`, beiAenderung: zeichnen });
      const rest = regler({ name: 'Reststrecke zum Ziel', min: 10, max: 80, schritt: 5, wert: 40, format: (w) => `${w} NM`, beiAenderung: zeichnen });
      function zeichnen() {
        const fehler = (ablage.wert * 60) / geflogen.wert;
        const schliess = (ablage.wert * 60) / rest.wert;
        bild.zeichnen(einszusechzigBild(geflogen.wert, ablage.wert, rest.wert));
        werte.setzen([
          { titel: 'Kursfehler', wert: `${fehler.toFixed(1).replace('.', ',')}°`, hinweis: 'Ablage × 60 ÷ geflogen' },
          { titel: 'Schließwinkel', wert: `${schliess.toFixed(1).replace('.', ',')}°`, hinweis: 'Ablage × 60 ÷ Rest' },
          { titel: 'Korrektur zum Ziel', wert: `${(fehler + schliess).toFixed(1).replace('.', ',')}°`, art: 'gut', hinweis: 'Kursfehler + Schließwinkel' },
        ]);
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(geflogen.el, rest.el, h('div', { class: 'breit' }, ablage.el)), werte.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Die Ablage ist in der Grafik übertrieben groß dargestellt.'));
    },
  },
};
