// Einstieg der App: Navigation (über den Teil der Adresse nach #), Startseite,
// modulübergreifende Wiederholung, Lernstand- und Info-Seite sowie das Laden der Module.
//
// Ein Modul wird in modules/index.json eingetragen und liegt in einem eigenen Ordner
// mit einer Datei module.js. Diese exportiert ein Objekt mit:
//   anzeigen(element, pfadTeile, ctx)  – zeichnet das Modul in das Element (Pflicht)
//   fortschritt(ctx)                   – { anteil, faellig, neu, gesamt, sicher } (optional)
//   aufgaben(ctx)                      – alle Fragen für die gemeinsame Wiederholung (optional)
// Die meisten Module nutzen dafür den Baukasten in js/lernmodul.js.

import { h, anhaengen, ladeJSON, fehlerAnzeige, datumText, ring, balken, leerzustand, mehrzahl, formatiert, brotkrumen } from './ui.js';
import { icon, themenIcon, logo } from './icons.js';
import { fragerunde } from './quiz.js';
import { tagText, tagPlus, istFaellig, ABSTAND_TAGE, SICHER_AB_BOX } from './srs.js';
import { zufall } from './zufall.js';
import * as lernstand from './storage.js';
import { STUFEN, aktuelleStufe, stufeGewaehlt, stufeSetzen, stufeAnwenden, stufenUmschalter } from './stufe.js';
import { lexikonLaden, neueSeite, alleBegriffe, erklaerungKnoten } from './lexikon.js';
import { frageText } from './merkliste.js';

const APP_VERSION = '1.0.0';
const TAGE_BIS_SICHERUNGSHINWEIS = 7;
const WIEDERHOLUNG_GROESSE = 15;

const NAVIGATION = [
  { ziel: '', text: 'Start', symbol: 'start' },
  { ziel: 'wiederholen', text: 'Wiederholen', symbol: 'wiederholen' },
  { ziel: 'lexikon', text: 'Lexikon', symbol: 'lexikon' },
  { ziel: 'lernstand', text: 'Lernstand', symbol: 'lernstand' },
  { ziel: 'info', text: 'Info', symbol: 'info' },
];

const hauptbereich = document.getElementById('app');
let modulListe = null;
const geladeneModule = new Map();
let navigationsNr = 0;

// ---------- Module laden ----------

function module() {
  modulListe ??= ladeJSON('modules/index.json')
    .then((daten) => daten.module)
    .catch((fehler) => { modulListe = null; throw fehler; });
  return modulListe;
}

async function aktiveModule() {
  return (await module()).filter((m) => m.status === 'aktiv');
}

function modulLaden(modul) {
  if (!geladeneModule.has(modul.id)) {
    const basis = new URL(modul.pfad, document.baseURI);
    const ladevorgang = import(new URL('module.js', basis).href).then((code) => {
      const ctx = {
        modul,
        h,
        inhalt: (datei) => ladeJSON(new URL(datei, basis)),
        stand: () => lernstand.modulStand(modul.id),
        aktualisieren: (aenderung) => lernstand.modulAktualisieren(modul.id, aenderung),
        gezaehlt: (richtig) => lernstand.antwortZaehlen(richtig),
        geaendert: () => faelligeAktualisieren(),
        link: (...teile) => '#/' + [modul.id, ...teile].map(encodeURIComponent).join('/'),
      };
      return { code: code.default, ctx };
    }).catch((fehler) => { geladeneModule.delete(modul.id); throw fehler; });
    geladeneModule.set(modul.id, ladevorgang);
  }
  return geladeneModule.get(modul.id);
}

async function alleFortschritte() {
  const liste = await aktiveModule();
  return Promise.all(liste.map(async (modul) => {
    try {
      const { code, ctx } = await modulLaden(modul);
      return { modul, fortschritt: await code.fortschritt?.(ctx) };
    } catch (fehler) {
      console.warn(`Modul ${modul.id} konnte nicht geladen werden`, fehler);
      return { modul, fortschritt: null };
    }
  }));
}

// ---------- Navigation ----------

function navigationAufbauen() {
  const markenLink = document.querySelector('.marke');
  markenLink.prepend(logo());
  for (const container of document.querySelectorAll('[data-navigation]')) {
    container.replaceChildren(...NAVIGATION.map((eintrag) => h('a', { href: `#/${eintrag.ziel}`, 'data-ziel': eintrag.ziel },
      h('span', { class: 'nav-symbol' }, icon(eintrag.symbol), eintrag.ziel === 'wiederholen' && h('span', { class: 'nav-zahl', hidden: true })),
      h('span', { class: 'nav-text' }, eintrag.text),
    )));
  }
}

