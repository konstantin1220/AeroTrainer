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

import { h, anhaengen, formatiert, ring, balken, abbildungKnoten, brotkrumen, leerzustand, mehrzahl } from './ui.js';
import { icon, themenIcon } from './icons.js';
import { fragerunde, frageKopf } from './quiz.js';
import { lernrunde, uebungsrunde, statistik, karteBewerten, istSicher } from './srs.js';
import { frageProblem, loesungText } from './fragen.js';
import { zufall } from './zufall.js';
import { textMitBegriffen } from './lexikon.js';
import { aktuelleStufe, stufenUmschalter } from './stufe.js';

// ---------- Theorie-Blöcke ----------
// Das Erklär-Level (js/stufe.js) bestimmt, wie „Einfach erklärt“-Kästen erscheinen:
// Einsteiger offen, Standard aufklappbar, Kompakt ausgeblendet.

export function theorieBlock(block, abbildung, interaktiv = () => null, stufe = aktuelleStufe()) {
  const text = textMitBegriffen;
  switch (block.typ) {
    case 'absatz': return h('p', {}, text(block.text));
    case 'zwischentitel': return h('h3', { class: 'theorie-zwischentitel' }, block.text);
    case 'liste': return h('ul', { class: 'theorie-liste' }, block.punkte.map((p) => h('li', {}, text(p))));
    case 'merke': return h('aside', { class: 'merke' }, h('span', { class: 'merke-symbol' }, icon('lampe')), h('div', {}, h('strong', {}, block.titel ?? 'Merke'), h('p', {}, text(block.text))));
    case 'achtung': return h('aside', { class: 'merke achtung' }, h('span', { class: 'merke-symbol' }, icon('warnung')), h('div', {}, h('strong', {}, block.titel ?? 'Achtung'), h('p', {}, text(block.text))));
    case 'einfach': {
      if (stufe === 'kompakt') return null;
      const titel = block.titel ?? 'Einfach erklärt';
      if (stufe === 'standard') {
        return h('details', { class: 'einfach-box' }, h('summary', {}, icon('sprechblase'), titel), h('p', {}, text(block.text)));
      }
      return h('aside', { class: 'einfach-box offen' }, h('span', { class: 'einfach-symbol' }, icon('sprechblase')), h('div', {}, h('strong', {}, titel), h('p', {}, text(block.text))));
    }
    case 'formel': return h('div', { class: 'formel' }, block.titel && h('span', { class: 'formel-titel' }, block.titel), h('code', {}, block.text));
    case 'tabelle': {
      // Breite Tabellen werden auf schmalen Bildschirmen als gestapelte Karten gezeigt.
      const stapeln = (block.kopf?.length ?? 0) >= 4;
      return h('div', { class: 'tabelle-rahmen' }, h('table', { class: `tabelle ${stapeln ? 'stapeln' : ''}` },
        block.kopf && h('thead', {}, h('tr', {}, block.kopf.map((k) => h('th', {}, formatiert(k))))),
        h('tbody', {}, block.zeilen.map((z) => h('tr', {}, z.map((zelle, i) => h('td', { 'data-label': block.kopf?.[i] }, formatiert(zelle)))))),
      ), block.unterschrift && h('p', { class: 'tabelle-unterschrift' }, formatiert(block.unterschrift)));
    }
    case 'abbildung': return abbildung(block.id, block.unterschrift) ?? h('p', { class: 'fehlerton' }, `Abbildung „${block.id}“ fehlt`);
    case 'interaktiv': return interaktiv(block.id) ?? h('p', { class: 'fehlerton' }, `Interaktives Element „${block.id}“ fehlt`);
    default: return h('p', { class: 'fehlerton' }, `Unbekannter Block „${block.typ}“`);
  }
}

