// Für welchen Schein lernst du? PPL/LAPL (Flugzeug), SPL (Segelflugzeug), UL (Ultraleichtflugzeug).
// Die Auswahl gilt für die ganze App und filtert Inhalte, die nur für bestimmte Scheine gelten:
// Module (index.json), Kapitel, Fragen und interaktive Elemente können "scheine": ["spl"] tragen.
// Ohne Angabe gilt ein Inhalt für alle. Ist nichts ausgewählt, zeigt die App alles.

import { h } from './ui.js';
import { einstellung, einstellungSetzen } from './storage.js';

export const SCHEINE = {
  ppl: { titel: 'PPL / LAPL', text: 'Flugzeug' },
  spl: { titel: 'SPL', text: 'Segelflugzeug' },
  ul: { titel: 'UL', text: 'Ultraleichtflugzeug' },
};

export function gewaehlteScheine() {
  const liste = einstellung('scheine', []);
  return Array.isArray(liste) ? liste.filter((s) => SCHEINE[s]) : [];
}

export function scheineSetzen(liste) {
  einstellungSetzen('scheine', liste.filter((s) => SCHEINE[s]));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('schein-geaendert'));
}

/** Gilt ein Inhalt für die gewählten Scheine? (eintrag.scheine fehlt = gilt für alle) */
export function passtZumSchein(eintrag, gewaehlt = gewaehlteScheine()) {
  const fuer = eintrag?.scheine;
  if (!Array.isArray(fuer) || fuer.length === 0 || gewaehlt.length === 0) return true;
  return fuer.some((s) => gewaehlt.includes(s));
}

/** Kurztext wie „nur SPL“ für Inhalte, die nicht für alle gelten. */
export function scheinHinweis(eintrag) {
  const fuer = eintrag?.scheine;
  if (!Array.isArray(fuer) || fuer.length === 0 || fuer.length === Object.keys(SCHEINE).length) return null;
  return `nur ${fuer.map((s) => SCHEINE[s]?.titel ?? s).join(' und ')}`;
}

/** Auswahl als Knöpfe zum An- und Abwählen (mehrere möglich). */
export function scheinWahl({ beschriftung = 'Ich lerne für' } = {}) {
  const gewaehlt = gewaehlteScheine();
  const knoepfe = Object.entries(SCHEINE).map(([id, s]) => h('button', {
    type: 'button', class: 'schein-knopf', 'aria-pressed': String(gewaehlt.includes(id)), title: s.text,
    onclick: () => {
      const neu = gewaehlteScheine();
      scheineSetzen(neu.includes(id) ? neu.filter((x) => x !== id) : [...neu, id]);
    },
  }, h('strong', {}, s.titel), h('span', {}, s.text)));
  return h('div', { class: 'schein-wahl', role: 'group', 'aria-label': 'Für welchen Schein lernst du?' },
    beschriftung && h('span', { class: 'schein-wahl-titel' }, beschriftung), h('div', { class: 'schein-knoepfe' }, knoepfe),
    h('p', { class: 'schein-wahl-hinweis' }, gewaehlt.length
      ? `Inhalte, die nur für andere Scheine gelten, sind ausgeblendet.${gewaehlt.includes('ul') ? ' Für UL gelten teils nationale Regeln – die App zeigt die gemeinsamen Grundlagen.' : ''}`
      : 'Nichts gewählt: Die App zeigt alle Inhalte.'));
}
