// Aufgaben mit wechselnden Werten für das Modul „Sprechfunk“.
// Aussprache nach ICAO: Ziffern einzeln, „niner“ für 9, „decimal“ bei Frequenzen.
import { transponder } from './abbildungen.js';
import { BUCHSTABEN as AUSSPRACHE } from './aussprache.js';
import * as funk from './funkwerte.js';
import { STATIONEN, MUSTERSTADT } from './uebungsgebiet.js';
import { uhrzeigerstellung } from './abbildungen.js';

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
    const richtig = `QNH ${funk.qnh(qnh, 'en')}`;
    const falsch = [
      qnh >= 1000 ? `QNH ten ${ziffernweise(qnh % 100).replace(/^zero /, 'oh ')}` : `QNH nine hundred ${ziffernweise(qnh % 100)}`,
      `QNH ${qnh >= 1000 ? 'one thousand' : 'nine hundred'} ${qnh % 100 < 10 ? ziffernweise(qnh % 100) : `${ziffernweise(Math.floor((qnh % 100) / 10))} ${ziffernweise(qnh % 10)}`}`,
      `QNH ${ziffernweise(String(qnh).split('').reverse().join(''))}`,
      `QNH ${ziffernweise(qnh)}`,
    ];
    return {
      typ: 'auswahl',
      frage: `Wie sprichst du **QNH ${qnh}** im englischen Sprechfunk?`,
      richtig,
      falsch: eindeutig(richtig, falsch),
      erklaerung: 'Der Luftdruck wird Ziffer für Ziffer gesprochen – die 9 als „niner“. Nur 1000 hPa heißt „one thousand“ (NfL 2024-1-3266, Nr. 10).',
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

  // ---------- BZF: Zurücklesen, Zahlen, Platzrunde, Englisch ----------

  zuruecklesen(z) {
    const r = funk.zufallsRufzeichen(z);
    const k = funk.kurzform(r);
    const piste = z.wahl(MUSTERSTADT.pisten);
    const andere = MUSTERSTADT.pisten.find((p) => p !== piste);
    const qnh = z.ganz(995, 1030);
    const code = `${z.ganz(2, 6)}${z.ganz(1, 7)}${z.ganz(0, 7)}${z.ganz(1, 7)}`;
    const wind = `${String(z.ganz(1, 36) * 10).padStart(3, '0')} Grad, ${z.ganz(3, 14)} Knoten`;
    const faelle = [
      () => ({ ansage: `${k}, rollen Sie zum Rollhalt Piste ${piste}`, richtig: `Rolle zum Rollhalt Piste ${piste}, ${k}`,
        falsch: [`Verstanden, ${k}`, `Rolle zum Rollhalt Piste ${andere}, ${k}`, `${k}, abflugbereit`],
        erklaerung: 'Rollanweisungen zu einer Piste liest du zurück – mit Pistenbezeichnung und Rufzeichen.' }),
      () => ({ ansage: `${k}, rollen Sie zum Abflugpunkt Piste ${piste}, dort halten`, richtig: `Rolle zum Abflugpunkt Piste ${piste}, dort halten, ${k}`,
        falsch: [`Rolle zum Abflugpunkt Piste ${piste}, ${k}`, `Piste ${piste}, Start frei, ${k}`, `Wilco, ${k}`],
        erklaerung: '„Dort halten“ gehört unbedingt in die Rückmeldung – du darfst noch nicht starten.' }),
      () => ({ ansage: `${k}, Wind ${wind}, Piste ${piste}, Start frei`, richtig: `Piste ${piste}, Start frei, ${k}`,
        falsch: [`Start frei, ${k}`, `Verstanden, ${k}`, `Piste ${andere}, Start frei, ${k}`],
        erklaerung: 'Startfreigaben liest du mit Pistenbezeichnung zurück. Den Wind musst du nicht wiederholen.' }),
      () => ({ ansage: `${k}, Wind ${wind}, Piste ${piste}, Landung frei`, richtig: `Piste ${piste}, Landung frei, ${k}`,
        falsch: [`Landung frei, ${k}`, `Roger, ${k}`, `Piste ${andere}, Landung frei, ${k}`],
        erklaerung: 'Landefreigaben liest du mit Pistenbezeichnung zurück.' }),
      () => ({ ansage: `${k}, fliegen Sie in die Kontrollzone über Whiskey in 2500 ft, QNH ${qnh}`,
        richtig: `Fliege in die Kontrollzone über Whiskey in 2500 ft, QNH ${qnh}, ${k}`,
        falsch: [`Fliege in die Kontrollzone über Whiskey, ${k}`, `Fliege in die Kontrollzone über Whiskey in 2500 ft, QNH ${qnh + 1}, ${k}`, `Verstanden, Whiskey, ${k}`],
        erklaerung: 'Freigaben, Höhen und den Höhenmesserwert (QNH) liest du vollständig zurück.' }),
      () => ({ ansage: `${k}, Squawk ${code}`, richtig: `Squawk ${code}, ${k}`,
        falsch: [`Verstanden, ${k}`, `Squawk ${code.split('').reverse().join('')}, ${k}`, `Squawk 7000, ${k}`],
        erklaerung: 'Transpondercodes liest du immer zurück.' }),
      () => ({ ansage: `${k}, rufen Sie ${STATIONEN.mittelland.de} auf ${STATIONEN.mittelland.frequenz}`,
        richtig: `${STATIONEN.mittelland.de} auf ${STATIONEN.mittelland.frequenz}, ${k}`,
        falsch: [`Wilco, ${k}`, `${STATIONEN.mittelland.de}, ${k}`, `${STATIONEN.mittelland.de} auf ${STATIONEN.mittelland.frequenz.slice(0, -1)}0, ${k}`],
        erklaerung: 'Neue Frequenzen liest du zurück – sonst merkt niemand, wenn du dich verhört hast.' }),
    ];
    const f = z.wahl(faelle)();
    return {
      typ: 'auswahl',
      frage: `Der Turm sagt: „${f.ansage}“. Was antwortest du?`,
      richtig: f.richtig,
      falsch: eindeutig(f.richtig, f.falsch),
      erklaerung: `${f.erklaerung} (Pflicht zum Zurücklesen: SERA.8015 e)`,
    };
  },

  zahlensprechen(z) {
    const sprache = z.wahl(['de', 'en']);
    const de = sprache === 'de';
    const art = z.wahl(['qnh', 'squawk', 'frequenz', 'hoehe']);
    let wert, richtig, falsch, frage, erklaerung;
    if (art === 'qnh') {
      wert = z.janein(0.2) ? 1000 : z.ganz(990, 1035);
      richtig = `QNH ${funk.qnh(wert, sprache)}`;
      falsch = [`QNH ${funk.ziffern(wert + 1, sprache)}`, de ? `QNH ${wert} Hektopascal` : `QNH ${wert} hectopascal`, `QNH ${funk.ziffern(String(wert).slice(1), sprache)}`];
      if (wert === 1000) falsch[0] = `QNH ${funk.ziffern(1000, sprache)}`;
      frage = `Wie sprichst du **QNH ${wert}** ${de ? 'auf Deutsch' : 'auf Englisch'}?`;
      erklaerung = 'Den Höhenmesserwert sprichst du Ziffer für Ziffer – nur 1000 hPa heißt „ein tausend“ / „one thousand“.';
    } else if (art === 'squawk') {
      wert = z.janein(0.3) ? String(z.ganz(1, 7) * 1000) : `${z.ganz(1, 6)}${z.ganz(0, 7)}${z.ganz(0, 7)}${z.ganz(1, 7)}`;
      richtig = `Squawk ${funk.squawk(wert, sprache)}`;
      const ganz = Number(wert) % 1000 === 0;
      falsch = [
        ganz ? `Squawk ${funk.ziffern(wert, sprache)}` : `Squawk ${funk.ziffern(wert.slice(0, 2), sprache)} ${de ? 'hundert' : 'hundred'} ${funk.ziffern(wert.slice(2), sprache)}`,
        `Squawk ${funk.ziffern(wert.split('').reverse().join(''), sprache)}`,
        de ? `Squawk ${funk.ziffern(wert, 'de').replace(/zwo/g, 'zwei')}` : `Squawk ${funk.ziffern(wert, 'en').replace(/niner/g, 'nine')}`,
      ];
      frage = `Wie sprichst du **Squawk ${wert}** ${de ? 'auf Deutsch' : 'auf Englisch'}?`;
      erklaerung = 'Transpondercodes sprichst du Ziffer für Ziffer – Codes aus ganzen Tausendern mit „tausend“ / „thousand“ (z. B. 7000 = „sieben tausend“).';
    } else if (art === 'frequenz') {
      wert = z.wahl([STATIONEN.musterstadtTurm.frequenz, STATIONEN.mittelland.frequenz, STATIONEN.altdorf.frequenz, '118.100', '121.500', '132.000']);
      richtig = funk.frequenz(wert, sprache);
      const [mhz, khz] = wert.split('.');
      falsch = [
        `${funk.ziffern(mhz, sprache)} ${de ? 'punkt' : 'point'} ${funk.ziffern(khz, sprache)}`,
        `${funk.ziffern(mhz, sprache)} ${de ? 'komma' : 'decimal'} ${funk.ziffern(khz.slice(0, 1), sprache)}`,
        `${funk.ziffern(mhz, sprache)} ${de ? 'komma' : 'decimal'} ${funk.ziffern(khz, sprache)}`,
        `${funk.ziffern(mhz, sprache)} ${de ? 'komma' : 'decimal'} ${funk.ziffern(khz.slice(0, 2), sprache)}`,
      ];
      frage = `Wie sprichst du die Frequenz **${wert}** ${de ? 'auf Deutsch' : 'auf Englisch'}?`;
      erklaerung = 'Frequenzen mit „komma“ / „decimal“ und allen sechs Ziffern – nur wenn die fünfte und sechste Ziffer beide null sind, sprichst du die ersten vier.';
    } else {
      wert = z.wahl([1500, 2000, 2500, 3400, 4500, 1000, 1700, 12000]);
      richtig = `${funk.hoehe(wert, sprache)} ${de ? 'Fuß' : 'feet'}`;
      falsch = [
        `${funk.ziffern(wert, sprache)} ${de ? 'Fuß' : 'feet'}`,
        de ? `${wert.toLocaleString('de-DE')} Fuß` : `${wert} feet`,
        `${funk.hoehe(wert + 100, sprache)} ${de ? 'Fuß' : 'feet'}`,
      ];
      frage = `Wie sprichst du die Höhe **${wert} ft** ${de ? 'auf Deutsch' : 'auf Englisch'}?`;
      erklaerung = 'Höhen sprichst du mit „tausend“ und „hundert“: 3400 = „drei tausend vier hundert“, 12 000 = „eins zwo tausend“.';
    }
    return { typ: 'auswahl', frage, richtig, falsch: eindeutig(richtig, falsch), erklaerung: `${erklaerung} (NfL 2024-1-3266, Nr. 10)` };
  },

  platzrundenmeldung(z) {
    const r = funk.zufallsRufzeichen(z);
    const piste = z.wahl(['07', '25']);
    const rechts = piste === '25';
    const teil = z.wahl(['Gegenanflug', 'Queranflug', 'Endanflug']);
    const absicht = z.wahl(['zur Landung', 'Aufsetzen und Durchstarten']);
    const richtig = `${r}, ${rechts ? `rechter ${teil}` : teil} Piste ${piste}, ${absicht}`;
    const falsch = [
      `${r}, ${rechts ? teil : `rechter ${teil}`} Piste ${piste}, ${absicht}`,
      `${r}, im ${teil}, erbitte Landeinformationen`,
      `${r}, ${rechts ? `rechter ${teil}` : teil} Piste ${piste}, erbitte Landefreigabe`,
      `${r}, kurz vor der Landung`,
    ];
    return {
      typ: 'auswahl',
      frage: `Du fliegst in Altdorf (Bodenfunkstelle „Altdorf Radio“) die Platzrunde zur Piste ${piste} – das ist dort eine **${rechts ? 'rechte' : 'linke'} Platzrunde**. Du bist im **${teil}** und möchtest ${absicht === 'zur Landung' ? 'landen' : 'aufsetzen und durchstarten'}. Was meldest du?`,
      richtig,
      falsch: eindeutig(richtig, falsch),
      erklaerung: 'In der Platzrunde meldest du Platzrundenteil, Piste und Absicht. Bei einer Rechtsplatzrunde kommt „rechter“ davor. Eine RADIO-Station gibt keine Landefreigabe. (NfL 2024-1-3240, Nr. 6.2)',
    };
  },

  englischphrase(z) {
    const paare = [
      ['Rollen Sie zum Rollhalt Piste 27', 'Taxi to holding point runway 27'],
      ['Rollen Sie zum Abflugpunkt Piste 27, dort halten', 'Line up runway 27 and wait'],
      ['Piste 27, Start frei', 'Runway 27, cleared for take-off'],
      ['Piste 27, Landung frei', 'Runway 27, cleared to land'],
      ['Melden Sie abflugbereit', 'Report when ready for departure'],
      ['Fliegen Sie in den Gegenanflug Piste 27', 'Join downwind runway 27'],
      ['Melden Sie Queranflug', 'Report base'],
      ['Melden Sie Endanflug', 'Report final'],
      ['Starten Sie durch', 'Go around'],
      ['Fliegen Sie in die Kontrollzone über Whiskey', 'Enter control zone via Whiskey'],
      ['Verlassen Sie die Kontrollzone über November', 'Leave control zone via November'],
      ['Rufen Sie Rollkontrolle', 'Contact ground'],
      ['Halte Ausschau', 'Looking out'],
      ['Verkehr in Sicht', 'Traffic in sight'],
      ['Kein Kontakt', 'Negative contact'],
      ['Wiederholen Sie', 'Say again'],
      ['Nicht möglich', 'Unable'],
      ['Werde in RMZ einfliegen', 'Will enter RMZ'],
    ];
    const [de, en] = z.wahl(paare);
    const rueckwaerts = z.janein();
    const andere = paare.filter((p) => p[0] !== de);
    return rueckwaerts
      ? { typ: 'auswahl', frage: `Was bedeutet **„${en}“**?`, richtig: de, falsch: z.ziehen(andere, 3).map((p) => p[0]),
        erklaerung: 'Die englischen Sprechgruppen entsprechen den deutschen – siehe Bekanntmachung über die Sprechfunkverfahren, Anlage 1.' }
      : { typ: 'auswahl', frage: `Wie heißt **„${de}“** im englischen Sprechfunk?`, richtig: en, falsch: z.ziehen(andere, 3).map((p) => p[1]),
        erklaerung: 'Die englischen Sprechgruppen entsprechen den deutschen – siehe Bekanntmachung über die Sprechfunkverfahren, Anlage 1.' };
  },

  uhrzeit(z) {
    const uhr = z.ganz(1, 12);
    const richtung = { 12: 'genau voraus', 1: 'rechts vorne', 2: 'rechts vorne', 3: 'rechts (querab)', 4: 'rechts hinten', 5: 'rechts hinten', 6: 'genau hinter dir', 7: 'links hinten', 8: 'links hinten', 9: 'links (querab)', 10: 'links vorne', 11: 'links vorne' };
    const alle = [...new Set(Object.values(richtung))];
    return {
      typ: 'auswahl',
      frage: `Der Fluginformationsdienst meldet: „Verkehr auf **${uhr} Uhr**“. Wo suchst du?`,
      svg: uhrzeigerstellung(uhr),
      richtig: richtung[uhr],
      falsch: z.ziehen(alle.filter((a) => a !== richtung[uhr]), 3),
      erklaerung: 'Die Uhrzeigerstellung bezieht sich auf deine Flugrichtung: 12 Uhr ist geradeaus, 3 Uhr rechts, 6 Uhr hinten, 9 Uhr links.',
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
