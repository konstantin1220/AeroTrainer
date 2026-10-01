// Interaktive Darstellungen für „Luftraum & Regeln“ (Grundlage: SERA).
import { h } from '../../js/ui.js';
import { regler, umschalter, wertanzeige, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { svg, text, linie, pfeil, flugzeug, wolke, aufKreis } from '../../js/grafik.js';

const RAD = Math.PI / 180;
const r1 = (n) => n.toFixed(1);
const grad3 = (g) => String(Math.round(((g % 360) + 360) % 360) || 360).padStart(3, '0');

// ---------- Sichtflugbedingungen ----------

export function vmcMinima(klasse, gelaende, hoehe) {
  const grenze = Math.max(3000, gelaende + 1000);
  if (hoehe >= 10000) return { band: 'ab FL 100', sicht: '8 km', abstand: '1500 m waagerecht, 1000 ft senkrecht', frei: false, grenze };
  if (hoehe > grenze) return { band: `oberhalb ${grenze} ft MSL`, sicht: '5 km', abstand: '1500 m waagerecht, 1000 ft senkrecht', frei: false, grenze };
  if (klasse === 'G') return { band: `bis ${grenze} ft MSL`, sicht: '1,5 km', abstand: 'frei von Wolken, mit Erdsicht', frei: true, grenze };
  return { band: `bis ${grenze} ft MSL`, sicht: '5 km', abstand: '1500 m waagerecht, 1000 ft senkrecht', frei: false, grenze };
}

function vmcBild(klasse, gelaende, hoehe, m) {
  // Höhenbereich passend zur Lage wählen, damit tiefe Flüge nicht gequetscht werden
  const oben = hoehe >= 8000 ? 12000 : Math.ceil(Math.max(6000, hoehe + 2000, m.grenze + 1500) / 1000) * 1000;
  const py = (ft) => 270 - (Math.min(ft, oben) / oben) * 250;
  const yFlug = py(hoehe);
  const xFlug = 150;
  const wolkeX = m.frei ? 228 : 300;
  return svg(400, 290, `
    <rect width="400" height="290" class="g-f-himmel"/>
    ${oben > 10000 ? `<rect x="0" y="${r1(py(oben))}" width="400" height="${r1(py(10000) - py(oben))}" class="g-f-mf-hell"/>
    ${linie(0, r1(py(10000)), 400, r1(py(10000)), 'g-s-leise', 1, 'stroke-dasharray="6 5"')}
    ${text(394, r1(py(10000) - 9), 'FL 100', { groesse: 11, anker: 'end', klasse: 'g-f-leise', gewicht: 700 })}` : ''}
    ${linie(0, r1(py(m.grenze)), 400, r1(py(m.grenze)), 'g-s-mf', 1.4, 'stroke-dasharray="8 6"')}
    ${text(394, r1(py(m.grenze) - 9), m.grenze > 3000 ? `1000 ft GND = ${m.grenze} ft MSL` : '3000 ft MSL', { groesse: 11, anker: 'end', gewicht: 700, klasse: 'g-f-mf' })}
    <rect x="0" y="${r1(py(gelaende))}" width="400" height="${r1(290 - py(gelaende))}" class="g-f-boden"/>
    ${linie(0, r1(py(gelaende)), 400, r1(py(gelaende)), 'g-s-leise', 1)}
    ${text(8, r1(Math.min(282, py(gelaende) + 14)), `Gelände ${gelaende} ft`, { groesse: 11, anker: 'start', gewicht: 600 })}
    ${text(8, 16, `Luftraum ${klasse}`, { groesse: 13, anker: 'start', gewicht: 800 })}
    ${flugzeug(xFlug, r1(yFlug), 90, 34)}
    ${text(xFlug - 26, r1(yFlug), `${hoehe} ft`, { groesse: 12, gewicht: 700, klasse: 'g-f-primaer', anker: 'end' })}
    ${wolke(wolkeX, r1(yFlug - (m.frei ? 4 : 0)), 70)}
    ${m.frei
      ? `${text(wolkeX, r1(yFlug - 30), 'frei von Wolken', { groesse: 12, gewicht: 700, klasse: 'g-f-ok' })}${pfeil(xFlug, yFlug + 34, xFlug, Math.min(278, py(gelaende) - 2), { farbe: 'ok', breite: 1.4, gestrichelt: true })}${text(xFlug + 8, r1((yFlug + py(gelaende)) / 2 + 12), 'Erdsicht', { groesse: 11, gewicht: 700, klasse: 'g-f-ok', anker: 'start' })}`
      : `${pfeil(xFlug + 22, yFlug, wolkeX - 36, yFlug, { farbe: 'orange', breite: 1.5 })}${text(r1((xFlug + wolkeX) / 2), r1(yFlug - 12), '1500 m', { groesse: 12, gewicht: 700, klasse: 'g-f-orange' })}${linie(wolkeX, r1(yFlug + 20), wolkeX, r1(Math.min(yFlug + 60, 282)), 'g-s-orange', 1.8, 'stroke-dasharray="4 4"')}${text(wolkeX + 8, r1(Math.min(yFlug + 44, 278)), '1000 ft', { groesse: 12, gewicht: 700, klasse: 'g-f-orange', anker: 'start' })}`}
  `, 'Seitenansicht mit Gelände, Grenze 3000 Fuß MSL bzw. 1000 Fuß über Grund, FL 100, Flugzeug und Wolke');
}

// ---------- Kontrollzone: VFR oder Sonder-VFR ----------

export function ctrErgebnis(sicht, decke) {
  if (sicht >= 5000 && decke >= 1500) return 'vfr';
  if (sicht >= 1500 && decke >= 600) return 'sonder';
  return 'nein';
}

function ctrBild(sicht, decke) {
  const l = 56, r = 384, o = 16, u = 236;
  const px = (m) => l + (Math.min(m, 10000) / 10000) * (r - l);
  const py = (ft) => u - (Math.min(ft, 3000) / 3000) * (u - o);
  return svg(400, 280, `
    <path d="M${l} ${o}H${r1(px(1500))}V${r1(py(600))}H${r}V${u}H${l}z" class="g-f-fehler" opacity=".16"/>
    <path d="M${r1(px(1500))} ${o}H${r1(px(5000))}V${r1(py(1500))}H${r}V${r1(py(600))}H${r1(px(1500))}z" class="g-f-orange" opacity=".25"/>
    <path d="M${r1(px(5000))} ${o}H${r}V${r1(py(1500))}H${r1(px(5000))}z" class="g-f-ok" opacity=".25"/>
    ${linie(l, u, r, u, 'g-s-text', 1.4)}${linie(l, u, l, o, 'g-s-text', 1.4)}
    ${[0, 1500, 5000, 10000].map((m) => text(r1(px(m)), u + 14, m >= 10000 ? '10 km' : m >= 5000 ? `${m / 1000} km` : `${m} m`, { groesse: 11, klasse: 'g-f-leise' })).join('')}
    ${[0, 600, 1500, 3000].map((f) => text(l - 6, r1(py(f)), `${f}`, { groesse: 11, klasse: 'g-f-leise', anker: 'end' })).join('')}
    ${text((l + r) / 2, 270, 'Bodensicht →', { groesse: 11, klasse: 'g-f-leise' })}
    ${text(14, (o + u) / 2, 'Wolkenuntergrenze (ft) →', { groesse: 11, klasse: 'g-f-leise', extra: `transform="rotate(-90 14 ${(o + u) / 2})"` })}
    ${text(r - 10, o + 18, 'VFR', { groesse: 16, gewicht: 800, klasse: 'g-f-ok', anker: 'end' })}
    ${text(r1(px(1500) + 8), o + 16, 'Sonder-VFR', { groesse: 13, gewicht: 800, klasse: 'g-f-orange', anker: 'start' })}
    ${text(l + 8, u - 14, 'weder noch', { groesse: 13, gewicht: 800, klasse: 'g-f-fehler', anker: 'start' })}
    <circle cx="${r1(px(sicht))}" cy="${r1(py(decke))}" r="9" class="g-f-primaer"/>
    <circle cx="${r1(px(sicht))}" cy="${r1(py(decke))}" r="9" class="g-s-flaeche" stroke-width="2"/>
  `, 'Diagramm: Bodensicht und Wolkenuntergrenze mit den Bereichen VFR, Sonder-VFR und nicht möglich');
}

// ---------- Ausweichregeln ----------

const ARTEN = {
  motor: { text: 'Motorflugzeug', artikel: 'Das', klasse: 'motor' },
  segel: { text: 'Segelflugzeug', artikel: 'Das', klasse: 'segel' },
  ballon: { text: 'Ballon', artikel: 'Der', klasse: 'ballon' },
  schlepp: { text: 'Schleppzug', artikel: 'Der', klasse: 'schlepp' },
};

/** Wer weicht aus? Ergebnis: { du: 'ausweichen'|'vorflug'|'beide'|'unklar', text } */
export function vorflug(eigen, anderer, lage) {
  if (lage === 'gegen') return { du: 'beide', text: 'Gegenflug: Beide weichen nach rechts aus.' };
  if (lage === 'ueberholen') return { du: 'ausweichen', text: eigen === 'segel' && anderer === 'segel' ? 'Du überholst: Du weichst aus – als Segelflugzeug darfst du rechts oder links vorbei.' : 'Du überholst: Du weichst nach rechts aus. Der Überholte hat Vorflug.' };
  const gleich = eigen === anderer || (eigen === 'motor' && anderer === 'motor');
  if (gleich) {
    return lage === 'rechts'
      ? { du: 'ausweichen', text: 'Gleiche Art, der andere kommt von rechts: Du weichst aus (rechts vor links).' }
      : { du: 'vorflug', text: 'Gleiche Art, der andere kommt von links: Du hast Vorflug – Kurs und Geschwindigkeit beibehalten.' };
  }
  const paar = [eigen, anderer].sort().join('+');
  if (paar === 'schlepp+segel') return { du: 'unklar', text: 'Nach dem Wortlaut von SERA.3210 weichen motorgetriebene Luftfahrzeuge Segelflugzeugen aus – ein Schleppzug ist aber erkennbar in seiner Beweglichkeit eingeschränkt (SERA.3210 b). Frühzeitig und deutlich ausweichen – im Zweifel weicht der Wendigere aus.' };
  const rang = { motor: 0, schlepp: 1, segel: 2, ballon: 3 };
  if (eigen === 'motor' && anderer === 'schlepp') return { du: 'ausweichen', text: 'Motorgetriebene Luftfahrzeuge weichen Luftfahrzeugen aus, die etwas schleppen.' };
  if (eigen === 'schlepp' && anderer === 'motor') return { du: 'vorflug', text: 'Wer schleppt, ist eingeschränkt beweglich – das Motorflugzeug weicht dir aus.' };
  if (eigen === 'schlepp' && anderer === 'ballon') return { du: 'ausweichen', text: 'Auch ein Schleppzug ist motorgetrieben – und motorgetriebene Luftfahrzeuge weichen Ballonen immer aus.' };
  if (eigen === 'ballon' && anderer === 'schlepp') return { du: 'vorflug', text: 'Der Schleppzug muss dir ausweichen – motorgetriebene Luftfahrzeuge weichen Ballonen immer aus.' };
  return rang[eigen] < rang[anderer]
    ? { du: 'ausweichen', text: `Als ${ARTEN[eigen].text} weichst du einem ${ARTEN[anderer].text} aus – es ist weniger beweglich.` }
    : { du: 'vorflug', text: `${ARTEN[anderer].artikel} ${ARTEN[anderer].text} muss dir ausweichen – du bist weniger beweglich. Trotzdem aufmerksam bleiben!` };
}

function ausweichBild(lage, ergebnis, eigen, anderer) {
  const pos = {
    rechts: { du: [150, 196, 0], er: [290, 96, 270] },
    links: { du: [250, 196, 0], er: [110, 96, 90] },
    gegen: { du: [80, 130, 90], er: [320, 130, 270] },
    ueberholen: { du: [200, 196, 0], er: [200, 76, 0] },
  }[lage];
  const farbeDu = ergebnis.du === 'ausweichen' || ergebnis.du === 'beide' ? 'g-f-orange' : ergebnis.du === 'unklar' ? 'g-f-leise' : 'g-f-primaer';
  const farbeEr = ergebnis.du === 'vorflug' || ergebnis.du === 'beide' ? 'g-f-orange' : ergebnis.du === 'unklar' ? 'g-f-leise' : 'g-f-primaer';
  const ausweich = ([x, y, kurs]) => {
    const vorne = [x + Math.sin(kurs * RAD) * 26, y - Math.cos(kurs * RAD) * 26];
    const ziel = [vorne[0] + Math.sin((kurs + 50) * RAD) * 44, vorne[1] - Math.cos((kurs + 50) * RAD) * 44];
    return pfeil(vorne[0], vorne[1], ziel[0], ziel[1], { farbe: 'orange', breite: 1.8 });
  };
  const beschriftung = ([x, y], titel, wer) => `${text(x, y + 34, titel, { groesse: 12, gewicht: 800 })}${text(x, y + 50, wer, { groesse: 11, klasse: 'g-f-leise' })}`;
  return svg(400, 260, `
    <rect width="400" height="260" class="g-f-himmel"/>
    ${flugzeug(pos.du[0], pos.du[1], pos.du[2], 46, farbeDu)}
    ${flugzeug(pos.er[0], pos.er[1], pos.er[2], 46, farbeEr)}
    ${ergebnis.du === 'ausweichen' || ergebnis.du === 'beide' ? ausweich(pos.du) : ''}
    ${ergebnis.du === 'vorflug' || ergebnis.du === 'beide' ? ausweich(pos.er) : ''}
    ${beschriftung(pos.du, 'Du', ARTEN[eigen].text)}
    ${beschriftung(pos.er, 'Anderer', ARTEN[anderer].text)}
  `, 'Zwei Luftfahrzeuge mit Ausweichrichtung');
}

// ---------- Halbkreisflugregel ----------

function halbkreisBild(kurs) {
  const c = 200, cy = 175, r = 140;
  const ost = kurs < 180;
  const [kx, ky] = aufKreis(c, cy, r - 6, kurs);
  return svg(400, 340, `
    <path d="M${c} ${cy - r}a${r} ${r} 0 0 1 0 ${2 * r}z" class="${ost ? 'g-f-mf-hell' : 'g-f-flaeche'}"/>
    <path d="M${c} ${cy - r}a${r} ${r} 0 0 0 0 ${2 * r}z" class="${ost ? 'g-f-flaeche' : 'g-f-mf-hell'}"/>
    <circle cx="${c}" cy="${cy}" r="${r}" class="g-s-text" stroke-width="1.3"/>
    ${linie(c, cy - r - 6, c, cy + r + 6, 'g-s-leise', 1)}
    ${text(c, cy - r - 16, 'N', { groesse: 14, gewicht: 800 })}${text(c, cy + r + 18, 'S', { groesse: 14, gewicht: 800 })}
    ${text(c + r + 10, cy, 'O', { groesse: 14, gewicht: 800, anker: 'start' })}${text(c - r - 10, cy, 'W', { groesse: 14, gewicht: 800, anker: 'end' })}
    ${text(c + 70, cy - 60, 'ungerade', { groesse: 13, gewicht: ost ? 800 : 400 })}${text(c + 70, cy - 42, '+ 500 ft', { groesse: 13, gewicht: ost ? 800 : 400 })}
    ${text(c - 70, cy - 60, 'gerade', { groesse: 13, gewicht: ost ? 400 : 800 })}${text(c - 70, cy - 42, '+ 500 ft', { groesse: 13, gewicht: ost ? 400 : 800 })}
    ${pfeil(c, cy, kx, ky, { farbe: 'primaer', breite: 2.4, spitze: 10.8 })}
    ${flugzeug(c, cy, kurs, 40)}
  `, 'Kompassrose mit dem gewählten Kurs und der passenden Hälfte der Halbkreisflugregel');
}

export const interaktiv = {
  vmc: {
    titel: 'Welche Sichtflugbedingungen gelten?',
    kurz: 'Wähle Luftraum, Gelände und Flughöhe – die App zeigt Flugsicht und Wolkenabstand.',
    symbol: 'auge',
    anleitung: "Wähle den Luftraum, die Geländehöhe und deine Flughöhe. Die Grafik zeigt dein Flugzeug, die Grenze von 3000 ft MSL bzw. 1000 ft über Grund und den nötigen Abstand zur Wolke. Darunter stehen die Mindestwerte.",
    legende: [["mf", "Grenze 3000 ft MSL bzw. 1000 ft über Grund"], ["orange", "vorgeschriebener Abstand zur Wolke"], ["ok", "„frei von Wolken“ und Erdsicht"]],
    probier: ["Luftraum G, Gelände 500 ft, Flughöhe 2000 ft: Was gilt? Und im Luftraum E?", "Erhöhe das Gelände auf 2500 ft – wohin wandert die Grenze?", "Steig über 10 000 ft: Welche Flugsicht brauchst du jetzt?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const klasse = umschalter({ name: 'Luftraum', optionen: [['C', 'C'], ['D', 'D'], ['E', 'E'], ['G', 'G']], wert: 'G', beiAenderung: zeichnen });
      const gelaende = regler({ name: 'Gelände', min: 0, max: 4000, schritt: 100, wert: 800, format: (w) => `${w} ft MSL`, beiAenderung: zeichnen });
      const hoehe = regler({ name: 'Flughöhe', min: 500, max: 11500, schritt: 100, wert: 2500, format: (w) => `${w} ft MSL`, beiAenderung: zeichnen });
      function zeichnen() {
        const m = vmcMinima(klasse.wert, gelaende.wert, hoehe.wert);
        bild.zeichnen(vmcBild(klasse.wert, gelaende.wert, hoehe.wert, m));
        werte.setzen([
          { titel: 'Höhenband', wert: m.band },
          { titel: 'Flugsicht mindestens', wert: m.sicht, art: 'gut' },
          { titel: 'Abstand zu Wolken', wert: m.abstand, art: 'gut' },
        ]);
        const ueberGrund = hoehe.wert - gelaende.wert;
        if (ueberGrund < 500) hinweis.setzen(`Nur ${Math.max(0, ueberGrund)} ft über Grund – unter der Mindesthöhe von 500 ft (außer bei Start und Landung).`, 'fehler');
        else if (klasse.wert === 'G' && m.frei) hinweis.setzen('Luftraum G unterhalb der Grenze: In Deutschland 1,5 km Flugsicht für Flächenflugzeuge bis 140 kt IAS.', 'warnung');
        else hinweis.setzen('');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, klasse.el), gelaende.el, hoehe.el), werte.el, hinweis.el);
    },
  },

  halbkreis: {
    titel: 'Halbkreisflugregel am Kompass',
    kurz: 'Drehe den Kurs und sieh, welche Reiseflughöhen passen.',
    symbol: 'karte',
    anleitung: "Drehe mit dem Regler deinen missweisenden Kurs. Die farbige Hälfte zeigt, welche Regel gilt; darunter stehen die passenden Reiseflughöhen.",
    legende: [["mf", "Hälfte, die zu deinem Kurs passt"], ["primaer", "dein Kurs"]],
    probier: ["Kurs 175°, dann 185°: Welche Reiseflughöhen passen jeweils?", "Welche Höhe passt für einen Flug genau nach Süden (180°)?"],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const kurs = regler({ name: 'Missweisender Kurs über Grund', min: 0, max: 355, schritt: 5, wert: 70, format: (w) => `${grad3(w)}°`, beiAenderung: zeichnen });
      function zeichnen() {
        const ost = kurs.wert < 180;
        bild.zeichnen(halbkreisBild(kurs.wert));
        werte.setzen([
          { titel: 'Regel', wert: ost ? 'ungerade + 500' : 'gerade + 500' },
          { titel: 'Passende Höhen', wert: ost ? '3500 ft · FL 55 · FL 75 · FL 95' : '4500 ft · FL 65 · FL 85 · FL 105', art: 'gut' },
        ]);
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, kurs.el)), werte.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Gilt im Reiseflug mehr als 3000 ft über Grund. Kurs 000° bis 179°: ungerade Tausender plus 500 ft, Kurs 180° bis 359°: gerade Tausender plus 500 ft.'));
    },
  },

  kontrollzone: {
    titel: 'Wetter in der Kontrollzone',
    kurz: 'Stelle Bodensicht und Wolkenuntergrenze ein: VFR, Sonder-VFR oder gar nicht?',
    symbol: 'warnung',
    anleitung: "Stelle die gemeldete Bodensicht und Wolkenuntergrenze ein. Der Punkt im Diagramm zeigt, in welchem Bereich du mit diesen Werten bist.",
    legende: [["primaer", "deine Werte"], ["ok", "VFR erlaubt"], ["orange", "nur mit Sonder-VFR-Freigabe"], ["fehler", "weder VFR noch Sonder-VFR"]],
    probier: ["Wie weit darf die Sicht sinken, bevor VFR nicht mehr geht?", "Bei 1100 ft Wolkenuntergrenze: Reichen 8 km Sicht für VFR?"],
    erstellen() {
      const bild = buehne();
      const ergebnis = meldung();
      const sicht = regler({ name: 'Bodensicht', min: 500, max: 10000, schritt: 100, wert: 3500, format: (w) => (w >= 10000 ? '10 km oder mehr' : w >= 5000 ? `${(w / 1000).toLocaleString('de-DE')} km` : `${w} m`), beiAenderung: zeichnen });
      const decke = regler({ name: 'Hauptwolkenuntergrenze', min: 200, max: 3000, schritt: 100, wert: 1100, format: (w) => (w >= 3000 ? '3000 ft oder höher' : `${w} ft`), beiAenderung: zeichnen });
      function zeichnen() {
        const e = ctrErgebnis(sicht.wert, decke.wert);
        bild.zeichnen(ctrBild(sicht.wert, decke.wert));
        if (e === 'vfr') ergebnis.setzen('VFR möglich: Bodensicht mindestens 5 km und Wolkenuntergrenze mindestens 1500 ft.', 'ok');
        else if (e === 'sonder') ergebnis.setzen('Nur mit Sonder-VFR-Freigabe: mindestens 1500 m Bodensicht und 600 ft Wolkenuntergrenze sind erfüllt.', 'warnung');
        else ergebnis.setzen('Weder VFR noch Sonder-VFR: unter 1500 m Bodensicht oder unter 600 ft Wolkenuntergrenze.', 'fehler');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(sicht.el, decke.el), ergebnis.el);
    },
  },

  ausweichen: {
    titel: 'Wer weicht aus?',
    kurz: 'Wähle, wer du bist, wer dir begegnet und von wo – die Ausweichregeln nach SERA.',
    symbol: 'flugzeug',
    anleitung: "Wähle, mit welchem Luftfahrzeug du fliegst, wer dir begegnet und aus welcher Richtung. Die Grafik zeigt, wer ausweichen muss und in welche Richtung.",
    legende: [["orange", "muss ausweichen (Pfeil = Richtung)"], ["primaer", "hat Vorflug"], ["leise", "nicht eindeutig geregelt"]],
    probier: ["Motorflugzeug gegen Motorflugzeug: Von welcher Seite muss der andere kommen, damit du Vorflug hast?", "Du fliegst Segelflugzeug, dir begegnet ein Ballon – wer weicht aus?", "Was gilt beim Gegenflug – egal, wer kommt?"],
    erstellen() {
      const bild = buehne();
      const ergebnis = meldung();
      const optionen = Object.entries(ARTEN).map(([k, a]) => [k, a.text]);
      const eigen = umschalter({ name: 'Du fliegst', optionen, wert: 'motor', beiAenderung: zeichnen });
      const anderer = umschalter({ name: 'Dir begegnet', optionen, wert: 'segel', beiAenderung: zeichnen });
      const lage = umschalter({ name: 'Lage', optionen: [['rechts', 'kommt von rechts'], ['links', 'kommt von links'], ['gegen', 'Gegenflug'], ['ueberholen', 'du überholst']], wert: 'rechts', beiAenderung: zeichnen });
      function zeichnen() {
        const e = vorflug(eigen.wert, anderer.wert, lage.wert);
        bild.zeichnen(ausweichBild(lage.wert, e, eigen.wert, anderer.wert));
        ergebnis.setzen(e.text, e.du === 'vorflug' ? 'ok' : e.du === 'unklar' ? 'warnung' : 'fehler');
      }
      zeichnen();
      return h('div', {}, bild.el, ergebnis.el, bedienfeld(eigen.el, anderer.el, h('div', { class: 'breit' }, lage.el)),
        h('p', { class: 'interaktiv-erklaerung' }, 'Vorflug entbindet nie davon, einen Zusammenstoß zu vermeiden. Beim Gegenflug und beim Überholen wird nach rechts ausgewichen (Segelflugzeuge dürfen beim Überholen auch links vorbei).'));
    },
  },
};
