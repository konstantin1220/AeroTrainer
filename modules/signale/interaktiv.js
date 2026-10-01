// Interaktive Darstellung für „Signale“: den Signalscheinwerfer selbst bedienen.
import { h } from '../../js/ui.js';
import { umschalter, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { lichtsignal, rotesFeuerwerk } from './abbildungen.js';
import { LICHTSIGNALE } from './generatoren.js';

export const interaktiv = {
  turm: {
    titel: 'Der Signalscheinwerfer am Turm',
    kurz: 'Wähle Farbe und Art des Lichts – was bedeutet es im Flug, was am Boden?',
    symbol: 'lampe',
    anleitung: "Wähle Farbe und Art des Lichts. Der Scheinwerfer zeigt das Signal, darunter steht, was es im Flug und am Boden bedeutet.",
    probier: ["Welches Signal bedeutet im Flug „Landung freigegeben“ – und was bedeutet dasselbe Signal am Boden?", "Welche Signale fordern dich auf, nicht zu landen?"],
    erstellen() {
      const bild = buehne();
      const im = meldung();
      const am = meldung();
      const farbe = umschalter({ name: 'Farbe', optionen: [['gruen', 'Grün'], ['rot', 'Rot'], ['weiss', 'Weiß']], wert: 'gruen', beiAenderung: zeichnen });
      const art = umschalter({ name: 'Art', optionen: [['dauer', 'Dauerlicht'], ['blinken', 'Blinkfolge'], ['rakete', 'Leuchtrakete']], wert: 'dauer', beiAenderung: zeichnen });
      const finde = (wo) => LICHTSIGNALE[wo].find((s) => s.farbe === farbe.wert && s.art === art.wert);
      function zeichnen() {
        if (art.wert === 'rakete') {
          bild.zeichnen(farbe.wert === 'rot' ? rotesFeuerwerk() : lichtsignal(farbe.wert, 'blinken'));
          if (farbe.wert !== 'rot') {
            im.setzen('Als Leuchtrakete ist nur die rote vorgesehen.', 'warnung');
            am.setzen('');
            return;
          }
        } else {
          bild.zeichnen(lichtsignal(farbe.wert, art.wert));
        }
        const flug = finde('flug');
        const boden = finde('boden');
        im.setzen(`Im Flug: ${flug ? flug.bedeutung : 'kein festgelegtes Signal'}`, flug ? 'ok' : 'warnung');
        am.setzen(`Am Boden: ${boden ? boden.bedeutung : 'kein festgelegtes Signal'}`, boden ? 'ok' : 'warnung');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(farbe.el, art.el), im.el, am.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Nach SERA, Anlage 1. Bestätigen am Tag: im Flug mit den Tragflächen wackeln, am Boden Querruder oder Seitenruder bewegen.'));
    },
  },
};
