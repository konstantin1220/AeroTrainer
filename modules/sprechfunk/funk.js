// Funkgespräche üben: simulierte Gespräche mit Bodenfunkstellen im frei erfundenen
// Übungsgebiet – auf Deutsch (BZF II/BZF I) oder Englisch (BZF I).
// Szenarien stehen in content/funkgespraeche.json. Vier Stufen, vom Einfachen zum Schweren:
//   auswahl   – Stufe 1: die richtige Meldung aus mehreren auswählen
//   bausteine – Stufe 2: die Meldung aus fertigen Satzteilen zusammensetzen
//   woerter   – Stufe 3: die Meldung Wort für Wort zusammensetzen (mit Störwörtern)
//   frei      – Stufe 4: die Meldung selbst eintippen (tolerant geprüft, siehe funklogik.js)
// Ab 80 % beim ersten Versuch ohne Hilfe gilt eine Stufe als geschafft.

import { h, anhaengen, ladeJSON, brotkrumen, abbildungKnoten, ring, mehrzahl } from '../../js/ui.js';
import { icon } from '../../js/icons.js';
import { zufall } from '../../js/zufall.js';
import { umschalter } from '../../js/interaktiv.js';
import { einstellung, einstellungSetzen } from '../../js/storage.js';
import { tagText } from '../../js/srs.js';
import { textMitBegriffen } from '../../js/lexikon.js';
import { abbildungen } from './abbildungen.js';
import { sprechen } from './funkwerte.js';
import { szenarioWerte, fuellen, freitextPruefen, bausteine, einzelwoerter, reihenfolgePruefen, wortschatz, geruest } from './funklogik.js';

const THEMEN = [
  ['radio', 'Flugplätze ohne Flugverkehrsdienst (RADIO)'],
  ['kontrolliert', 'Flugplätze mit Flugverkehrskontrolle'],
  ['unterwegs', 'Unterwegs: FIS und RMZ'],
  ['notfall', 'Not- und Dringlichkeitsverkehr'],
];
const STUFEN = [
  { id: 'auswahl', name: 'Auswählen', symbol: 'stufeAuswahl', text: 'Du wählst die richtige Meldung aus mehreren aus – zum Kennenlernen.' },
  { id: 'bausteine', name: 'Große Bausteine', symbol: 'stufeBausteine', text: 'Du bringst fertige Satzteile in die richtige Reihenfolge. Ein paar falsche Teile sind dabei.' },
  { id: 'woerter', name: 'Kleine Bausteine', symbol: 'stufeWoerter', text: 'Du setzt die Meldung Wort für Wort zusammen. Ein paar Wörter gehören nicht dazu.' },
  { id: 'frei', name: 'Frei sprechen', symbol: 'stufeFrei', text: 'Du tippst die Meldung selbst ein – wie in der Prüfung. Groß/klein, Satzzeichen und kleine Tippfehler sind egal, Zahlen und Rufzeichen müssen stimmen.' },
];
const GESCHAFFT = 0.8;
const stufeNr = (id) => Math.max(0, STUFEN.findIndex((s) => s.id === id));
const aktuelleStufe = () => STUFEN[stufeNr(einstellung('funkModus', 'auswahl'))].id;

// ---------- Seiten ----------

function stand(ctx) {
  return ctx.stand().funk ?? {};
}

export async function funkSeite(el, [id], ctx) {
  const daten = await ladeJSON(new URL('content/funkgespraeche.json', import.meta.url));
  const szenario = daten.szenarien.find((s) => s.id === id);
  if (id && !szenario) throw new Error('Dieses Funkgespräch gibt es nicht.');
  if (szenario) return gespraech(el, szenario, ctx, wortschatz(daten.szenarien));
  return liste(el, daten.szenarien, ctx);
}

/** Vier Punkte: welche Stufen eines Gesprächs geschafft sind. */
function stufenPunkte(stufen = {}) {
  const geschafft = STUFEN.filter((s) => (stufen[s.id] ?? 0) >= GESCHAFFT).length;
  return h('span', { class: 'funk-punkte', role: 'img', 'aria-label': `${geschafft} von ${STUFEN.length} Stufen geschafft` },
    STUFEN.map((s, i) => h('span', { class: (stufen[s.id] ?? 0) >= GESCHAFFT ? 'voll' : s.id in stufen ? 'angefangen' : '', title: `Stufe ${i + 1}: ${s.name}` })));
}

