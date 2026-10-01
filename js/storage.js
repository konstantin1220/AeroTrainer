// Lernstand: wird nur lokal im Browser gespeichert (localStorage).
// Über Export/Import als JSON-Datei kann ihn jeder selbst sichern und auf andere
// Geräte übertragen. Die Datei enthält nur den Lernstand, keine Lerninhalte.
//
// Aufbau: { module: { <modul-id>: {…} }, statistik: { tage: { "JJJJ-MM-TT": { a: Antworten, r: richtig } } },
//          merkliste: [{ schluessel, modul, id, gemerkt, frage? }] }

import { tagText, tagPlus } from './srs.js';

export const FORMAT = 'flug-lernstand';
export const VERSION = 1;
export const DATEINAME = 'flug-lernstand.json';

const SCHLUESSEL_STAND = 'aerotrainer.lernstand';
const SCHLUESSEL_META = 'aerotrainer.meta';
const SCHLUESSEL_EINSTELLUNGEN = 'aerotrainer.einstellungen';

// Ändert sich das Dateiformat, VERSION erhöhen und hier eine Umwandlung ergänzen:
// MIGRATIONEN[n] macht aus einer Datei der Version n eine der Version n + 1.
const MIGRATIONEN = {
  // 1: (daten) => ({ ...daten, version: 2, /* … */ }),
};

let stand = vervollstaendigen(lesen(SCHLUESSEL_STAND, {}));
let meta = lesen(SCHLUESSEL_META, { letzteSicherung: null });
let einstellungen = lesen(SCHLUESSEL_EINSTELLUNGEN, {});

/** Persönliche Einstellungen dieses Geräts, z. B. das Erklär-Level. */
export function einstellung(name, ersatz = null) {
  return einstellungen[name] ?? ersatz;
}

export function einstellungSetzen(name, wert) {
  einstellungen = { ...einstellungen, [name]: wert };
  schreiben(SCHLUESSEL_EINSTELLUNGEN, einstellungen);
}

function vervollstaendigen(daten) {
  return {
    module: daten.module && typeof daten.module === 'object' ? daten.module : {},
    statistik: { tage: daten.statistik?.tage && typeof daten.statistik.tage === 'object' ? daten.statistik.tage : {} },
    // Ältere Dateien haben noch keine Merkliste – dann ist sie einfach leer.
    merkliste: Array.isArray(daten.merkliste)
      ? daten.merkliste.filter((e) => e && typeof e.schluessel === 'string' && typeof e.modul === 'string' && typeof e.id === 'string')
      : [],
  };
}

function lesen(schluessel, ersatz) {
  try {
    const roh = localStorage.getItem(schluessel);
    return roh ? JSON.parse(roh) : ersatz;
  } catch {
    return ersatz;
  }
}

function schreiben(schluessel, wert) {
  try {
    localStorage.setItem(schluessel, JSON.stringify(wert));
  } catch (fehler) {
    console.warn('Lernstand konnte nicht gespeichert werden.', fehler);
  }
}

/** Liefert eine Kopie des Lernstands eines Moduls. */
export function modulStand(modulId) {
  return structuredClone(stand.module[modulId] ?? {});
}

/** Ändert den Lernstand eines Moduls. Die Funktion bekommt eine Kopie und darf sie verändern. */
export function modulAktualisieren(modulId, aenderung) {
  const kopie = modulStand(modulId);
  stand.module[modulId] = aenderung(kopie) ?? kopie;
  schreiben(SCHLUESSEL_STAND, stand);
}

/** Zählt eine beantwortete Frage für die Tagesstatistik. */
export function antwortZaehlen(richtig) {
  const heute = tagText();
  const tag = stand.statistik.tage[heute] ?? { a: 0, r: 0 };
  stand.statistik.tage[heute] = { a: tag.a + 1, r: tag.r + (richtig ? 1 : 0) };
  schreiben(SCHLUESSEL_STAND, stand);
}

export function tagesStatistik() {
  return structuredClone(stand.statistik.tage);
}

/** Anzahl aufeinanderfolgender Lerntage bis heute (oder bis gestern, wenn heute noch nichts gelernt wurde). */
export function serie() {
  const tage = stand.statistik.tage;
  let tag = tagText();
  if (!tage[tag]?.a) tag = tagPlus(tag, -1);
  let anzahl = 0;
  while (tage[tag]?.a) {
    anzahl++;
    tag = tagPlus(tag, -1);
  }
  return anzahl;
}

export function hatFortschritt() {
  return Object.keys(stand.module).length > 0 || Object.keys(stand.statistik.tage).length > 0 || stand.merkliste.length > 0;
}

