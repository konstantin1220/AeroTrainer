// Aufgaben mit wechselnden Werten für das Modul „Sprechfunk“.
// Aussprache nach ICAO: Ziffern einzeln, „niner“ für 9, „decimal“ bei Frequenzen.
import { transponder } from './abbildungen.js';
import { BUCHSTABEN as AUSSPRACHE } from './aussprache.js';

export const ALPHABET = {
  A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel',
  I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa',
  Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey',
  X: 'X-ray', Y: 'Yankee', Z: 'Zulu',
};
const BUCHSTABEN = Object.keys(ALPHABET);

const ZIFFERN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner'];

/** Ziffern einzeln sprechen: „1013“ → „one zero one three“ */
export function ziffernweise(text) {
  return [...String(text)].map((z) => ZIFFERN[Number(z)]).join(' ');
}

/** Frequenz nach ICAO: alle sechs Ziffern – außer die letzten beiden sind 0, dann nur vier. */
export function frequenzSprechen(frequenz) {
  const [mhz, khz] = frequenz.split('.');
  const nachkomma = khz.endsWith('00') ? khz[0] : khz;
  return `${ziffernweise(mhz)} decimal ${ziffernweise(nachkomma)}`;
}

/** Höhe nach ICAO: Tausender und Hunderter mit „thousand“/„hundred“. */
export function hoeheSprechen(fuss) {
  const tausender = Math.floor(fuss / 1000);
  const hunderter = Math.floor((fuss % 1000) / 100);
  const teile = [];
  if (tausender) teile.push(`${ziffernweise(tausender)} thousand`);
  if (hunderter) teile.push(`${ZIFFERN[hunderter]} hundred`);
  return `${teile.join(' ')} feet`;
}

function kennzeichenSprechen(kennzeichen) {
  return [...kennzeichen.replace('-', '')].map((b) => ALPHABET[b]).join(' ');
}

function eindeutig(richtig, kandidaten, anzahl = 3) {
  const falsch = [];
  for (const k of kandidaten) {
    if (k !== richtig && !falsch.includes(k)) falsch.push(k);
    if (falsch.length === anzahl) break;
  }
  return falsch;
}

