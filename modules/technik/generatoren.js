// Aufgaben mit wechselnden Werten für „Technik“.
import { MF4_FAHRT, fahrtBereich, vergaserGefahr } from './rechnen.js';

const BEREICH_TEXT = {
  unter: 'unter dem weißen Bogen – unterhalb der Überziehgeschwindigkeit',
  weiss: 'im weißen Bogen unterhalb des grünen – nur mit ausgefahrenen Klappen',
  'gruen-weiss': 'im grünen und im weißen Bogen – mit und ohne Klappen erlaubt',
  gruen: 'im grünen Bogen über dem weißen – Klappen nicht mehr ausfahren',
  gelb: 'im gelben Bogen – nur in ruhiger Luft und mit Vorsicht',
  rot: 'am roten Strich oder darüber – niemals',
};

const GEFAHR_TEXT = {
  hoch: 'Hohe Gefahr der Vergaservereisung',
  moeglich: 'Vergaservereisung ist möglich',
  gering: 'Geringe Gefahr – aber nicht ausgeschlossen',
};

export const generatoren = {
  /** Wo liegt eine angezeigte Fahrt auf dem Fahrtmesser des Übungsflugzeugs MF-4? */
  fahrtbogen(z) {
    const m = MF4_FAHRT;
    const ias = z.wahl([z.ganz(m.vs0, m.vs1 - 1, 1), z.ganz(m.vs1, m.vfe, 5), z.ganz(m.vfe + 5, m.vno, 5), z.ganz(m.vno + 5, m.vne - 5, 5)]);
    const bereich = fahrtBereich(ias);
    const richtig = BEREICH_TEXT[bereich];
    return {
      typ: 'auswahl',
      frage: `Das (frei erfundene) Übungsflugzeug MF-4 hat diese Markierungen: weißer Bogen ${m.vs0}–${m.vfe} kt, grüner Bogen ${m.vs1}–${m.vno} kt, gelber Bogen ${m.vno}–${m.vne} kt, roter Strich ${m.vne} kt. Der Fahrtmesser zeigt ${ias} kt. Wo bist du?`,
      richtig,
      falsch: Object.entries(BEREICH_TEXT).filter(([k]) => k !== bereich && k !== 'unter' && k !== 'rot').map(([, t]) => t).slice(0, 3),
      erklaerung: `Weiß ist der Bereich für ausgefahrene Klappen (VS0 bis VFE), Grün der Normalbereich (VS1 bis VNO), Gelb der Vorsichtsbereich bis zum roten Strich VNE. ${ias} kt liegt ${richtig}.`,
    };
  },

  /** Was zeigen die Instrumente bei einer Verstopfung? */
  verstopfung(z) {
    const faelle = [
      { frage: 'Die statische Öffnung ist zugefroren. Du steigst weiter. Was zeigt der Höhenmesser?', richtig: 'Er bleibt auf der Höhe stehen, in der die Öffnung zufror', falsch: ['Er zeigt zu wenig Höhe an', 'Er zeigt die richtige Höhe', 'Er fällt auf null'], erklaerung: 'Der eingeschlossene Druck ändert sich nicht mehr – der Höhenmesser friert ein.' },
      { frage: 'Die statische Öffnung ist zugefroren. Was zeigt das Variometer?', richtig: 'Dauernd null', falsch: ['Dauernd Steigen', 'Dauernd Sinken', 'Die richtige Steigrate'], erklaerung: 'Das Variometer misst Druckänderungen. Ohne Änderung am statischen Anschluss zeigt es null.' },
      { frage: 'Die statische Öffnung ist zugefroren. Du sinkst. Was zeigt der Fahrtmesser?', richtig: 'Zu viel – mehr als die tatsächliche Fahrt', falsch: ['Zu wenig', 'Genau die richtige Fahrt', 'Null'], erklaerung: 'Beim Sinken steigt der Druck im Staurohr, der eingeschlossene statische Druck bleibt – der Unterschied wird größer.' },
      { frage: 'Die statische Öffnung ist zugefroren. Du steigst. Was zeigt der Fahrtmesser?', richtig: 'Zu wenig – weniger als die tatsächliche Fahrt', falsch: ['Zu viel', 'Genau die richtige Fahrt', 'Dauernd den roten Strich'], erklaerung: 'Beim Steigen sinkt der Druck im Staurohr, der eingeschlossene statische Druck bleibt – der Unterschied wird kleiner.' },
      { frage: 'Ein Insekt verstopft das Staurohr, der Ablauf bleibt offen. Was zeigt der Fahrtmesser?', richtig: 'Er fällt auf null', falsch: ['Er bleibt stehen', 'Er zeigt zu viel', 'Er wirkt wie ein Höhenmesser'], erklaerung: 'Die Luft im Staurohr entweicht durch den Ablauf, der Druck gleicht sich dem statischen an – Anzeige null.' },
      { frage: 'Staurohr und Ablauf sind vereist. Du steigst bei gleicher Fahrt. Was zeigt der Fahrtmesser?', richtig: 'Immer mehr – er wirkt wie ein Höhenmesser', falsch: ['Er fällt auf null', 'Er zeigt die richtige Fahrt', 'Immer weniger'], erklaerung: 'Der Gesamtdruck ist eingeschlossen, der statische sinkt beim Steigen – die Anzeige steigt.' },
      { frage: 'Du schaltest auf die Ersatz-Druckquelle in der Kabine. Was zeigt der Fahrtmesser?', richtig: 'Etwas mehr als die tatsächliche Fahrt', falsch: ['Etwas weniger', 'Null', 'Genau die richtige Fahrt'], erklaerung: 'Der Druck in der Kabine ist etwas geringer als draußen – Fahrtmesser und Höhenmesser zeigen etwas zu viel.' },
    ];
    const f = z.wahl(faelle);
    return { typ: 'auswahl', ...f };
  },

  /** Wie groß ist die Gefahr der Vergaservereisung? (vereinfacht nach PHAK Abb. 7-12) */
  vergaser(z) {
    const temperatur = z.ganz(-5, 35, 1);
    const feuchte = z.ganz(30, 100, 5);
    const gefahr = vergaserGefahr(temperatur, feuchte);
    return {
      typ: 'auswahl',
      frage: `Außentemperatur ${temperatur} °C, relative Feuchte ${feuchte} %. Wie groß ist die Gefahr der Vergaservereisung (vereinfacht nach dem Pilot’s Handbook of Aeronautical Knowledge)?`,
      richtig: GEFAHR_TEXT[gefahr],
      falsch: Object.entries(GEFAHR_TEXT).filter(([k]) => k !== gefahr).map(([, t]) => t).concat(['Vergaservereisung gibt es nur unter 0 °C']).slice(0, 3),
      erklaerung: 'Am größten ist die Gefahr unter etwa 21 °C bei mehr als 80 % Feuchte, möglich bis 38 °C schon ab 50 % Feuchte. Auch außerhalb dieser Bereiche kann sich Eis bilden.',
    };
  },
};
