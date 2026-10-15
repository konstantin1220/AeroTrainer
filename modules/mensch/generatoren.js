// Aufgaben mit wechselnden Werten für „Menschliches Leistungsvermögen“.
import { ZEIT_NUTZBAREN_BEWUSSTSEINS, zeitNutzbarenBewusstseins, sauerstoffPflicht, tauglichkeitMonate, wartezeitNachTauchen } from './rechnen.js';

const komma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Gefährliche Denkmuster und ihre Gegenmittel (FAA PHAK, Kapitel 2, Abbildung 2-4) – eigene Übersetzung
export const DENKMUSTER = [
  { name: 'Gegen Autorität', satz: '„Mir sagt doch keiner, was ich zu tun habe.“', gegen: 'Halte dich an die Regeln – sie haben meistens recht.' },
  { name: 'Impulsivität', satz: '„Schnell, mach irgendwas!“', gegen: 'Nicht so schnell – erst denken.' },
  { name: 'Unverwundbarkeit', satz: '„Mir passiert das schon nicht.“', gegen: 'Es kann auch mir passieren.' },
  { name: 'Imponiergehabe', satz: '„Das schaffe ich – denen zeige ich’s.“', gegen: 'Unnötige Risiken einzugehen ist dumm.' },
  { name: 'Resignation', satz: '„Ist doch eh egal, was ich mache.“', gegen: 'Ich bin nicht hilflos – ich kann etwas bewirken.' },
];

const TAEUSCHUNGEN = [
  { lage: 'Die Piste ist deutlich schmaler, als du es von deinem Heimatplatz gewohnt bist.', wirkung: 'Du glaubst, zu hoch zu sein, und fliegst zu tief an' },
  { lage: 'Die Piste ist deutlich breiter, als du es gewohnt bist.', wirkung: 'Du glaubst, zu tief zu sein, und fängst zu hoch ab' },
  { lage: 'Die Piste steigt vom Anfang zum Ende hin an.', wirkung: 'Du glaubst, zu hoch zu sein, und fliegst zu tief an' },
  { lage: 'Die Piste fällt vom Anfang zum Ende hin ab.', wirkung: 'Du glaubst, zu tief zu sein, und fliegst zu hoch an' },
  { lage: 'Du fliegst nachts über Wasser oder dunkles, strukturloses Gelände an.', wirkung: 'Du glaubst, zu hoch zu sein, und fliegst zu tief an' },
];

