// Aufgaben für „Signale“: Lichtsignale und Bodensignale nach SERA, Anlage 1.
import { lichtsignal, rotesFeuerwerk, BODENSIGNALE } from './abbildungen.js';

export const LICHTSIGNALE = {
  flug: [
    { farbe: 'gruen', art: 'dauer', bedeutung: 'Landung freigegeben' },
    { farbe: 'rot', art: 'dauer', bedeutung: 'Anderes Luftfahrzeug hat Vorflug – Platzrunde fortsetzen' },
    { farbe: 'gruen', art: 'blinken', bedeutung: 'Zwecks Landung zurückkehren' },
    { farbe: 'rot', art: 'blinken', bedeutung: 'Nicht landen – Flugplatz unbenutzbar' },
    { farbe: 'weiss', art: 'blinken', bedeutung: 'Auf diesem Flugplatz landen und zum Vorfeld rollen' },
    { farbe: 'rot', art: 'rakete', bedeutung: 'Ungeachtet aller früheren Anweisungen zurzeit nicht landen' },
  ],
  boden: [
    { farbe: 'gruen', art: 'dauer', bedeutung: 'Start freigegeben' },
    { farbe: 'rot', art: 'dauer', bedeutung: 'Halt' },
    { farbe: 'gruen', art: 'blinken', bedeutung: 'Rollerlaubnis erteilt' },
    { farbe: 'rot', art: 'blinken', bedeutung: 'Die benutzte Landefläche freimachen' },
    { farbe: 'weiss', art: 'blinken', bedeutung: 'Zum Ausgangspunkt auf dem Flugplatz zurückkehren' },
  ],
};

export const generatoren = {
  lichtsignal(z) {
    const wo = z.wahl(['flug', 'boden']);
    const signal = z.wahl(LICHTSIGNALE[wo]);
    const andere = LICHTSIGNALE[wo].filter((s) => s !== signal).map((s) => s.bedeutung);
    return {
      typ: 'auswahl',
      frage: wo === 'flug'
        ? 'Du bist **im Flug** in der Nähe des Flugplatzes und siehst dieses Signal vom Turm. Was bedeutet es?'
        : 'Du stehst mit deinem Flugzeug **am Boden** und siehst dieses Signal vom Turm. Was bedeutet es?',
      svg: signal.art === 'rakete' ? rotesFeuerwerk() : lichtsignal(signal.farbe, signal.art),
      richtig: signal.bedeutung,
      falsch: z.ziehen(andere, 3),
      erklaerung: 'Lichtsignale nach SERA, Anlage 1. Die Bedeutung hängt davon ab, ob du fliegst oder am Boden bist.',
    };
  },

  bodensignal(z) {
    const schluessel = z.wahl(Object.keys(BODENSIGNALE));
    const andere = Object.keys(BODENSIGNALE).filter((k) => k !== schluessel).map((k) => BODENSIGNALE[k].bedeutung);
    return {
      typ: 'auswahl',
      frage: 'Was bedeutet dieses Bodensignal?',
      svg: BODENSIGNALE[schluessel].zeichnen(),
      richtig: BODENSIGNALE[schluessel].bedeutung,
      falsch: z.ziehen(andere, 3),
    };
  },
};
