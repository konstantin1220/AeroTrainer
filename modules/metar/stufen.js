// Die vier Lernstufen des METAR-Moduls (Oberfläche).
//   #/metar/1/<beispiel>   Antippen & erklären
//   #/metar/2[/<stufe>]    Selbst entschlüsseln
//   #/metar/3[/<stufe>]    Rückwärts bauen
//   #/metar/4[/<platz>]    Entscheidung treffen
// Lernstand: stufe1 = { <beispiel-id>: { erkundet } }, stufen = { '2': { runden, perfekt }, … }

import { h, anhaengen, brotkrumen, formatiert, mehrzahl } from '../../js/ui.js';
import { icon } from '../../js/icons.js';
import { fragerunde } from '../../js/quiz.js';
import { zufall } from '../../js/zufall.js';
import { zerlegen } from './metar.js';
import { metarErzeugen } from './erzeugen.js';
import { entschluesselnFragen, bauenVergleichen, beschreibung, szenarioErzeugen } from './aufgaben.js';

export const STUFEN = [
  { nr: '1', titel: 'Antippen & erklären', text: 'Tippe die Gruppen eines METARs an und lass sie dir erklären.', symbol: 'auge' },
  { nr: '2', titel: 'Selbst entschlüsseln', text: 'Lies Wind, Sicht, Wolken und mehr selbst aus dem METAR heraus.', symbol: 'ueben' },
  { nr: '3', titel: 'Rückwärts bauen', text: 'Aus einer Wetterbeschreibung schreibst du das METAR.', symbol: 'stufen' },
  { nr: '4', titel: 'Entscheidung treffen', text: 'Piste, Seitenwind, Wolken, Luftraum: Kannst du fliegen?', symbol: 'flugzeug' },
];

const SCHWIERIGKEIT = [
  ['1', 'Schönes Wetter', 'CAVOK, wenige Wolken, mäßiger Wind'],
  ['2', 'Wolken & Wind', 'Böen, schwacher Wind, Kälte, Dunst'],
  ['3', 'Regen & Dunst', 'tiefe Wolken, Niesel, Trend BECMG'],
  ['4', 'Schauer, Nebel, Gewitter', 'CB, Pistensichtweite, TEMPO'],
  ['5', 'Für Profis', 'Schnee, gefrierender Regen, AUTO, Trend mit Uhrzeit'],
];

function stufenStand(ctx, nr) {
  return ctx.stand().stufen?.[nr] ?? { runden: 0, perfekt: 0 };
}

function stufeZaehlen(ctx, nr, perfekt) {
  ctx.aktualisieren((stand) => {
    stand.stufen ??= {};
    const s = (stand.stufen[nr] ??= { runden: 0, perfekt: 0 });
    s.runden++;
    if (perfekt) s.perfekt++;
  });
}

function kopf(ctx, titel, untertitel) {
  return h('header', { class: 'seitenkopf' },
    brotkrumen(['Start', '#/'], [ctx.modul.titel, ctx.link()], [titel]),
    h('h1', {}, titel),
    untertitel && h('p', { class: 'einleitung' }, untertitel),
  );
}

function gruppenZeile(gruppen, markiert = []) {
  return h('div', { class: 'metar metar-anzeige' }, gruppen.map((g, i) => h('span', {
    class: `gruppe${markiert.includes(i) ? ' markiert' : ''}`, 'data-typ': g.typ, 'data-trend': g.imTrend,
  }, g.text)));
}

// ---------- Übersicht der Stufen (auf der Modulseite) ----------

export function stufenUebersicht(ctx, daten) {
  const erkundet = Object.keys(ctx.stand().stufe1 ?? {}).filter((id) => daten.beispiele.some((b) => b.id === id)).length;
  return h('section', {},
    h('h2', { class: 'abschnitt-titel' }, icon('stufen'), 'Lernstufen'),
    h('ol', { class: 'stufenliste' }, STUFEN.map((stufe) => {
      const s = stufenStand(ctx, stufe.nr);
      const stand = stufe.nr === '1'
        ? `${erkundet} von ${daten.beispiele.length} Beispielen erkundet`
        : s.runden ? `${mehrzahl(s.runden, 'Runde', 'Runden')} · ${s.perfekt} fehlerfrei` : 'noch nicht geübt';
      return h('li', {}, h('a', { class: 'stufen-karte', href: ctx.link(stufe.nr), 'data-modul': ctx.modul.id },
        h('span', { class: 'stufen-nr' }, stufe.nr),
        h('span', { class: 'stufen-text' },
          h('strong', {}, stufe.titel),
          h('span', {}, stufe.text),
          h('span', { class: 'stufen-stand' }, stand),
        ),
        icon('weiter'),
      ));
    })),
  );
}

