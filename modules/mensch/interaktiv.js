// Interaktive Darstellungen für „Menschliches Leistungsvermögen“.
import { h } from '../../js/ui.js';
import { regler, umschalter, wertanzeige, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { sauerstoffPartialdruck, sauerstoffPflicht, zeitNutzbarenBewusstseins, lage } from './rechnen.js';
import { sauerstoffBild, kollisionsBild } from './abbildungen.js';

const komma = (n, s = 0) => Number(n.toFixed(s)).toLocaleString('de-DE', { minimumFractionDigits: s, maximumFractionDigits: s });
const LAGEN = {
  kollision: { eigen: { x: 0, y: -3, kurs: 0, kt: 100 }, anderer: { x: 4, y: 1, kurs: 270, kt: 100 } },
  vorbei: { eigen: { x: 0, y: -3, kurs: 0, kt: 100 }, anderer: { x: 4, y: 2.2, kurs: 270, kt: 100 } },
  frontal: { eigen: { x: 0, y: -3, kurs: 0, kt: 100 }, anderer: { x: 0.25, y: 3.4, kurs: 180, kt: 90 } },
};

export const interaktiv = {
  sauerstoff: {
    titel: 'Wie viel Sauerstoff gibt es in der Höhe?',
    kurz: 'Steig höher und sieh, wie der Sauerstoff-Partialdruck sinkt – und ab wann du Zusatzsauerstoff brauchst.',
    symbol: 'thermik',
    anleitung: 'Schiebe den Regler auf eine Druckhöhe. Der Balken zeigt maßstäblich den Sauerstoff-Partialdruck der Standardatmosphäre: Der Anteil des Sauerstoffs bleibt 21 %, aber die Luft wird dünner. Die farbigen Bänder zeigen die Regeln aus NCO.OP.190 für Flugzeuge ohne Druckkabine. Darunter läuft die Flugdauer mit der Marke bei 30 Minuten. Ab 20 000 ft steht die Zeit nutzbaren Bewusstseins dabei.',
    legende: [['primaer', 'Sauerstoff-Partialdruck'], ['orange', '10 000 – 13 000 ft: nach 30 min Sauerstoff für die Besatzung'], ['fehler', 'über 13 000 ft: Sauerstoff für alle']],
    probier: ['In welcher Höhe ist nur noch halb so viel Sauerstoff vorhanden wie am Boden?', 'Du fliegst 45 Minuten in 11 500 ft. Was verlangt NCO.OP.190?'],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const hoehe = regler({ name: 'Druckhöhe', min: 0, max: 25000, schritt: 500, wert: 8000, format: (w) => `${komma(w)} ft`, beiAenderung: zeichnen });
      const dauer = regler({ name: 'Dauer in dieser Höhe', min: 0, max: 120, schritt: 5, wert: 20, format: (w) => `${w} min`, beiAenderung: zeichnen });
      function zeichnen() {
        const p = sauerstoffPartialdruck(hoehe.wert);
        bild.zeichnen(sauerstoffBild(hoehe.wert, dauer.wert));
        werte.setzen([
          { titel: 'Sauerstoff-Partialdruck', wert: Math.round(p), einheit: 'hPa' },
          { titel: 'im Vergleich zum Meer', wert: `${Math.round((p / sauerstoffPartialdruck(0)) * 100)} %` },
          zeitNutzbarenBewusstseins(hoehe.wert) && { titel: 'Zeit nutzbaren Bewusstseins', wert: zeitNutzbarenBewusstseins(hoehe.wert), art: 'schlecht' },
        ]);
        const pflicht = sauerstoffPflicht(hoehe.wert, dauer.wert);
        if (pflicht === 'alle') hinweis.setzen('Über 13 000 ft: Alle Insassen müssen Zusatzsauerstoff nehmen (NCO.OP.190 b 2).', 'fehler');
        else if (pflicht === 'besatzung') hinweis.setzen('Länger als 30 Minuten zwischen 10 000 und 13 000 ft: Die Besatzung muss Zusatzsauerstoff nehmen (NCO.OP.190 b 1).', 'warnung');
        else if (hoehe.wert > 10000) hinweis.setzen('Noch keine feste Pflicht – aber nach 30 Minuten in dieser Höhe braucht die Besatzung Sauerstoff. Achte auf erste Anzeichen von Sauerstoffmangel.', 'warnung');
        else hinweis.setzen('Bis 10 000 ft gibt es keine feste Sauerstoffpflicht. Nachts lässt das Sehen ohne Zusatzsauerstoff aber schon oberhalb von etwa 4000 ft messbar nach (FAA).', '');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, hoehe.el), h('div', { class: 'breit' }, dauer.el)), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Die Regeln gelten nach NCO.OP.190 b für Flugzeuge, wenn der Pilot nicht selbst feststellen kann, wie sich Sauerstoffmangel auswirkt. Für Segelflugzeuge verlangt SAO.OP.150 Zusatzsauerstoff, sobald Sauerstoffmangel die Fähigkeiten einschränken könnte. Die Zeit nutzbaren Bewusstseins stammt aus dem Pilot’s Handbook of Aeronautical Knowledge der FAA.'));
    },
  },

  kollision: {
    titel: 'Kollisionskurs erkennen',
    kurz: 'Bleibt das andere Flugzeug an derselben Stelle der Frontscheibe, wird es gefährlich.',
    symbol: 'auge',
    anleitung: 'Wähle eine Lage und schiebe die Zeit vor. Oben siehst du beide Flugzeuge von oben (orange gestrichelt: die Sichtlinie), unten den Blick durch deine Frontscheibe. Bei einem Kollisionskurs bleibt der rote Punkt an derselben Stelle und wird nur größer – genau das macht ihn so schwer zu entdecken.',
    legende: [['primaer', 'dein Flugzeug'], ['fehler', 'anderes Flugzeug'], ['orange', 'Sichtlinie zu verschiedenen Zeiten']],
    probier: ['Vergleiche „Kollisionskurs“ und „kreuzt vorbei“: Wie verhält sich der Punkt in der Frontscheibe?', 'Wie schnell kommt das Flugzeug im Gegenkurs näher?'],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const art = umschalter({ name: 'Lage', optionen: [['kollision', 'Kollisionskurs'], ['vorbei', 'kreuzt vorbei'], ['frontal', 'Gegenkurs']], wert: 'kollision', beiAenderung: zeichnen });
      const zeit = regler({ name: 'Zeit', min: 0, max: 2.3, schritt: 0.1, wert: 0, format: (w) => `${komma(w * 60)} s`, beiAenderung: zeichnen });
      function zeichnen() {
        const { eigen, anderer } = LAGEN[art.wert];
        bild.zeichnen(kollisionsBild(eigen, anderer, zeit.wert, 2.4));
        const start = Math.round(lage(eigen, anderer, 0).peilung);
        const jetzt = Math.round(lage(eigen, anderer, zeit.wert).peilung);
        werte.setzen([
          { titel: 'Peilung am Anfang', wert: `${start}°` },
          { titel: 'Peilung jetzt', wert: `${jetzt}°`, art: Math.abs(jetzt - start) < 2 ? 'schlecht' : 'gut' },
        ]);
        if (art.wert === 'kollision') hinweis.setzen('Die Peilung bleibt gleich, der Abstand schrumpft: Kollisionskurs! Ausweichen nach den Ausweichregeln – rechtzeitig.', 'fehler');
        else if (art.wert === 'vorbei') hinweis.setzen('Die Peilung wandert: Das andere Flugzeug kreuzt vor dir vorbei. Trotzdem im Blick behalten.', 'ok');
        else hinweis.setzen('Im Gegenkurs addieren sich die Geschwindigkeiten: Bei 100 und 90 kt kommt der andere fast 3 NM pro Minute näher.', 'warnung');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, art.el), h('div', { class: 'breit' }, zeit.el)), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Peilung = Winkel zwischen deiner Flugrichtung und der Richtung, in der du den anderen siehst. Luftraumbeobachtung: den Himmel in Blicksprüngen von höchstens 10° absuchen und jeden Abschnitt mindestens eine Sekunde lang anschauen.'));
    },
  },
};

