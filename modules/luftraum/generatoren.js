// Aufgaben, die jedes Mal mit neuen Werten erzeugt werden (Modul „Luftraum & Regeln“).
// Jede Funktion bekommt eine Zufallsquelle z (js/zufall.js) und liefert eine Frage.

const ABSTAND_KONTROLLIERT = '1500 m waagerecht, 1000 ft senkrecht';
const ABSTAND_FREI = 'Frei von Wolken, mit Erdsicht';

function sichtText(meter) {
  if (meter >= 9999) return '10 km oder mehr';
  return meter >= 5000 ? `${meter / 1000} km` : `${meter} m`;
}

export const generatoren = {
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
      erklaerung: `Die Grenze liegt bei ${grenze} ft MSL – dem höheren Wert aus 3000 ft MSL und 1000 ft über Grund (${gelaende + 1000} ft MSL). `
        + `Du fliegst ${unten ? 'darunter' : 'darüber'}. `
        + (frei
          ? 'Im Luftraum G gilt dort „frei von Wolken, mit Erdsicht“.'
          : `${klasse === 'G' ? 'Auch im Luftraum G' : `Im Luftraum ${klasse}`} gilt deshalb: 1500 m waagerecht und 1000 ft senkrecht.`),
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
      erklaerung: 'VFR braucht in der Kontrollzone mindestens 5 km Bodensicht und 1500 ft Hauptwolkenuntergrenze. '
        + 'Darunter kann ATC Sonder-VFR freigeben – aber nur bei mindestens 1500 m Bodensicht und 600 ft Hauptwolkenuntergrenze.',
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
      erklaerung: ostwaerts
        ? 'Kurse von 000° bis 179°: ungerade Tausender plus 500 ft (z. B. 3500 ft, FL 55, FL 75).'
        : 'Kurse von 180° bis 359°: gerade Tausender plus 500 ft (z. B. 4500 ft, FL 65, FL 85).',
    };
  },
};
