// Interaktive Darstellungen für „Sprechfunk“: Buchstabieren und Zahlen sprechen –
// mit ICAO-Lautschrift (betonte Silbe hervorgehoben) und deutscher Lesehilfe.
// Bewusst ohne Sprachausgabe: Die Stimmen der Geräte sprechen die ICAO-Wörter oft falsch aus.
import { h, ladeJSON } from '../../js/ui.js';
import { umschalter, bedienfeld, meldung } from '../../js/interaktiv.js';
import * as funk from './funkwerte.js';
import { BUCHSTABEN, WOERTER, ZIFFERN_DEUTSCH, ZIFFERN_ENGLISCH, satzAussprache } from './aussprache.js';

/** Lautschrift als Element: großgeschriebene (betonte) Silbe fett. */
export function lautschrift(text) {
  return h('span', { class: 'lautschrift' }, text.split('-').flatMap((silbe, i) => {
    const betont = silbe === silbe.toUpperCase();
    return [i ? '·' : null, betont ? h('b', {}, silbe) : silbe.toLowerCase()].filter(Boolean);
  }));
}

export function buchstabieren(text, zahlen = 'englisch') {
  return [...text.toUpperCase()].filter((z) => /[A-Z0-9]/.test(z)).map((z) => {
    if (/\d/.test(z)) {
      if (zahlen === 'deutsch') return { zeichen: z, wort: ZIFFERN_DEUTSCH[Number(z)] };
      const wort = ZIFFERN_ENGLISCH[Number(z)];
      return { zeichen: z, wort, ...WOERTER[wort] };
    }
    return { zeichen: z, ...BUCHSTABEN[z] };
  });
}

/**
 * Wandelt einen Wert in die Sprechweise um – englisch (Standard) oder deutsch.
 * Regeln nach NfL 2024-1-3266, Nr. 10 (siehe funkwerte.js). Ergebnis: { text } oder { fehler }
 */
export function sprechweise(art, eingabe, sprache = 'en') {
  const e = eingabe.trim().replace(/\s+/g, '');
  const de = sprache === 'de';
  switch (art) {
    case 'frequenz': {
      const m = /^(1[1-3]\d)[.,](\d{1,3})$/.exec(e);
      if (!m) return { fehler: 'Bitte eine Frequenz wie 123,450 eingeben.' };
      return { text: funk.frequenz(`${m[1]}.${m[2].padEnd(3, '0')}`, sprache) };
    }
    case 'qnh': {
      const n = Number(e);
      if (!/^\d{3,4}$/.test(e) || n < 900 || n > 1100) return { fehler: 'Bitte ein QNH zwischen 900 und 1100 hPa eingeben.' };
      return { text: `QNH ${funk.qnh(n, sprache)}` };
    }
    case 'hoehe': {
      const n = Number(e);
      if (!/^\d+$/.test(e) || n < 100 || n > 99900 || n % 100) return { fehler: 'Bitte eine Höhe in Fuß in Hunderterschritten eingeben, z. B. 2500.' };
      return { text: `${funk.hoehe(n, sprache)} ${de ? 'Fuß' : 'feet'}` };
    }
    case 'kurs': {
      const n = Number(e);
      if (!/^\d{1,3}$/.test(e) || n > 360) return { fehler: 'Bitte einen Kurs von 0 bis 360 eingeben.' };
      return { text: `${de ? 'Steuerkurs' : 'heading'} ${funk.ziffern(String(n === 0 ? 360 : n).padStart(3, '0'), sprache)}` };
    }
    case 'squawk':
      if (!/^[0-7]{4}$/.test(e)) return { fehler: 'Ein Transpondercode hat vier Ziffern von 0 bis 7.' };
      return { text: `${de ? 'Squawk' : 'squawk'} ${funk.squawk(e, sprache)}` };
    case 'wind': {
      const m = /^(\d{1,3})\/(\d{1,2})$/.exec(e);
      if (!m || Number(m[1]) > 360) return { fehler: 'Bitte den Wind wie 240/12 eingeben (Richtung/Stärke in kt).' };
      return { text: de
        ? `Wind ${funk.ziffern(m[1].padStart(3, '0'), 'de')} Grad ${funk.ziffern(Number(m[2]), 'de')} Knoten`
        : `wind ${funk.ziffern(m[1].padStart(3, '0'), 'en')} degrees ${funk.ziffern(Number(m[2]), 'en')} knots` };
    }
    default:
      return { fehler: 'Unbekannte Art' };
  }
}