export const THEORIE_BLOCKTYPEN = ['absatz', 'zwischentitel', 'liste', 'merke', 'achtung', 'einfach', 'formel', 'tabelle', 'abbildung', 'interaktiv'];

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
  seiten = {},
  uebersichtZusatz = null,
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

  const karten = (ctx) => ctx.stand().karten ?? {};

  function aufgabe(ctx, id, daten) {
    const eintrag = daten.aufgaben.get(id);
    return {
      id,
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
    const { modul } = ctx;
    return h('header', { class: 'modul-kopf', 'data-modul': modul.id },
      h('div', { class: 'modul-symbol' }, themenIcon(modul.id)),
      h('div', { class: 'modul-kopf-text' },
        brotkrumen(['Start', '#/'], [modul.titel]),
        h('h1', {}, modul.titel),
        untertitel && h('p', { class: 'einleitung' }, untertitel),
      ),
    );
  }

  function uebersicht(el, ctx, daten) {
    const kartenStand = karten(ctx);
    const s = statistik(daten.alleIds, kartenStand);
    const lernbar = Math.min(rundenGroesse, s.faellig + Math.min(s.neu, 5));
    const kapitelListe = daten.kapitel.map((kapitel, i) => {
      const ks = statistik(kapitel.ids, kartenStand);
      return h('li', {}, h('a', { class: 'kapitel-karte', href: ctx.link('kapitel', kapitel.id) },
        h('span', { class: 'kapitel-nr' }, i + 1),
        h('span', { class: 'kapitel-text' },
          h('strong', {}, kapitel.titel),
          kapitel.kurz && h('span', { class: 'kapitel-kurz' }, kapitel.kurz),
          ks.gesamt > 0 && h('span', { class: 'kapitel-stand' },
            balken(ks.gesamt ? ks.sicher / ks.gesamt : 0),
            h('span', {}, `${ks.sicher}/${ks.gesamt} sicher`)),
        ),
        icon('weiter'),
      ));
    });

    anhaengen(el,
      kopf(ctx, daten.einleitung ?? ctx.modul.beschreibung),
      h('section', { class: 'karte lernkarte', 'data-modul': ctx.modul.id },
        ring(s.gesamt ? s.sicher / s.gesamt : 0, `${s.sicher} von ${s.gesamt} Fragen sicher`),
        h('div', { class: 'lernkarte-text' },
          h('strong', {}, `${s.sicher} von ${s.gesamt} Fragen sicher`),
          h('span', { class: 'leise' }, `${s.faellig} fällig · ${s.neu} neu`),
        ),
        lernbar > 0
          ? h('a', { class: 'knopf gross', href: ctx.link('lernen') }, icon('flugzeug'), 'Lernrunde')
          : h('a', { class: 'knopf gross zweitrangig', href: ctx.link('lernen') }, icon('ueben'), 'Frei üben'),
      ),
      uebersichtZusatz?.(ctx, api, daten),
      Object.keys(interaktiv).length > 0 && h('section', {},
        h('h2', { class: 'abschnitt-titel' }, icon('ueben'), 'Zum Ausprobieren'),
        h('ul', { class: 'werkzeugliste' }, Object.entries(interaktiv).map(([id, element]) => h('li', {},
          h('a', { class: 'werkzeug-karte', href: ctx.link('werkzeug', id), 'data-modul': ctx.modul.id },
            h('span', { class: 'werkzeug-symbol' }, icon(element.symbol ?? 'ueben')),
            h('span', { class: 'werkzeug-text' }, h('strong', {}, element.titel), h('span', {}, element.kurz)),
            icon('weiter'),
          )))),
      ),
      h('h2', { class: 'abschnitt-titel' }, icon('theorie'), 'Kapitel'),
      h('ol', { class: 'kapitelliste' }, kapitelListe),
      h('p', { class: 'pruef-hinweis' }, icon('lexikon'), h('a', { href: `#/quellen/${ctx.modul.id}` }, 'Quellen und Grundlagen dieses Themas')),
      h('p', { class: 'pruef-hinweis' }, icon('pruefen'), h('a', { href: ctx.link('pruefen') }, 'Alle Inhalte zum Gegenlesen anzeigen'), ' (für Fluglehrer)'),
    );
  }

  function kapitelSeite(el, ctx, daten, kapitelId) {
    const index = daten.kapitel.findIndex((k) => k.id === kapitelId);
    if (index < 0) throw new Error('Dieses Kapitel gibt es nicht.');
    const kapitel = daten.kapitel[index];
    const vorher = daten.kapitel[index - 1];
    const nachher = daten.kapitel[index + 1];
    const stufe = aktuelleStufe();
    const theorie = h('article', { class: 'theorie' }, (kapitel.theorie ?? []).map((block) => theorieBlock(block, abbildung, interaktivEinbetten, stufe)));
    const kern = kapitel.kern?.length > 0 && h('section', { class: 'kern' },
      h('h2', {}, icon('ziel'), stufe === 'kompakt' ? 'Das Wichtigste' : 'Das Wichtigste in Kürze'),
      h('ul', {}, kapitel.kern.map((punkt) => h('li', {}, textMitBegriffen(punkt)))));
    anhaengen(el,
      h('header', { class: 'seitenkopf', 'data-modul': ctx.modul.id },
        brotkrumen(['Start', '#/'], [ctx.modul.titel, ctx.link()], [`Kapitel ${index + 1}`]),
        h('h1', {}, kapitel.titel),
        kapitel.kurz && h('p', { class: 'einleitung' }, kapitel.kurz),
        stufenUmschalter({ kompakt: true }),
      ),
      // Kompakt: erst das Wichtigste, die ausführliche Erklärung aufklappbar.
      stufe === 'kompakt' && kern
        ? [kern, h('details', { class: 'theorie-ausfuehrlich' }, h('summary', {}, icon('theorie'), 'Ausführliche Erklärung lesen'), theorie)]
        : [theorie, kern],
      kapitel.ids.length > 0 && h('div', { class: 'karte kapitel-aktion', 'data-modul': ctx.modul.id },
        h('div', {}, h('strong', {}, 'Verstanden?'), h('p', { class: 'leise' }, `Teste dich mit ${mehrzahl(kapitel.ids.length, 'Frage', 'Fragen')} zu diesem Kapitel.`)),
        h('a', { class: 'knopf gross', href: ctx.link('ueben', kapitel.id) }, icon('ueben'), 'Fragen üben'),
      ),
      h('nav', { class: 'blaettern' },
        vorher ? h('a', { class: 'knopf zweitrangig', href: ctx.link('kapitel', vorher.id) }, icon('zurueck'), 'Vorheriges') : h('span'),
        nachher ? h('a', { class: 'knopf zweitrangig', href: ctx.link('kapitel', nachher.id) }, 'Nächstes', icon('weiter')) : h('a', { class: 'knopf zweitrangig', href: ctx.link() }, 'Übersicht'),
      ),
    );
  }

  function lernenSeite(el, ctx, daten) {
    const neuZeichnen = () => { el.replaceChildren(); lernenSeite(el, ctx, daten); };
    let ids = lernrunde(daten.alleIds, karten(ctx), { anzahl: rundenGroesse });
    let titel = 'Lernrunde';
    if (ids.length === 0) {
      ids = uebungsrunde(daten.alleIds, karten(ctx), { anzahl: rundenGroesse });
      titel = 'Freies Üben';
    }
    runde(el, ctx, daten, ids, { titel, zurueck: { href: ctx.link(), text: 'Zur Übersicht' }, neuZeichnen });
  }

  function uebenSeite(el, ctx, daten, kapitelId) {
    const kapitel = daten.kapitel.find((k) => k.id === kapitelId);
    if (!kapitel) throw new Error('Dieses Kapitel gibt es nicht.');
    const neuZeichnen = () => { el.replaceChildren(); uebenSeite(el, ctx, daten, kapitelId); };
    const ids = uebungsrunde(kapitel.ids, karten(ctx), { anzahl: Math.min(12, kapitel.ids.length) });
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
              return h('div', { class: 'pruef-beispiel' }, frageKopf(frage, (n) => abbildung(n)), loesungsBlock(frage), problem && h('p', { class: 'fehlerton' }, problem));
            }),
          );
        }
        const problem = frageProblem(quelle);
        if (problem) probleme.push(`${quelle.id}: ${problem}`);
        return h('div', { class: 'pruef-frage' },
          h('p', { class: 'pruef-meta' }, `${quelle.id} · ${quelle.typ}`),
          frageKopf(quelle, (n) => abbildung(n)),
          loesungsBlock(quelle),
          problem && h('p', { class: 'fehlerton' }, problem),
        );
      });
      return h('section', { class: 'pruef-kapitel' },
        h('h2', {}, `${i + 1}. ${kapitel.titel}`),
        h('details', { class: 'pruef-theorie' }, h('summary', {}, 'Theorie anzeigen'),
          h('div', { class: 'theorie' }, (kapitel.theorie ?? []).map((block) => (block.typ === 'interaktiv'
            ? h('p', { class: 'leise' }, `[Interaktives Element: ${interaktiv[block.id]?.titel ?? block.id}]`)
            : theorieBlock(block, abbildung, undefined, 'einsteiger'))),
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
      const s = statistik(daten.alleIds, karten(ctx));
      return { ...s, anteil: s.gesamt ? s.sicher / s.gesamt : 0 };
    },

    /** Alle Aufgaben des Moduls – für die modulübergreifende Wiederholung. */
    async aufgaben(ctx) {
      const daten = await laden(ctx);
      const stand = karten(ctx);
      return daten.alleIds.map((id) => ({ ...aufgabe(ctx, id, daten), karte: stand[id] }));
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
    frage.erklaerung && h('p', { class: 'pruef-erklaerung' }, formatiert(frage.erklaerung)),
  );
}

export { istSicher };