// ---------- Merkliste ----------
// Feste Fragen werden über Modul und ID gemerkt. Bei erzeugten Rechenaufgaben wird die
// konkrete Aufgabe mitgespeichert (frage), damit sie genau so wieder erscheint.

export function merkliste() {
  return structuredClone(stand.merkliste);
}

export function istGemerkt(schluessel) {
  return stand.merkliste.some((e) => e.schluessel === schluessel);
}

export function merken(eintrag) {
  if (istGemerkt(eintrag.schluessel)) return;
  stand.merkliste = [{ ...eintrag, gemerkt: eintrag.gemerkt ?? new Date().toISOString() }, ...stand.merkliste];
  schreiben(SCHLUESSEL_STAND, stand);
}

export function vergessen(schluessel) {
  stand.merkliste = stand.merkliste.filter((e) => e.schluessel !== schluessel);
  schreiben(SCHLUESSEL_STAND, stand);
}

export function letzteSicherung() {
  return meta.letzteSicherung ? new Date(meta.letzteSicherung) : null;
}

export function tageSeitSicherung() {
  const datum = letzteSicherung();
  return datum ? Math.floor((Date.now() - datum.getTime()) / 86_400_000) : null;
}

/**
 * Speichert den Lernstand als Datei. Auf dem Handy öffnet sich das Teilen-Menü
 * (z. B. „In Dateien sichern“), am PC wird die Datei heruntergeladen.
 * Gibt false zurück, wenn der Nutzer abgebrochen hat.
 */
export async function sichern() {
  const inhalt = JSON.stringify({
    format: FORMAT,
    version: VERSION,
    app: 'AeroTrainer',
    exportiert: new Date().toISOString(),
    module: stand.module,
    statistik: stand.statistik,
    merkliste: stand.merkliste,
    einstellungen,
  }, null, 2);
  const datei = new File([inhalt], DATEINAME, { type: 'application/json' });

  const touchGeraet = matchMedia('(pointer: coarse)').matches;
  if (touchGeraet && navigator.canShare?.({ files: [datei] })) {
    try {
      await navigator.share({ files: [datei] });
    } catch (fehler) {
      if (fehler.name === 'AbortError') return false;
      throw fehler;
    }
  } else {
    const url = URL.createObjectURL(datei);
    const link = Object.assign(document.createElement('a'), { href: url, download: DATEINAME });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  meta.letzteSicherung = new Date().toISOString();
  schreiben(SCHLUESSEL_META, meta);
  return true;
}

/** Liest eine Lernstand-Datei ein und ersetzt den Lernstand auf diesem Gerät. */
export async function importieren(datei) {
  let daten;
  try {
    daten = JSON.parse(await datei.text());
  } catch {
    throw new Error('Die Datei konnte nicht gelesen werden. Ist es wirklich eine Lernstand-Datei (.json)?');
  }
  if (daten?.format !== FORMAT || !Number.isInteger(daten.version)) {
    throw new Error('Das ist keine Lernstand-Datei dieser App.');
  }
  if (daten.version > VERSION) {
    throw new Error('Die Datei stammt aus einer neueren Version der App. Bitte lade die App neu und versuche es dann noch einmal.');
  }
  while (daten.version < VERSION) {
    const umwandeln = MIGRATIONEN[daten.version];
    if (!umwandeln) throw new Error(`Dateiversion ${daten.version} wird nicht unterstützt.`);
    daten = umwandeln(daten);
  }
  if (typeof daten.module !== 'object' || daten.module === null || Array.isArray(daten.module)) {
    throw new Error('Die Lernstand-Datei ist beschädigt.');
  }

  stand = vervollstaendigen(daten);
  schreiben(SCHLUESSEL_STAND, stand);
  if (daten.einstellungen && typeof daten.einstellungen === 'object') {
    einstellungen = { ...einstellungen, ...daten.einstellungen };
    schreiben(SCHLUESSEL_EINSTELLUNGEN, einstellungen);
  }

  // Die geladene Datei ist selbst eine Sicherung – ihr Datum zählt als letzte Sicherung.
  const exportiert = new Date(daten.exportiert);
  meta.letzteSicherung = (Number.isNaN(exportiert.getTime()) ? new Date() : exportiert).toISOString();
  schreiben(SCHLUESSEL_META, meta);
}

export function zuruecksetzen() {
  stand = vervollstaendigen({});
  meta = { letzteSicherung: null };
  schreiben(SCHLUESSEL_STAND, stand);
  schreiben(SCHLUESSEL_META, meta);
}

/** Bittet den Browser, die Daten nicht automatisch zu löschen (nicht überall wirksam). */
export function dauerhaftenSpeicherAnfragen() {
  navigator.storage?.persist?.().catch(() => {});
}