/** Auswahl der Stufe als vier Kacheln mit eigenen Symbolen. */
function stufenWahl(wert, beiAenderung) {
  const knoepfe = STUFEN.map((s, i) => h('button', {
    type: 'button', role: 'radio', class: 'funk-stufe', 'aria-checked': String(s.id === wert),
    onclick: () => { knoepfe.forEach((k, j) => k.setAttribute('aria-checked', String(j === i))); beiAenderung(s.id); },
  }, icon(s.symbol), h('span', { class: 'funk-stufe-nr' }, `Stufe ${i + 1}`), h('strong', {}, s.name)));
  return h('div', { class: 'funk-stufen', role: 'radiogroup', 'aria-label': 'Stufe' }, knoepfe);
}

function liste(el, szenarien, ctx) {
  const ergebnisse = stand(ctx);
  let stufe = aktuelleStufe();
  const sprache = umschalter({
    name: 'Sprache', optionen: [['de', 'Deutsch (BZF II und BZF I)'], ['en', 'Englisch (BZF I)']],
    wert: einstellung('funkSprache', 'de'), beiAenderung: (w) => { einstellungSetzen('funkSprache', w); zeichnen(); },
  });
  const wahl = stufenWahl(stufe, (w) => { stufe = w; einstellungSetzen('funkModus', w); zeichnen(); });
  const stufenHinweis = h('p', { class: 'leise funk-stufen-text' });
  const leiter = h('p', { class: 'funk-leiter' });
  const gruppen = h('div');
  function zeichnen() {
    const nr = stufeNr(stufe);
    stufenHinweis.textContent = STUFEN[nr].text;
    const geschafft = szenarien.reduce((summe, s) => summe + STUFEN.filter((st) => (ergebnisse[`${s.id}-${sprache.wert}`]?.stufen?.[st.id] ?? 0) >= GESCHAFFT).length, 0);
    leiter.replaceChildren(icon('stufen'), h('span', {}, `Geschafft: ${geschafft} von ${szenarien.length * STUFEN.length} Stufen (${sprache.wert === 'en' ? 'Englisch' : 'Deutsch'}). Eine Stufe gilt ab ${GESCHAFFT * 100} % beim ersten Versuch ohne Hilfe als geschafft.`));
    gruppen.replaceChildren(...THEMEN.map(([thema, titel]) => {
      const auswahl = szenarien.filter((s) => s.thema === thema);
      if (!auswahl.length) return null;
      return h('section', {},
        h('h2', { class: 'abschnitt-titel' }, titel),
        h('ul', { class: 'stufenliste' }, auswahl.map((s) => {
          const e = ergebnisse[`${s.id}-${sprache.wert}`];
          const aufStufe = e?.stufen?.[stufe];
          return h('li', {}, h('a', { class: 'stufen-karte', href: ctx.link('funk', s.id), 'data-modul': ctx.modul.id },
            h('span', { class: 'stufen-nr', title: `Schwierigkeit ${s.stufe} von 3` }, '●'.repeat(s.stufe)),
            h('span', { class: 'stufen-text' },
              h('strong', {}, s.titel),
              h('span', {}, s.kurz),
              h('span', { class: 'stufen-stand' }, stufenPunkte(e?.stufen),
                aufStufe != null ? `Stufe ${nr + 1}: bestes Ergebnis ${Math.round(aufStufe * 100)} %` : e ? `Stufe ${nr + 1} noch nicht geübt` : 'noch nicht geübt'),
            ),
            icon('weiter')));
        })));
    }).filter(Boolean));
  }
  zeichnen();
  anhaengen(el,
    h('header', { class: 'seitenkopf' },
      brotkrumen(['Start', '#/'], [ctx.modul.titel, ctx.link()], ['Funkgespräche']),
      h('h1', {}, 'Funkgespräche üben'),
      h('p', { class: 'einleitung' }, 'Spiele komplette Funkgespräche durch – vom Erstanruf bis zur Landung. Rufzeichen, Piste, Wind, QNH und Squawk wechseln bei jedem Durchgang. Arbeite dich Stufe für Stufe hoch: vom Auswählen bis zum freien Sprechen.'),
    ),
    h('section', { class: 'karte' }, sprache.el,
      h('div', { class: 'umschalter' }, h('span', { class: 'umschalter-name' }, 'Stufe'), wahl),
      stufenHinweis, leiter),
    gruppen,
    h('p', { class: 'hinweis-klein' }, 'Alle Plätze, Frequenzen und Situationen sind frei erfunden (Übungsgebiet Mittelland). Die Sprechgruppen folgen der Bekanntmachung über die Sprechfunkverfahren (NfL 2024-1-3266) und den Richtlinien für den Flugfunk an Plätzen ohne Flugverkehrsdienst (NfL 2024-1-3240).'),
  );
}

