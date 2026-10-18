// Baukasten für Lernmodule mit Theorie und Fragen.
//
// Ein Modul besteht aus einer Inhaltsdatei (content/inhalt.json) mit Kapiteln.
// Jedes Kapitel hat Theorie-Blöcke und Fragen. Daraus entstehen automatisch:
//   #/<modul>                 Übersicht mit Lernstand und Kapiteln
//   #/<modul>/kapitel/<id>    Theorie eines Kapitels
//   #/<modul>/lernen          Lernrunde mit verteilter Wiederholung
//   #/<modul>/ueben/<id>      Fragen eines Kapitels üben
//   #/<modul>/pruefen         alle Inhalte zum Gegenlesen (für Fluglehrer)
//   #/<modul>/werkzeug/<id>   ein interaktives Element als eigene Seite
//
// Rechenaufgaben, die jedes Mal neu erzeugt werden, stehen in der Inhaltsdatei als
// { "id": "…", "typ": "generator", "generator": "<name>" } und werden im Modul-Code definiert.

import { h, anhaengen, formatiert, abbildungKnoten, brotkrumen, leerzustand, mehrzahl, stufenBalken, stufenLegende, stufenRing } from './ui.js';
import { icon, themenIcon } from './icons.js';
import { fragerunde, frageKopf } from './quiz.js';
import { merkKnopf } from './merkliste.js';
import { lernrunde, uebungsrunde, statistik, karteBewerten, istSicher } from './srs.js';
import { frageProblem, loesungText } from './fragen.js';
import { zufall } from './zufall.js';
import { textMitBegriffen } from './lexikon.js';
import { aktuelleStufe, stufenUmschalter } from './stufe.js';
import { passtZumSchein, scheinHinweis } from './schein.js';
import { animationAbspieler, animationStandbilder } from './animation.js';
import { einstellung } from './storage.js';

// ---------- Theorie-Blöcke ----------
// Das Erklär-Level (js/stufe.js) bestimmt, wie „Einfach erklärt“-Kästen erscheinen:
// Einsteiger offen, Standard aufklappbar, Kompakt ausgeblendet.

export function theorieBlock(block, abbildung, interaktiv = () => null, stufe = aktuelleStufe(), animation = () => null) {
  const text = textMitBegriffen;
  switch (block.typ) {
    case 'absatz': return h('p', {}, text(block.text));
    case 'zwischentitel': return h('h3', { class: 'theorie-zwischentitel' }, block.text);
    case 'liste': return h('ul', { class: 'theorie-liste' }, block.punkte.map((p) => h('li', {}, text(p))));
    case 'merke': return h('aside', { class: 'merke' }, h('span', { class: 'merke-symbol' }, icon('merken')), h('div', {}, h('strong', {}, block.titel ?? 'Merke'), h('p', {}, text(block.text))));
    case 'achtung': return h('aside', { class: 'merke achtung' }, h('span', { class: 'merke-symbol' }, icon('warnung')), h('div', {}, h('strong', {}, block.titel ?? 'Achtung'), h('p', {}, text(block.text))));
    case 'einfach': {
      if (stufe === 'kompakt') return null;
      const titel = block.titel ?? 'Einfach erklärt';
      if (stufe === 'standard') {
        return h('details', { class: 'einfach-box' }, h('summary', {}, icon('lampe'), titel), h('p', {}, text(block.text)));
      }
      return h('aside', { class: 'einfach-box offen' }, h('span', { class: 'einfach-symbol' }, icon('lampe')), h('div', {}, h('strong', {}, titel), h('p', {}, text(block.text))));
    }
    case 'formel': return h('div', { class: 'formel' }, block.titel && h('span', { class: 'formel-titel' }, block.titel), h('code', {}, block.text));
    case 'tabelle': {
      // Breite Tabellen werden auf schmalen Bildschirmen als gestapelte Karten gezeigt –
      // außer Zahlentabellen mit "kompakt": true (z. B. Navigationsflugplan), die eng gesetzt bleiben.
      const stapeln = !block.kompakt && (block.kopf?.length ?? 0) >= 4;
      return h('div', { class: 'tabelle-rahmen' }, h('table', { class: `tabelle ${stapeln ? 'stapeln' : ''} ${block.kompakt ? 'kompakt' : ''}` },
        block.kopf && h('thead', {}, h('tr', {}, block.kopf.map((k) => h('th', {}, formatiert(k))))),
        h('tbody', {}, block.zeilen.map((z) => h('tr', {}, z.map((zelle, i) => h('td', { 'data-label': block.kopf?.[i] }, formatiert(zelle)))))),
      ), block.unterschrift && h('p', { class: 'tabelle-unterschrift' }, formatiert(block.unterschrift)));
    }
    case 'abbildung': return abbildung(block.id, block.unterschrift) ?? h('p', { class: 'fehlerton' }, `Abbildung „${block.id}“ fehlt`);
    case 'interaktiv': return interaktiv(block.id) ?? h('p', { class: 'fehlerton' }, `Interaktives Element „${block.id}“ fehlt`);
    case 'animation': return animation(block.id, block.unterschrift) ?? h('p', { class: 'fehlerton' }, `Animation „${block.id}“ fehlt`);
    default: return h('p', { class: 'fehlerton' }, `Unbekannter Block „${block.typ}“`);
  }
}

