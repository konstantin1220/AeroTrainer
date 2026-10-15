// Die vier Lernstufen des METAR-Moduls (Oberfläche).
//   #/metar/1/<beispiel>   Antippen & erklären
//   #/metar/2[/<stufe>]    Selbst entschlüsseln
//   #/metar/3[/<stufe>]    Rückwärts bauen
//   #/metar/4[/<platz>]    Entscheidung treffen
//   #/metar/5              Fehler finden
// Lernstand: stufe1 = { <beispiel-id>: { erkundet } }, stufen = { '2': { runden, perfekt }, … }
// Stufe 3 gibt es in drei Arten (Einstellung „metarBauArt“): Bausteine, Bausteine mit Fallen, Eintippen.

import { h, anhaengen, brotkrumen, formatiert, mehrzahl } from '../../js/ui.js';
import { icon } from '../../js/icons.js';
import { fragerunde } from '../../js/quiz.js';
import { zufall } from '../../js/zufall.js';
import { umschalter } from '../../js/interaktiv.js';
import { einstellung, einstellungSetzen } from '../../js/storage.js';
import { zerlegen } from './metar.js';
import { metarErzeugen } from './erzeugen.js';
import { entschluesselnFragen, bauenVergleichen, beschreibung, szenarioErzeugen, bauBausteine, fehlerEinbauen } from './aufgaben.js';

export const STUFEN = [
  { nr: '1', titel: 'Antippen & erklären', text: 'Tippe die Gruppen eines METARs an und lass sie dir erklären.', symbol: 'auge' },
  { nr: '2', titel: 'Selbst entschlüsseln', text: 'Lies Wind, Sicht, Wolken und mehr selbst aus dem METAR heraus.', symbol: 'ueben' },
  { nr: '3', titel: 'Rückwärts bauen', text: 'Aus einer Wetterbeschreibung schreibst du das METAR.', symbol: 'stufen' },
  { nr: '4', titel: 'Entscheidung treffen', text: 'Piste, Seitenwind, Wolken, Luftraum: Kannst du fliegen?', symbol: 'flugzeug' },
  { nr: '5', titel: 'Fehler finden', text: 'In jedem METAR steckt höchstens ein Fehler – findest du ihn?', symbol: 'pruefen' },
];

const BAU_ARTEN = [
  ['bausteine', 'Bausteine'],
  ['fallen', 'Bausteine mit Fallen'],
  ['tippen', 'Eintippen'],
];
const BAU_TEXT = {
  bausteine: 'Du setzt das METAR aus den passenden Gruppen zusammen – alle Bausteine gehören dazu.',
  fallen: 'Wie Bausteine, aber ein paar fast richtige Gruppen sind als Fallen dabei (z. B. BKN080 statt BKN008).',
  tippen: 'Du schreibst das METAR selbst – wie in der Prüfung.',
};
const bauArt = () => (BAU_ARTEN.some(([a]) => a === einstellung('metarBauArt')) ? einstellung('metarBauArt') : 'bausteine');

/** Umschalter für die Art von Stufe 3, mit kurzer Erklärung darunter. */
function bauArtWahl(beiAenderung) {
  const hinweis = h('p', { class: 'leise' }, BAU_TEXT[bauArt()]);
  const wahl = umschalter({
    name: 'So baust du das METAR', optionen: BAU_ARTEN, wert: bauArt(),
    beiAenderung: (w) => { einstellungSetzen('metarBauArt', w); hinweis.textContent = BAU_TEXT[w]; beiAenderung?.(w); },
  });
  return h('section', { class: 'karte' }, wahl.el, hinweis);
}

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
    nr === '3' && bauArtWahl(),
    h('h2', { class: 'abschnitt-titel' }, 'Wie schwer soll das METAR sein?'),
    h('ul', { class: 'wahl-liste' }, SCHWIERIGKEIT.map(([stufe, name, beschr]) => h('li', {},
      h('a', { class: 'wahl-karte', href: ctx.link(nr, stufe) },
        h('span', { class: 'schwierigkeit gross' }, '●'.repeat(Number(stufe)), h('span', { class: 'leer' }, '●'.repeat(5 - Number(stufe)))),
        h('span', { class: 'wahl-text' }, h('strong', {}, name), h('span', {}, beschr)),
        icon('weiter'),
      )))),
    h('p', { class: 'hinweis-klein' }, 'Alle METARs sind frei erfunden – für die Übungsplätze XMUS, XALT und XBER, mit ausgedachtem Wetter.'),
  );
}