// ---------- Stufe 1: Antippen & erklären ----------

function erklaerung(gruppe, texte) {
  const info = texte[gruppe.typ] ?? texte.unbekannt;
  return [
    h('div', { class: 'erklaerung-kopf' },
      h('code', {}, gruppe.text),
      h('span', { class: 'erklaerung-titel' }, info.titel),
      gruppe.imTrend && h('span', { class: 'chip' }, 'Trend'),
    ),
    h('p', { class: 'bedeutung' }, gruppe.bedeutung),
    h('p', { class: 'allgemein' }, info.erklaerung),
  ];
}

export function stufe1(el, [id], ctx, daten) {
  const liste = daten.beispiele;
  const index = Math.max(0, liste.findIndex((b) => b.id === id));
  const beispiel = liste[index];
  const gruppen = zerlegen(beispiel.metar);
  const angetippt = new Set();
  const warSchonErkundet = Boolean(ctx.stand().stufe1?.[beispiel.id]);

  const detail = h('div', { class: 'karte erklaerung', 'aria-live': 'polite' },
    h('p', { class: 'leise erklaerung-leer' }, icon('auge'), 'Tippe auf eine Gruppe im METAR, um sie erklärt zu bekommen.'));
  const status = h('p', { class: 'stufe1-status' });

  function statusZeigen() {
    if (warSchonErkundet || angetippt.size === gruppen.length) status.replaceChildren(h('span', { class: 'erledigt' }, icon('haken'), 'Alle Gruppen erkundet'));
    else status.textContent = `${angetippt.size} von ${gruppen.length} Gruppen angetippt`;
  }

  const knoepfe = gruppen.map((gruppe, i) => h('button', {
    type: 'button', class: 'gruppe', 'data-typ': gruppe.typ, 'data-trend': gruppe.imTrend, 'aria-pressed': 'false',
    onclick: () => waehlen(i),
  }, gruppe.text));

  function waehlen(i) {
    knoepfe.forEach((k, j) => k.setAttribute('aria-pressed', String(i === j)));
    knoepfe[i].classList.add('gesehen');
    angetippt.add(i);
    detail.replaceChildren(...erklaerung(gruppen[i], daten.gruppen));
    if (angetippt.size === gruppen.length && !warSchonErkundet) {
      ctx.aktualisieren((stand) => {
        stand.stufe1 ??= {};
        stand.stufe1[beispiel.id] ??= { erkundet: new Date().toISOString() };
      });
    }
    statusZeigen();
  }

  const vorher = liste[index - 1];
  const nachher = liste[index + 1];
  statusZeigen();
  anhaengen(el,
    h('header', { class: 'seitenkopf' },
      brotkrumen(['Start', '#/'], [ctx.modul.titel, ctx.link()], ['Stufe 1']),
      h('div', { class: 'aufgabenkopf' },
        h('h1', {}, beispiel.titel),
        h('span', { class: 'schwierigkeit', title: `Schwierigkeit ${beispiel.schwierigkeit} von 5` }, `${index + 1}/${liste.length} · `, '●'.repeat(beispiel.schwierigkeit), h('span', { class: 'leer' }, '●'.repeat(5 - beispiel.schwierigkeit))),
      ),
    ),
    h('div', { class: 'metar metar-gross', role: 'group', 'aria-label': 'METAR – jede Gruppe ist antippbar' }, knoepfe),
    status,
    detail,
    h('details', { class: 'aufloesung karte' },
      h('summary', {}, 'Alle Gruppen auf einmal anzeigen'),
      h('dl', {}, gruppen.map((g) => [h('dt', {}, h('code', {}, g.text)), h('dd', {}, g.bedeutung)])),
    ),
    h('nav', { class: 'blaettern' },
      vorher ? h('a', { class: 'knopf zweitrangig', href: ctx.link('1', vorher.id) }, icon('zurueck'), 'Zurück') : h('span'),
      nachher ? h('a', { class: 'knopf', href: ctx.link('1', nachher.id) }, 'Weiter', icon('weiter')) : h('a', { class: 'knopf', href: ctx.link() }, 'Fertig', icon('haken')),
    ),
  );
}

