// Erklär-Level der App: Wie ausführlich wird erklärt?
//   einsteiger – alles ausführlich, mit Alltagsvergleichen und hervorgehobenen Fachbegriffen
//   standard   – normale Erklärungen, Fachbegriffe antippbar, Vergleiche aufklappbar
//   kompakt    – das Wichtigste zuerst, ausführlicher Text eingeklappt (z. B. zur Prüfungsvorbereitung)
// Das Level gilt für die ganze App und wird am <html>-Element als data-stufe gesetzt.

import { h } from './ui.js';
import { einstellung, einstellungSetzen } from './storage.js';

export const STUFEN = {
  einsteiger: { titel: 'Einsteiger', kurz: 'Ausführlich', text: 'Alles Schritt für Schritt, mit Alltagsvergleichen. Fachbegriffe sind markiert und werden beim Antippen erklärt.' },
  standard: { titel: 'Standard', kurz: 'Normal', text: 'Normale Erklärungen. Fachbegriffe kannst du antippen, Vergleiche aus dem Alltag aufklappen.' },
  kompakt: { titel: 'Kompakt', kurz: 'Kompakt', text: 'Das Wichtigste zuerst – ideal zum Wiederholen und vor der Prüfung. Ausführliches lässt sich aufklappen.' },
};

export function aktuelleStufe() {
  const s = einstellung('stufe');
  return STUFEN[s] ? s : 'standard';
}

export function stufeGewaehlt() {
  return Boolean(STUFEN[einstellung('stufe')]);
}

export function stufeAnwenden() {
  document.documentElement.dataset.stufe = aktuelleStufe();
}

export function stufeSetzen(stufe) {
  einstellungSetzen('stufe', stufe);
  stufeAnwenden();
  window.dispatchEvent(new CustomEvent('stufe-geaendert', { detail: stufe }));
}

/** Kleiner Umschalter für das Erklär-Level (z. B. im Kopf eines Kapitels). */
export function stufenUmschalter({ kompakt = false } = {}) {
  const aktuell = aktuelleStufe();
  return h('div', { class: `stufen-umschalter ${kompakt ? 'klein' : ''}` },
    h('span', { class: 'stufen-umschalter-name' }, 'Erklärung:'),
    h('div', { class: 'segmente', role: 'radiogroup', 'aria-label': 'Wie ausführlich soll erklärt werden?' },
      Object.entries(STUFEN).map(([schluessel, s]) => h('button', {
        type: 'button', role: 'radio', class: 'segment', 'aria-checked': String(schluessel === aktuell), title: s.text,
        onclick: () => { if (schluessel !== aktuelleStufe()) stufeSetzen(schluessel); },
      }, s.kurz))),
  );
}
