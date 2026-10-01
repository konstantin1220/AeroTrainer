// Fragerunde: zeigt Fragen nacheinander, prüft die Antworten und gibt Rückmeldung.
// Falsch beantwortete Fragen kommen am Ende der Runde noch einmal dran.

import { h, formatiert, abbildungKnoten, ring } from './ui.js';
import { icon } from './icons.js';
import { bewerten, loesungText, zahlLesen } from './fragen.js';
import { zufall } from './zufall.js';
import { textMitBegriffen } from './lexikon.js';
import { merkKnopf } from './merkliste.js';

const LOB = ['Richtig!', 'Genau so.', 'Sauber gelöst.', 'Stimmt.', 'Sehr gut.'];
const BUCHSTABEN = 'ABCDEFGH';

// ---------- Eingabe je Fragetyp ----------
// Jede Funktion liefert { knoten, wert(), aufloesen(richtig) } und meldet über bereit(),
// ob schon geantwortet werden kann.

function auswahlEingabe(frage, bereit, mehrere) {
  const richtige = mehrere ? frage.richtig : [frage.richtig];
  let optionen = zufall.mischen([...richtige, ...frage.falsch]);
  // Reine Zahlenantworten sortieren – das liest sich leichter.
  if (optionen.every((o) => zahlLesen(o.split(' ')[0]) !== null)) {
    optionen = optionen.sort((a, b) => zahlLesen(a.split(' ')[0]) - zahlLesen(b.split(' ')[0]));
  }
  const gewaehlt = new Set();
  const knoepfe = optionen.map((text, i) => h('button', {
    type: 'button',
    class: `option ${mehrere ? 'option-mehrfach' : ''}`,
    'aria-pressed': 'false',
    onclick: () => waehlen(i),
  }, h('span', { class: 'option-marke', 'aria-hidden': 'true' }, mehrere ? icon('haken') : BUCHSTABEN[i]), h('span', { class: 'option-text' }, formatiert(text))));

  function waehlen(i) {
    const text = optionen[i];
    if (mehrere) {
      if (gewaehlt.has(text)) gewaehlt.delete(text); else gewaehlt.add(text);
    } else {
      gewaehlt.clear();
      gewaehlt.add(text);
    }
    knoepfe.forEach((k, j) => k.setAttribute('aria-pressed', String(gewaehlt.has(optionen[j]))));
    bereit(gewaehlt.size > 0);
  }

  return {
    knoten: h('div', { class: 'optionen', role: 'group' },
      mehrere && h('p', { class: 'hinweis-klein' }, 'Mehrere Antworten können richtig sein.'),
      knoepfe),
    wert: () => (mehrere ? [...gewaehlt] : [...gewaehlt][0]),
    tastatur: (taste) => {
      const i = Number(taste) - 1;
      if (i >= 0 && i < knoepfe.length && !knoepfe[i].disabled) waehlen(i);
    },
    aufloesen() {
      knoepfe.forEach((k, i) => {
        k.disabled = true;
        const text = optionen[i];
        if (richtige.includes(text)) k.classList.add('ist-richtig');
        else if (gewaehlt.has(text)) k.classList.add('ist-falsch');
      });
    },
  };
}

function wahrfalschEingabe(frage, bereit) {
  let gewaehlt = null;
  const knoepfe = [[true, 'Stimmt'], [false, 'Stimmt nicht']].map(([wert, text]) => h('button', {
    type: 'button',
    class: 'option option-wahrfalsch',
    'aria-pressed': 'false',
    onclick: () => waehlen(wert),
  }, h('span', { class: 'option-marke', 'aria-hidden': 'true' }, icon(wert ? 'haken' : 'kreuz')), h('span', { class: 'option-text' }, text)));

  function waehlen(wert) {
    gewaehlt = wert;
    knoepfe.forEach((k, i) => k.setAttribute('aria-pressed', String((i === 0) === wert)));
    bereit(true);
  }

  return {
    knoten: h('div', { class: 'optionen optionen-zwei', role: 'group' }, knoepfe),
    wert: () => gewaehlt,
    tastatur: (taste) => { if (taste === '1') waehlen(true); if (taste === '2') waehlen(false); },
    aufloesen() {
      knoepfe.forEach((k, i) => {
        k.disabled = true;
        const wert = i === 0;
        if (wert === frage.richtig) k.classList.add('ist-richtig');
        else if (wert === gewaehlt) k.classList.add('ist-falsch');
      });
    },
  };
}

