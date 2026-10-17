// Animationen in Kapiteln: ein Bild, das sich Schritt für Schritt aufbaut – mit kurzem Text zu jedem Schritt.
//
// Eine Animation steht in modules/<thema>/animationen.js:
//   { titel, schritte: [{ text, dauer }], bild(schritt, t) }
// bild() liefert für Schritt `schritt` (ab 0) und den Fortschritt t (0 bis 1) die SVG-Grafik als Text.
// Es ist eine reine Funktion – so lässt sich jede Animation mit node --test prüfen (tests/animationen.test.mjs).
// Eingebunden wird sie in inhalt.json mit { "typ": "animation", "id": "…", "unterschrift": "…" }.
//
// Die Animation startet, sobald sie ins Bild scrollt, und hält am Ende jedes Schritts kurz an.
// Wer in den Systemeinstellungen „Bewegung reduzieren“ gewählt hat, sieht ruhige Standbilder
// und blättert selbst weiter.

import { h, formatiert, abbildungKnoten } from './ui.js';
import { icon } from './icons.js';

const PAUSE = 1.6; // Sekunden Stillstand am Ende eines Schritts
const STANDARD_DAUER = 3.2;

export const wenigBewegung = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const reinText = (text) => String(text).replaceAll('**', '');

/** Der Abspieler mit Bühne, Schritt-Text und Bedienleiste. */
export function animationAbspieler(anim, { unterschrift } = {}) {
  const anzahl = anim.schritte.length;
  let schritt = 0;
  let zeit = 0; // Sekunden im aktuellen Schritt
  let laeuft = false;
  let amEnde = false;
  let letzte = null;
  let rahmen = null;
  let gestartet = false;
  let imBild = false;

  const dauer = (i) => anim.schritte[i].dauer ?? STANDARD_DAUER;
  const t = () => (wenigBewegung() ? 1 : Math.min(1, zeit / dauer(schritt)));

  const buehne = h('div', { class: 'animation-buehne abbildung-grafik', role: 'img' });
  const text = h('p', { class: 'animation-text', 'aria-live': 'polite' });
  const zaehler = h('span', { class: 'animation-zaehler' });
  const spielen = h('button', { type: 'button', class: 'animation-spielen', onclick: umschalten });
  const punkte = anim.schritte.map((s, i) => h('button', {
    type: 'button', class: 'animation-punkt', 'aria-label': `Schritt ${i + 1}: ${reinText(s.text)}`,
    onclick: () => springen(i),
  }, h('span', {})));
  const weiterKnopf = h('button', {
    type: 'button', class: 'animation-weiter', 'aria-label': 'Nächster Schritt',
    onclick: () => springen((schritt + 1) % anzahl),
  }, icon('weiter'));

  function zeichnen() {
    buehne.innerHTML = anim.bild(schritt, t());
  }

  function schrittZeigen() {
    const s = anim.schritte[schritt];
    text.replaceChildren(...formatiert(s.text));
    zaehler.textContent = `Schritt ${schritt + 1} von ${anzahl}`;
    buehne.setAttribute('aria-label', `${anim.titel}. Schritt ${schritt + 1} von ${anzahl}: ${reinText(s.text)}`);
    punkte.forEach((p, i) => {
      p.classList.toggle('erledigt', i < schritt);
      p.classList.toggle('aktuell', i === schritt);
      if (i === schritt) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current');
    });
  }

  function knopfZeigen() {
    const [symbol, label] = laeuft ? ['anhalten', 'Animation anhalten'] : amEnde ? ['nochmal', 'Animation noch einmal abspielen'] : ['abspielen', 'Animation abspielen'];
    spielen.replaceChildren(icon(symbol));
    spielen.setAttribute('aria-label', label);
  }

  function takt(jetzt) {
    rahmen = null;
    if (!laeuft || !buehne.isConnected) { letzte = null; return; }
    if (letzte !== null) zeit += Math.min(0.1, (jetzt - letzte) / 1000);
    letzte = jetzt;
    if (zeit >= dauer(schritt) + PAUSE) {
      if (schritt + 1 < anzahl) {
        schritt += 1;
        zeit = 0;
        schrittZeigen();
      } else {
        laeuft = false;
        amEnde = true;
        zeit = dauer(schritt);
        knopfZeigen();
      }
    }
    zeichnen();
    if (laeuft) rahmen = requestAnimationFrame(takt);
  }

  function starten() {
    if (amEnde) { schritt = 0; zeit = 0; amEnde = false; schrittZeigen(); }
    laeuft = true;
    gestartet = true;
    letzte = null;
    knopfZeigen();
    rahmen ??= requestAnimationFrame(takt);
  }

  function anhalten() {
    laeuft = false;
    knopfZeigen();
  }

  function umschalten() {
    if (laeuft) anhalten(); else starten();
  }

  /** Zu einem Schritt springen: Er wird von vorn abgespielt (bei reduzierter Bewegung als Standbild). */
  function springen(i) {
    schritt = i;
    zeit = 0;
    amEnde = false;
    schrittZeigen();
    if (wenigBewegung()) {
      zeit = dauer(i);
      zeichnen();
      return;
    }
    zeichnen();
    starten();
  }

  // Start, sobald die Animation zur Hälfte zu sehen ist; außerhalb des Bildes anhalten.
  if (typeof IntersectionObserver === 'function') {
    const beobachter = new IntersectionObserver((eintraege) => {
      for (const eintrag of eintraege) {
        imBild = eintrag.isIntersecting;
        if (!buehne.isConnected && gestartet) { beobachter.disconnect(); return; }
        if (imBild && !gestartet && !wenigBewegung()) starten();
        else if (!imBild && laeuft) { anhalten(); gestartet = false; }
      }
    }, { threshold: 0.5 });
    queueMicrotask(() => beobachter.observe(buehne));
  }

  if (wenigBewegung()) zeit = dauer(0);
  schrittZeigen();
  zeichnen();
  knopfZeigen();

  return h('figure', { class: 'animation', role: 'group', 'aria-label': `Animation: ${anim.titel}` },
    h('div', { class: 'animation-kopf' },
      h('span', { class: 'animation-marke' }, icon('animation'), 'Animation'),
      zaehler),
    buehne,
    text,
    h('div', { class: 'animation-leiste' },
      spielen,
      h('div', { class: 'animation-punkte' }, punkte),
      weiterKnopf),
    unterschrift && h('figcaption', {}, formatiert(unterschrift)),
  );
}

/** Für die Prüfansicht und zum Drucken: jeder Schritt als Standbild mit seinem Text. */
export function animationStandbilder(anim, unterschrift) {
  return h('div', { class: 'animation-standbilder' },
    h('p', { class: 'leise' }, `Animation „${anim.titel}“ in ${anim.schritte.length} Schritten:`),
    anim.schritte.map((s, i) => abbildungKnoten(anim.bild(i, 1), `${i + 1}. ${s.text}`)),
    unterschrift && h('p', { class: 'leise' }, formatiert(unterschrift)));
}
