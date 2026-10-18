// Aufgaben, die jedes Mal mit neuen Werten erzeugt werden (Modul „Luftraum & Regeln“).
// Jede Funktion bekommt eine Zufallsquelle z (js/zufall.js) und liefert eine Frage.

const ABSTAND_KONTROLLIERT = '1500 m waagerecht, 1000 ft senkrecht';
const ABSTAND_FREI = 'Frei von Wolken, mit Erdsicht';

function sichtText(meter) {
  if (meter >= 9999) return '10 km oder mehr';
  return meter >= 5000 ? `${meter / 1000} km` : `${meter} m`;
}

import { grenzen, luftraumAn } from './luftraeume.js';

/** Sicht und Wolkenuntergrenze in der Kontrollzone prüfen: erst VFR, dann Sonder-VFR (auch für das Thema METAR). */
export function ctrWeg(sicht, decke, ergebnis) {
  const deckeOk = (wert) => decke === null || decke >= wert;
  const deckeText = decke === null ? 'keine Hauptwolkenuntergrenze' : `Wolken ab ${decke} ft`;
  const schritte = [
    'VFR in der Kontrollzone: mindestens **5 km Bodensicht** und **1500 ft Hauptwolkenuntergrenze**.',
    `Hier: Sicht ${sicht === null ? 'nicht gemeldet' : sichtText(sicht)} (${sicht >= 5000 ? 'reicht' : 'zu wenig'}), ${deckeText} (${deckeOk(1500) ? 'reicht' : 'zu tief'}).`,
  ];
  if (!(sicht >= 5000 && deckeOk(1500))) {
    schritte.push('Sonder-VFR (nur mit Freigabe): mindestens **1500 m Bodensicht** und **600 ft Hauptwolkenuntergrenze**.');
    schritte.push(`Hier: Sicht ${sicht >= 1500 ? 'reicht' : 'zu wenig'}, Wolken ${deckeOk(600) ? 'reichen' : 'zu tief'}.`);
  }
  schritte.push(`Also: **${ergebnis}**.`);
  return schritte;
}