// ---------- Auswahl der Schwierigkeit (Stufen 2 und 3) ----------

function schwierigkeitsWahl(el, ctx, nr, titel, text) {
  const s = stufenStand(ctx, nr);
  anhaengen(el,
    kopf(ctx, `Stufe ${nr}: ${titel}`, text),
    s.runden > 0 && h('p', { class: 'leise' }, `Bisher ${mehrzahl(s.runden, 'Runde', 'Runden')}, davon ${s.perfekt} fehlerfrei.`),
    h('h2', { class: 'abschnitt-titel' }, 'Wie schwer soll das METAR sein?'),
    h('ul', { class: 'wahl-liste' }, SCHWIERIGKEIT.map(([stufe, name, beschr]) => h('li', {},
      h('a', { class: 'wahl-karte', href: ctx.link(nr, stufe) },
        h('span', { class: 'schwierigkeit gross' }, '●'.repeat(Number(stufe)), h('span', { class: 'leer' }, '●'.repeat(5 - Number(stufe)))),
        h('span', { class: 'wahl-text' }, h('strong', {}, name), h('span', {}, beschr)),
        icon('weiter'),
      )))),
    h('p', { class: 'hinweis-klein' }, 'Alle METARs werden frei erfunden – mit echten Flugplatzkennungen, aber ausgedachtem Wetter.'),
  );
}

// ---------- Stufe 2: Selbst entschlüsseln ----------

export function stufe2(el, [stufe], ctx) {
  if (!stufe) return schwierigkeitsWahl(el, ctx, '2', 'Selbst entschlüsseln', 'Du bekommst ein METAR und liest die einzelnen Werte selbst heraus. Die jeweils gefragte Gruppe ist markiert.');
  const { text } = metarErzeugen(zufall, { stufe: Math.min(5, Math.max(1, Number(stufe) || 1)) });
  const fragen = entschluesselnFragen(zufall, text);
  const neuZeichnen = () => { el.replaceChildren(); stufe2(el, [stufe], ctx); };
  fragerunde(el, {
    titel: `Stufe 2 · Schwierigkeit ${stufe}`,
    aufgaben: fragen.map((frage, i) => ({ id: `s2-${i}`, erzeugen: () => frage })),
    zurueck: { href: ctx.link('2'), text: 'Schwierigkeit wählen' },
    nochmal: neuZeichnen,
    amEnde: ({ gesamt, erstRichtig }) => stufeZaehlen(ctx, '2', gesamt === erstRichtig),
  });
}

// ---------- Stufe 3: Rückwärts bauen ----------