// ---------- Stufe 2: Selbst entschlüsseln ----------

export function stufe2(el, [stufe], ctx) {
  if (!stufe) return schwierigkeitsWahl(el, ctx, '2', 'Selbst entschlüsseln', 'Du bekommst ein METAR und liest die einzelnen Werte selbst heraus. Die jeweils gefragte Gruppe ist markiert.');
  const { text } = metarErzeugen(zufall, { stufe: Math.min(5, Math.max(1, Number(stufe) || 1)) });
  const fragen = entschluesselnFragen(zufall, text);
  const neuZeichnen = () => { el.replaceChildren(); stufe2(el, [stufe], ctx); };
  fragerunde(el, {
    merkModul: ctx.modul.id,
    titel: `Stufe 2 · Schwierigkeit ${stufe}`,
    aufgaben: fragen.map((frage, i) => ({ id: `s2-${i}`, erzeugen: () => frage })),
    zurueck: { href: ctx.link('2'), text: 'Schwierigkeit wählen' },
    nochmal: neuZeichnen,
    amEnde: ({ gesamt, erstRichtig }) => stufeZaehlen(ctx, '2', gesamt === erstRichtig),
  });
}

// ---------- Stufe 3: Rückwärts bauen ----------

export function stufe3(el, [stufe], ctx, daten) {
  if (!stufe) return schwierigkeitsWahl(el, ctx, '3', 'Rückwärts bauen', 'Du bekommst das Wetter in Worten und baust daraus das METAR – Gruppe für Gruppe in der richtigen Reihenfolge.');
  const art = bauArt();
  const { text: loesung } = metarErzeugen(zufall, { stufe: Math.min(5, Math.max(1, Number(stufe) || 1)) });
  const zeilen = beschreibung(loesung);
  const neuZeichnen = () => { el.replaceChildren(); stufe3(el, [stufe], ctx, daten); };
  let gezaehlt = false;
  let versuch = 0;

  const ergebnis = h('div', { class: 'bau-ergebnis', 'aria-live': 'polite' });
  const pruefKnopf = h('button', { type: 'button', class: 'knopf gross', onclick: pruefen }, icon('haken'), 'Prüfen');
  const loesungKnopf = h('button', { type: 'button', class: 'knopf gross zweitrangig', onclick: () => zeigen(true) }, icon('auge'), 'Lösung zeigen');
  const weiterKnopf = h('button', { type: 'button', class: 'knopf gross', hidden: true, onclick: neuZeichnen }, 'Nächstes METAR', icon('weiter'));

  // Eingabe je nach Art: Bausteine antippen oder selbst schreiben
  let eingabe;
  if (art === 'tippen') {
    const feld = h('textarea', {
      class: 'metar-eingabe', rows: 3, autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false',
      placeholder: 'METAR …', 'aria-label': 'Dein METAR',
    });
    feld.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); pruefen(); } });
    eingabe = {
      knoten: [h('label', { class: 'bau-label' }, 'Dein METAR', feld), h('p', { class: 'hinweis-klein' }, 'Gruppen mit Leerzeichen trennen. Groß- und Kleinschreibung ist egal.')],
      text: () => feld.value, leer: () => !feld.value.trim(), sperren: () => { feld.disabled = true; }, freigeben: () => { feld.disabled = false; feld.focus(); }, fokus: () => feld.focus(),
    };
  } else {
    const { teile, auswahl } = bauBausteine(loesung, zufall, art === 'fallen' ? Math.min(6, 3 + Math.floor(Number(stufe) / 2)) : 0);
    const gelegt = [];
    let marken = null;
    let gesperrt = false;
    const zeile = h('div', { class: 'baustein-zeile metar-bausteine', 'aria-label': 'Dein METAR' });
    const vorrat = h('div', { class: 'baustein-vorrat metar-bausteine' });
    const zeichnen = () => {
      zeile.replaceChildren(...(gelegt.length ? gelegt.map((b, i) => h('button', {
        type: 'button', disabled: gesperrt, class: `baustein gelegt${marken ? (marken[i] ? ' ist-richtig' : ' ist-falsch') : ''}`,
        onclick: () => { gelegt.splice(i, 1); marken = null; zeichnen(); },
      }, b.text)) : [h('span', { class: 'leise' }, 'Tippe die Gruppen in der richtigen Reihenfolge an.')]));
      vorrat.replaceChildren(...auswahl.filter((b) => !gelegt.includes(b)).map((b) => h('button', {
        type: 'button', class: 'baustein', disabled: gesperrt, onclick: () => { gelegt.push(b); marken = null; zeichnen(); },
      }, b.text)));
    };
    zeichnen();
    eingabe = {
      knoten: [h('p', { class: 'bau-label' }, 'Dein METAR'), zeile, vorrat,
        h('p', { class: 'hinweis-klein' }, art === 'fallen' ? 'Achtung: Ein paar Gruppen sind fast richtig – aber eben nur fast. Antippen in der Zeile legt eine Gruppe zurück.' : 'Antippen in der Zeile legt eine Gruppe zurück.')],
      text: () => gelegt.map((b) => b.text).join(' '),
      leer: () => gelegt.length === 0,
      sperren: () => { gesperrt = true; zeichnen(); },
      freigeben: () => { gesperrt = false; zeichnen(); },
      markieren: (vergleich) => { marken = vergleich.eingabe.map((t) => t.ok); zeichnen(); },
      fallen: () => gelegt.filter((b) => b.grund),
    };
    void teile;
  }

  function vergleichsAnzeige(vergleich, nurLoesung) {
    return [
      !nurLoesung && h('p', { class: 'bau-titel' }, 'Deine Eingabe:'),
      !nurLoesung && h('div', { class: 'metar metar-anzeige' }, vergleich.eingabe.map((t) => h('span', { class: `gruppe ${t.ok ? 'ist-ok' : 'ist-falsch'}` }, t.text))),
      h('p', { class: 'bau-titel' }, 'Richtig wäre:'),
      h('div', { class: 'metar metar-anzeige' }, vergleich.soll.map((t) => h('span', { class: `gruppe ${t.ok ? 'ist-ok' : 'ist-fehlt'}` }, t.text))),
    ];
  }

  /** Erklärt die Fallen, in die man getappt ist. */
  function fallenListe() {
    const getappt = eingabe.fallen?.() ?? [];
    return getappt.length > 0 && h('ul', { class: 'fallen-liste' }, getappt.map((f) => h('li', {}, h('code', {}, f.text), ' – ', f.grund)));
  }

  function zeigen(nurLoesung) {
    const vergleich = bauenVergleichen(nurLoesung ? '' : eingabe.text(), loesung);
    if (!gezaehlt) {
      gezaehlt = true;
      stufeZaehlen(ctx, '3', vergleich.richtig && !nurLoesung && versuch <= 1);
      ctx.gezaehlt(vergleich.richtig && !nurLoesung && versuch <= 1);
    }
    eingabe.sperren();
    const fehlend = vergleich.soll.filter((t) => !t.ok).length;
    const falsch = vergleich.eingabe.filter((t) => !t.ok).length;
    ergebnis.replaceChildren(
      vergleich.richtig
        ? h('div', { class: 'rueckmeldung rueckmeldung-richtig' }, h('div', { class: 'rueckmeldung-kopf' }, h('span', { class: 'rueckmeldung-symbol' }, icon('haken')), h('strong', {}, versuch > 1 ? 'Richtig – im zweiten Anlauf.' : 'Perfekt – jede Gruppe stimmt!')))
        : h('div', { class: 'rueckmeldung rueckmeldung-falsch' },
          h('div', { class: 'rueckmeldung-kopf' }, h('span', { class: 'rueckmeldung-symbol' }, icon(nurLoesung ? 'auge' : 'kreuz')), h('strong', {}, nurLoesung ? 'Die Lösung' : `Noch nicht ganz: ${falsch} falsch, ${fehlend} fehlen`)),
          !nurLoesung && fallenListe(),
          vergleichsAnzeige(vergleich, nurLoesung),
        ),
    );
    pruefKnopf.hidden = true;
    loesungKnopf.hidden = true;
    weiterKnopf.hidden = false;
    weiterKnopf.focus({ preventScroll: true });
  }

  function pruefen() {
    if (eingabe.leer()) { eingabe.fokus?.(); return; }
    versuch++;
    const vergleich = bauenVergleichen(eingabe.text(), loesung);
    // Beim ersten Fehlversuch mit Bausteinen: markieren und einen zweiten Anlauf anbieten
    if (!vergleich.richtig && versuch === 1 && eingabe.markieren) {
      eingabe.markieren(vergleich);
      eingabe.sperren();
      const getappt = eingabe.fallen();
      ergebnis.replaceChildren(h('div', { class: 'rueckmeldung rueckmeldung-fast' },
        h('div', { class: 'rueckmeldung-kopf' }, h('span', { class: 'rueckmeldung-symbol' }, icon('lampe')), h('strong', {}, 'Fast – schau noch mal hin.')),
        h('p', {}, `Rot markierte Gruppen stehen falsch oder gehören nicht hinein${vergleich.soll.length > vergleich.eingabe.filter((t) => t.ok).length + vergleich.eingabe.filter((t) => !t.ok).length ? ', und es fehlen noch Gruppen' : ''}.${getappt.length ? ` Darunter ${getappt.length === 1 ? 'ist eine Falle' : `sind ${getappt.length} Fallen`}.` : ''}`),
        h('div', { class: 'knopfreihe' },
          h('button', { type: 'button', class: 'knopf gross', onclick: () => { eingabe.freigeben(); ergebnis.replaceChildren(); pruefKnopf.hidden = false; loesungKnopf.hidden = false; } }, 'Nochmal versuchen'),
          h('button', { type: 'button', class: 'knopf gross zweitrangig', onclick: () => zeigen(false) }, 'Lösung zeigen'))));
      pruefKnopf.hidden = true;
      loesungKnopf.hidden = true;
      return;
    }
    zeigen(false);
  }

  anhaengen(el,
    kopf(ctx, 'Stufe 3: Rückwärts bauen', `Schwierigkeit ${stufe} · ${BAU_ARTEN.find(([a]) => a === art)[1]}`),
    h('section', { class: 'karte' },
      h('h2', {}, icon('theorie'), 'So ist das Wetter'),
      h('ol', { class: 'bau-beschreibung' }, zeilen.map((z) => h('li', { class: z.imTrend ? 'im-trend' : '' },
        h('span', { class: 'bau-art' }, daten.gruppen[z.typ]?.titel ?? z.typ), h('span', {}, z.text)))),
    ),
    h('section', { class: 'karte' },
      eingabe.knoten,
      h('div', { class: 'knopfreihe' }, pruefKnopf, loesungKnopf, weiterKnopf),
      ergebnis,
    ),
    bauArtWahl(() => neuZeichnen()),
    h('p', {}, h('a', { href: ctx.link('3') }, 'Andere Schwierigkeit wählen')),
  );
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
    merkModul: ctx.modul.id,
    titel: `Stufe 4 · ${szenario.platz.name}`,
    aufgaben: szenario.fragen.map((frage, i) => ({ id: `s4-${i}`, erzeugen: () => frage })),
    zurueck: { href: ctx.link('4'), text: 'Flugplatz wählen' },
    nochmal: neuZeichnen,
    amEnde: ({ gesamt, erstRichtig }) => stufeZaehlen(ctx, '4', gesamt === erstRichtig),
  });
}