export const THEORIE_BLOCKTYPEN = ['absatz', 'zwischentitel', 'liste', 'merke', 'achtung', 'einfach', 'formel', 'tabelle', 'abbildung', 'interaktiv', 'animation'];

/** Hilfen zu einem interaktiven Element: Anleitung, Farblegende und „Probier mal“-Aufgaben. */
export function interaktivHilfe(element, stufe = aktuelleStufe()) {
  const anleitung = element.anleitung && h('p', { class: 'interaktiv-anleitung' }, icon('info'), h('span', {}, element.anleitung));
  const legende = element.legende && h('ul', { class: 'legende', 'aria-label': 'Farben in der Grafik' },
    element.legende.map(([farbe, beschreibung]) => h('li', {}, h('span', { class: `legende-farbe farbe-${farbe}` }), beschreibung)));
  let probier = null;
  if (element.probier?.length && stufe !== 'kompakt') {
    const liste = h('ol', {}, element.probier.map((p) => h('li', {}, textMitBegriffen(p))));
    probier = stufe === 'einsteiger'
      ? h('div', { class: 'probier offen' }, h('strong', {}, icon('ueben'), 'Probier mal'), liste)
      : h('details', { class: 'probier' }, h('summary', {}, icon('ueben'), 'Probier mal'), liste);
  }
  return { anleitung, legende, probier };
}

/** Anleitung, Element, Legende (direkt unter der Grafik) und „Probier mal“ zusammensetzen. */
function interaktivInhalt(element) {
  const hilfe = interaktivHilfe(element);
  const knoten = element.erstellen();
  const grafik = knoten.querySelector?.('.buehne');
  if (hilfe.legende && grafik) grafik.after(hilfe.legende);
  return [hilfe.anleitung, knoten, !grafik && hilfe.legende, hilfe.probier];
}

// ---------- Modul-Baukasten ----------