export function stufe3(el, [stufe], ctx, daten) {
  if (!stufe) return schwierigkeitsWahl(el, ctx, '3', 'Rückwärts bauen', 'Du bekommst das Wetter in Worten und schreibst daraus das METAR – Gruppe für Gruppe in der richtigen Reihenfolge.');
  const { text: loesung } = metarErzeugen(zufall, { stufe: Math.min(5, Math.max(1, Number(stufe) || 1)) });
  const zeilen = beschreibung(loesung);
  let gezaehlt = false;

  const feld = h('textarea', {
    class: 'metar-eingabe', rows: 3, autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false',
    placeholder: 'METAR …', 'aria-label': 'Dein METAR',
  });
  const ergebnis = h('div', { class: 'bau-ergebnis', 'aria-live': 'polite' });
  const pruefKnopf = h('button', { type: 'button', class: 'knopf gross', onclick: pruefen }, icon('haken'), 'Prüfen');
  const loesungKnopf = h('button', { type: 'button', class: 'knopf gross zweitrangig', onclick: () => zeigen(true) }, icon('auge'), 'Lösung zeigen');
  const weiterKnopf = h('button', { type: 'button', class: 'knopf gross', hidden: true, onclick: () => { el.replaceChildren(); stufe3(el, [stufe], ctx, daten); } }, 'Nächstes METAR', icon('weiter'));

  function zeigen(nurLoesung) {
    const vergleich = bauenVergleichen(nurLoesung ? '' : feld.value, loesung);
    if (!gezaehlt) {
      gezaehlt = true;
      stufeZaehlen(ctx, '3', vergleich.richtig && !nurLoesung);
      ctx.gezaehlt(vergleich.richtig && !nurLoesung);
    }
    const fehlend = vergleich.soll.filter((t) => !t.ok).length;
    const falsch = vergleich.eingabe.filter((t) => !t.ok).length;
    ergebnis.replaceChildren(
      vergleich.richtig
        ? h('div', { class: 'rueckmeldung rueckmeldung-richtig' }, h('div', { class: 'rueckmeldung-kopf' }, h('span', { class: 'rueckmeldung-symbol' }, icon('haken')), h('strong', {}, 'Perfekt – jede Gruppe stimmt!')))
        : h('div', { class: 'rueckmeldung rueckmeldung-falsch' },
          h('div', { class: 'rueckmeldung-kopf' }, h('span', { class: 'rueckmeldung-symbol' }, icon(nurLoesung ? 'auge' : 'kreuz')), h('strong', {}, nurLoesung ? 'Die Lösung' : `Noch nicht ganz: ${falsch} falsch, ${fehlend} fehlen`)),
          !nurLoesung && h('p', { class: 'bau-titel' }, 'Deine Eingabe:'),
          !nurLoesung && h('div', { class: 'metar metar-anzeige' }, vergleich.eingabe.map((t) => h('span', { class: `gruppe ${t.ok ? 'ist-ok' : 'ist-falsch'}` }, t.text))),
          h('p', { class: 'bau-titel' }, 'Richtig wäre:'),
          h('div', { class: 'metar metar-anzeige' }, vergleich.soll.map((t) => h('span', { class: `gruppe ${t.ok ? 'ist-ok' : 'ist-fehlt'}` }, t.text))),
        ),
    );
    weiterKnopf.hidden = false;
    if (nurLoesung) loesungKnopf.hidden = true;
  }

  function pruefen() {
    if (!feld.value.trim()) { feld.focus(); return; }
    zeigen(false);
  }

  anhaengen(el,
    kopf(ctx, 'Stufe 3: Rückwärts bauen', `Schwierigkeit ${stufe} · Schreibe das METAR zu diesem Wetter.`),
    h('section', { class: 'karte' },
      h('h2', {}, icon('theorie'), 'So ist das Wetter'),
      h('ol', { class: 'bau-beschreibung' }, zeilen.map((z) => h('li', { class: z.imTrend ? 'im-trend' : '' },
        h('span', { class: 'bau-art' }, daten.gruppen[z.typ]?.titel ?? z.typ), h('span', {}, z.text)))),
    ),
    h('section', { class: 'karte' },
      h('label', { class: 'bau-label' }, 'Dein METAR', feld),
      h('p', { class: 'hinweis-klein' }, 'Gruppen mit Leerzeichen trennen. Groß- und Kleinschreibung ist egal.'),
      h('div', { class: 'knopfreihe' }, pruefKnopf, loesungKnopf, weiterKnopf),
      ergebnis,
    ),
    h('p', {}, h('a', { href: ctx.link('3') }, 'Andere Schwierigkeit wählen')),
  );
  feld.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); pruefen(); } });
}

// ---------- Stufe 4: Entscheidung treffen ----------