export const generatoren = {
  /** Zeit nutzbaren Bewusstseins aus der Tabelle */
  bewusstsein(z) {
    const [hoehe, richtig] = z.wahl(ZEIT_NUTZBAREN_BEWUSSTSEINS.slice(1));
    return {
      typ: 'auswahl',
      frage: `Ohne Zusatzsauerstoff in **${komma(hoehe)} ft**: Wie lange bleibt dir etwa, um vernünftig zu handeln (Zeit nutzbaren Bewusstseins)?`,
      richtig,
      falsch: z.ziehen(ZEIT_NUTZBAREN_BEWUSSTSEINS.map(([, t]) => t).filter((t) => t !== richtig && t !== zeitNutzbarenBewusstseins(20000)), 3),
      erklaerung: `Nach der Tabelle der FAA: ${komma(hoehe)} ft – ${richtig}. Je höher, desto schneller geht es – und Sauerstoffmangel merkt man oft selbst nicht.`,
    };
  },

  /** Sauerstoffpflicht nach NCO.OP.190 b */
  sauerstoff(z) {
    const hoehe = z.wahl([9500, 10500, 11500, 12500, 13500, 14500]);
    const minuten = z.wahl([20, 25, 40, 60, 90]);
    const pflicht = sauerstoffPflicht(hoehe, minuten);
    const text = { alle: 'Alle Insassen müssen Zusatzsauerstoff nehmen', besatzung: 'Die Besatzung muss Zusatzsauerstoff nehmen', keine: 'Keine feste Pflicht nach NCO.OP.190 b' };
    return {
      typ: 'auswahl',
      frage: `Flugzeug ohne Druckkabine: **${minuten} Minuten** in einer Druckhöhe von **${komma(hoehe)} ft**. Was verlangt NCO.OP.190 b, wenn du nicht selbst einschätzen kannst, wie sich Sauerstoffmangel auswirkt?`,
      richtig: text[pflicht],
      falsch: Object.values(text).filter((t) => t !== text[pflicht]).concat('Nur Fluggäste brauchen Sauerstoff').slice(0, 3),
      erklaerung: 'NCO.OP.190 b: Besatzung Sauerstoff, wenn die Druckhöhe länger als 30 Minuten zwischen 10 000 und 13 000 ft liegt; über 13 000 ft alle Insassen.',
    };
  },

  /** Gültigkeit des Tauglichkeitszeugnisses (MED.A.045) */
  tauglichkeit(z) {
    const klasse = z.wahl(['klasse2', 'lapl']);
    const alter = z.wahl(klasse === 'lapl' ? [22, 30, 36, 45, 58, 66] : [22, 30, 36, 42, 47, 55, 63]);
    const monate = tauglichkeitMonate(klasse, alter);
    const name = klasse === 'lapl' ? 'LAPL-Tauglichkeitszeugnis (für LAPL und SPL)' : 'Tauglichkeitszeugnis der Klasse 2 (für PPL)';
    return {
      typ: 'auswahl',
      frage: `Du bist **${alter} Jahre** alt und bekommst ein neues ${name}. Wie lange ist es gültig?`,
      richtig: `${monate} Monate`,
      falsch: ['12 Monate', '24 Monate', '60 Monate', '36 Monate'].filter((t) => t !== `${monate} Monate`).slice(0, 3),
      erklaerung: klasse === 'lapl'
        ? 'MED.A.045: LAPL-Tauglichkeit 60 Monate bis zum 40. Geburtstag (längstens bis zum 42.), danach 24 Monate.'
        : 'MED.A.045: Klasse 2 – 60 Monate bis zum 40. Geburtstag (längstens bis zum 42.), 24 Monate zwischen 40 und 50 (längstens bis zum 51.), danach 12 Monate.',
    };
  },

  /** Wartezeit nach dem Tauchen */
  tauchen(z) {
    const dekompression = z.janein(0.3);
    const hoehe = z.wahl([3500, 5500, 7500, 9500]);
    const stunden = wartezeitNachTauchen({ dekompression, hoeheFt: hoehe });
    return {
      typ: 'auswahl',
      frage: `Du warst im Urlaub tauchen${dekompression ? ', mit Dekompressionsstopps' : ', ohne Dekompressionsstopps'}. Wie lange solltest du mindestens warten, bevor du auf ${komma(hoehe)} ft fliegst?`,
      richtig: `${stunden} Stunden`,
      falsch: ['2 Stunden', '6 Stunden', '12 Stunden', '24 Stunden'].filter((t) => t !== `${stunden} Stunden`).slice(0, 3),
      erklaerung: 'Empfehlung der FAA: bis 8000 ft mindestens 12 Stunden nach Tauchgängen ohne Dekompressionsstopp, 24 Stunden nach Tauchgängen mit Dekompressionsstopp; über 8000 ft immer mindestens 24 Stunden.',
    };
  },

  /** Optische Täuschungen im Anflug */
  anflug(z) {
    const t = z.wahl(TAEUSCHUNGEN);
    const wirkungen = [...new Set(TAEUSCHUNGEN.map((x) => x.wirkung))];
    return {
      typ: 'auswahl',
      frage: `${t.lage} Welche Täuschung droht im Anflug?`,
      richtig: t.wirkung,
      falsch: wirkungen.filter((w) => w !== t.wirkung).concat('Keine – die Piste sieht aus wie immer').slice(0, 3),
      erklaerung: 'Schmale, ansteigende Pisten und dunkles, strukturloses Gelände lassen dich höher erscheinen, als du bist – du fliegst zu tief an. Breite oder abfallende Pisten wirken umgekehrt. Gegenmittel: Höhenmesser und Anflughilfen nutzen.',
    };
  },

  /** Gefährliche Denkmuster erkennen */
  denkmuster(z) {
    const d = z.wahl(DENKMUSTER);
    if (z.janein()) {
      return {
        typ: 'auswahl',
        frage: `Welches gefährliche Denkmuster steckt hinter dem Satz **${d.satz}**?`,
        richtig: d.name,
        falsch: z.ziehen(DENKMUSTER.filter((x) => x !== d).map((x) => x.name), 3),
        erklaerung: `Gegenmittel: „${d.gegen}“`,
      };
    }
    return {
      typ: 'auswahl',
      frage: `Welcher Gedanke hilft gegen das Denkmuster **${d.name}**?`,
      richtig: d.gegen,
      falsch: z.ziehen(DENKMUSTER.filter((x) => x !== d).map((x) => x.gegen), 3),
      erklaerung: `${d.name}: ${d.satz} – Gegenmittel: „${d.gegen}“`,
    };
  },
};
