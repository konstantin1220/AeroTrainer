// Interaktive Darstellungen für „Technik“.
import { h } from '../../js/ui.js';
import { regler, umschalter, wertanzeige, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { svg, text, linie, aufKreis } from '../../js/grafik.js';
import { MF4_FAHRT, fahrtBereich, staudruckAnzeigen, vergaserGefahr, relativeFeuchte } from './rechnen.js';

const r1 = (n) => Math.round(n * 10) / 10;
const ganz = (n) => String(Math.round(n));

// ---------- Rundinstrumente ----------
// Instrumente haben feste Gerätefarben (dunkles Zifferblatt, helle Schrift) – in hellem und dunklem Farbschema gleich.

const HELL = '#f3f4f6';
const strich = (x1, y1, x2, y2, breite = 1.2, farbe = HELL) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${farbe}" stroke-width="${breite}" stroke-linecap="round"/>`;
const ziffer = (x, y, inhalt, groesse = 10) => `<text x="${r1(x)}" y="${r1(y)}" fill="#e5e7eb" font-size="${groesse}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${inhalt}</text>`;

/** Bogen auf der Skala von Winkel w1 bis w2 (0° = oben, im Uhrzeigersinn). */
function bogen(cx, cy, r, w1, w2, farbe, breite) {
  let d = '';
  const schritte = 40;
  for (let i = 0; i <= schritte; i++) {
    const [x, y] = aufKreis(cx, cy, r, w1 + ((w2 - w1) * i) / schritte);
    d += `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`;
  }
  return `<path d="${d}" stroke="${farbe}" stroke-width="${breite}" fill="none"/>`;
}

function nadel(cx, cy, r, grad) {
  const [x, y] = aufKreis(cx, cy, r, grad);
  return `${strich(cx, cy, x, y, 2.6)}<circle cx="${cx}" cy="${cy}" r="4" fill="${HELL}"/>`;
}

/** Fahrtmesser bis maxKt mit den Farbbögen des MF-4. Skala über 300° (−150° bis +150°). */
function fahrtmesserZifferblatt(cx, cy, r, kt, { maxKt = 180, ziffern = 11 } = {}) {
  const m = MF4_FAHRT;
  const w = (v) => -150 + (Math.max(0, Math.min(maxKt, v)) / maxKt) * 300;
  let skala = '';
  for (let v = 0; v <= maxKt; v += 10) {
    const lang = v % 20 === 0;
    const [x1, y1] = aufKreis(cx, cy, r - (lang ? 12 : 7), w(v));
    const [x2, y2] = aufKreis(cx, cy, r - 2, w(v));
    skala += strich(x1, y1, x2, y2, lang ? 1.6 : 1);
    if (lang && v % 40 === 0) {
      const [tx, ty] = aufKreis(cx, cy, r - 26, w(v));
      skala += ziffer(tx, ty, String(v), ziffern);
    }
  }
  const [rx1, ry1] = aufKreis(cx, cy, r - 15, w(m.vne));
  const [rx2, ry2] = aufKreis(cx, cy, r, w(m.vne));
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1f2937"/>
    ${bogen(cx, cy, r - 13, w(m.vs0), w(m.vfe), '#f9fafb', 5)}
    ${bogen(cx, cy, r - 6, w(m.vs1), w(m.vno), '#22c55e', 6)}
    ${bogen(cx, cy, r - 6, w(m.vno), w(m.vne), '#facc15', 6)}
    ${strich(rx1, ry1, rx2, ry2, 4, '#ef4444')}
    ${skala}
    ${ziffer(cx, cy + r * 0.42, 'KT', ziffern)}
    ${nadel(cx, cy, r - 10, w(kt))}`;
}

/** Höhenmesser: großer Zeiger Hunderter, kleiner Zeiger Tausender. */
function hoehenmesserZifferblatt(cx, cy, r, ft) {
  let skala = '';
  for (let i = 0; i < 10; i++) {
    const [x1, y1] = aufKreis(cx, cy, r - 8, i * 36);
    const [x2, y2] = aufKreis(cx, cy, r - 2, i * 36);
    const [tx, ty] = aufKreis(cx, cy, r - 18, i * 36);
    skala += strich(x1, y1, x2, y2, 1.4) + ziffer(tx, ty, String(i));
  }
  const hunderter = ((ft % 1000) + 1000) % 1000;
  const [kx, ky] = aufKreis(cx, cy, r * 0.45, (ft / 10000) * 360);
  const [gx, gy] = aufKreis(cx, cy, r - 8, (hunderter / 1000) * 360);
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1f2937"/>${skala}
    <line x1="${cx}" y1="${cy}" x2="${r1(kx)}" y2="${r1(ky)}" stroke="#f9fafb" stroke-width="4" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${r1(gx)}" y2="${r1(gy)}" stroke="#f9fafb" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="#f9fafb"/>`;
}

/** Variometer ±2000 ft/min, null links (9 Uhr). */
function variometerZifferblatt(cx, cy, r, fpm) {
  const w = (v) => -90 + (Math.max(-2000, Math.min(2000, v)) / 2000) * 170;
  let skala = '';
  for (let v = -2000; v <= 2000; v += 500) {
    const [x1, y1] = aufKreis(cx, cy, r - 8, w(v));
    const [x2, y2] = aufKreis(cx, cy, r - 2, w(v));
    skala += strich(x1, y1, x2, y2, v % 1000 === 0 ? 1.6 : 1);
    if (v % 1000 === 0) {
      const [tx, ty] = aufKreis(cx, cy, r - 18, w(v));
      skala += ziffer(tx, ty, String(Math.abs(v / 1000)));
    }
  }
  const [nx, ny] = aufKreis(cx, cy, r - 8, w(fpm));
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1f2937"/>${skala}
    ${ziffer(cx + 14, cy - r * 0.42, 'auf', 9)}${ziffer(cx + 14, cy + r * 0.42, 'ab', 9)}
    <line x1="${cx}" y1="${cy}" x2="${r1(nx)}" y2="${r1(ny)}" stroke="#f9fafb" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="#f9fafb"/>`;
}

// ---------- Vergaservereisung ----------

function vergaserBild(t, td) {
  const l = 54, r = 384, o = 30, u = 250;
  const px = (grad) => l + ((grad + 10) / 50) * (r - l);
  const py = (rf) => u - ((rf - 30) / 70) * (u - o);
  const rf = relativeFeuchte(t, td);
  let raster = '';
  for (let g = -10; g <= 40; g += 10) raster += linie(r1(px(g)), o, r1(px(g)), u, 'g-s-rand', 0.8) + text(r1(px(g)), u + 13, `${g} °C`, { groesse: 10, klasse: 'g-f-leise', anker: g === 40 ? 'end' : 'middle' });
  for (let f = 30; f <= 100; f += 10) raster += linie(l, r1(py(f)), r, r1(py(f)), 'g-s-rand', 0.8) + text(l - 5, r1(py(f)), `${f} %`, { groesse: 10, klasse: 'g-f-leise', anker: 'end' });
  const gefahr = vergaserGefahr(t, rf);
  return svg(400, 280, `
    <rect x="${l}" y="${o}" width="${r - l}" height="${u - o}" class="g-f-flaeche"/>
    <rect x="${r1(px(-7))}" y="${r1(py(100))}" width="${r1(px(38) - px(-7))}" height="${r1(py(50) - py(100))}" class="g-f-orange" opacity=".22"/>
    <rect x="${r1(px(-7))}" y="${r1(py(100))}" width="${r1(px(21) - px(-7))}" height="${r1(py(80) - py(100))}" class="g-f-fehler" opacity=".3"/>
    ${raster}
    ${text(r1(px(7)), r1(py(90)), 'hohe Gefahr', { groesse: 12, gewicht: 800, klasse: 'g-f-fehler g-halo' })}
    ${text(r1(px(29)), r1(py(65)), 'möglich', { groesse: 12, gewicht: 800, klasse: 'g-f-orange g-halo' })}
    ${text(r1(px(29)), r1(py(38)), 'gering', { groesse: 12, gewicht: 800, klasse: 'g-f-leise g-halo' })}
    <circle cx="${r1(px(Math.max(-10, Math.min(40, t))))}" cy="${r1(py(Math.max(30, rf)))}" r="7" class="g-f-primaer"/>
    ${text(200, 276, 'Außentemperatur →', { groesse: 10, klasse: 'g-f-leise' })}
    ${text(8, 12, 'relative Feuchte ↑', { groesse: 10, klasse: 'g-f-leise', anker: 'start' })}
  `, `Vergaservereisung bei ${t} Grad und ${Math.round(rf)} Prozent relativer Feuchte: Gefahr ${gefahr}`);
}

const STOERUNGEN = [
  ['keine', 'keine'],
  ['staurohr', 'Staurohr zu'],
  ['staurohrUndAblauf', 'Staurohr und Ablauf zu'],
  ['statisch', 'statische Öffnung zu'],
  ['ersatz', 'Ersatz-Druckquelle'],
];

export const interaktiv = {
  fahrtmesser: {
    titel: 'Die Farbbögen am Fahrtmesser',
    kurz: 'Stelle eine Fahrt ein und sieh, in welchem Bereich du bist – am Beispiel des Übungsflugzeugs MF-4.',
    symbol: 'ziel',
    anleitung: 'Schiebe den Regler: Die Nadel zeigt die angezeigte Fahrt (IAS) am Fahrtmesser des frei erfundenen Übungsflugzeugs MF-4. Weißer Bogen: Klappenbereich, grüner Bogen: Normalbereich, gelber Bogen: Vorsicht, roter Strich: VNE. Darunter steht, was in diesem Bereich gilt.',
    legende: [['text', 'weiß: VS0 bis VFE (Klappenbereich)'], ['ok', 'grün: VS1 bis VNO (normal)'], ['orange', 'gelb: VNO bis VNE (nur ruhige Luft)'], ['fehler', 'rot: VNE']],
    probier: ['Wo beginnt der weiße Bogen – und was bedeutet diese Geschwindigkeit?', 'Bis zu welcher Fahrt darfst du beim MF-4 die Klappen ausfahren?', 'Du fliegst bei Turbulenz mit 130 kt. Was tust du?'],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const fahrt = regler({ name: 'Angezeigte Fahrt', min: 0, max: 170, schritt: 1, wert: 95, format: (w) => `${w} kt`, beiAenderung: zeichnen });
      const TEXTE = {
        unter: ['unter VS0', 'Unter der Überziehgeschwindigkeit in Landekonfiguration – im Flug nicht möglich.', 'fehler'],
        weiss: ['weißer Bogen', 'Nur mit ausgefahrenen Landeklappen. Ohne Klappen wärst du unter VS1 – nahe am Strömungsabriss.', 'warnung'],
        'gruen-weiss': ['grün und weiß', 'Normaler Bereich – Landeklappen dürfen ausgefahren werden (bis VFE).', ''],
        gruen: ['grüner Bogen', 'Normaler Bereich. Über VFE: Landeklappen eingefahren lassen.', ''],
        gelb: ['gelber Bogen', 'Vorsichtsbereich: nur in ruhiger Luft und mit Vorsicht. Bei Turbulenz Fahrt verringern.', 'warnung'],
        rot: ['roter Strich', 'VNE erreicht oder überschritten – sofort Fahrt verringern. Es droht Strukturschaden.', 'fehler'],
      };
      function zeichnen() {
        const bereich = fahrtBereich(fahrt.wert);
        const [name, erklaerung, art] = TEXTE[bereich];
        bild.zeichnen(svg(400, 270, `<rect width="400" height="270" class="g-f-flaeche"/>${fahrtmesserZifferblatt(200, 134, 118, fahrt.wert)}`, `Fahrtmesser zeigt ${fahrt.wert} Knoten: ${name}`));
        werte.setzen([
          { titel: 'Fahrt', wert: fahrt.wert, einheit: 'kt' },
          { titel: 'Bereich', wert: name, art: art === 'fehler' ? 'schlecht' : art === '' ? 'gut' : '' },
        ]);
        hinweis.setzen(erklaerung, art);
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, fahrt.el)), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, `MF-4 (frei erfunden): VS0 ${MF4_FAHRT.vs0} kt, VS1 ${MF4_FAHRT.vs1} kt, VFE ${MF4_FAHRT.vfe} kt, VNO ${MF4_FAHRT.vno} kt, VNE ${MF4_FAHRT.vne} kt. Für dein Flugzeug gelten die Werte im Flughandbuch.`));
    },
  },

  staudruck: {
    titel: 'Wenn das Staurohr verstopft',
    kurz: 'Wähle eine Störung und steige oder sinke – und sieh, was Fahrtmesser, Höhenmesser und Variometer anzeigen.',
    symbol: 'auge',
    anleitung: 'Die Störung beginnt in 4000 ft bei 100 kt. Wähle die Störung, dann ändere Höhe, Fahrt und Steigrate. Die drei Instrumente zeigen, was du im Cockpit siehst; darunter steht, was wirklich ist. Gerechnet wird mit der Standardatmosphäre.',
    legende: [['text', 'Zeiger: was das Instrument anzeigt'], ['ok', 'stimmt mit der Wirklichkeit überein'], ['fehler', 'falsche Anzeige']],
    probier: ['Staurohr und Ablauf zu: Steig auf 5000 ft. Was macht der Fahrtmesser – und warum ist das gefährlich?', 'Statische Öffnung zu: Sinke auf 3000 ft. Was zeigt der Fahrtmesser?', 'Schalte auf die Ersatz-Druckquelle: Zeigen die Instrumente zu viel oder zu wenig?'],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const stoerung = umschalter({ name: 'Störung', optionen: STOERUNGEN, wert: 'keine', beiAenderung: zeichnen });
      const hoehe = regler({ name: 'Wirkliche Höhe', min: 3000, max: 5000, schritt: 100, wert: 4000, format: (w) => `${w} ft`, beiAenderung: zeichnen });
      const fahrt = regler({ name: 'Wirkliche Fahrt (TAS)', min: 70, max: 130, schritt: 5, wert: 100, format: (w) => `${w} kt`, beiAenderung: zeichnen });
      const steig = regler({ name: 'Steigen oder Sinken', min: -1000, max: 1000, schritt: 100, wert: 0, format: (w) => `${w > 0 ? '+' : ''}${w} ft/min`, beiAenderung: zeichnen });
      const TEXT = {
        keine: 'Alles frei: Die Instrumente zeigen richtig. (Der Fahrtmesser zeigt die angezeigte Fahrt IAS – in der Höhe etwas weniger als die wahre Fahrt.)',
        staurohr: 'Staurohr verstopft, Ablauf offen: Der Druck im Staurohr gleicht sich dem statischen an – der Fahrtmesser fällt auf null. Höhenmesser und Variometer arbeiten weiter.',
        staurohrUndAblauf: 'Staurohr und Ablauf verstopft: Der Fahrtmesser reagiert nicht mehr auf die Fahrt, sondern auf die Höhe – beim Steigen zeigt er mehr, beim Sinken weniger.',
        statisch: 'Statische Öffnung verstopft: Höhenmesser bleibt stehen, Variometer zeigt null, der Fahrtmesser zeigt beim Steigen zu wenig und beim Sinken zu viel.',
        ersatz: 'Ersatz-Druckquelle in der Kabine: Der Druck ist dort etwas geringer – Höhenmesser und Fahrtmesser zeigen etwas zu viel. Beim Umschalten zeigt das Variometer kurz ein Steigen.',
      };
      function zeichnen() {
        const a = staudruckAnzeigen({ stoerung: stoerung.wert, hoehe: hoehe.wert, fahrt: fahrt.wert, steigrate: steig.wert });
        const richtig = staudruckAnzeigen({ hoehe: hoehe.wert, fahrt: fahrt.wert, steigrate: steig.wert });
        const stimmt = (x, y, tol) => Math.abs(x - y) <= tol;
        const farbe = (ok) => (ok ? 'g-f-ok' : 'g-f-fehler');
        const fOk = stimmt(a.fahrtmesser, richtig.fahrtmesser, 2), hOk = stimmt(a.hoehenmesser, richtig.hoehenmesser, 20), vOk = stimmt(a.variometer, richtig.variometer, 50);
        bild.zeichnen(svg(400, 210, `
          <rect width="400" height="210" class="g-f-flaeche"/>
          <g transform="translate(70 92) scale(0.5) translate(-200 -134)">${fahrtmesserZifferblatt(200, 134, 118, a.fahrtmesser, { maxKt: 200, ziffern: 20 })}</g>
          ${hoehenmesserZifferblatt(200, 92, 58, a.hoehenmesser)}
          ${variometerZifferblatt(330, 92, 58, a.variometer)}
          ${text(70, 166, `${ganz(a.fahrtmesser)} kt`, { groesse: 13, gewicht: 800, klasse: farbe(fOk) })}
          ${text(200, 166, `${ganz(a.hoehenmesser)} ft`, { groesse: 13, gewicht: 800, klasse: farbe(hOk) })}
          ${text(330, 166, `${ganz(a.variometer)} ft/min`, { groesse: 13, gewicht: 800, klasse: farbe(vOk) })}
          ${text(70, 186, `wirklich ${ganz(richtig.fahrtmesser)} kt`, { groesse: 10.5, klasse: 'g-f-leise' })}
          ${text(200, 186, `wirklich ${hoehe.wert} ft`, { groesse: 10.5, klasse: 'g-f-leise' })}
          ${text(330, 186, `wirklich ${steig.wert} ft/min`, { groesse: 10.5, klasse: 'g-f-leise' })}
          ${text(70, 22, 'Fahrtmesser', { groesse: 11, gewicht: 700 })}${text(200, 22, 'Höhenmesser', { groesse: 11, gewicht: 700 })}${text(330, 22, 'Variometer', { groesse: 11, gewicht: 700 })}
        `, `Fahrtmesser ${ganz(a.fahrtmesser)} Knoten, Höhenmesser ${ganz(a.hoehenmesser)} Fuß, Variometer ${ganz(a.variometer)} Fuß pro Minute`));
        werte.setzen([
          { titel: 'Fahrtmesser', wert: `${ganz(a.fahrtmesser)} kt`, art: fOk ? 'gut' : 'schlecht' },
          { titel: 'Höhenmesser', wert: `${ganz(a.hoehenmesser)} ft`, art: hOk ? 'gut' : 'schlecht' },
          { titel: 'Variometer', wert: `${ganz(a.variometer)} ft/min`, art: vOk ? 'gut' : 'schlecht' },
        ]);
        hinweis.setzen(TEXT[stoerung.wert], stoerung.wert === 'keine' ? '' : 'warnung');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, stoerung.el), hoehe.el, fahrt.el, h('div', { class: 'breit' }, steig.el)), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Nach dem Pilot’s Handbook of Aeronautical Knowledge der FAA (Kapitel 8). Vereinfacht: Fahrtmesser ohne Kompressibilität, Ersatz-Druckquelle mit 1,5 hPa weniger Druck als draußen.'));
    },
  },

  vergaser: {
    titel: 'Droht Vergaservereisung?',
    kurz: 'Stelle Temperatur und Taupunkt ein – wie im METAR – und sieh, wie groß die Gefahr ist.',
    symbol: 'warnung',
    scheine: ['ppl', 'ul'],
    anleitung: 'Stelle Temperatur und Taupunkt ein, wie du sie aus dem METAR kennst. Die App rechnet daraus die relative Feuchte und zeigt den Punkt im Diagramm: rot hohe Gefahr, orange möglich. Die Bereiche sind vereinfacht nach dem Pilot’s Handbook of Aeronautical Knowledge der FAA (Abb. 7-12).',
    legende: [['fehler', 'hohe Gefahr: unter etwa 21 °C, über 80 % Feuchte'], ['orange', 'möglich: bis 38 °C, ab 50 % Feuchte'], ['primaer', 'deine Werte']],
    probier: ['Ein typischer Herbstmorgen: 12 °C, Taupunkt 10 °C. Wie groß ist die Gefahr?', 'Ein Sommertag: 30 °C, Taupunkt 18 °C. Ist Vereisung möglich?', 'Wie klein muss der Spread etwa sein, damit die Feuchte über 80 % liegt?'],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const t = regler({ name: 'Temperatur', min: -10, max: 40, schritt: 1, wert: 12, format: (w) => `${w} °C`, beiAenderung: zeichnen });
      const td = regler({ name: 'Taupunkt', min: -20, max: 30, schritt: 1, wert: 9, format: (w) => `${w} °C`, beiAenderung: zeichnen });
      function zeichnen() {
        const tauptunkt = Math.min(td.wert, t.wert);
        const rf = relativeFeuchte(t.wert, tauptunkt);
        const gefahr = vergaserGefahr(t.wert, rf);
        bild.zeichnen(vergaserBild(t.wert, tauptunkt));
        werte.setzen([
          { titel: 'Spread', wert: `${t.wert - tauptunkt} °C` },
          { titel: 'Relative Feuchte', wert: `${Math.round(rf)} %` },
          { titel: 'Gefahr', wert: { hoch: 'hoch', moeglich: 'möglich', gering: 'gering' }[gefahr], art: gefahr === 'hoch' ? 'schlecht' : gefahr === 'gering' ? 'gut' : '' },
        ]);
        hinweis.setzen(gefahr === 'hoch' ? 'Hohe Gefahr: Achte auf Drehzahlabfall und nutze die Vergaservorwärmung nach Flughandbuch – besonders im Sinkflug mit wenig Leistung.' : gefahr === 'moeglich' ? 'Vergaservereisung ist möglich. Prüfe die Vergaservorwärmung beim Abbremsen und beobachte die Drehzahl.' : 'Geringe Gefahr – ausgeschlossen ist Vergaservereisung aber auch hier nicht.', gefahr === 'hoch' ? 'fehler' : gefahr === 'moeglich' ? 'warnung' : '');
        if (td.wert > t.wert) hinweis.setzen('Der Taupunkt kann nicht über der Temperatur liegen – gerechnet wird mit Taupunkt = Temperatur (100 % Feuchte).', 'warnung');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(t.el, td.el), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Die relative Feuchte rechnet die App mit der Magnus-Formel aus Temperatur und Taupunkt. Vergaservereisung ist auch außerhalb der markierten Bereiche möglich.'));
    },
  },
};