// ---------- Stufe 5: Fehler finden ----------

const STUFE5_RUNDE = 6;

export function stufe5(el, rest, ctx) {
  // Eine Runde: sechs METARs, in etwa jedem fünften ist alles richtig
  const aufgaben = Array.from({ length: STUFE5_RUNDE }, (_, i) => {
    const { text } = metarErzeugen(zufall, { stufe: zufall.ganz(1, 5) });
    const fehler = i > 0 && zufall.janein(0.2) ? null : fehlerEinbauen(zufall, text);
    return fehler ?? { text, stellen: [], grund: null };
  });
  let nr = 0;
  let richtig = 0;
  const neuZeichnen = () => { el.replaceChildren(); stufe5(el, rest, ctx); };
  const bereich = h('div', {});

  function aufgabe() {
    const a = aufgaben[nr];
    const gruppen = zerlegen(a.text);
    let fertig = false;
    const rueckmeldung = h('div', { 'aria-live': 'polite' });
    const knoepfe = gruppen.map((g, i) => h('button', { type: 'button', class: 'gruppe', 'data-typ': g.typ, 'data-trend': g.imTrend, onclick: () => antwort(i) }, g.text));
    const keinFehler = h('button', { type: 'button', class: 'knopf zweitrangig', onclick: () => antwort(null) }, icon('haken'), 'Alles richtig – kein Fehler');

    function antwort(i) {
      if (fertig) return;
      fertig = true;
      const ok = i === null ? a.stellen.length === 0 : a.stellen.includes(i);
      if (ok) richtig++;
      ctx.gezaehlt(ok);
      knoepfe.forEach((k, j) => {
        k.disabled = true;
        if (a.stellen.includes(j)) k.classList.add('ist-falsch');
        else if (j === i) k.classList.add('ist-gewaehlt');
      });
      keinFehler.disabled = true;
      const letzte = nr === aufgaben.length - 1;
      const weiter = h('button', { type: 'button', class: 'knopf gross breit', onclick: () => { if (letzte) ende(); else { nr++; aufgabe(); } } }, letzte ? 'Auswertung' : 'Nächstes METAR', icon('weiter'));
      rueckmeldung.replaceChildren(h('div', { class: `rueckmeldung ${ok ? 'rueckmeldung-richtig' : 'rueckmeldung-falsch'}` },
        h('div', { class: 'rueckmeldung-kopf' }, h('span', { class: 'rueckmeldung-symbol' }, icon(ok ? 'haken' : 'kreuz')), h('strong', {}, ok ? 'Richtig!' : 'Leider nicht.')),
        h('p', {}, a.stellen.length
          ? [`Der Fehler steckt in `, h('code', {}, a.stellen.map((s) => gruppen[s].text).join(' und ')), `: ${a.grund}`]
          : 'In diesem METAR ist alles korrekt – jede Gruppe hält sich an die Melderegeln.'),
        weiter));
      weiter.focus({ preventScroll: true });
    }

    bereich.replaceChildren(
      h('p', { class: 'runde-zaehler' }, `METAR ${nr + 1} von ${aufgaben.length}`),
      h('div', { class: 'metar metar-gross', role: 'group', 'aria-label': 'METAR – tippe die fehlerhafte Gruppe an' }, knoepfe),
      h('div', { class: 'knopfreihe' }, keinFehler),
      rueckmeldung,
    );
  }

  function ende() {
    stufeZaehlen(ctx, '5', richtig === aufgaben.length);
    ctx.geaendert?.();
    bereich.replaceChildren(h('div', { class: 'runde-ende' },
      h('h2', {}, richtig === aufgaben.length ? 'Adlerauge! Alles gefunden.' : richtig >= aufgaben.length - 2 ? 'Gut aufgepasst!' : 'Übung macht den Meister.'),
      h('p', { class: 'einleitung' }, `${richtig} von ${aufgaben.length} richtig erkannt.`),
      h('div', { class: 'knopfreihe zentriert' },
        h('button', { type: 'button', class: 'knopf gross', onclick: neuZeichnen }, icon('wuerfel'), 'Neue Runde'),
        h('a', { class: 'knopf gross zweitrangig', href: ctx.link() }, 'Zur Übersicht'))));
  }

  aufgabe();
  anhaengen(el,
    kopf(ctx, 'Stufe 5: Fehler finden', 'In jedem METAR steckt höchstens ein Fehler: ein Verstoß gegen die Melderegeln oder ein Wert, der nicht zusammenpasst. Tippe die falsche Gruppe an – oder sag, dass alles stimmt.'),
    bereich,
  );
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