function navigationMarkieren(seite) {
  if (seite === 'quellen') seite = 'info';
  const modulSeite = !NAVIGATION.some((n) => n.ziel === (seite ?? ''));
  for (const link of document.querySelectorAll('[data-ziel]')) {
    const aktiv = link.dataset.ziel === (seite ?? '') || (modulSeite && link.dataset.ziel === '');
    if (aktiv) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
}

async function faelligeAktualisieren() {
  const fortschritte = await alleFortschritte();
  const anzahl = fortschritte.reduce((summe, f) => summe + (f.fortschritt?.faellig ?? 0), 0);
  for (const zahl of document.querySelectorAll('.nav-zahl')) {
    zahl.hidden = anzahl === 0;
    zahl.textContent = anzahl > 99 ? '99+' : String(anzahl);
  }
}

async function navigieren({ behalteScroll = false } = {}) {
  const nr = ++navigationsNr;
  const scroll = window.scrollY;
  neueSeite();
  const [seite, ...rest] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  navigationMarkieren(seite);

  const inhalt = h('div', { class: 'seite' });
  try {
    if (!seite) await startseite(inhalt);
    else if (seite === 'wiederholen') await wiederholenSeite(inhalt);
    else if (seite === 'lernstand') await lernstandSeite(inhalt);
    else if (seite === 'lexikon') lexikonSeite(inhalt, rest[0]);
    else if (seite === 'info') infoSeite(inhalt, await impressumLaden());
    else if (seite === 'quellen') await quellenSeite(inhalt);
    else if (seite === 'merkliste') await merklisteSeite(inhalt, rest);
    else await modulSeite(inhalt, seite, rest);
  } catch (fehler) {
    console.error(fehler);
    inhalt.replaceChildren(fehlerAnzeige(fehler));
  }
  if (nr !== navigationsNr) return; // inzwischen wurde schon weiter navigiert

  hauptbereich.replaceChildren(inhalt);
  if (behalteScroll) {
    window.scrollTo(0, scroll);
  } else if (seite === 'lexikon' && rest[0]) {
    document.getElementById(`begriff-${rest[0]}`)?.scrollIntoView({ block: 'start' });
  } else if (seite === 'info' && rest[0]) {
    document.getElementById(rest[0])?.scrollIntoView({ block: 'start' });
  } else if (seite === 'quellen' && rest[0]) {
    document.getElementById(`quellen-${rest[0]}`)?.scrollIntoView({ block: 'start' });
  } else {
    window.scrollTo(0, 0);
  }
  hauptbereich.focus({ preventScroll: true });
}

async function modulSeite(el, id, rest) {
  const modul = (await module()).find((m) => m.id === id);
  if (!modul || modul.status !== 'aktiv') throw new Error('Dieses Modul gibt es (noch) nicht.');
  const { code, ctx } = await modulLaden(modul);
  el.dataset.modul = modul.id;
  await code.anzeigen(el, rest, ctx);
}

// ---------- Startseite ----------

function sicherungsHinweis() {
  if (!lernstand.hatFortschritt()) return null;
  const tage = lernstand.tageSeitSicherung();
  if (tage !== null && tage < TAGE_BIS_SICHERUNGSHINWEIS) return null;
  const text = tage === null ? 'Dein Lernstand ist noch nicht gesichert.' : `Letzte Sicherung vor ${tage} Tagen.`;
  return h('a', { class: 'sicherungshinweis', href: '#/lernstand' },
    icon('sichern'), h('span', {}, text), h('strong', {}, 'Jetzt sichern'), icon('weiter'));
}

function gruss() {
  const stunde = new Date().getHours();
  if (stunde < 5) return 'Gute Nacht';
  if (stunde < 11) return 'Guten Morgen';
  if (stunde < 18) return 'Guten Tag';
  return 'Guten Abend';
}

async function startseite(el) {
  const [alleModule, fortschritte] = await Promise.all([module(), alleFortschritte()]);
  const faellig = fortschritte.reduce((s, f) => s + (f.fortschritt?.faellig ?? 0), 0);
  const neu = fortschritte.reduce((s, f) => s + (f.fortschritt?.neu ?? 0), 0);
  const gesamt = fortschritte.reduce((s, f) => s + (f.fortschritt?.gesamt ?? 0), 0);
  const sicher = fortschritte.reduce((s, f) => s + (f.fortschritt?.sicher ?? 0), 0);
  const heute = lernstand.tagesStatistik()[tagText()]?.a ?? 0;
  const serie = lernstand.serie();

  // Vorschlag für neue Fragen: das Modul mit dem meisten Fortschritt, das noch Neues hat.
  const vorschlag = fortschritte.filter((f) => f.fortschritt?.neu > 0)
    .sort((a, b) => (b.fortschritt.gesehen - a.fortschritt.gesehen))[0];

  let aktion;
  if (faellig > 0) {
    aktion = h('a', { class: 'knopf gross hell', href: '#/wiederholen' }, icon('wiederholen'), `${mehrzahl(faellig, 'Frage', 'Fragen')} wiederholen`);
  } else if (vorschlag) {
    aktion = h('a', { class: 'knopf gross hell', href: `#/${vorschlag.modul.id}/lernen` }, icon('flugzeug'), `Weiter mit ${vorschlag.modul.titel}`);
  } else {
    aktion = h('a', { class: 'knopf gross hell', href: '#/wiederholen' }, icon('ueben'), 'Frei üben');
  }

  const kacheln = alleModule.map((modul) => {
    const f = fortschritte.find((x) => x.modul.id === modul.id)?.fortschritt;
    if (modul.status !== 'aktiv') {
      return h('li', {}, h('div', { class: 'themen-kachel geplant', 'data-modul': modul.id },
        h('span', { class: 'themen-symbol' }, themenIcon(modul.id)),
        h('span', { class: 'themen-text' }, h('strong', {}, modul.titel), h('span', {}, 'in Vorbereitung')),
      ));
    }
    return h('li', {}, h('a', { class: 'themen-kachel', href: `#/${modul.id}`, 'data-modul': modul.id },
      h('span', { class: 'themen-symbol' }, themenIcon(modul.id)),
      h('span', { class: 'themen-text' },
        h('strong', {}, modul.titel),
        h('span', {}, modul.beschreibung),
        f && h('span', { class: 'themen-stand' },
          f.faellig > 0 ? h('span', { class: 'chip chip-faellig' }, `${f.faellig} fällig`) : null,
          f.gesehen === 0 ? h('span', { class: 'chip' }, 'neu') : null),
      ),
      f ? ring(f.anteil, `${Math.round(f.anteil * 100)} Prozent sicher`, 'klein') : null,
    ));
  });

  anhaengen(el,
    sicherungsHinweis(),
    !stufeGewaehlt() && stufenAbfrage(),
    h('section', { class: 'heute' },
      h('div', { class: 'heute-kopf' },
        h('p', { class: 'heute-gruss' }, gruss()),
        h('h1', {}, faellig > 0 ? `Heute ${faellig > 1 ? 'warten' : 'wartet'} ${mehrzahl(faellig, 'Wiederholung', 'Wiederholungen')}` : lernstand.hatFortschritt() ? 'Für heute ist alles wiederholt' : 'Bereit für die Theorie?'),
      ),
      h('div', { class: 'heute-werte' },
        h('div', { class: 'heute-wert' }, icon('thermik'), h('strong', {}, serie), h('span', {}, serie === 1 ? 'Lerntag in Folge' : 'Lerntage in Folge')),
        h('div', { class: 'heute-wert' }, icon('haken'), h('strong', {}, heute), h('span', {}, 'Antworten heute')),
        h('div', { class: 'heute-wert' }, icon('ziel'), h('strong', {}, `${gesamt ? Math.round((sicher / gesamt) * 100) : 0}%`), h('span', {}, 'sicher gelernt')),
      ),
      aktion,
    ),
    !lernstand.hatFortschritt() && h('p', { class: 'start-tipp' }, icon('lampe'), 'Tipp: Wähle ein Thema, lies ein Kapitel und starte dann eine Lernrunde. Der Rest ergibt sich von selbst.'),
    merklisteKachel(),
    h('h2', { class: 'abschnitt-titel' }, 'Themen'),
    h('ul', { class: 'themen-raster' }, kacheln),
  );
}

// ---------- Erklär-Level ----------

function stufenKarten() {
  const aktuell = aktuelleStufe();
  return h('div', { class: 'stufen-karten', role: 'radiogroup', 'aria-label': 'Erklär-Level' },
    Object.entries(STUFEN).map(([schluessel, stufe]) => h('button', {
      type: 'button', role: 'radio', class: 'stufen-karte-wahl', 'aria-checked': String(stufeGewaehlt() && schluessel === aktuell),
      onclick: () => stufeSetzen(schluessel),
    }, h('strong', {}, stufe.titel), h('span', {}, stufe.text))));
}

function stufenAbfrage() {
  return h('section', { class: 'karte stufen-abfrage' },
    h('h2', {}, icon('sprechblase'), 'Wie viel weißt du schon?'),
    h('p', {}, 'Davon hängt ab, wie ausführlich die App erklärt. Du kannst das jederzeit ändern – in jedem Kapitel oben und unter „Lernstand“.'),
    stufenKarten(),
  );
}

// ---------- Lexikon ----------

function lexikonSeite(el, offen) {
  const begriffe = [...alleBegriffe()].sort((a, b) => a.begriff.localeCompare(b.begriff, 'de'));
  const liste = h('div', { class: 'lexikon-liste' });
  const suche = h('input', { type: 'search', class: 'texteingabe lexikon-suche', placeholder: 'Begriff suchen …', 'aria-label': 'Begriff suchen', oninput: zeichnen });

  function zeichnen() {
    const wort = suche.value.trim().toLowerCase();
    const treffer = begriffe.filter((b) => !wort || b.begriff.toLowerCase().includes(wort) || b.kurz.toLowerCase().includes(wort) || (b.suche ?? []).some((v) => v.toLowerCase().includes(wort)));
    const gruppen = new Map();
    for (const b of treffer) {
      const buchstabe = b.begriff[0].toUpperCase().replace(/[ÄÖÜ]/, (u) => ({ Ä: 'A', Ö: 'O', Ü: 'U' })[u]);
      if (!gruppen.has(buchstabe)) gruppen.set(buchstabe, []);
      gruppen.get(buchstabe).push(b);
    }
    liste.replaceChildren();
    anhaengen(liste,
      treffer.length === 0 && h('p', { class: 'leise' }, 'Kein Begriff gefunden.'),
      [...gruppen].map(([buchstabe, eintraege]) => h('section', { class: 'lexikon-gruppe' },
        h('h2', {}, buchstabe),
        eintraege.map((b) => h('details', { class: 'lexikon-eintrag', id: `begriff-${b.id}`, open: b.id === offen || Boolean(wort) },
          h('summary', {}, h('strong', {}, b.begriff), b.lang && h('span', { class: 'leise' }, ` – ${b.lang}`)),
          h('div', { class: 'lexikon-text' }, erklaerungKnoten(b),
            b.thema && h('a', { class: 'lexikon-thema', href: `#/${b.thema}` }, 'Zum Thema', icon('weiter'))))))),
    );
  }
  zeichnen();
  anhaengen(el,
    h('header', { class: 'seitenkopf' },
      h('h1', {}, 'Lexikon'),
      h('p', { class: 'einleitung' }, `${begriffe.length} Fachbegriffe, kurz erklärt. In den Kapiteln kannst du markierte Begriffe direkt antippen.`),
      stufenUmschalter({ kompakt: true }),
    ),
    suche,
    liste,
  );
}

// ---------- Gemeinsame Wiederholung ----------

async function wiederholenSeite(el) {
  const liste = await aktiveModule();
  const geladen = await Promise.all(liste.map(async (modul) => {
    const { code, ctx } = await modulLaden(modul);
    const aufgaben = (await code.aufgaben?.(ctx)) ?? [];
    return aufgaben.map((a) => ({ ...a, modul }));
  }));
  const alle = geladen.flat();
  const heute = tagText();
  const neuZeichnen = () => { el.replaceChildren(); wiederholenSeite(el); };

  let auswahl = zufall.mischen(alle.filter((a) => istFaellig(a.karte, heute)))
    .sort((a, b) => a.karte.b - b.karte.b)
    .slice(0, WIEDERHOLUNG_GROESSE);
  let titel = 'Wiederholung';

  if (auswahl.length === 0) {
    const gesehen = alle.filter((a) => a.karte);
    if (gesehen.length === 0) {
      anhaengen(el, leerzustand('wiederholen', 'Noch nichts zu wiederholen',
        'Hier sammeln sich die Fragen aus allen Themen, sobald sie wieder dran sind. Starte mit einem Thema auf der Startseite.',
        h('a', { class: 'knopf gross', href: '#/' }, icon('start'), 'Zu den Themen')));
      return;
    }
    if (!el.dataset.freiwillig) {
      anhaengen(el, leerzustand('haken', 'Alles wiederholt!',
        'Für heute ist nichts mehr fällig. Du kannst trotzdem gemischt aus allen Themen üben – das zählt nicht gegen deinen Plan.',
        h('button', { type: 'button', class: 'knopf gross', onclick: () => { el.dataset.freiwillig = 'ja'; neuZeichnen(); } }, icon('wuerfel'), 'Gemischt üben'),
        h('a', { class: 'knopf gross zweitrangig', href: '#/' }, 'Zur Startseite')));
      return;
    }
    auswahl = zufall.ziehen(gesehen, WIEDERHOLUNG_GROESSE);
    titel = 'Gemischtes Üben';
  }

  fragerunde(el, {
    titel,
    aufgaben: auswahl,
    zurueck: { href: '#/', text: 'Zur Startseite' },
    nochmal: neuZeichnen,
    amEnde: faelligeAktualisieren,
  });
}

// ---------- Lernstand ----------

function aktivitaetsKalender(tage) {
  // 12 Wochen, Spalten = Wochen (Montag oben), Farbe = Anzahl Antworten
  const heute = tagText();
  const wochentag = (new Date().getDay() + 6) % 7; // Montag = 0
  const start = tagPlus(heute, -(11 * 7 + wochentag));
  const zellen = [];
  for (let i = 0; i < 12 * 7; i++) {
    const tag = tagPlus(start, i);
    const anzahl = tage[tag]?.a ?? 0;
    const stufe = anzahl === 0 ? 0 : anzahl < 10 ? 1 : anzahl < 25 ? 2 : anzahl < 50 ? 3 : 4;
    const zukunft = tag > heute;
    zellen.push(h('span', {
      class: `tag stufe-${stufe} ${zukunft ? 'zukunft' : ''} ${tag === heute ? 'ist-heute' : ''}`,
      title: zukunft ? '' : `${new Date(tag).toLocaleDateString('de-DE')}: ${mehrzahl(anzahl, 'Antwort', 'Antworten')}`,
    }));
  }
  return h('div', { class: 'kalender' },
    h('div', { class: 'kalender-raster', role: 'img', 'aria-label': 'Lernaktivität der letzten 12 Wochen' }, zellen),
    h('div', { class: 'kalender-legende' }, 'weniger', [0, 1, 2, 3, 4].map((s) => h('span', { class: `tag stufe-${s}` })), 'mehr'),
  );
}

async function lernstandSeite(el) {
  const fortschritte = await alleFortschritte();
  const tage = lernstand.tagesStatistik();
  const antworten = Object.values(tage).reduce((s, t) => s + t.a, 0);
  const richtig = Object.values(tage).reduce((s, t) => s + t.r, 0);
  const lerntage = Object.values(tage).filter((t) => t.a > 0).length;

  const meldung = h('p', { class: 'meldung', role: 'status' });
  const status = h('p', { class: 'sicherung-status' });

  function statusAktualisieren() {
    const datum = lernstand.letzteSicherung();
    status.replaceChildren('Letzte Sicherung: ', h('strong', {}, datum ? datumText(datum) : 'noch nie'));
  }
  function melden(text, art = 'ok') {
    meldung.className = `meldung ${art}`;
    meldung.textContent = text;
  }

  async function sichern() {
    try {
      if (await lernstand.sichern()) melden(`Gespeichert als „${lernstand.DATEINAME}“.`);
    } catch (fehler) {
      melden(`Speichern hat nicht geklappt: ${fehler.message}`, 'fehler');
    }
    statusAktualisieren();
  }

  async function laden(ereignis) {
    const datei = ereignis.target.files[0];
    ereignis.target.value = '';
    if (!datei) return;
    if (lernstand.hatFortschritt() && !confirm('Der Lernstand auf diesem Gerät wird durch den aus der Datei ersetzt. Fortfahren?')) return;
    try {
      await lernstand.importieren(datei);
      melden('Lernstand geladen.');
      setTimeout(() => navigieren(), 900);
      faelligeAktualisieren();
    } catch (fehler) {
      melden(fehler.message, 'fehler');
    }
    statusAktualisieren();
  }

  function zuruecksetzen() {
    if (!confirm('Wirklich den gesamten Lernstand auf diesem Gerät löschen? Das lässt sich nur mit einer Sicherungsdatei rückgängig machen.')) return;
    lernstand.zuruecksetzen();
    faelligeAktualisieren();
    navigieren();
  }

  statusAktualisieren();
  anhaengen(el,
    h('header', { class: 'seitenkopf' }, h('h1', {}, 'Dein Lernstand')),
    h('div', { class: 'kennzahlen' },
      h('div', { class: 'kennzahl' }, icon('thermik'), h('strong', {}, lernstand.serie()), h('span', {}, 'Lerntage in Folge')),
      h('div', { class: 'kennzahl' }, icon('kalender'), h('strong', {}, lerntage), h('span', {}, 'Lerntage gesamt')),
      h('div', { class: 'kennzahl' }, icon('haken'), h('strong', {}, antworten), h('span', {}, 'Antworten')),
      h('div', { class: 'kennzahl' }, icon('ziel'), h('strong', {}, antworten ? `${Math.round((richtig / antworten) * 100)}%` : '–'), h('span', {}, 'richtig')),
    ),
    h('section', { class: 'karte' }, h('h2', {}, 'Aktivität'), aktivitaetsKalender(tage)),
    h('section', { class: 'karte' },
      h('h2', {}, 'Themen'),
      h('ul', { class: 'modul-fortschritte' }, fortschritte.map(({ modul, fortschritt: f }) => h('li', { 'data-modul': modul.id },
        h('a', { href: `#/${modul.id}` },
          h('span', { class: 'themen-symbol klein' }, themenIcon(modul.id)),
          h('span', { class: 'modul-fortschritt-text' },
            h('strong', {}, modul.titel),
            f ? h('span', { class: 'leise' }, `${f.sicher} von ${f.gesamt} sicher · ${f.faellig} fällig`) : null,
            f ? balken(f.anteil, 'modulfarbe') : null),
        )))),
    ),
    h('section', { class: 'karte' },
      h('h2', {}, icon('merken'), 'Merkliste'),
      h('p', {}, lernstand.merkliste().length
        ? `${mehrzahl(lernstand.merkliste().length, 'Frage', 'Fragen')} gemerkt.`
        : 'Noch keine Fragen gemerkt. Tippe in einer Fragerunde oben rechts auf „Merken“.'),
      h('a', { class: 'knopf zweitrangig', href: '#/merkliste' }, icon('merken'), 'Zur Merkliste'),
    ),
    h('section', { class: 'karte' },
      h('h2', {}, icon('sprechblase'), 'Wie ausführlich soll erklärt werden?'),
      stufenKarten(),
    ),
    h('section', { class: 'karte sicherung', id: 'sicherung' },
      h('h2', {}, icon('sichern'), 'Sichern & übertragen'),
      h('p', {}, 'Dein Fortschritt wird nur auf diesem Gerät gespeichert – ohne Konto und ohne Server. '
        + 'Sichere ihn ab und zu als Datei, z. B. in iCloud, OneDrive oder Google Drive. '
        + 'Mit dieser Datei kannst du auch auf einem anderen Gerät weiterlernen.'),
      status,
      h('div', { class: 'knopfreihe' },
        h('button', { type: 'button', class: 'knopf gross', onclick: sichern }, icon('sichern'), 'Lernstand sichern'),
        h('label', { class: 'knopf gross zweitrangig' },
          icon('laden'), 'Lernstand laden',
          h('input', { type: 'file', accept: '.json,application/json', class: 'unsichtbar', onchange: laden }),
        ),
      ),
      meldung,
    ),
    h('section', { class: 'karte' },
      h('h2', {}, icon('lampe'), 'Tipp: als App installieren'),
      h('p', {}, 'Safari löscht Website-Daten unter Umständen, wenn eine Seite länger nicht genutzt wurde. '
        + 'Als App auf dem Home-Bildschirm bleibt dein Lernstand besser erhalten – und die App funktioniert auch ohne Internet.'),
      h('ul', { class: 'theorie-liste' },
        h('li', {}, h('strong', {}, 'iPhone/iPad: '), 'in Safari auf „Teilen“ tippen, dann „Zum Home-Bildschirm“.'),
        h('li', {}, h('strong', {}, 'Android: '), 'im Chrome-Menü „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.'),
        h('li', {}, h('strong', {}, 'PC: '), 'in Chrome oder Edge über das Installieren-Symbol in der Adresszeile.'),
      ),
    ),
    h('section', { class: 'gefahrenzone' },
      h('h2', {}, 'Neu anfangen'),
      h('p', { class: 'leise' }, 'Löscht den gesamten Lernstand auf diesem Gerät.'),
      h('button', { type: 'button', class: 'knopf gefahr', onclick: zuruecksetzen }, icon('loeschen'), 'Lernstand zurücksetzen'),
    ),
  );
}

// ---------- Info ----------

// Anbieterkennzeichnung (modules/impressum.json). Erst wenn ein Name eingetragen ist, erscheint das Impressum.
let impressumDaten = null;
function impressumLaden() {
  impressumDaten ??= ladeJSON('modules/impressum.json').then((d) => (d?.name ? d : null)).catch(() => null);
  return impressumDaten;
}

function impressumKarte(daten) {
  if (!daten) return null;
  return h('section', { class: 'karte', id: 'impressum' },
    h('h2', {}, icon('info'), 'Impressum'),
    h('p', {}, 'Angaben nach § 18 Abs. 1 Medienstaatsvertrag:'),
    h('address', { class: 'impressum' },
      h('strong', {}, daten.name),
      (daten.anschrift ?? []).map((zeile) => h('span', {}, zeile)),
      daten.vertreten && h('span', {}, `Vertreten durch: ${daten.vertreten}`),
      daten.email && h('span', {}, 'E-Mail: ', daten.email),
    ),
  );
}

function infoSeite(el, impressum = null) {
  anhaengen(el,
    h('header', { class: 'seitenkopf' }, h('h1', {}, 'Über AeroTrainer')),
    h('div', { class: 'karte wichtig' },
      h('h2', {}, icon('warnung'), 'Nur eine Lernhilfe'),
      h('p', {}, 'AeroTrainer ist eine Lernhilfe und ', h('strong', {}, 'kein offizielles oder genehmigtes Ausbildungsmaterial'), '. '
        + 'Maßgeblich sind die Ausbildung bei deiner ATO bzw. in deinem Verein, das Flughandbuch deines Luftfahrzeugs und die jeweils gültigen Vorschriften. '
        + 'Alle Beispiele – Wettermeldungen, Flugplätze, Karten und Flugzeugdaten – sind frei erfunden und nicht für die echte Flugvorbereitung geeignet.'),
    ),
    h('section', { class: 'karte' },
      h('h2', {}, icon('wiederholen'), 'So lernst du hier'),
      h('p', {}, 'Lies zuerst die Kapitel eines Themas und beantworte dann Fragen. Jede Frage wandert je nach Antwort durch fünf Fächer – wie in einem Karteikasten:'),
      h('ul', { class: 'faecher' }, ABSTAND_TAGE.slice(1).map((tage, i) => h('li', { class: i + 1 >= SICHER_AB_BOX ? 'sicher' : '' },
        h('strong', {}, `Fach ${i + 1}`), h('span', {}, `nach ${mehrzahl(tage, 'Tag', 'Tagen')}`)))),
      h('p', {}, 'Richtig beantwortet rückt die Frage ein Fach weiter und kommt erst später wieder. Falsch beantwortet geht sie zurück in Fach 1. '
        + `Ab Fach ${SICHER_AB_BOX} gilt eine Frage als „sicher“. So übst du genau das, was du noch nicht kannst – und vergisst das Gelernte nicht.`),
      h('p', {}, 'Rechenaufgaben (z. B. Winddreieck oder Schwerpunkt) werden jedes Mal mit neuen Zahlen erzeugt.'),
    ),
    h('section', { class: 'karte' },
      h('h2', {}, icon('auge'), 'Datenschutz'),
      h('p', {}, 'Die App selbst sammelt keine Daten: keine Benutzerkonten, kein Tracking, keine Werbung, keine Cookies und kein eigener Server. '
        + 'Dein Lernstand (auch deine Merkliste) bleibt im Browser auf deinem Gerät und in den Sicherungsdateien, die du selbst ablegst. '
        + 'Gespeichert wird er nur, damit die App für dich funktioniert.'),
      h('p', {}, 'Die App liegt bei ', h('strong', {}, 'GitHub Pages'), ' (GitHub, Inc., USA). Beim Aufruf verarbeitet GitHub technisch notwendige Daten wie deine IP-Adresse, '
        + 'um die Seite auszuliefern und vor Angriffen zu schützen. Details: ',
        h('a', { href: 'https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement', target: '_blank', rel: 'noopener' }, 'Datenschutzerklärung von GitHub'), '.'),
      impressum && h('p', {}, 'Verantwortlich für dieses Angebot: siehe ', h('a', { href: '#/info/impressum' }, 'Impressum'), '.'),
    ),
    h('section', { class: 'karte' },
      h('h2', {}, icon('theorie'), 'Inhalte'),
      h('p', {}, 'Alle Erklärungen, Fragen, Grafiken und Symbole wurden eigens für diese App erstellt. '
        + 'Fragen aus dem amtlichen Prüfungsfragenkatalog werden nicht verwendet. Grundlage sind die amtlichen Vorschriften '
        + '(z. B. die europäischen Luftverkehrsregeln SERA und die Luftverkehrs-Ordnung) und internationale Normen. '
        + 'Die Inhalte sollen vor der Freigabe von Fluglehrern gegengelesen werden – jedes Thema hat dafür eine Prüfansicht.'),
      h('a', { class: 'knopf zweitrangig', href: '#/quellen' }, icon('lexikon'), 'Quellen & Grundlagen ansehen'),
      h('p', {}, 'Hast du einen Fehler gefunden? Sag bitte im Verein Bescheid.'),
    ),
    h('section', { class: 'karte' },
      h('h2', {}, icon('pruefen'), 'Lizenzen'),
      h('ul', { class: 'theorie-liste' },
        h('li', {}, 'Programmcode: MIT-Lizenz – ', h('a', { href: 'LICENSE' }, 'Lizenztext')),
        h('li', {}, 'Lerninhalte: CC BY 4.0 – ', h('a', { href: 'LICENSE-INHALTE.md' }, 'Details')),
        h('li', {}, 'Fremde Bestandteile: keine – ', h('a', { href: 'THIRD_PARTY_LICENSES.md' }, 'Übersicht')),
      ),
    ),
    impressumKarte(impressum),
    h('p', { class: 'leise zentriert' }, `AeroTrainer ${APP_VERSION}`),
  );
}

// ---------- Merkliste ----------

function merklisteKachel() {
  const anzahl = lernstand.merkliste().length;
  if (!anzahl) return null;
  return h('a', { class: 'merkliste-kachel', href: '#/merkliste' },
    h('span', { class: 'merkliste-kachel-symbol' }, icon('merken')),
    h('span', { class: 'merkliste-kachel-text' }, h('strong', {}, 'Deine Merkliste'), h('span', {}, mehrzahl(anzahl, 'gemerkte Frage', 'gemerkte Fragen'))),
    icon('weiter'));
}

/** Lädt zu jedem Merk-Eintrag die Frage (aus dem Modul oder der gespeicherten Kopie) und eine Aufgabe für die Fragerunde. */
async function merkEintraegeLaden() {
  const eintraege = lernstand.merkliste();
  const liste = await aktiveModule();
  const geladen = new Map();
  for (const modul of liste.filter((m) => eintraege.some((e) => e.modul === m.id))) {
    try {
      const { code, ctx } = await modulLaden(modul);
      geladen.set(modul.id, { modul, code, ctx, daten: await code.api.laden(ctx) });
    } catch (fehler) {
      console.warn(`Modul ${modul.id} konnte nicht geladen werden`, fehler);
    }
  }
  return eintraege.map((eintrag) => {
    const m = geladen.get(eintrag.modul);
    if (!m) return { eintrag, fehlt: true };
    const { code, ctx, daten, modul } = m;
    const bekannt = daten.aufgaben.get(eintrag.id);
    if (eintrag.frage) {
      // Erzeugte Aufgabe: genau die gespeicherte Fassung zeigen. Gehört sie zu einer Frage des
      // Moduls (Rechenaufgabe), zählt die Antwort wie gewohnt für die Wiederholung.
      const basis = bekannt ? code.api.aufgabe(ctx, eintrag.id, daten) : { id: eintrag.id, abbildung: (n) => code.api.abbildung(n) };
      return { eintrag, modul, frage: eintrag.frage, erzeugt: true,
        aufgabe: { ...basis, erzeugen: () => structuredClone(eintrag.frage), merken: { modul: modul.id, id: eintrag.id, erzeugt: true } } };
    }
    if (!bekannt) return { eintrag, modul, fehlt: true };
    return { eintrag, modul, frage: bekannt.quelle, erzeugt: false, aufgabe: code.api.aufgabe(ctx, eintrag.id, daten) };
  });
}

async function merklisteSeite(el, [teil, modulId]) {
  const alle = await merkEintraegeLaden();
  const nutzbar = alle.filter((e) => !e.fehlt);

  if (teil === 'ueben') {
    const auswahl = nutzbar.filter((e) => !modulId || e.modul.id === modulId);
    if (!auswahl.length) { location.hash = '#/merkliste'; return; }
    fragerunde(el, {
      titel: modulId ? `Merkliste · ${auswahl[0].modul.titel}` : 'Merkliste',
      aufgaben: zufall.mischen(auswahl.map((e) => e.aufgabe)),
      zurueck: { href: '#/merkliste', text: 'Zur Merkliste' },
      nochmal: () => { el.replaceChildren(); merklisteSeite(el, [teil, modulId]); },
      amEnde: faelligeAktualisieren,
    });
    return;
  }

  const kopf = h('header', { class: 'seitenkopf' },
    brotkrumen(['Start', '#/'], ['Merkliste']),
    h('h1', {}, 'Merkliste'),
    h('p', { class: 'einleitung' }, alle.length
      ? `${mehrzahl(alle.length, 'Frage', 'Fragen')}, die du dir gemerkt hast. Übe sie gezielt – so oft du willst.`
      : 'Hier sammelst du Fragen, die du dir gezielt noch einmal ansehen willst.'),
  );
  if (!alle.length) {
    anhaengen(el, kopf, leerzustand('merken', 'Noch nichts gemerkt',
      'Tippe bei einer Frage oben rechts auf „Merken“ – in jeder Lern- und Übungsrunde, in der Wiederholung, am Ende einer Runde und in der Prüfansicht. Die Fragen landen dann hier.',
      h('a', { class: 'knopf gross', href: '#/' }, icon('start'), 'Zu den Themen')));
    return;
  }

  const neuZeichnen = () => { el.replaceChildren(); merklisteSeite(el, []); };
  const gruppen = new Map();
  for (const e of alle) {
    const id = e.modul?.id ?? e.eintrag.modul;
    if (!gruppen.has(id)) gruppen.set(id, []);
    gruppen.get(id).push(e);
  }

  anhaengen(el,
    kopf,
    h('div', { class: 'knopfreihe' },
      h('a', { class: 'knopf gross', href: '#/merkliste/ueben', 'aria-disabled': String(!nutzbar.length) }, icon('ueben'), 'Merkliste üben'),
    ),
    [...gruppen].map(([id, eintraege]) => {
      const modul = eintraege.find((e) => e.modul)?.modul;
      return h('section', { class: 'karte merkliste-thema', 'data-modul': id },
        h('div', { class: 'merkliste-thema-kopf' },
          h('h2', {}, h('span', { class: 'quellen-symbol' }, themenIcon(id)), modul?.titel ?? id),
          eintraege.some((e) => !e.fehlt) && h('a', { class: 'knopf zweitrangig klein', href: `#/merkliste/ueben/${encodeURIComponent(id)}` }, icon('ueben'), 'Nur diese üben'),
        ),
        h('ul', { class: 'merkliste-eintraege' }, eintraege.map((e) => h('li', {},
          h('div', { class: 'merkliste-frage' },
            e.fehlt
              ? h('span', { class: 'leise' }, 'Diese Frage gibt es nicht mehr – sie wurde geändert oder entfernt.')
              : h('span', {}, formatiert(frageText(e.frage) ?? '')),
            h('span', { class: 'merkliste-meta' },
              e.erzeugt ? 'Rechen- bzw. Übungsaufgabe · ' : '',
              `gemerkt am ${datumText(new Date(e.eintrag.gemerkt))}`),
          ),
          h('button', {
            type: 'button', class: 'merk-entfernen', 'aria-label': 'Von der Merkliste entfernen', title: 'Von der Merkliste entfernen',
            onclick: () => { lernstand.vergessen(e.eintrag.schluessel); neuZeichnen(); },
          }, icon('kreuz')),
        ))),
      );
    }),
    h('p', { class: 'hinweis-klein' }, 'Die Merkliste ist Teil deines Lernstands und wird beim Sichern mitgespeichert.'),
  );
}

// ---------- Quellen & Grundlagen ----------

const QUELLEN_STATUS = {
  abgeglichen: { text: 'Am Original geprüft', symbol: 'haken', erklaerung: 'Punkt für Punkt mit dem amtlichen Originaltext verglichen.' },
  grundlage: { text: 'Grundlage', symbol: 'theorie', erklaerung: 'Beruht auf dieser Quelle; der Abgleich mit dem Originaltext steht noch aus.' },
  herleitung: { text: 'Herleitung', symbol: 'rechner', erklaerung: 'Physikalisch oder mathematisch hergeleitet; die Rechenwege werden mit automatischen Tests geprüft.' },
  erfunden: { text: 'Übungsbeispiel', symbol: 'wuerfel', erklaerung: 'Frei erfunden – nicht für die echte Flugvorbereitung.' },
  offen: { text: 'Bitte prüfen', symbol: 'warnung', erklaerung: 'Noch nicht bestätigt – bitte im genannten Dokument nachsehen.' },
};

function quellenStatus(status) {
  const s = QUELLEN_STATUS[status] ?? QUELLEN_STATUS.grundlage;
  return h('span', { class: `chip quellen-status status-${status}`, title: s.erklaerung }, icon(s.symbol), s.text);
}

async function quellenSeite(el) {
  const [daten, liste] = await Promise.all([ladeJSON('modules/quellen.json'), module()]);
  const quellen = new Map(daten.quellen.map((q) => [q.id, q]));
  const aktiv = liste.filter((m) => m.status === 'aktiv');
  // Fachliche Prüfung je Thema steht in den Inhaltsdateien („_geprueft“)
  const geprueft = await Promise.all(aktiv.map((m) => ladeJSON(`${m.pfad}content/inhalt.json`).then((d) => d._geprueft ?? null).catch(() => null)));
  const alle = daten.themen.flatMap((t) => t.punkte);
  const anzahl = (status) => alle.filter((p) => p.status === status).length;
  const abgleich = datumText(new Date(`${daten.abgleich}T12:00:00`));

  anhaengen(el,
    h('header', { class: 'seitenkopf' },
      brotkrumen(['Info', '#/info'], ['Quellen & Grundlagen']),
      h('h1', {}, 'Quellen & Grundlagen'),
      h('p', { class: 'einleitung' }, daten.einleitung),
    ),
    h('section', { class: 'karte' },
      h('h2', {}, icon('theorie'), 'So sind die Inhalte entstanden'),
      h('ul', { class: 'theorie-liste' }, daten.entstehung.map((t) => h('li', {}, formatiert(t)))),
    ),
    h('section', { class: 'karte' },
      h('h2', {}, icon('pruefen'), 'Stand der Prüfung'),
      h('ul', { class: 'quellen-bilanz' },
        Object.keys(QUELLEN_STATUS).filter((s) => anzahl(s)).map((s) => h('li', {},
          h('strong', {}, String(anzahl(s))), quellenStatus(s), h('span', {}, QUELLEN_STATUS[s].erklaerung)))),
      h('p', { class: 'leise' }, `Letzter Abgleich mit den Originaltexten: ${abgleich}.`),
      h('h3', {}, 'Fachliche Prüfung durch Fluglehrer'),
      h('ul', { class: 'quellen-pruefung' }, aktiv.map((m, i) => h('li', {},
        h('a', { href: `#/${m.id}/pruefen`, 'data-modul': m.id }, themenIcon(m.id), m.titel),
        geprueft[i]
          ? h('span', { class: 'chip quellen-status status-abgeglichen' }, icon('haken'), String(geprueft[i]))
          : h('span', { class: 'chip quellen-status status-offen' }, 'noch nicht geprüft')))),
    ),
    h('section', { class: 'karte' },
      h('h2', {}, icon('lexikon'), 'Quellen'),
      h('ul', { class: 'quellen-liste' }, daten.quellen.map((q) => h('li', { id: `quelle-${q.id}` },
        h('strong', {}, q.titel),
        h('span', {}, q.voll),
        h('span', { class: 'leise' }, q.art),
        q.link && h('a', { href: q.link, target: '_blank', rel: 'noopener' }, 'Zum Text', icon('weiter'))))),
    ),
    h('h2', { class: 'abschnitt-titel' }, 'Nach Thema'),
    daten.themen.map((thema) => {
      const modul = aktiv.find((m) => m.id === thema.modul);
      if (!modul) return null;
      return h('section', { class: 'karte quellen-thema', id: `quellen-${modul.id}`, 'data-modul': modul.id },
        h('h3', {}, h('span', { class: 'quellen-symbol' }, themenIcon(modul.id)), modul.titel),
        h('ul', { class: 'quellen-punkte' }, thema.punkte.map((p) => {
          const q = quellen.get(p.quelle);
          return h('li', {},
            h('span', { class: 'quellen-inhalt' }, p.inhalt),
            h('span', { class: 'quellen-fundstelle' },
              q && h('a', { href: `#/quellen`, onclick: (e) => { e.preventDefault(); document.getElementById(`quelle-${q.id}`)?.scrollIntoView({ block: 'center' }); } }, q.titel),
              p.fundstelle && ` · ${p.fundstelle}`),
            quellenStatus(p.status),
            p.hinweis && h('span', { class: 'quellen-hinweis' }, p.hinweis));
        })));
    }),
  );
}

// ---------- Start ----------

stufeAnwenden();
navigationAufbauen();
window.addEventListener('hashchange', () => navigieren());
window.addEventListener('stufe-geaendert', () => navigieren({ behalteScroll: true }));
lexikonLaden().finally(() => navigieren());
impressumLaden().then((daten) => {
  if (daten) document.querySelector('.lernhilfe-hinweis')?.append(' · ', h('a', { href: '#/info/impressum' }, 'Impressum'));
});
faelligeAktualisieren();
lernstand.dauerhaftenSpeicherAnfragen();

// Offline-Modus. Bei der Entwicklung auf dem eigenen Rechner (localhost) ist er aus,
// damit Änderungen sofort sichtbar sind – mit ?offline in der Adresse lässt er sich dort testen.
const entwicklung = ['localhost', '127.0.0.1'].includes(location.hostname) && !new URLSearchParams(location.search).has('offline');
if ('serviceWorker' in navigator) {
  if (entwicklung) {
    navigator.serviceWorker.getRegistrations().then((liste) => liste.forEach((r) => r.unregister()));
  } else {
    navigator.serviceWorker.register('sw.js').catch((fehler) => console.warn('Offline-Modus nicht verfügbar', fehler));
  }
}