function sprechKarte(oben, wort, icao, deutsch) {
  return h('li', {},
    oben && h('b', { class: 'sprech-zeichen' }, oben),
    h('span', { class: 'sprech-wort' }, wort),
    icao && lautschrift(icao),
    deutsch && h('span', { class: 'sprech-deutsch' }, deutsch),
  );
}

export const interaktiv = {
  buchstabieren: {
    titel: 'Buchstabieren',
    kurz: 'Gib ein Kennzeichen oder Wort ein und sieh, wie es im Funk buchstabiert und ausgesprochen wird.',
    symbol: 'sprechfunk',
    anleitung: 'Tippe ein Kennzeichen oder ein Wort in das Feld. Für jeden Buchstaben siehst du das ICAO-Wort, darunter die Aussprache – die fett gedruckte Silbe wird betont – und ganz unten eine Lesehilfe auf Deutsch.',
    probier: ['Buchstabiere dein eigenes Kennzeichen oder deinen Namen.', 'Achte auf Wörter, die anders betont werden als im Deutschen: Hotel (ho-TELL), Papa (pa-PAH), Quebec (ke-BECK).', 'Stell die Ziffern auf „Deutsch“ und gib eine 2 ein – im deutschen Funk heißt sie „zwo“.'],
    erstellen() {
      const liste = h('ul', { class: 'sprechliste', 'aria-live': 'polite' });
      const zahlen = umschalter({ name: 'Ziffern sprechen auf', optionen: [['englisch', 'Englisch'], ['deutsch', 'Deutsch']], wert: 'englisch', beiAenderung: zeichnen });
      const feld = h('input', { class: 'texteingabe', value: 'D-EKLM', maxlength: 20, autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Text zum Buchstabieren', oninput: zeichnen });
      function zeichnen() {
        liste.replaceChildren(...buchstabieren(feld.value, zahlen.wert).map((t) => sprechKarte(t.zeichen, t.wort, t.icao, t.deutsch)));
      }
      zeichnen();
      return h('div', {},
        bedienfeld(h('label', { class: 'bau-label' }, 'Text oder Kennzeichen', feld), zahlen.el),
        liste,
        h('p', { class: 'interaktiv-erklaerung' }, 'Aussprache nach ICAO. Fett = betonte Silbe. Die deutsche Lesehilfe ist eine Annäherung – am besten übst du die Aussprache mit deinem Fluglehrer oder am Funkgerät.'));
    },
  },

  zahlen: {
    titel: 'Zahlen sprechen',
    kurz: 'Frequenz, QNH, Höhe, Kurs, Transpondercode oder Wind – so wird es im Funk gesprochen, auf Englisch und auf Deutsch.',
    symbol: 'sprechfunk',
    anleitung: 'Wähle oben aus, was du sprechen möchtest, und gib den Wert ein. Darunter steht der fertige Funkspruch und für jede Zahl die Aussprache nach ICAO.',
    probier: ['Gib die Frequenz 118,000 und danach 118,005 ein – wann werden alle sechs Ziffern gesprochen?', 'Probiere die Höhen 2500 und 10000 aus.', 'Stell den Transponder auf 7000 und danach auf 7001 – was ändert sich?', 'Schalte auf Deutsch und gib als QNH 1000 ein.'],
    erstellen() {
      const BEISPIEL = { frequenz: '123,450', qnh: '1009', hoehe: '2500', kurs: '090', squawk: '7000', wind: '240/12' };
      const zeile = h('p', { class: 'sprechzeile', 'aria-live': 'polite' });
      const liste = h('ul', { class: 'sprechliste' });
      const hinweis = meldung();
      const feld = h('input', { class: 'texteingabe', value: BEISPIEL.frequenz, inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Wert', oninput: zeichnen });
      const sprache = umschalter({ name: 'Sprache', optionen: [['en', 'Englisch'], ['de', 'Deutsch']], wert: 'en', beiAenderung: zeichnen });
      const art = umschalter({
        name: 'Was möchtest du sprechen?',
        optionen: [['frequenz', 'Frequenz'], ['qnh', 'QNH'], ['hoehe', 'Höhe'], ['kurs', 'Steuerkurs'], ['squawk', 'Transponder'], ['wind', 'Wind']],
        wert: 'frequenz',
        beiAenderung: (w) => { feld.value = BEISPIEL[w]; zeichnen(); },
      });
      function zeichnen() {
        const e = sprechweise(art.wert, feld.value, sprache.wert);
        zeile.textContent = e.text ?? '…';
        liste.replaceChildren(...(e.text ? satzAussprache(e.text) : []).map((w) => sprechKarte(null, w.wort, w.icao, w.deutsch)));
        hinweis.setzen(e.fehler ?? '', 'warnung');
      }
      zeichnen();
      return h('div', {},
        bedienfeld(h('div', { class: 'breit' }, art.el), h('label', { class: 'bau-label' }, 'Wert', feld), sprache.el),
        zeile, liste, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Nach der Bekanntmachung über die Sprechfunkverfahren: Frequenzen mit allen sechs Ziffern – außer die fünfte und sechste sind null. Höhen mit „tausend/hundert“. QNH 1000 und Transpondercodes aus ganzen Tausendern mit „tausend“. Fett = betonte Silbe.'));
    },
  },
  uebersetzen: {
    titel: 'Übersetzungsübung (BZF I)',
    kurz: 'Ein englischer Text im Stil des Luftfahrthandbuchs – lies ihn laut vor, übersetze ihn und vergleiche.',
    symbol: 'sprechblase',
    anleitung: 'Wähle einen Text. Lies ihn laut auf Englisch vor und übersetze ihn Satz für Satz ins Deutsche – am besten laut, wie in der Prüfung. Mit „Vokabeln“ siehst du schwierige Wörter, mit „Übersetzung zeigen“ eine Musterübersetzung zum Vergleichen.',
    probier: ['Übersetze zuerst ohne Hilfe und schau dann nach.', 'Achte auf „shall“: Es drückt eine Pflicht aus („muss“ / „ist zu“).', 'Lies den Text ein zweites Mal flüssig vor – in der Prüfung zählt auch das Vorlesen.'],
    erstellen() {
      const bereich = h('div', { class: 'uebersetzung' }, h('p', { class: 'leise' }, 'Texte werden geladen …'));
      ladeJSON(new URL('content/uebersetzungen.json', import.meta.url)).then(({ texte }) => {
        const wahl = umschalter({ name: 'Text', optionen: texte.map((t) => [t.id, t.titel]), wert: texte[0].id, beiAenderung: zeigen });
        const inhalt = h('div');
        function zeigen() {
          const t = texte.find((x) => x.id === wahl.wert);
          const deutsch = h('div', { class: 'uebersetzung-text uebersetzung-deutsch', hidden: true }, t.deutsch.split('\n').map((z) => h('p', {}, z)));
          const knopf = h('button', { type: 'button', class: 'knopf zweitrangig', onclick: () => {
            deutsch.hidden = !deutsch.hidden;
            knopf.textContent = deutsch.hidden ? 'Übersetzung zeigen' : 'Übersetzung ausblenden';
          } }, 'Übersetzung zeigen');
          inhalt.replaceChildren(
            h('div', { class: 'uebersetzung-text', lang: 'en' }, t.englisch.split('\n').map((z) => h('p', {}, z))),
            h('p', { class: 'leise' }, `${t.englisch.replace(/\n/g, ' ').length} Zeichen – in der Prüfung sind es etwa 800.`),
            h('details', { class: 'karten-legende' }, h('summary', {}, 'Vokabeln'),
              h('dl', { class: 'vokabeln' }, t.vokabeln.flatMap(([en, de]) => [h('dt', { lang: 'en' }, en), h('dd', {}, de)]))),
            h('div', { class: 'knopfreihe' }, knopf),
            deutsch,
          );
        }
        zeigen();
        bereich.replaceChildren(bedienfeld(h('div', { class: 'breit' }, wahl.el)), inhalt,
          h('p', { class: 'interaktiv-erklaerung' }, 'Frei erfundene Übungstexte über die Plätze des Übungsgebiets – keine Auszüge aus dem echten Luftfahrthandbuch.'));
      }).catch(() => bereich.replaceChildren(h('p', { class: 'fehlerton' }, 'Die Übungstexte konnten nicht geladen werden.')));
      return bereich;
    },
  },
};