export const generatoren = {
  buchstabe(z) {
    const b = z.wahl(BUCHSTABEN);
    if (z.janein()) {
      return {
        typ: 'auswahl',
        frage: `Wie wird der Buchstabe **${b}** im ICAO-Alphabet gesprochen?`,
        richtig: ALPHABET[b],
        falsch: z.ziehen(BUCHSTABEN.filter((x) => x !== b), 3).map((x) => ALPHABET[x]),
      };
    }
    return {
      typ: 'auswahl',
      frage: `Für welchen Buchstaben steht **${ALPHABET[b]}**?`,
      richtig: b,
      falsch: z.ziehen(BUCHSTABEN.filter((x) => x !== b), 3),
    };
  },

  betonung(z) {
    // Nur Wörter mit mindestens zwei Silben – dort kann man die Betonung verwechseln
    const kandidaten = Object.values(AUSSPRACHE).filter((a) => a.icao.includes('-'));
    const eintrag = z.wahl(kandidaten);
    const silben = eintrag.icao.toLowerCase().split('-');
    const varianten = silben.map((_, i) => silben.map((s, j) => (i === j ? s.toUpperCase() : s)).join('-'));
    const richtig = eintrag.icao;
    return {
      typ: 'auswahl',
      frage: `Welche Silbe wird bei **${eintrag.wort}** im Sprechfunk betont? (Großbuchstaben = betont)`,
      richtig,
      falsch: varianten.filter((v) => v !== richtig),
      erklaerung: `Nach ICAO: ${richtig} – auf Deutsch etwa „${eintrag.deutsch}“.`,
    };
  },

  kennzeichen(z) {
    const art = z.wahl([['E', 'ein Motorflugzeug bis 2 t'], ['K', 'einen Motorsegler'], ['M', 'ein Ultraleichtflugzeug']]);
    const kennzeichen = `D-${art[0]}${z.ziehen(BUCHSTABEN, 3).join('')}`;
    const richtig = kennzeichenSprechen(kennzeichen);
    const teile = richtig.split(' ');
    const varianten = [];
    for (let i = 0; i < 6; i++) {
      const kopie = [...teile];
      const stelle = z.ganz(2, kopie.length - 1);
      kopie[stelle] = ALPHABET[z.wahl(BUCHSTABEN.filter((x) => ALPHABET[x] !== teile[stelle]))];
      varianten.push(kopie.join(' '));
    }
    const vertauscht = [...teile];
    [vertauscht[2], vertauscht[3]] = [vertauscht[3], vertauscht[2]];
    return {
      typ: 'auswahl',
      frage: `Wie buchstabierst du das Kennzeichen **${kennzeichen}** (${art[1]})?`,
      richtig,
      falsch: eindeutig(richtig, [vertauscht.join(' '), ...varianten]),
      erklaerung: 'Jeder Buchstabe wird mit dem ICAO-Alphabet gesprochen, der Bindestrich nicht.',
    };
  },

  kurzrufzeichen(z) {
    const kennzeichen = `D-${z.wahl(['E', 'K', 'M'])}${z.ziehen(BUCHSTABEN, 3).join('')}`;
    const b = kennzeichen.replace('-', '');
    const form = (k) => `${k} (${kennzeichenSprechen(k)})`;
    const richtig = form(`D-${b.slice(-2)}`);
    return {
      typ: 'auswahl',
      frage: `Die Flugverkehrskontrolle hat dein Rufzeichen **${kennzeichen}** bereits abgekürzt. Wie lautet die übliche Kurzform?`,
      richtig,
      falsch: eindeutig(richtig, [form(`D-${b.slice(1, 3)}`), form(b.slice(-2)), form(`D-${b[1]}${b.slice(-1)}`), form(b.slice(-3))]),
      erklaerung: 'Abgekürzt werden das erste Zeichen und mindestens die letzten beiden Zeichen des Kennzeichens – aber erst, nachdem die Bodenstation selbst abgekürzt hat.',
    };
  },

  frequenz(z) {
    const mhz = z.ganz(118, 136);
    const endung = z.wahl(['00', '00', '05', '10', '15', '25', '30', '35', '40', '50', '55', '60', '65', '75', '80', '85', '90']);
    const frequenz = `${mhz}.${z.ganz(0, 9)}${endung}`;
    const richtig = frequenzSprechen(frequenz);
    const [ganz, khz] = frequenz.split('.');
    const falsch = [
      `${ziffernweise(ganz)} decimal ${ziffernweise(khz)}`,
      `${ziffernweise(ganz)} point ${ziffernweise(khz.endsWith('00') ? khz[0] : khz)}`,
      `${ziffernweise(ganz)} decimal ${ziffernweise(khz.slice(0, 2))}`,
      `one hundred ${ziffernweise(ganz.slice(1))} decimal ${ziffernweise(khz.endsWith('00') ? khz[0] : khz)}`,
    ];
    return {
      typ: 'auswahl',
      frage: `Wie sprichst du die Frequenz **${frequenz.replace('.', ',')} MHz** im englischen Sprechfunk?`,
      richtig,
      falsch: z.ziehen(eindeutig(richtig, falsch, 4), 3),
      erklaerung: 'Alle sechs Ziffern werden einzeln gesprochen, der Punkt heißt „decimal“. Nur wenn die letzten beiden Ziffern null sind, reichen die ersten vier.',
    };
  },

  qnh(z) {
    const qnh = z.ganz(986, 1036);
    const richtig = `QNH ${ziffernweise(qnh)}`;
    const falsch = [
      qnh >= 1000 ? `QNH ten ${ziffernweise(qnh % 100).replace(/^zero /, 'oh ')}` : `QNH nine hundred ${ziffernweise(qnh % 100)}`,
      `QNH ${qnh >= 1000 ? 'one thousand' : 'nine hundred'} ${qnh % 100 < 10 ? ziffernweise(qnh % 100) : `${ziffernweise(Math.floor((qnh % 100) / 10))} ${ziffernweise(qnh % 10)}`}`,
      `QNH ${ziffernweise(String(qnh).split('').reverse().join(''))}`,
    ];
    return {
      typ: 'auswahl',
      frage: `Wie sprichst du **QNH ${qnh}** im englischen Sprechfunk?`,
      richtig,
      falsch: eindeutig(richtig, falsch),
      erklaerung: 'Der Luftdruck wird Ziffer für Ziffer gesprochen – die 9 als „niner“.',
    };
  },

  hoehe(z) {
    const fuss = z.ganz(1500, 9500, 500);
    const richtig = hoeheSprechen(fuss);
    const falsch = [
      `${ziffernweise(fuss)} feet`,
      `${fuss % 1000 ? `${ziffernweise(Math.floor(fuss / 100))} hundred` : `${ziffernweise(fuss / 1000)} zero zero zero`} feet`,
      `${ziffernweise(Math.floor(fuss / 1000))} point ${ziffernweise(Math.floor((fuss % 1000) / 100))} thousand feet`,
    ];
    return {
      typ: 'auswahl',
      frage: `Wie sprichst du die Höhe **${fuss} ft** im englischen Sprechfunk?`,
      richtig,
      falsch: eindeutig(richtig, falsch),
      erklaerung: 'Bei Höhen werden die Tausender und Hunderter mit „thousand“ und „hundred“ gesprochen, z. B. 2500 ft = „two thousand five hundred feet“.',
    };
  },

  steuerkurs(z) {
    const kurs = z.ganz(1, 36) * 10;
    const kursText = String(kurs).padStart(3, '0');
    const richtig = `heading ${ziffernweise(kursText)}`;
    const zehner = Math.round(kurs / 10);
    const falsch = [
      `heading ${ziffernweise(String(kurs))}${kurs < 100 ? ' zero' : ''}`,
      `heading ${ziffernweise(String(zehner))}`,
      `heading ${kurs} degrees`,
    ];
    return {
      typ: 'auswahl',
      frage: `Wie sprichst du den Steuerkurs **${kursText}°**?`,
      richtig,
      falsch: eindeutig(richtig, falsch),
      erklaerung: 'Steuerkurse werden immer dreistellig und Ziffer für Ziffer gesprochen. Norden ist „three six zero“.',
    };
  },

  transpondercode(z) {
    const codes = [
      ['7000', 'VFR-Flug ohne zugeteilten Code'],
      ['7600', 'Funkausfall'],
      ['7700', 'Notfall'],
      ['7500', 'Widerrechtlicher Eingriff (Entführung)'],
    ];
    const [code, bedeutung] = z.wahl(codes);
    return {
      typ: 'auswahl',
      frage: 'Was signalisierst du mit diesem Transpondercode?',
      svg: transponder(code),
      richtig: bedeutung,
      falsch: [...codes.filter((c) => c[0] !== code).map((c) => c[1])],
      erklaerung: '7000 = VFR ohne zugeteilten Code, 7500 = widerrechtlicher Eingriff, 7600 = Funkausfall, 7700 = Notfall.',
    };
  },
};
