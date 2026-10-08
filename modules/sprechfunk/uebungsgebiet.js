// Funkstellen und Platzdaten des frei erfundenen Übungsgebiets „Mittelland“ – gemeinsam genutzt
// von den Übungskarten, den Lernkapiteln und den Funkgesprächen. Alle Namen, Frequenzen und
// Höhen sind erfunden und gehören zu keinem echten Flugplatz.

export const STATIONEN = {
  musterstadtTurm: { de: 'Musterstadt Turm', en: 'Musterstadt Tower', frequenz: '119.180' },
  musterstadtAtis: { de: 'Musterstadt ATIS', en: 'Musterstadt ATIS', frequenz: '128.330' },
  mittelland: { de: 'Mittelland Information', en: 'Mittelland Information', frequenz: '126.855' },
  altdorf: { de: 'Altdorf Radio', en: 'Altdorf Radio', frequenz: '123.505' },
  bergen: { de: 'Bergen Radio', en: 'Bergen Radio', frequenz: '122.605' },
};

export const MUSTERSTADT = {
  kennung: 'XMUS',
  hoehe: 1180,
  pisten: ['09', '27'],
  ctr: 'GND – 3500 ft MSL',
  platzrunde: 2200,
  meldepunkte: {
    N: { name: 'November', hoehe: 2500, art: 'Pflichtmeldepunkt' },
    W: { name: 'Whiskey', hoehe: 2500, art: 'Meldepunkt auf Anforderung' },
  },
};

export const ALTDORF = {
  kennung: 'XALT',
  hoehe: 1450,
  pisten: ['07', '25'],
  platzrunde: 2450,
};