export function stufe4(el, [kennung], ctx, daten) {
  if (!kennung) {
    const s = stufenStand(ctx, '4');
    anhaengen(el,
      kopf(ctx, 'Stufe 4: Entscheidung treffen', `Du planst einen Flug mit dem ${daten.plaetze.flugzeug.name} (nachgewiesene Seitenwindkomponente ${daten.plaetze.flugzeug.seitenwind} kt). Lies das METAR und entscheide.`),
      s.runden > 0 && h('p', { class: 'leise' }, `Bisher ${mehrzahl(s.runden, 'Runde', 'Runden')}, davon ${s.perfekt} fehlerfrei.`),
      h('h2', { class: 'abschnitt-titel' }, icon('karte'), 'Wähle einen Flugplatz'),
      h('ul', { class: 'wahl-liste' },
        h('li', {}, h('a', { class: 'wahl-karte', href: ctx.link('4', 'zufall') },
          h('span', { class: 'wahl-symbol' }, icon('wuerfel')),
          h('span', { class: 'wahl-text' }, h('strong', {}, 'Zufälliger Flugplatz'), h('span', {}, 'Lass dich überraschen')), icon('weiter'))),
        daten.plaetze.plaetze.map((p) => h('li', {}, h('a', { class: 'wahl-karte', href: ctx.link('4', p.kennung) },
          h('span', { class: 'wahl-symbol' }, icon(p.luftraum === 'CTR' ? 'karte' : 'start')),
          h('span', { class: 'wahl-text' }, h('strong', {}, p.name), h('span', {}, `${p.kennung} · Pisten ${p.pisten.join('/')} · ${p.luftraum === 'CTR' ? 'Kontrollzone' : 'Luftraum G'}`)),
          icon('weiter')))),
      ),
      h('p', { class: 'hinweis-klein' }, 'Die Flugplätze sind frei erfunden – es sind dieselben wie auf der Übungskarte im Modul Navigation.'),
    );
    return;
  }
  const szenario = szenarioErzeugen(zufall, daten.plaetze, kennung === 'zufall' ? null : kennung);
  const neuZeichnen = () => { el.replaceChildren(); stufe4(el, [kennung], ctx, daten); };
  fragerunde(el, {
    titel: `Stufe 4 · ${szenario.platz.name}`,
    aufgaben: szenario.fragen.map((frage, i) => ({ id: `s4-${i}`, erzeugen: () => frage })),
    zurueck: { href: ctx.link('4'), text: 'Flugplatz wählen' },
    nochmal: neuZeichnen,
    amEnde: ({ gesamt, erstRichtig }) => stufeZaehlen(ctx, '4', gesamt === erstRichtig),
  });
}

// ---------- Zusatz für die Prüfansicht ----------

export function pruefZusatz(ctx, daten) {
  const beispielKarten = daten.beispiele.map((b) => {
    const gruppen = zerlegen(b.metar);
    return h('div', { class: 'pruef-frage' },
      h('p', { class: 'pruef-meta' }, `${b.id} · Schwierigkeit ${b.schwierigkeit}`),
      h('h3', {}, b.titel),
      gruppenZeile(gruppen),
      h('ul', { class: 'pruef-antworten' }, gruppen.map((g) => h('li', { class: g.typ === 'unbekannt' ? 'fehlerton' : '' }, h('code', {}, g.text), ' – ', g.bedeutung, g.imTrend ? ' (Trend)' : ''))),
    );
  });
  const erzeugte = [1, 2, 3, 4, 5].map((stufe) => h('div', { class: 'pruef-frage' },
    h('p', { class: 'pruef-meta' }, `Generator · Schwierigkeit ${stufe} – drei Beispiele`),
    [0, 1, 2].map(() => h('p', {}, h('code', { class: 'metar-text' }, metarErzeugen(zufall, { stufe }).text))),
  ));
  return h('section', { class: 'pruef-kapitel' },
    h('h2', {}, 'Beispiel-METARs (Stufe 1)'),
    h('p', { class: 'leise' }, 'Datei: modules/metar/content/beispiele.json. Die Erklärungen der Gruppen stehen in gruppen.json.'),
    beispielKarten,
    h('h2', {}, 'Vom Generator erzeugte METARs (Stufen 2–4)'),
    h('p', { class: 'leise' }, 'Bei jedem Laden neu erzeugt (modules/metar/erzeugen.js). Bitte auf Plausibilität prüfen.'),
    erzeugte,
    h('h2', {}, 'Allgemeine Erklärungen der Gruppen'),
    h('dl', { class: 'pruefliste' }, Object.entries(daten.gruppen).map(([typ, info]) => [
      h('dt', {}, info.titel, ' ', h('span', { class: 'leise' }, `(${typ})`)),
      h('dd', {}, formatiert(info.erklaerung)),
    ])),
  );
}
