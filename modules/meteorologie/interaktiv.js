// Interaktive Darstellungen für „Meteorologie“.
import { h } from '../../js/ui.js';
import { regler, wertanzeige, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { svg, text, linie, pfeil, wolke, aufKreis, stufenMaximum, flugzeug } from '../../js/grafik.js';

const r1 = (n) => n.toFixed(1);
const komma = (n, s = 0) => Number(n.toFixed(s)).toLocaleString('de-DE', { useGrouping: false });
const plus = (n) => (n > 0 ? `+${komma(n)}` : komma(n).replace('-', '−'));

// ---------- Wolkenbasis ----------

/** Höhe der Kondensation (m über Grund): Spread ÷ 0,8 °C je 100 m. */
export function kondensationsHoehe(t, td) {
  return ((t - td) / 0.8) * 100;
}

// Höhenachse in Stufen: Sie wächst erst, wenn die Wolkenbasis nicht mehr hineinpasst
const BASIS_ACHSE = [2000, 4000, 6000]; // m

function wolkenbasisBild(t, td) {
  const l = 46, r = 390, o = 14, u = 262;
  const tMin = -35, tMax = 40;
  const basis = kondensationsHoehe(t, td);
  const hMax = stufenMaximum(basis + 700, BASIS_ACHSE);
  const px = (grad) => l + ((grad - tMin) / (tMax - tMin)) * (r - l);
  const py = (m) => u - (m / hMax) * (u - o);
  const tBasis = t - basis / 100;
  const tOben = tBasis - ((hMax - basis) / 100) * 0.6;
  let raster = '';
  for (let m = 0; m <= hMax; m += 1000) raster += linie(l, r1(py(m)), r, r1(py(m)), 'g-s-rand', 0.8) + text(l - 5, r1(py(m)), `${m / 1000} km`, { groesse: 10, anker: 'end', klasse: 'g-f-leise' });
  for (let g = -30; g <= 40; g += 10) raster += linie(r1(px(g)), o, r1(px(g)), u, 'g-s-rand', 0.8) + text(r1(px(g)), u + 13, `${g}°`, { groesse: 10, klasse: 'g-f-leise', anker: g === 40 ? 'end' : 'middle' });
  return svg(400, 290, `
    <rect x="${l}" y="${o}" width="${r - l}" height="${u - o}" class="g-f-himmel"/>
    ${raster}
    <rect x="${l}" y="${r1(py(Math.min(hMax, basis + 600)))}" width="${r - l}" height="${r1(py(basis) - py(Math.min(hMax, basis + 600)) + 3)}" class="g-f-wolke" opacity=".7"/>
    ${wolke(r1((px(tBasis) + r) / 2 + 30), r1(py(basis) - 16), 80)}
    <path d="M${r1(px(t))} ${u}L${r1(px(tBasis))} ${r1(py(basis))}" class="g-s-orange" stroke-width="2.3"/>
    <path d="M${r1(px(tBasis))} ${r1(py(basis))}L${r1(px(tOben))} ${r1(py(hMax))}" class="g-s-orange" stroke-width="2.3" stroke-dasharray="7 5"/>
    <path d="M${r1(px(td))} ${u}L${r1(px(tBasis))} ${r1(py(basis))}" class="g-s-primaer" stroke-width="2.3"/>
    <circle cx="${r1(px(tBasis))}" cy="${r1(py(basis))}" r="6" class="g-f-text"/>
    ${text(r1(Math.min(px(t) + 4, r - 64)), u - 12, 'Temperatur', { groesse: 11, gewicht: 700, klasse: 'g-f-orange g-halo', anker: 'start' })}
    ${text(r1(Math.max(px(td) - 4, l + 52)), u - 12, 'Taupunkt', { groesse: 11, gewicht: 700, klasse: 'g-f-primaer g-halo', anker: 'end' })}
    ${py(basis) > u - 40
    ? text(r1(Math.min(Math.max(px(tBasis), l + 40), r - 40)), r1(py(basis) - 32), 'Wolkenbasis', { groesse: 11, gewicht: 800, klasse: 'g-f-text g-halo' })
    : text(r1(px(tBasis) - 10), r1(py(basis) + 14), 'Wolkenbasis', { groesse: 11, gewicht: 800, anker: 'end', klasse: 'g-f-text g-halo' })}
    ${text(200, 286, 'Temperatur →', { groesse: 10, klasse: 'g-f-leise' })}
  `, 'Aufsteigende Luft kühlt um 1 Grad je 100 Meter ab, der Taupunkt um 0,2 Grad; wo sich die Linien treffen, liegt die Wolkenbasis');
}

// ---------- Höhenmesser ----------

const HOEHENMESSER_ACHSE = 7000; // ft – wahre Höhe bis 5000 ft plus Fehler bis 1800 ft

function hoehenmesserBild(anzeige, eingestellt, wahr) {
  const c = 150, cy = 150, r = 120;
  let ziffern = '';
  for (let i = 0; i < 10; i++) {
    const [x, y] = aufKreis(c, cy, r - 24, i * 36);
    ziffern += text(r1(x), r1(y), String(i), { groesse: 20, gewicht: 800, klasse: '', extra: 'fill="#f2f5f9"' });
    for (let k = 0; k < 5; k++) {
      const g = i * 36 + k * 7.2;
      const [x1, y1] = aufKreis(c, cy, r - (k ? 6 : 12), g);
      const [x2, y2] = aufKreis(c, cy, r - 1, g);
      ziffern += `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="#f2f5f9" stroke-width="${k ? 1.5 : 3}"/>`;
    }
  }
  const wert = Math.max(0, anzeige);
  const zeiger = (winkel, laenge, breite, farbe) => {
    const [x, y] = aufKreis(c, cy, laenge, winkel);
    return `<line x1="${c}" y1="${cy}" x2="${r1(x)}" y2="${r1(y)}" stroke="${farbe}" stroke-width="${breite}" stroke-linecap="round"/>`;
  };
  // Seitenansicht rechts, maßstäblich: wo du wirklich bist und was der Höhenmesser behauptet
  const o = 24, u = 270, sx = 352;
  const py = (ft) => u - (Math.max(0, Math.min(ft, HOEHENMESSER_ACHSE)) / HOEHENMESSER_ACHSE) * (u - o);
  let seite = `<rect x="292" y="${o - 10}" width="128" height="${u - o + 10}" class="g-f-himmel"/><rect x="292" y="${u}" width="128" height="16" class="g-f-boden"/>`;
  for (let ft = 0; ft <= HOEHENMESSER_ACHSE; ft += 1000) seite += linie(292, r1(py(ft)), 420, r1(py(ft)), 'g-s-rand', 0.6) + (ft % 2000 === 0 ? text(296, r1(py(ft) - 3), `${ft}`, { groesse: 9, klasse: 'g-f-leise', anker: 'start' }) : '');
  const fehler = anzeige - wahr;
  // Beschriftungen auf die jeweils äußere Seite, damit sie sich nicht überdecken
  const anzeigeOben = anzeige >= wahr;
  seite += linie(sx - 18, r1(py(anzeige)), sx + 46, r1(py(anzeige)), 'g-s-text', 1.6, 'stroke-dasharray="5 4"')
    + text(sx + 46, r1(py(anzeige) + (anzeigeOben ? -5 : 13)), 'Anzeige', { groesse: 10, gewicht: 800, klasse: 'g-f-text g-halo', anker: 'end' });
  if (Math.abs(fehler) >= 30) seite += pfeil(sx + 30, py(anzeige), sx + 30, py(wahr), { farbe: fehler > 0 ? 'fehler' : 'orange', breite: 2, spitze: 7 });
  seite += flugzeug(sx, r1(py(wahr)), 90, 26) + text(sx + 46, r1(py(wahr) + (anzeigeOben ? 18 : -10)), 'wahre Höhe', { groesse: 10, gewicht: 800, klasse: 'g-f-primaer g-halo', anker: 'end' });
  return svg(420, 300, `
    ${seite}
    <circle cx="${c}" cy="${cy}" r="${r + 12}" fill="#2b3442"/>
    <circle cx="${c}" cy="${cy}" r="${r}" fill="#10161f"/>
    ${ziffern}
    <rect x="${c + 30}" y="${cy - 14}" width="62" height="28" rx="4" fill="#000" stroke="#56647a"/>
    <text x="${c + 61}" y="${cy + 1}" font-size="15" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, Menlo, monospace">${eingestellt}</text>
    <text x="${c}" y="${cy + 42}" font-size="11" fill="#9fb0c8" text-anchor="middle" dominant-baseline="middle">FEET</text>
    ${zeiger(((wert % 10000) / 10000) * 360, r - 62, 8, '#f2f5f9')}
    ${zeiger(((wert % 1000) / 1000) * 360, r - 14, 4, '#f2f5f9')}
    <circle cx="${c}" cy="${cy}" r="7" fill="#56647a"/>
  `, `Höhenmesser zeigt ${Math.round(anzeige)} Fuß, eingestellt ${eingestellt} Hektopascal`);
}

// ---------- Standardatmosphäre ----------

export function isa(hoeheFt) {
  const m = hoeheFt * 0.3048;
  const tropo = 11000;
  const t = m <= tropo ? 15 - 0.0065 * m : -56.5;
  const p = m <= tropo
    ? 1013.25 * (1 - 0.0065 * m / 288.15) ** 5.2559
    : 226.32 * Math.exp(-(m - tropo) / 6341.6);
  const dichte = (p / 1013.25) / ((t + 273.15) / 288.15);
  return { t, p, dichte };
}

const ISA_MAX = 45000; // ft – Reglerbereich

/** Temperatur und Luftdruck der Standardatmosphäre über der Höhe, mit Marke bei der gewählten Höhe. */
function isaBild(hoeheFt) {
  const o = 16, u = 262;
  const py = (ft) => u - (ft / ISA_MAX) * (u - o);
  const tafeln = [
    { l: 58, r: 214, min: -60, max: 20, titel: 'Temperatur (°C)', wert: (ft) => isa(ft).t, teilung: [-60, -40, -20, 0, 20], klasse: 'orange' },
    { l: 238, r: 392, min: 0, max: 1050, titel: 'Luftdruck (hPa)', wert: (ft) => isa(ft).p, teilung: [0, 250, 500, 750, 1000], klasse: 'primaer' },
  ];
  let inhalt = '';
  for (let ft = 0; ft <= ISA_MAX; ft += 10000) {
    inhalt += linie(58, r1(py(ft)), 392, r1(py(ft)), 'g-s-rand', 0.6) + text(52, r1(py(ft) + 4), ft === 0 ? '0' : `${ft / 1000} 000`, { groesse: 10, klasse: 'g-f-leise', anker: 'end' });
  }
  const tropo = 36089;
  inhalt += linie(58, r1(py(tropo)), 392, r1(py(tropo)), 'g-s-leise', 1, 'stroke-dasharray="5 4"') + text(390, r1(py(tropo) - 5), 'Tropopause', { groesse: 10, klasse: 'g-f-leise', anker: 'end' });
  for (const t of tafeln) {
    const px = (w) => t.l + ((w - t.min) / (t.max - t.min)) * (t.r - t.l);
    let pfad = '';
    for (let ft = 0; ft <= ISA_MAX; ft += 500) pfad += `${ft ? 'L' : 'M'}${r1(px(t.wert(ft)))} ${r1(py(ft))}`;
    inhalt += `<rect x="${t.l}" y="${o}" width="${t.r - t.l}" height="${u - o}" class="g-s-rand" fill="none" stroke-width="1"/>`;
    inhalt += t.teilung.map((w) => linie(r1(px(w)), u, r1(px(w)), u + 4, 'g-s-leise', 1) + text(r1(px(w)), u + 15, `${w}`.replace('-', '−'), { groesse: 10, klasse: 'g-f-leise' })).join('');
    inhalt += text((t.l + t.r) / 2, u + 30, t.titel, { groesse: 10, gewicht: 700, klasse: `g-f-${t.klasse}` });
    inhalt += `<path d="${pfad}" class="g-s-${t.klasse}" stroke-width="2.2" fill="none"/>`;
    const w = t.wert(hoeheFt);
    const x = px(w);
    const beschriftung = t.klasse === 'orange' ? `${komma(w, 1).replace('-', '−')} °C` : `${komma(Math.round(w))} hPa`;
    const rechts = x < (t.l + t.r) / 2;
    inhalt += `<circle cx="${r1(x)}" cy="${r1(py(hoeheFt))}" r="5" class="g-f-${t.klasse}"/>`
      + text(r1(x + (rechts ? 8 : -8)), r1(py(hoeheFt) - 7), beschriftung, { groesse: 11, gewicht: 800, klasse: `g-f-${t.klasse} g-halo`, anker: rechts ? 'start' : 'end' });
  }
  inhalt += linie(58, r1(py(hoeheFt)), 392, r1(py(hoeheFt)), 'g-s-text', 1.2, 'stroke-dasharray="2 3"');
  return svg(400, 300, `<rect x="58" y="${o}" width="334" height="${u - o}" class="g-f-himmel"/>${inhalt}${text(8, 10, 'Höhe (ft)', { groesse: 10, klasse: 'g-f-leise', anker: 'start' })}`,
    `Standardatmosphäre: in ${hoeheFt} Fuß ${komma(isa(hoeheFt).t, 1)} Grad und ${Math.round(isa(hoeheFt).p)} Hektopascal`);
}

export const interaktiv = {
  wolkenbasis: {
    titel: 'Wo liegt die Wolkenbasis?',
    kurz: 'Stelle Temperatur und Taupunkt am Boden ein und sieh, in welcher Höhe aufsteigende Luft kondensiert.',
    symbol: 'thermik',
    anleitung: "Stelle Temperatur und Taupunkt am Boden ein. Die orange Linie zeigt, wie aufsteigende Luft abkühlt (1 °C je 100 m), die blaue, wie ihr Taupunkt sinkt (nur 0,2 °C je 100 m). Wo sich beide treffen, ist die Luft gesättigt – dort entsteht die Wolke. Die Höhenachse ist maßstäblich und wächst in Stufen mit (2, 4 oder 6 km).",
    legende: [["orange", "Temperatur der aufsteigenden Luft"], ["primaer", "Taupunkt der aufsteigenden Luft"]],
    probier: ["Verkleinere den Spread auf 2 °C – wie tief liegt jetzt die Wolkenbasis?", "Stell einen Spread von 10 °C ein und vergleiche mit der Faustformel (Spread × 400 ft)."],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const temperatur = regler({ name: 'Temperatur am Boden', min: -5, max: 35, wert: 22, format: (w) => `${plus(w)} °C`, beiAenderung: zeichnen });
      const taupunkt = regler({ name: 'Taupunkt am Boden', min: -10, max: 30, wert: 12, format: (w) => `${plus(w)} °C`, beiAenderung: zeichnen });
      function zeichnen() {
        if (taupunkt.wert > temperatur.wert) taupunkt.setzen(temperatur.wert);
        const t = temperatur.wert, td = taupunkt.wert;
        const meter = kondensationsHoehe(t, td);
        bild.zeichnen(wolkenbasisBild(t, td));
        werte.setzen([
          { titel: 'Spread', wert: `${t - td} °C`, art: t - td <= 2 ? 'warnung' : '' },
          { titel: 'Wolkenbasis über Grund', wert: komma(Math.round(meter / 10) * 10), einheit: 'm', art: 'gut' },
          { titel: 'in Fuß', wert: komma(Math.round(meter / 0.3048 / 50) * 50), einheit: 'ft', hinweis: `Faustformel: ${t - td} × 400 = ${(t - td) * 400} ft` },
        ]);
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(temperatur.el, taupunkt.el), werte.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Oberhalb der Basis (gestrichelt) kühlt die nun feuchte Luft nur noch um etwa 0,6 °C je 100 m ab, weil bei der Kondensation Wärme frei wird. Faustformel: Spread × 125 m bzw. × 400 ft.'));
    },
  },

  hoehenmesser: {
    titel: 'Höhenmesser und QNH',
    kurz: 'Was zeigt der Höhenmesser, wenn das falsche QNH eingestellt ist?',
    symbol: 'warnung',
    anleitung: "Stelle deine wahre Höhe, das tatsächliche QNH und den Wert ein, den du am Höhenmesser eingestellt hast. Das Instrument zeigt, was du im Cockpit sehen würdest: Der lange Zeiger zählt die Hunderter (eine Umdrehung = 1000 ft), der kurze die Tausender. Im kleinen Fenster steht der eingestellte Luftdruck. Rechts daneben siehst du maßstäblich, wo du wirklich fliegst und was der Höhenmesser anzeigt – der Pfeil ist der Fehler.",
    probier: ["Stelle beide QNH-Werte gleich ein – was zeigt der Höhenmesser?", "Du fliegst vom Hoch (1025 hPa eingestellt) ins Tief (1005 hPa tatsächlich): Bist du höher oder tiefer, als angezeigt?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const hoehe = regler({ name: 'Wahre Höhe über MSL', min: 0, max: 5000, schritt: 50, wert: 2500, format: (w) => `${w} ft`, beiAenderung: zeichnen });
      const qnh = regler({ name: 'Tatsächliches QNH', min: 980, max: 1040, wert: 1005, format: (w) => `${w} hPa`, beiAenderung: zeichnen });
      const eingestellt = regler({ name: 'Am Höhenmesser eingestellt', min: 980, max: 1040, wert: 1020, format: (w) => `${w} hPa`, beiAenderung: zeichnen });
      function zeichnen() {
        const fehler = (eingestellt.wert - qnh.wert) * 30;
        const anzeige = hoehe.wert + fehler;
        bild.zeichnen(hoehenmesserBild(anzeige, eingestellt.wert, hoehe.wert));
        werte.setzen([
          { titel: 'Anzeige', wert: komma(Math.round(anzeige)), einheit: 'ft' },
          { titel: 'Wahre Höhe', wert: komma(hoehe.wert), einheit: 'ft' },
          { titel: 'Fehler', wert: plus(fehler), einheit: 'ft', art: Math.abs(fehler) < 1 ? 'gut' : fehler > 0 ? 'schlecht' : 'warnung' },
        ]);
        if (Math.abs(fehler) < 1) hinweis.setzen('Richtig eingestellt: Der Höhenmesser zeigt die wahre Höhe über MSL.', 'ok');
        else if (fehler > 0) hinweis.setzen(`Gefährlich: Du bist ${komma(fehler)} ft tiefer, als der Höhenmesser anzeigt. „Vom Hoch ins Tief – geht's schief.“`, 'fehler');
        else hinweis.setzen(`Du bist ${komma(-fehler)} ft höher, als der Höhenmesser anzeigt.`, 'warnung');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, hoehe.el), qnh.el, eingestellt.el), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Gerechnet mit 1 hPa ≈ 30 ft.'));
    },
  },

  standardatmosphaere: {
    titel: 'Standardatmosphäre in jeder Höhe',
    kurz: 'Temperatur, Luftdruck und Luftdichte der ICAO-Standardatmosphäre.',
    symbol: 'stufen',
    anleitung: "Schiebe den Regler auf eine Höhe. Die Grafik zeigt, wie Temperatur und Luftdruck der ICAO-Standardatmosphäre mit der Höhe abnehmen; die Punkte markieren die Werte in der gewählten Höhe. Darunter stehen die Zahlen und die Luftdichte.",
    legende: [["orange", "Temperatur"], ["primaer", "Luftdruck"]],
    probier: ["Wie kalt ist es nach Standardatmosphäre in 10 000 ft?", "Um wie viel Prozent ist die Luftdichte in 8000 ft geringer als am Boden – und was bedeutet das für Startstrecke und Steigleistung?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hoehe = regler({ name: 'Höhe', min: 0, max: ISA_MAX, schritt: 500, wert: 5000, format: (w) => `${komma(w)} ft`, beiAenderung: zeichnen });
      const balken = h('div', { class: 'isa-balken' });
      function zeichnen() {
        const { t, p, dichte } = isa(hoehe.wert);
        bild.zeichnen(isaBild(hoehe.wert));
        balken.style.setProperty('--dichte', `${Math.round(dichte * 100)}%`);
        balken.textContent = `Luftdichte ${Math.round(dichte * 100)} % von Meereshöhe`;
        werte.setzen([
          { titel: 'Temperatur', wert: komma(t, 1).replace('-', '−'), einheit: '°C' },
          { titel: 'Luftdruck', wert: komma(Math.round(p)), einheit: 'hPa' },
          { titel: 'Druckabnahme bisher', wert: `${Math.round((1 - p / 1013.25) * 100)} %` },
          { titel: 'Schicht', wert: hoehe.wert * 0.3048 > 11000 ? 'Stratosphäre' : 'Troposphäre' },
        ]);
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, hoehe.el)), werte.el, balken,
        h('p', { class: 'interaktiv-erklaerung' }, 'Bis etwa 36 000 ft (11 km) nimmt die Temperatur um rund 2 °C je 1000 ft ab, darüber bleibt sie bei −56,5 °C. In etwa 18 000 ft ist der Luftdruck halbiert.'));
    },
  },
};
