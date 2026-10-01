// Merkliste: Fragen, die man sich gezielt merken möchte – in jeder Fragerunde, am Ende
// einer Runde und in der Prüfansicht. Gesammelt angezeigt unter #/merkliste.
//
// Ein Merk-Eintrag braucht { modul, id, erzeugt }:
//   erzeugt = false → feste Frage aus der Inhaltsdatei, gemerkt über Modul und ID
//   erzeugt = true  → Rechenaufgabe oder Übungsfrage, die jedes Mal neu entsteht;
//                     die konkrete Frage wird mitgespeichert

import { h } from './ui.js';
import { icon } from './icons.js';
import * as lernstand from './storage.js';

/** Kurze Prüfsumme (FNV-1a), damit dieselbe erzeugte Aufgabe nicht doppelt gemerkt wird. */
export function pruefsumme(text) {
  let wert = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    wert ^= text.charCodeAt(i);
    wert = Math.imul(wert, 0x01000193) >>> 0;
  }
  return wert.toString(36);
}

export function merkSchluessel({ modul, id, erzeugt }, frage) {
  return erzeugt ? `${modul}/${id}/${pruefsumme(JSON.stringify(frage))}` : `${modul}/${id}`;
}

/** Text der Frage für Listen (Wahr/falsch-Fragen haben eine Aussage statt einer Frage). */
export function frageText(frage) {
  return frage.typ === 'wahrfalsch' ? frage.aussage : frage.frage;
}

/** Knopf „Merken“ / „Gemerkt“. klein = nur Symbol (z. B. in Listen). */
export function merkKnopf(info, frage, { klein = false } = {}) {
  const schluessel = merkSchluessel(info, frage);
  const knopf = h('button', { type: 'button', class: `merk-knopf${klein ? ' klein' : ''}`, onclick: umschalten });

  function zeichnen() {
    const gemerkt = lernstand.istGemerkt(schluessel);
    const text = gemerkt ? 'Gemerkt' : 'Merken';
    knopf.setAttribute('aria-pressed', String(gemerkt));
    knopf.setAttribute('aria-label', gemerkt ? 'Von der Merkliste entfernen' : 'Auf die Merkliste setzen');
    knopf.title = gemerkt ? 'Gemerkt – noch einmal tippen zum Entfernen' : 'Auf die Merkliste setzen';
    knopf.replaceChildren(icon('merken'), klein ? '' : h('span', {}, text));
  }

  function umschalten(e) {
    e.stopPropagation();
    if (lernstand.istGemerkt(schluessel)) {
      lernstand.vergessen(schluessel);
    } else {
      lernstand.merken({
        schluessel,
        modul: info.modul,
        id: info.id,
        ...(info.erzeugt ? { frage: JSON.parse(JSON.stringify(frage)) } : {}),
      });
    }
    zeichnen();
  }

  zeichnen();
  return knopf;
}