export const generatoren = {
  /** In welchem Luftraum bist du? Gelände, Gebiet und Höhe wechseln (Grundmuster nach AIP VFR ENR 1-1). */
  luftraumhoehe(z) {
    const gelaende = z.ganz(0, 2400, 100);
    const gebiet = z.wahl(['normal', 'normal', 'flugplatz']);
    const g = grenzen(gelaende, gebiet);
    const fall = z.wahl(['G', 'E', 'E', 'C']);
    const hoehe = fall === 'G' ? z.ganz(gelaende + 500, g.gOben - 100, 100)
      : fall === 'E' ? z.ganz(g.gOben + 100, 9500, 100)
        : z.ganz(10500, 12500, 500);
    const klasse = luftraumAn(hoehe, gelaende, gebiet);
    const ort = gebiet === 'flugplatz' ? 'in der Nähe eines Flugplatzes, an dem E schon ab 1000 ft über Grund beginnt' : 'ohne Kontrollzone und Nahverkehrsbereich in der Nähe';
    return {
      typ: 'auswahl',
      frage: `Gelände ${gelaende} ft MSL, ${ort}. In welchem Luftraum fliegst du in ${hoehe} ft MSL (außerhalb der Alpen)?`,
      richtig: `Luftraum ${klasse}`,
      falsch: ['G', 'E', 'C', 'D'].filter((k) => k !== klasse).slice(0, 3).map((k) => `Luftraum ${k}`),
      rechenweg: [
        `Obergrenze von G: Gelände + ${gebiet === 'flugplatz' ? 1000 : 2500} ft = ${gelaende} + ${gebiet === 'flugplatz' ? 1000 : 2500} = **${g.gOben} ft MSL**.`,
        'Darüber liegt Luftraum **E** bis **FL 100** (rund 10 000 ft), darüber **C**.',
        klasse === 'G' ? `${hoehe} ft liegt unter ${g.gOben} ft → **Luftraum G**.`
          : klasse === 'E' ? `${hoehe} ft liegt zwischen ${g.gOben} ft und FL 100 → **Luftraum E**.`
            : `${hoehe} ft liegt über FL 100 → **Luftraum C** – dafür brauchst du eine Freigabe.`,
      ],
    };
  },

  /** Welcher Wolkenabstand gilt in Höhe X über Gelände Y im Luftraum Z? */
  wolkenabstand(z) {
    const gelaende = z.wahl([200, 500, 900, 1400, 1900, 2400]);
    const klasse = z.wahl(['C', 'D', 'E', 'G', 'G', 'G']);
    const grenze = Math.max(3000, gelaende + 1000);
    const unten = z.janein();
    const hoehe = unten
      ? z.ganz(gelaende + 600, grenze - 200, 100)
      : z.ganz(Math.ceil((grenze + 300) / 500) * 500, 9500, 500);
    const frei = klasse === 'G' && unten;
    return {
      typ: 'auswahl',
      frage: `Gelände ${gelaende} ft MSL. Du fliegst in ${hoehe} ft MSL im Luftraum ${klasse}. Welcher Mindestabstand zu Wolken gilt?`,
      richtig: frei ? ABSTAND_FREI : ABSTAND_KONTROLLIERT,
      falsch: [frei ? ABSTAND_KONTROLLIERT : ABSTAND_FREI, '1000 m waagerecht, 500 ft senkrecht', 'Kein Mindestabstand vorgeschrieben'],
      rechenweg: [
        `Die Grenze ist der **höhere** Wert aus 3000 ft MSL und 1000 ft über Grund: ${gelaende} + 1000 = ${gelaende + 1000} ft MSL → Grenze **${grenze} ft MSL**.`,
        `Du fliegst in ${hoehe} ft – also **${unten ? 'darunter' : 'darüber'}**.`,
        frei
          ? 'Unter der Grenze gilt im Luftraum G: **frei von Wolken, mit Erdsicht**.'
          : `${klasse === 'G' ? (unten ? '' : 'Über der Grenze gilt auch im Luftraum G') : `Im Luftraum ${klasse} gilt immer`}: **1500 m waagerecht, 1000 ft senkrecht**.`,
      ],
    };
  },

  /** VFR, Sonder-VFR oder keins von beiden an einem Platz in der Kontrollzone? */
  kontrollzone(z) {
    const sicht = z.wahl([800, 1200, 1500, 2000, 3000, 4000, 4500, 5000, 6000, 8000, 9999]);
    const decke = z.wahl([400, 500, 600, 700, 900, 1200, 1400, 1500, 1800, 2500, null]);
    const vfr = sicht >= 5000 && (decke === null || decke >= 1500);
    const sonder = !vfr && sicht >= 1500 && (decke === null || decke >= 600);
    const antworten = ['VFR ohne Sonderfreigabe möglich', 'Nur mit Sonder-VFR-Freigabe', 'Weder VFR noch Sonder-VFR'];
    const richtig = vfr ? antworten[0] : sonder ? antworten[1] : antworten[2];
    const deckeText = decke === null ? 'keine (keine Schicht mit BKN oder OVC)' : `${decke} ft`;
    return {
      typ: 'auswahl',
      frage: 'Du willst an einem Flugplatz in einer Kontrollzone starten. Was ist bei diesem Wetter möglich?',
      code: `Bodensicht:              ${sichtText(sicht)}\nHauptwolkenuntergrenze:  ${deckeText}`,
      richtig,
      falsch: antworten.filter((a) => a !== richtig),
      rechenweg: ctrWeg(sicht, decke, richtig),
    };
  },

  /** Halbkreisflugregel: passende Reiseflughöhe zum Kurs. */
  halbkreis(z) {
    const kurs = z.ganz(1, 360);
    const ostwaerts = kurs < 180 || kurs === 360;
    const ungerade = ['3500 ft MSL', 'FL 55', 'FL 75', 'FL 95'];
    const gerade = ['4500 ft MSL', 'FL 65', 'FL 85', 'FL 105'];
    const [passend, unpassend] = ostwaerts ? [ungerade, gerade] : [gerade, ungerade];
    const kursText = String(kurs === 360 ? 360 : kurs).padStart(3, '0');
    return {
      typ: 'auswahl',
      frage: `Du fliegst nach VFR mit einem missweisenden Kurs über Grund von ${kursText}° mehr als 3000 ft über Grund. Welche Reiseflughöhe passt zur Halbkreisflugregel?`,
      richtig: z.wahl(passend),
      falsch: [...z.ziehen(unpassend, 2), z.wahl(['FL 60', 'FL 70', '5000 ft MSL'])],
      rechenweg: [
        `Kurs ${kursText}° liegt ${ostwaerts ? 'zwischen 000° und 179°' : 'zwischen 180° und 359°'}.`,
        ostwaerts ? 'Dafür gilt: **ungerade Tausender plus 500 ft** – 3500 ft, FL 55, FL 75, FL 95 …' : 'Dafür gilt: **gerade Tausender plus 500 ft** – 4500 ft, FL 65, FL 85, FL 105 …',
        'Unter den Antworten passt nur eine Höhe zu dieser Reihe.',
      ],
    };
  },
};