function zahlEingabe(frage, bereit, absenden) {
  const feld = h('input', {
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    enterkeyhint: 'done',
    class: 'zahlfeld',
    'aria-label': 'Deine Antwort',
    placeholder: '?',
    oninput: () => bereit(zahlLesen(feld.value) !== null),
    onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); absenden(); } },
  });
  setTimeout(() => feld.focus({ preventScroll: true }), 50);
  return {
    knoten: h('label', { class: 'zahl-eingabe' }, feld, frage.einheit && h('span', { class: 'einheit' }, frage.einheit)),
    wert: () => feld.value,
    aufloesen(richtig) {
      feld.disabled = true;
      feld.classList.add(richtig ? 'ist-richtig' : 'ist-falsch');
    },
  };
}

function zuordnungEingabe(frage, bereit) {
  const rechts = zufall.mischen([...new Set(frage.paare.map((p) => p[1]))]);
  const auswahlen = frage.paare.map(([links]) => h('select', {
    class: 'zuordnung-auswahl',
    'aria-label': `Zuordnung für ${links}`,
    onchange: () => bereit(auswahlen.every((s) => s.value !== '')),
  }, h('option', { value: '' }, '– wählen –'), rechts.map((r) => h('option', { value: r }, r))));
  const zeilen = frage.paare.map(([links], i) => h('div', { class: 'zuordnung-zeile' },
    h('span', { class: 'zuordnung-links' }, formatiert(links)), auswahlen[i]));
  return {
    knoten: h('div', { class: 'zuordnung' }, zeilen),
    wert: () => auswahlen.map((s) => s.value),
    aufloesen() {
      auswahlen.forEach((s, i) => {
        s.disabled = true;
        const stimmt = s.value === frage.paare[i][1];
        zeilen[i].classList.add(stimmt ? 'ist-richtig' : 'ist-falsch');
        if (!stimmt) zeilen[i].append(h('span', { class: 'zuordnung-loesung' }, `richtig: ${frage.paare[i][1]}`));
      });
    },
  };
}

// ---------- Darstellung einer Frage ----------

export function frageKopf(frage, abbildung) {
  const text = frage.typ === 'wahrfalsch' ? frage.aussage : frage.frage;
  const teile = [];
  if (frage.typ === 'wahrfalsch') teile.push(h('p', { class: 'frage-vorspann' }, 'Stimmt diese Aussage?'));
  teile.push(h('h2', { class: 'frage-text' }, formatiert(text)));
  if (frage.code) teile.push(h('pre', { class: 'frage-code' }, frage.code));
  if (frage.gruppen) {
    // Zeichenfolge in Gruppen (z. B. ein METAR), markierte Gruppen hervorgehoben
    teile.push(h('div', { class: 'metar metar-anzeige' }, frage.gruppen.map((g) => h('span', {
      class: `gruppe${g.markiert ? ' markiert' : ''}`, 'data-typ': g.typ, 'data-trend': g.imTrend,
    }, g.text))));
  }
  if (frage.svg) teile.push(abbildungKnoten(frage.svg, frage.svgUnterschrift));
  if (frage.abbildung) {
    const bild = abbildung?.(frage.abbildung);
    if (bild) teile.push(bild);
  }
  if (frage.hinweis) teile.push(h('p', { class: 'hinweis-klein' }, formatiert(frage.hinweis)));
  return teile;
}