function gespraech(el, szenario, ctx, woerter) {
  const sprache = einstellung('funkSprache', 'de') === 'en' ? 'en' : 'de';
  const modus = aktuelleStufe();
  const nr = stufeNr(modus);
  const werte = szenarioWerte(zufall, szenario)[sprache];
  const stationsName = werte.station;
  const verlauf = [];
  let position = 0;
  let duSchritte = 0;
  let ohneHilfe = 0;
  let mitTipp = 0;
  let gesprochen = Boolean(einstellung('funkGesprochen', false));

  const chat = h('ol', { class: 'funk-chat', 'aria-live': 'polite' });
  const bereich = h('div', { class: 'funk-aufgabe' });
  const anzeige = umschalter({
    name: 'Anzeige', optionen: [['text', 'Geschrieben'], ['gesprochen', 'Gesprochen']],
    wert: gesprochen ? 'gesprochen' : 'text', beiAenderung: (w) => { gesprochen = w === 'gesprochen'; einstellungSetzen('funkGesprochen', gesprochen); chatZeichnen(); },
  });

  const darstellen = (text, wer) => (gesprochen && wer !== 'info' ? sprechen(text, sprache) : text);
  const STATUS_ICON = { richtig: 'haken', hilfe: 'haken', falsch: 'kreuz' };

  function chatZeichnen() {
    chat.replaceChildren(...verlauf.map((b) => h('li', { class: `funk-blase funk-${b.wer}${b.status ? ` funk-${b.status}` : ''}` },
      b.wer !== 'info' && h('span', { class: 'funk-sprecher' }, b.wer === 'du' ? 'Du' : stationsName, b.status && icon(STATUS_ICON[b.status])),
      h('span', { class: 'funk-text', lang: b.wer === 'info' ? 'de' : sprache }, darstellen(b.text, b.wer)))));
  }

  function weiter() {
    while (position < szenario.schritte.length && szenario.schritte[position].wer !== 'du') {
      const s = szenario.schritte[position];
      verlauf.push(s.wer === 'info' ? { wer: 'info', text: s.text } : { wer: 'station', text: fuellen(s[sprache], werte) });
      position++;
    }
    chatZeichnen();
    if (position >= szenario.schritte.length) return ende();
    aufgabe(szenario.schritte[position]);
  }

  // ---------- Eingabe je Stufe: { knoten, pruefen, sperren, freigeben, markieren, tipp } ----------

  function auswahlFeld(richtig, falsch, pruefKnopf) {
    let gewaehlt = null;
    const optionen = zufall.mischen([richtig, ...falsch]);
    const weg = new Set();
    const knoepfe = optionen.map((text) => h('button', {
      type: 'button', class: 'option', 'aria-pressed': 'false', lang: sprache,
      onclick: () => { gewaehlt = text; knoepfe.forEach((k, i) => k.setAttribute('aria-pressed', String(optionen[i] === text))); pruefKnopf.disabled = false; },
    }, h('span', { class: 'option-text' }, darstellen(text, 'du'))));
    return {
      knoten: h('div', { class: 'optionen' }, knoepfe),
      pruefen: () => ({ ok: gewaehlt === richtig }),
      sperren: () => knoepfe.forEach((k, i) => {
        k.disabled = true;
        if (optionen[i] === richtig) k.classList.add('ist-richtig'); else if (optionen[i] === gewaehlt) k.classList.add('ist-falsch');
      }),
      // Tipp: eine falsche Meldung streichen (bis zwei übrig sind)
      tipp() {
        const kandidaten = optionen.filter((o) => o !== richtig && !weg.has(o));
        const raus = zufall.wahl(kandidaten.filter((o) => o !== gewaehlt).length ? kandidaten.filter((o) => o !== gewaehlt) : kandidaten);
        weg.add(raus);
        const k = knoepfe[optionen.indexOf(raus)];
        k.disabled = true;
        k.classList.add('ist-weg');
        if (gewaehlt === raus) { gewaehlt = null; k.setAttribute('aria-pressed', 'false'); pruefKnopf.disabled = true; }
        return kandidaten.length > 2;
      },
    };
  }

  function bausteinFeld({ teile, auswahl }, fein, pruefKnopf) {
    const gelegt = [];
    let marken = null;
    let gesperrt = false;
    const zeile = h('div', { class: `baustein-zeile${fein ? ' fein' : ''}`, 'aria-label': 'Deine Meldung' });
    const vorrat = h('div', { class: `baustein-vorrat${fein ? ' fein' : ''}` });
    const zeichnen = () => {
      zeile.replaceChildren(...(gelegt.length ? gelegt.map((b, i) => h('button', {
        type: 'button', lang: sprache, disabled: gesperrt,
        class: `baustein gelegt${marken ? (marken[i] ? ' ist-richtig' : ' ist-falsch') : ''}`,
        'aria-label': marken ? `${b.t} – ${marken[i] ? 'richtig' : 'falsch'}` : null,
        onclick: () => { gelegt.splice(i, 1); marken = null; zeichnen(); },
      }, b.t)) : [h('span', { class: 'leise' }, fein ? 'Tippe die Wörter in der richtigen Reihenfolge an.' : 'Tippe die Satzteile in der richtigen Reihenfolge an.')]));
      vorrat.replaceChildren(...auswahl.filter((b) => !gelegt.includes(b)).map((b) => h('button', {
        type: 'button', class: 'baustein', lang: sprache, disabled: gesperrt,
        onclick: () => { gelegt.push(b); marken = null; zeichnen(); },
      }, b.t)));
      pruefKnopf.disabled = gesperrt || gelegt.length === 0;
    };
    zeichnen();
    return {
      knoten: h('div', {}, zeile, vorrat, h('p', { class: 'hinweis-klein' }, fein
        ? 'Ein paar Wörter gehören nicht dazu. Antippen in der Zeile legt ein Wort zurück.'
        : 'Ein paar Satzteile gehören nicht dazu. Antippen in der Zeile legt einen Teil zurück.')),
      pruefen: () => reihenfolgePruefen(gelegt.map((b) => b.t), teile),
      sperren: () => { gesperrt = true; zeichnen(); },
      freigeben: () => { gesperrt = false; zeichnen(); },
      markieren: (ergebnis) => { marken = ergebnis.plaetze; zeichnen(); },
      // Tipp: alles bis zum ersten Fehler bleibt liegen, dann kommt der nächste richtige Baustein
      tipp() {
        let i = 0;
        while (i < gelegt.length && i < teile.length && gelegt[i].t.toLowerCase() === teile[i].toLowerCase()) i++;
        gelegt.splice(i);
        const naechster = auswahl.find((b) => !gelegt.includes(b) && b.t.toLowerCase() === teile[i]?.toLowerCase());
        if (naechster) gelegt.push(naechster);
        marken = null;
        zeichnen();
        return gelegt.length < teile.length;
      },
    };
  }

  function freiFeld(richtig, pflicht, regeln, pruefKnopf) {
    const geruestZeile = h('p', { class: 'funk-geruest', lang: sprache, hidden: true });
    const feld = h('textarea', {
      class: 'texteingabe funk-eingabe', rows: 3, lang: sprache, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'send',
      placeholder: sprache === 'en' ? 'Your transmission …' : 'Deine Meldung …', 'aria-label': 'Deine Meldung',
      oninput: () => { pruefKnopf.disabled = !feld.value.trim(); },
      onkeydown: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!pruefKnopf.disabled) pruefKnopf.click(); } },
    });
    return {
      knoten: h('div', {}, feld, geruestZeile,
        h('p', { class: 'hinweis-klein' }, 'Groß/klein, Satzzeichen und kleine Tippfehler sind egal. Zahlen und Rufzeichen müssen stimmen – als Ziffern oder gesprochen (z. B. „zwo sieben“, „Delta Echo …“).')),
      pruefen: () => freitextPruefen(feld.value, pflicht, woerter, regeln),
      sperren: () => { feld.disabled = true; },
      freigeben: () => { feld.disabled = false; feld.focus(); },
      // Tipp: das Gerüst der Meldung – von jedem Wort nur der erste Buchstabe, Ziffern als #
      tipp() {
        geruestZeile.replaceChildren(h('span', { class: 'funk-geruest-titel' }, icon('tipp'), 'Gerüst:'), geruest(richtig.replace(/\d/g, '#')));
        geruestZeile.hidden = false;
        return false;
      },
      fokus: () => feld.focus({ preventScroll: true }),
    };
  }

  /** Kurzübersicht bei freier Eingabe: Pflichtteile gefunden, mit Tippfehler oder fehlend; Teile, die nicht hineingehören; Reihenfolge. */
  //  verdeckt: beim ersten Fehlversuch nur das Gerüst der fehlenden Teile zeigen („R·······“, Zahlen als „##“)
  function pruefListe(ergebnis, regeln, verdeckt = false) {
    const fehlt = (teil) => (verdeckt ? geruest(teil.replace(/\d/g, '#')) : teil);
    return [
      h('ul', { class: 'funk-pruefliste' }, ergebnis.teile.map((t) => h('li', { class: `funk-teil funk-teil-${t.status}` },
        icon(t.status === 'fehlt' || t.status === 'tabu' ? 'kreuz' : 'haken'),
        h('span', { lang: sprache }, t.status === 'tabu' ? `„${t.du}“` : t.status === 'fehlt' ? fehlt(t.teil) : t.teil),
        t.status === 'tippfehler' && h('small', {}, ` (du: „${t.du}“)`),
        t.status === 'tabu' && h('small', {}, ' gehört nicht hinein')))),
      ergebnis.reihenfolgeFalsch && h('p', { class: 'funk-reihenfolge' }, 'Achte auf die Reihenfolge: ', h('strong', { lang: sprache }, regeln.reihenfolge.join(' → ')), '.'),
    ];
  }

  function aufgabe(schritt) {
    const richtig = fuellen(schritt[sprache], werte);
    const falsch = (schritt.falsch?.[sprache] ?? []).map((f) => fuellen(f, werte)).filter((f) => f !== richtig);
    const pflicht = (schritt.pflicht?.[sprache] ?? richtig.split(', ')).map((p) => fuellen(p, werte));
    const regeln = { tabu: (schritt.tabu?.[sprache] ?? []).map((t) => fuellen(t, werte)), reihenfolge: (schritt.reihenfolge ?? []).map((t) => fuellen(t, werte)) };
    const pruefKnopf = h('button', { type: 'button', class: 'knopf gross', disabled: true }, 'Prüfen');
    const tippKnopf = h('button', { type: 'button', class: 'knopf zweitrangig funk-tipp', title: 'Hilfe holen – die Meldung zählt dann nicht als „ohne Hilfe richtig“' }, icon('tipp'), 'Tipp');
    let versuch = 0;
    let tippGenutzt = false;

    const eingabe = modus === 'auswahl' ? auswahlFeld(richtig, falsch, pruefKnopf)
      : modus === 'frei' ? freiFeld(richtig, pflicht, regeln, pruefKnopf)
        : bausteinFeld(modus === 'woerter' ? einzelwoerter(richtig, falsch, zufall) : bausteine(richtig, falsch, zufall), modus === 'woerter', pruefKnopf);

    tippKnopf.onclick = () => {
      tippGenutzt = true;
      if (!eingabe.tipp()) tippKnopf.disabled = true;
    };
    const knopfReihe = () => h('div', { class: 'funk-knoepfe' }, tippKnopf, pruefKnopf);

    pruefKnopf.onclick = () => {
      const ergebnis = eingabe.pruefen();
      versuch++;
      eingabe.sperren();
      if (!ergebnis.ok && modus !== 'auswahl' && versuch === 1) return fastRichtig(ergebnis);
      abschliessen(ergebnis);
    };

    // Erster Fehlversuch (Stufe 2–4): zeigen, was nicht passt – und einen zweiten Anlauf anbieten
    function fastRichtig(ergebnis) {
      eingabe.markieren?.(ergebnis);
      const nochmal = h('button', { type: 'button', class: 'knopf gross', onclick: () => {
        eingabe.freigeben();
        fuss.replaceChildren(knopfReihe());
        pruefKnopf.disabled = false;
      } }, 'Nochmal versuchen');
      fuss.replaceChildren(h('div', { class: 'rueckmeldung rueckmeldung-fast', role: 'status' },
        h('div', { class: 'rueckmeldung-kopf' }, h('span', { class: 'rueckmeldung-symbol' }, icon('lampe')), h('strong', {}, 'Fast – schau noch mal hin.')),
        ergebnis.teile ? [pruefListe(ergebnis, regeln, true), h('p', { class: 'hinweis-klein' }, 'Mit ✗ markiert: fehlt noch oder gehört nicht hinein. Von fehlenden Teilen siehst du nur den ersten Buchstaben, Ziffern als #.')]
          : h('p', {}, [ergebnis.plaetze?.some((p) => !p) && 'Die rot markierten Teile stehen an der falschen Stelle oder gehören nicht dazu.',
            ergebnis.fehlen > 0 && ` Es ${ergebnis.fehlen === 1 ? 'fehlt noch ein Teil' : `fehlen noch ${ergebnis.fehlen} Teile`}.`].filter(Boolean).join('')),
        h('div', { class: 'knopfreihe' }, nochmal,
          h('button', { type: 'button', class: 'knopf gross zweitrangig', onclick: () => abschliessen(ergebnis) }, 'Lösung zeigen'))));
      nochmal.focus({ preventScroll: true });
      fuss.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function abschliessen(ergebnis) {
      const status = ergebnis.ok ? (versuch === 1 && !tippGenutzt ? 'richtig' : 'hilfe') : 'falsch';
      duSchritte++;
      if (status === 'richtig') ohneHilfe++;
      if (tippGenutzt) mitTipp++;
      ctx.gezaehlt?.(status === 'richtig');
      verlauf.push({ wer: 'du', text: richtig, status });
      position++;
      chatZeichnen();
      const kopf = { richtig: 'Richtig!', hilfe: tippGenutzt ? 'Richtig – mit Tipp.' : 'Richtig – im zweiten Anlauf.', falsch: 'Nicht ganz.' }[status];
      const weiterKnopf = h('button', { type: 'button', class: 'knopf gross breit', onclick: weiter }, position >= szenario.schritte.length ? 'Auswertung' : 'Weiter');
      fuss.replaceChildren(h('div', { class: `rueckmeldung ${ergebnis.ok ? 'rueckmeldung-richtig' : 'rueckmeldung-falsch'}`, role: 'status' },
        h('div', { class: 'rueckmeldung-kopf' }, h('span', { class: 'rueckmeldung-symbol' }, icon(ergebnis.ok ? 'haken' : 'kreuz')), h('strong', {}, kopf)),
        ergebnis.teile && pruefListe(ergebnis, regeln),
        ergebnis.tippfehler?.length > 0 && h('p', { class: 'hinweis-klein' }, 'Kleine Tippfehler zählen nicht als Fehler – im Funk kommt es aufs Gesprochene an.'),
        (!ergebnis.ok || modus === 'frei') && h('p', { class: 'rueckmeldung-loesung' }, ergebnis.ok ? 'Musterlösung: ' : 'So lautet die Meldung: ', h('strong', { lang: sprache }, darstellen(richtig, 'du'))),
        schritt.erklaerung && h('p', { class: 'rueckmeldung-erklaerung' }, textMitBegriffen(schritt.erklaerung)),
        weiterKnopf));
      weiterKnopf.focus({ preventScroll: true });
      fuss.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    const fuss = h('div', { class: 'runde-fuss' }, knopfReihe());
    bereich.replaceChildren(h('div', { class: 'frage-karte' },
      h('p', { class: 'frage-vorspann' }, 'Deine Meldung'),
      h('p', { class: 'frage-text' }, schritt.aufgabe),
      eingabe.knoten), fuss);
    bereich.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    eingabe.fokus?.();
  }

  function ende() {
    const anteil = duSchritte ? ohneHilfe / duSchritte : 0;
    let stufen = {};
    ctx.aktualisieren((s) => {
      s.funk ??= {};
      const schluessel = `${szenario.id}-${sprache}`;
      const alt = s.funk[schluessel] ?? { durchgaenge: 0, beste: 0 };
      stufen = { ...(alt.stufen ?? {}), [modus]: Math.max(alt.stufen?.[modus] ?? 0, anteil) };
      s.funk[schluessel] = { durchgaenge: alt.durchgaenge + 1, beste: Math.max(alt.beste, anteil), zuletzt: tagText(), stufen };
    });
    ctx.geaendert?.();
    const geschafft = anteil >= GESCHAFFT;
    const naechste = STUFEN[nr + 1];
    const leichter = STUFEN[nr - 1];
    const neuStarten = (stufe) => { if (stufe) einstellungSetzen('funkModus', stufe); el.replaceChildren(); gespraech(el, szenario, ctx, woerter); };
    const titel = geschafft
      ? (naechste ? `Stufe ${nr + 1} geschafft!` : anteil === 1 ? 'Frei gesprochen – ohne einen Fehler!' : 'Stufe 4 geschafft – frei gesprochen!')
      : anteil >= 0.5 ? 'Gut dabei – noch ein Durchgang?' : 'Übung macht den Piloten.';
    const zusatz = geschafft
      ? (naechste ? ` Bereit für Stufe ${nr + 2}: ${naechste.name}?` : ' So klingt das auch in der Prüfung.')
      : ` Ab ${GESCHAFFT * 100} % gilt die Stufe als geschafft.`;
    bereich.replaceChildren(h('div', { class: 'runde-ende' },
      ring(anteil, `${ohneHilfe} von ${duSchritte} ohne Hilfe richtig`, 'gross'),
      h('h2', {}, titel),
      h('p', { class: 'einleitung' }, `${ohneHilfe} von ${mehrzahl(duSchritte, 'Meldung', 'Meldungen')} beim ersten Versuch ohne Hilfe richtig${mitTipp ? ` (${mitTipp} mit Tipp)` : ''}.${zusatz} Oben steht das ganze Gespräch zum Nachlesen.`),
      h('p', { class: 'funk-leiter zentriert' }, stufenPunkte(stufen), `Stufe ${nr + 1} von ${STUFEN.length}: ${STUFEN[nr].name}`),
      h('div', { class: 'knopfreihe zentriert' },
        geschafft && naechste
          ? [h('button', { type: 'button', class: 'knopf gross', onclick: () => neuStarten(naechste.id) }, icon(naechste.symbol), `Weiter mit Stufe ${nr + 2}`),
            h('button', { type: 'button', class: 'knopf gross zweitrangig', onclick: () => neuStarten() }, icon('wuerfel'), 'Nochmal auf dieser Stufe')]
          : [h('button', { type: 'button', class: 'knopf gross', onclick: () => neuStarten() }, icon('wuerfel'), 'Nochmal mit neuen Werten'),
            anteil < 0.5 && leichter && h('button', { type: 'button', class: 'knopf gross zweitrangig', onclick: () => neuStarten(leichter.id) }, icon(leichter.symbol), `Eine Stufe leichter`)],
        h('a', { class: 'knopf gross zweitrangig', href: ctx.link('funk') }, 'Andere Situation'))));
  }

  const karte = szenario.karte && abbildungen[szenario.karte];
  anhaengen(el,
    h('header', { class: 'seitenkopf' },
      brotkrumen(['Start', '#/'], [ctx.modul.titel, ctx.link()], ['Funkgespräche', ctx.link('funk')], [szenario.titel]),
      h('h1', {}, szenario.titel),
    ),
    h('section', { class: 'karte funk-lage' },
      h('h2', {}, icon('karte'), 'Die Lage'),
      h('p', {}, fuellen(szenario.lage, werte)),
      h('p', { class: 'funk-chips' },
        h('span', { class: 'chip' }, icon('sprechblase'), `${stationsName} · ${werte.frequenz}`),
        h('span', { class: 'chip' }, sprache === 'en' ? 'Englisch' : 'Deutsch'),
        h('span', { class: 'chip' }, icon(STUFEN[nr].symbol), `Stufe ${nr + 1} · ${STUFEN[nr].name}`)),
      karte && h('details', { class: 'karten-legende' }, h('summary', {}, 'Karte anzeigen'), abbildungKnoten(karte(), 'Frei erfundene Übungskarte – nicht für die Navigation.')),
      anzeige.el,
    ),
    chat,
    bereich,
  );
  weiter();
}