export function lernmodul({
  generatoren = {},
  abbildungen = {},
  interaktiv = {},
  animationen = {},
  seiten = {},
  uebersichtZusatz = null,
  zusatzVorKapiteln = false,
  pruefZusatz = null,
  inhaltDatei = 'content/inhalt.json',
  rundenGroesse = 10,
} = {}) {
  let inhaltCache = null;

  function laden(ctx) {
    inhaltCache ??= ctx.inhalt(inhaltDatei)
      .then((daten) => {
        const aufgaben = new Map();
        for (const kapitel of daten.kapitel) {
          kapitel.ids = (kapitel.fragen ?? []).map((quelle) => {
            aufgaben.set(quelle.id, { id: quelle.id, kapitel: kapitel.id, quelle });
            return quelle.id;
          });
        }
        return { ...daten, aufgaben, alleIds: [...aufgaben.keys()] };
      })
      .catch((fehler) => { inhaltCache = null; throw fehler; });
    return inhaltCache;
  }

  function erzeugen(quelle) {
    if (quelle.typ !== 'generator') return quelle;
    const generator = generatoren[quelle.generator];
    if (!generator) throw new Error(`Rechenaufgabe „${quelle.generator}“ gibt es nicht.`);
    return { ...generator(zufall, quelle), id: quelle.id };
  }

  function abbildung(name, unterschrift) {
    const zeichnen = abbildungen[name];
    return zeichnen ? abbildungKnoten(zeichnen(), unterschrift) : null;
  }

  /** Interaktives Element eingebettet in die Theorie (mit Rahmen und Titel). */
  function interaktivEinbetten(id) {
    const element = interaktiv[id];
    if (!element) return null;
    return h('section', { class: 'interaktiv' },
      h('header', { class: 'interaktiv-kopf' },
        h('span', { class: 'interaktiv-symbol' }, icon(element.symbol ?? 'ueben')),
        h('div', {}, h('span', { class: 'interaktiv-marke' }, 'Zum Ausprobieren'), h('h3', {}, element.titel)),
      ),
      interaktivInhalt(element),
    );
  }

  /** Animation in der Theorie (js/animation.js); in der Prüfansicht als Standbilder. */
  const animationEinbetten = (id, unterschrift) => (animationen[id] ? animationAbspieler(animationen[id], { unterschrift }) : null);
  const animationStandbild = (id, unterschrift) => (animationen[id] ? animationStandbilder(animationen[id], unterschrift) : null);

  const karten = (ctx) => ctx.stand().karten ?? {};

  function aufgabe(ctx, id, daten) {
    const eintrag = daten.aufgaben.get(id);
    return {
      id,
      merken: { modul: ctx.modul.id, id, erzeugt: eintrag.quelle.typ === 'generator' },
      erzeugen: () => erzeugen(eintrag.quelle),
      abbildung: (name) => abbildung(name),
      beantworten: (richtig) => {
        ctx.aktualisieren((stand) => {
          stand.karten ??= {};
          stand.karten[id] = karteBewerten(stand.karten[id], richtig);
        });
        ctx.gezaehlt(richtig);
      },
    };
  }

  function runde(el, ctx, daten, ids, { titel, zurueck, neuZeichnen }) {
    fragerunde(el, {
      titel,
      aufgaben: ids.map((id) => aufgabe(ctx, id, daten)),
      zurueck,
      nochmal: neuZeichnen,
      amEnde: ctx.geaendert,
    });
  }

  const api = { laden, erzeugen, abbildung, runde, karten, aufgabe };

  // ---------- Seiten ----------

  function kopf(ctx, untertitel) {
    const { modul, fach } = ctx;
    return h('header', { class: 'modul-kopf', 'data-modul': modul.id },
      brotkrumen(['Start', '#/'], [modul.titel]),
      h('div', { class: 'modul-symbol' }, themenIcon(modul.id)),
      h('div', { class: 'modul-kopf-text' },
        fach && h('p', { class: 'seiten-marke' }, `Fach ${fach.nr} · ${fach.titel}`),
        h('h1', {}, modul.titel),
        untertitel && h('p', { class: 'einleitung' }, untertitel),
      ),
    );
  }

  /**
   * Die Kapitel als Lernpfad: Knoten mit Zustand (fertig, begonnen, neu) und ein hervorgehobenes
   * Kapitel zum Weitermachen – das zuletzt gelesene, sonst das erste, das noch nicht fertig ist.
   * Der Ring um den Knoten zeigt die vier Lernstufen der Fragen (fertig, fortgeschritten, angefangen, ungelernt).
   */
  function lernpfad(ctx, daten, kartenStand) {
    const liste = sichtbareKapitel(daten);
    const werte = liste.map((k) => statistik(kapitelIds(daten, k), kartenStand));
    const fertig = (s) => s.gesamt > 0 && s.fertig === s.gesamt;
    const begonnen = werte.some((s) => s.gesehen > 0);
    const zuletzt = einstellung('zuletzt');
    let aktuell = liste.findIndex((k) => zuletzt?.hash === ctx.link('kapitel', k.id));
    if (aktuell >= 0 && fertig(werte[aktuell])) aktuell = liste.findIndex((k, i) => i > aktuell && !fertig(werte[i]));
    if (aktuell < 0) aktuell = werte.findIndex((s) => !fertig(s));

    return h('ol', { class: 'lernpfad', 'aria-label': 'Kapitel dieses Themas' }, liste.map((kapitel, i) => {
      const s = werte[i];
      const zustand = fertig(s) ? 'fertig' : s.gesehen > 0 ? 'begonnen' : 'neu';
      const knoten = zustand === 'fertig'
        ? icon('haken')
        : h('span', { class: 'pfad-nr' }, i + 1);
      const prozent = (n) => `${s.gesamt ? Math.round((n / s.gesamt) * 100) : 0}%`;
      const stand = s.gesamt === 0 ? null
        : zustand === 'fertig' ? h('span', { class: 'pfad-stand' }, `Alle ${s.gesamt} Fragen fertig`)
          : zustand === 'begonnen' ? h('span', { class: 'pfad-stand mit-balken' }, stufenBalken(s, 'klein'), h('span', {}, `${Math.round(s.fortschritt * 100)} % gelernt`))
            : h('span', { class: 'pfad-stand' }, `${mehrzahl(s.gesamt, 'Frage', 'Fragen')} · neu`);
      return h('li', { class: `pfad-punkt ${zustand}${i === aktuell ? ' aktuell' : ''}` },
        h('span', {
          class: 'pfad-knoten', 'aria-hidden': 'true',
          style: { '--p1': prozent(s.fertig), '--p2': prozent(s.fertig + s.fortgeschritten), '--p3': prozent(s.fertig + s.fortgeschritten + s.angefangen) },
        }, knoten),
        h('a', { class: 'pfad-karte', href: ctx.link('kapitel', kapitel.id) },
          i === aktuell && h('span', { class: 'pfad-marke' }, begonnen ? 'Hier weitermachen' : 'Hier anfangen'),
          h('strong', { class: 'pfad-titel' }, `${i + 1}. ${kapitel.titel}`),
          zustand !== 'fertig' && kapitel.kurz && h('span', { class: 'kapitel-kurz' }, kapitel.kurz),
          scheinHinweis(kapitel) && h('span', { class: 'chip schein-chip' }, scheinHinweis(kapitel)),
          stand,
          i === aktuell && h('span', { class: 'pfad-los' }, 'Kapitel lesen', icon('weiter'))));
    }));
  }

  // ---------- Filter nach Schein (js/schein.js) ----------
  // Kapitel und Fragen mit "scheine" erscheinen nur, wenn sie zu den gewählten Scheinen passen.
  const sichtbareKapitel = (daten) => daten.kapitel.filter((k) => passtZumSchein(k));
  const kapitelIds = (daten, kapitel) => kapitel.ids.filter((id) => passtZumSchein(daten.aufgaben.get(id).quelle));
  const sichtbareIds = (daten) => sichtbareKapitel(daten).flatMap((k) => kapitelIds(daten, k));
  const sichtbareWerkzeuge = () => Object.entries(interaktiv).filter(([, element]) => passtZumSchein(element));

  function uebersicht(el, ctx, daten) {
    const kartenStand = karten(ctx);
    const s = statistik(sichtbareIds(daten), kartenStand);
    const lernbar = Math.min(rundenGroesse, s.faellig + Math.min(s.neu, 5));
    // Reihenfolge wie beim Lernen: erst die Kapitel, dann Übungen (z. B. Funkgespräche), dann die Werkzeuge.
    // Ist der Zusatz der eigentliche Einstieg (METAR-Lernstufen), steht er mit zusatzVorKapiteln vorn.
    const kapitelAbschnitt = h('section', {},
      h('h2', { class: 'abschnitt-titel' }, icon('theorie'), 'Kapitel'),
      lernpfad(ctx, daten, kartenStand));
    const zusatz = uebersichtZusatz?.(ctx, api, daten);
    const abschnitte = [
      ...(zusatzVorKapiteln ? [zusatz, kapitelAbschnitt] : [kapitelAbschnitt, zusatz]),
      sichtbareWerkzeuge().length > 0 && h('section', {},
        h('h2', { class: 'abschnitt-titel' }, icon('ueben'), 'Zum Ausprobieren'),
        h('ul', { class: 'werkzeugliste' }, sichtbareWerkzeuge().map(([id, element]) => h('li', {},
          h('a', { class: 'werkzeug-karte', href: ctx.link('werkzeug', id), 'data-modul': ctx.modul.id },
            h('span', { class: 'werkzeug-symbol' }, icon(element.symbol ?? 'ueben')),
            h('span', { class: 'werkzeug-text' }, h('strong', {}, element.titel), h('span', {}, element.kurz)),
            icon('weiter'),
          )))),
      ),
    ].filter(Boolean);

    anhaengen(el,
      kopf(ctx, daten.einleitung ?? ctx.modul.beschreibung),
      h('section', { class: 'karte lernkarte', 'data-modul': ctx.modul.id },
        stufenRing(s),
        h('div', { class: 'lernkarte-text' },
          h('strong', {}, s.gesehen ? `${Math.round(s.fortschritt * 100)} % gelernt` : 'Noch nicht begonnen'),
          stufenLegende(s),
          s.faellig > 0 && h('span', { class: 'leise' }, `${mehrzahl(s.faellig, 'Frage ist', 'Fragen sind')} heute fällig`),
        ),
        lernbar > 0
          ? h('a', { class: 'knopf gross', href: ctx.link('lernen') }, icon('flugzeug'), 'Lernrunde starten')
          : h('a', { class: 'knopf gross zweitrangig', href: ctx.link('lernen') }, icon('ueben'), 'Frei üben'),
      ),
      sprungleiste(abschnitte),
      abschnitte,
      h('p', { class: 'pruef-hinweis' }, icon('lexikon'), h('a', { href: `#/quellen/${ctx.modul.id}` }, 'Quellen und Grundlagen dieses Themas')),
      h('p', { class: 'pruef-hinweis' }, icon('pruefen'), h('a', { href: ctx.link('pruefen') }, 'Alle Inhalte zum Gegenlesen anzeigen'), ' (für Fluglehrer)'),
    );
  }

  /** Kleine Leiste mit den Abschnitten der Themenseite – ab zwei Abschnitten. Knöpfe statt Links, weil # die Seite wechselt. */
  function sprungleiste(abschnitte) {
    if (abschnitte.length < 2) return null;
    return h('nav', { class: 'sprungleiste', 'aria-label': 'Abschnitte dieser Seite' }, abschnitte.map((abschnitt) => {
      const titel = abschnitt.querySelector('h2');
      if (!titel) return null;
      return h('button', { type: 'button', class: 'chip sprung', onclick: () => abschnitt.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
        titel.querySelector('.ico')?.cloneNode(true), titel.textContent);
    }));
  }

  function kapitelSeite(el, ctx, daten, kapitelId) {
    const kapitel = daten.kapitel.find((k) => k.id === kapitelId);
    if (!kapitel) throw new Error('Dieses Kapitel gibt es nicht.');
    // Nummer und Blättern unter den Kapiteln, die zum gewählten Schein passen
    const liste = passtZumSchein(kapitel) ? sichtbareKapitel(daten) : daten.kapitel;
    const index = liste.indexOf(kapitel);
    const vorher = liste[index - 1];
    const nachher = liste[index + 1];
    const ids = kapitelIds(daten, kapitel);
    const stufe = aktuelleStufe();
    const theorie = h('article', { class: 'theorie' }, (kapitel.theorie ?? []).map((block) => theorieBlock(block, abbildung, interaktivEinbetten, stufe, animationEinbetten)));
    const kern = kapitel.kern?.length > 0 && h('section', { class: 'kern' },
      h('h2', {}, stufe === 'kompakt' ? 'Das Wichtigste' : 'Das Wichtigste in Kürze'),
      h('ul', {}, kapitel.kern.map((punkt) => h('li', {}, icon('haken'), h('span', {}, textMitBegriffen(punkt))))));
    const position = `Kapitel ${index + 1} von ${liste.length}`;
    const blaetterLink = (ziel, richtung) => h('a', { class: `blaettern-link ${richtung}`, href: ctx.link('kapitel', ziel.id) },
      h('span', { class: 'leise' }, richtung === 'zurueck' ? '‹ Vorheriges' : 'Nächstes ›'), h('strong', {}, ziel.titel));
    anhaengen(el,
      h('header', { class: 'seitenkopf', 'data-modul': ctx.modul.id },
        brotkrumen(['Start', '#/'], [ctx.modul.titel, ctx.link()], [position]),
        h('p', { class: 'seiten-marke' }, position),
        h('h1', {}, kapitel.titel),
        kapitel.kurz && h('p', { class: 'einleitung' }, kapitel.kurz),
        scheinHinweis(kapitel) && h('p', {}, h('span', { class: 'chip schein-chip' }, scheinHinweis(kapitel))),
        stufenUmschalter({ kompakt: true }),
      ),
      // Kompakt: erst das Wichtigste, die ausführliche Erklärung aufklappbar.
      stufe === 'kompakt' && kern
        ? [kern, h('details', { class: 'theorie-ausfuehrlich' }, h('summary', {}, icon('theorie'), 'Ausführliche Erklärung lesen'), theorie)]
        : [theorie, kern],
      ids.length > 0 && h('div', { class: 'karte kapitel-aktion', 'data-modul': ctx.modul.id },
        h('div', {}, h('strong', {}, 'Verstanden?'), h('p', {}, `Teste dich mit ${mehrzahl(ids.length, 'Frage', 'Fragen')} zu diesem Kapitel.`)),
        h('a', { class: 'knopf gross', href: ctx.link('ueben', kapitel.id) }, icon('ueben'), 'Fragen üben'),
      ),
      h('nav', { class: 'blaettern', 'aria-label': 'Kapitel blättern' },
        vorher ? blaetterLink(vorher, 'zurueck') : h('span'),
        nachher ? blaetterLink(nachher, 'vor')
          : h('a', { class: 'blaettern-link vor', href: ctx.link() }, h('span', { class: 'leise' }, 'Geschafft ›'), h('strong', {}, 'Zur Übersicht')),
      ),
    );
  }

  function lernenSeite(el, ctx, daten) {
    const neuZeichnen = () => { el.replaceChildren(); lernenSeite(el, ctx, daten); };
    let ids = lernrunde(sichtbareIds(daten), karten(ctx), { anzahl: rundenGroesse });
    let titel = 'Lernrunde';
    if (ids.length === 0) {
      ids = uebungsrunde(sichtbareIds(daten), karten(ctx), { anzahl: rundenGroesse });
      titel = 'Freies Üben';
    }
    runde(el, ctx, daten, ids, { titel, zurueck: { href: ctx.link(), text: 'Zur Übersicht' }, neuZeichnen });
  }

  function uebenSeite(el, ctx, daten, kapitelId) {
    const kapitel = daten.kapitel.find((k) => k.id === kapitelId);
    if (!kapitel) throw new Error('Dieses Kapitel gibt es nicht.');
    const neuZeichnen = () => { el.replaceChildren(); uebenSeite(el, ctx, daten, kapitelId); };
    const passend = kapitelIds(daten, kapitel);
    const ids = uebungsrunde(passend, karten(ctx), { anzahl: Math.min(12, passend.length) });
    runde(el, ctx, daten, ids, { titel: kapitel.titel, zurueck: { href: ctx.link('kapitel', kapitel.id), text: 'Zurück zum Kapitel' }, neuZeichnen });
  }

  function werkzeugSeite(el, ctx, id) {
    const element = interaktiv[id];
    if (!element) throw new Error('Dieses Werkzeug gibt es nicht.');
    anhaengen(el,
      h('header', { class: 'seitenkopf' },
        brotkrumen(['Start', '#/'], [ctx.modul.titel, ctx.link()], ['Zum Ausprobieren']),
        h('h1', {}, element.titel),
        element.kurz && h('p', { class: 'einleitung' }, element.kurz),
      ),
      h('section', { class: 'interaktiv interaktiv-seite' }, interaktivInhalt(element)),
    );
  }

  function pruefSeite(el, ctx, daten) {
    let anzahlFragen = 0;
    const probleme = [];
    const kapitelKnoten = daten.kapitel.map((kapitel, i) => {
      const fragen = (kapitel.fragen ?? []).map((quelle) => {
        anzahlFragen++;
        if (quelle.typ === 'generator') {
          const beispiele = [0, 1, 2].map(() => erzeugen(quelle));
          return h('div', { class: 'pruef-frage' },
            h('p', { class: 'pruef-meta' }, `${quelle.id} · Rechenaufgabe „${quelle.generator}“ – wird jedes Mal neu erzeugt. Drei Beispiele:`),
            beispiele.map((frage) => {
              const problem = frageProblem(frage);
              if (problem) probleme.push(`${quelle.id}: ${problem}`);
              return h('div', { class: 'pruef-beispiel' },
                h('div', { class: 'frage-werkzeuge' }, merkKnopf({ modul: ctx.modul.id, id: quelle.id, erzeugt: true }, frage)),
                frageKopf(frage, (n) => abbildung(n)), loesungsBlock(frage), problem && h('p', { class: 'fehlerton' }, problem));
            }),
          );
        }
        const problem = frageProblem(quelle);
        if (problem) probleme.push(`${quelle.id}: ${problem}`);
        return h('div', { class: 'pruef-frage' },
          h('div', { class: 'pruef-meta-zeile' }, h('p', { class: 'pruef-meta' }, `${quelle.id} · ${quelle.typ}${scheinHinweis(quelle) ? ` · ${scheinHinweis(quelle)}` : ''}`), merkKnopf({ modul: ctx.modul.id, id: quelle.id, erzeugt: false }, quelle)),
          frageKopf(quelle, (n) => abbildung(n)),
          loesungsBlock(quelle),
          problem && h('p', { class: 'fehlerton' }, problem),
        );
      });
      return h('section', { class: 'pruef-kapitel' },
        h('h2', {}, `${i + 1}. ${kapitel.titel}`, scheinHinweis(kapitel) && h('span', { class: 'chip schein-chip' }, scheinHinweis(kapitel))),
        h('details', { class: 'pruef-theorie' }, h('summary', {}, 'Theorie anzeigen'),
          h('div', { class: 'theorie' }, (kapitel.theorie ?? []).map((block) => (block.typ === 'interaktiv'
            ? h('p', { class: 'leise' }, `[Interaktives Element: ${interaktiv[block.id]?.titel ?? block.id}]`)
            : theorieBlock(block, abbildung, undefined, 'einsteiger', animationStandbild))),
          kapitel.kern?.length > 0 && h('section', { class: 'kern' }, h('h2', {}, 'Das Wichtigste'), h('ul', {}, kapitel.kern.map((p) => h('li', {}, formatiert(p))))))),
        h('h3', {}, `Fragen (${kapitel.fragen?.length ?? 0})`),
        fragen,
      );
    });

    anhaengen(el,
      h('header', { class: 'seitenkopf' },
        brotkrumen(['Start', '#/'], [ctx.modul.titel, ctx.link()], ['Inhalte prüfen']),
        h('h1', {}, 'Inhalte prüfen'),
        h('p', { class: 'einleitung' }, `Alle Inhalte des Moduls „${ctx.modul.titel}“ zum Gegenlesen. `
          + `Die Texte stehen in der Datei modules/${ctx.modul.id}/${inhaltDatei}. `
          + 'Rechenaufgaben werden vom Programm erzeugt; hier stehen je drei Beispiele.'),
      ),
      h('div', { class: `karte ${daten._geprueft ? 'erfolg' : 'wichtig'}` },
        h('p', {}, h('strong', {}, daten._geprueft ? `Fachlich geprüft: ${daten._geprueft}` : 'Noch nicht fachlich geprüft.'),
          ` ${daten.kapitel.length} Kapitel, ${anzahlFragen} Fragen.`),
        probleme.length > 0 && h('ul', { class: 'fehlerton' }, probleme.map((p) => h('li', {}, p))),
      ),
      kapitelKnoten,
      pruefZusatz?.(ctx, api, daten),
    );
  }

  return {
    api,

    async anzeigen(el, [teil, ...rest], ctx) {
      const daten = await laden(ctx);
      if (!teil) return uebersicht(el, ctx, daten);
      if (teil === 'kapitel') return kapitelSeite(el, ctx, daten, rest[0]);
      if (teil === 'lernen') return lernenSeite(el, ctx, daten);
      if (teil === 'ueben') return uebenSeite(el, ctx, daten, rest[0]);
      if (teil === 'pruefen') return pruefSeite(el, ctx, daten);
      if (teil === 'werkzeug') return werkzeugSeite(el, ctx, rest[0]);
      if (seiten[teil]) return seiten[teil](el, rest, ctx, api, daten);
      throw new Error('Diese Seite gibt es nicht.');
    },

    async fortschritt(ctx) {
      const daten = await laden(ctx);
      const s = statistik(sichtbareIds(daten), karten(ctx));
      return { ...s, anteil: s.fortschritt };
    },

    /** Alle Aufgaben des Moduls – für die modulübergreifende Wiederholung. */
    async aufgaben(ctx) {
      const daten = await laden(ctx);
      const stand = karten(ctx);
      return sichtbareIds(daten).map((id) => ({ ...aufgabe(ctx, id, daten), karte: stand[id] }));
    },
  };
}

function loesungsBlock(frage) {
  const zeilen = [];
  if (frage.typ === 'auswahl') {
    zeilen.push(h('li', { class: 'pruef-richtig' }, icon('haken'), formatiert(frage.richtig)));
    frage.falsch.forEach((f) => zeilen.push(h('li', { class: 'pruef-falsch' }, icon('kreuz'), formatiert(f))));
  } else if (frage.typ === 'mehrfach') {
    frage.richtig.forEach((r) => zeilen.push(h('li', { class: 'pruef-richtig' }, icon('haken'), formatiert(r))));
    frage.falsch.forEach((f) => zeilen.push(h('li', { class: 'pruef-falsch' }, icon('kreuz'), formatiert(f))));
  } else {
    zeilen.push(h('li', { class: 'pruef-richtig' }, icon('haken'), formatiert(loesungText(frage))));
  }
  return h('div', {},
    h('ul', { class: 'pruef-antworten' }, zeilen),
    frage.rechenweg && h('ol', { class: 'pruef-rechenweg', 'aria-label': 'Rechenweg' }, frage.rechenweg.map((s) => h('li', {}, formatiert(s)))),
    frage.erklaerung && h('p', { class: 'pruef-erklaerung' }, formatiert(frage.erklaerung)),
  );
}

export { istSicher };