function eingabeFuer(frage, bereit, absenden) {
  switch (frage.typ) {
    case 'auswahl': return auswahlEingabe(frage, bereit, false);
    case 'mehrfach': return auswahlEingabe(frage, bereit, true);
    case 'wahrfalsch': return wahrfalschEingabe(frage, bereit);
    case 'zahl': return zahlEingabe(frage, bereit, absenden);
    case 'zuordnung': return zuordnungEingabe(frage, bereit);
    default: throw new Error(`Unbekannter Fragetyp: ${frage.typ}`);
  }
}

// ---------- Die Runde ----------

/**
 * Startet eine Fragerunde im Element el.
 *   aufgaben:  [{ id, erzeugen(), abbildung?(name), beantworten?(richtig), merken?: { modul, id, erzeugt } }]
 *   zurueck:   { href, text } – Ziel nach der Runde
 *   nochmal:   Funktion für „Noch eine Runde“ (optional)
 *   amEnde:    wird nach der letzten Frage mit { gesamt, erstRichtig } aufgerufen (optional)
 *   merkModul: Modul-ID für Aufgaben ohne eigene Merk-Angabe – sie werden als erzeugte Fragen gemerkt (optional)
 */
export function fragerunde(el, { aufgaben, zurueck, nochmal, amEnde, titel, vorspann, merkModul }) {
  const merkInfo = (aufgabe) => aufgabe.merken ?? (merkModul ? { modul: merkModul, id: String(aufgabe.id), erzeugt: true } : null);
  const schlange = aufgaben.map((a) => ({ aufgabe: a, frage: a.erzeugen(), wiederholung: false }));
  let position = 0;
  let erstRichtig = 0;
  const fehler = [];
  let tastenAktion = null;

  function tastenHandler(e) {
    if (!el.isConnected) { document.removeEventListener('keydown', tastenHandler); return; }
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.metaKey || e.ctrlKey) return;
    tastenAktion?.(e);
  }
  document.addEventListener('keydown', tastenHandler);

  function zeigen() {
    if (position >= schlange.length) return ende();
    const eintrag = schlange[position];
    const { frage, aufgabe } = eintrag;

    const pruefKnopf = h('button', { type: 'button', class: 'knopf gross breit', disabled: true, onclick: pruefen }, 'Prüfen');
    const fuss = h('div', { class: 'runde-fuss' }, pruefKnopf);
    const bereit = (ja) => { pruefKnopf.disabled = !ja; };
    const eingabe = eingabeFuer(frage, bereit, () => { if (!pruefKnopf.disabled) pruefen(); });

    function pruefen() {
      const richtig = bewerten(frage, eingabe.wert());
      eingabe.aufloesen(richtig);
      if (!eintrag.wiederholung) {
        if (richtig) erstRichtig++;
        else fehler.push(eintrag);
        aufgabe.beantworten?.(richtig);
        if (!richtig) schlange.push({ ...eintrag, wiederholung: true });
      }
      const weiter = h('button', { type: 'button', class: 'knopf gross breit', onclick: () => { position++; zeigen(); } },
        position + 1 >= schlange.length ? 'Auswertung' : 'Weiter');
      fuss.replaceChildren(h('div', { class: `rueckmeldung ${richtig ? 'rueckmeldung-richtig' : 'rueckmeldung-falsch'}`, role: 'status' },
        h('div', { class: 'rueckmeldung-kopf' },
          h('span', { class: 'rueckmeldung-symbol' }, icon(richtig ? 'haken' : 'kreuz')),
          h('strong', {}, richtig ? zufall.wahl(LOB) : 'Leider nicht richtig.'),
        ),
        !richtig && frage.typ !== 'auswahl' && frage.typ !== 'mehrfach' && frage.typ !== 'zuordnung'
          && h('p', { class: 'rueckmeldung-loesung' }, 'Richtig ist: ', h('strong', {}, loesungText(frage))),
        frage.erklaerung && h('p', { class: 'rueckmeldung-erklaerung' }, textMitBegriffen(frage.erklaerung)),
        !richtig && !eintrag.wiederholung && h('p', { class: 'hinweis-klein' }, 'Diese Frage kommt am Ende der Runde noch einmal.'),
        weiter,
      ));
      tastenAktion = (e) => { if (e.key === 'Enter') { e.preventDefault(); weiter.click(); } };
      weiter.focus({ preventScroll: true });
      fuss.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    tastenAktion = (e) => {
      if (e.key === 'Enter' && !pruefKnopf.disabled) { e.preventDefault(); pruefen(); }
      else eingabe.tastatur?.(e.key);
    };

    const anteil = position / schlange.length;
    el.replaceChildren(h('div', { class: 'runde' },
      h('div', { class: 'runde-kopf' },
        h('a', { class: 'runde-schliessen', href: zurueck.href, 'aria-label': 'Runde beenden' }, icon('kreuz')),
        h('span', { class: 'balken balken-runde' }, h('span', { style: { width: `${Math.round(anteil * 100)}%` } })),
        h('span', { class: 'runde-zaehler' }, `${Math.min(position + 1, schlange.length)}/${schlange.length}`),
      ),
      titel && h('p', { class: 'runde-titel' }, titel, eintrag.wiederholung ? ' · Wiederholung' : ''),
      !titel && eintrag.wiederholung && h('p', { class: 'runde-titel' }, 'Wiederholung'),
      vorspann && position === 0 && h('div', { class: 'runde-vorspann' }, vorspann),
      h('div', { class: 'frage-karte' },
        merkInfo(aufgabe) && h('div', { class: 'frage-werkzeuge' }, merkKnopf(merkInfo(aufgabe), frage)),
        frageKopf(frage, aufgabe.abbildung), eingabe.knoten),
      fuss,
    ));
    window.scrollTo(0, 0);
  }

  function ende() {
    tastenAktion = null;
    document.removeEventListener('keydown', tastenHandler);
    const gesamt = aufgaben.length;
    amEnde?.({ gesamt, erstRichtig });
    const anteil = gesamt ? erstRichtig / gesamt : 0;
    const urteil = anteil === 1 ? 'Alles richtig – stark!' : anteil >= 0.8 ? 'Sehr ordentlich!' : anteil >= 0.5 ? 'Gute Runde – dranbleiben!' : 'Übung macht den Piloten.';
    el.replaceChildren(h('div', { class: 'runde-ende' },
      ring(anteil, `${erstRichtig} von ${gesamt} richtig`, 'gross'),
      h('h1', {}, urteil),
      h('p', { class: 'einleitung' }, `${erstRichtig} von ${gesamt} Fragen beim ersten Versuch richtig.`),
      fehler.length > 0 && h('div', { class: 'karte fehlerliste' },
        h('h2', {}, 'Das solltest du dir noch einmal ansehen'),
        h('ul', {}, fehler.map(({ frage, aufgabe }) => h('li', {},
          h('span', { class: 'fehler-frage' }, formatiert(frage.typ === 'wahrfalsch' ? frage.aussage : frage.frage)),
          h('span', { class: 'fehler-loesung' }, icon('haken'), ' ', formatiert(loesungText(frage))),
          merkInfo(aufgabe) && merkKnopf(merkInfo(aufgabe), frage),
        ))),
      ),
      h('div', { class: 'knopfreihe zentriert' },
        nochmal && h('button', { type: 'button', class: 'knopf gross', onclick: nochmal }, icon('flugzeug'), 'Noch eine Runde'),
        h('a', { class: `knopf gross ${nochmal ? 'zweitrangig' : ''}`, href: zurueck.href }, zurueck.text),
      ),
    ));
    window.scrollTo(0, 0);
  }

  if (schlange.length === 0) return ende();
  zeigen();
}
