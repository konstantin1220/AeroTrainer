// Verteilte Wiederholung (Spaced Repetition) nach dem Leitner-Prinzip.
//
// Jede Frage ist eine „Karte“ in einer von sechs Boxen (0–5).
// Richtig beantwortet → eine Box weiter, die nächste Wiederholung kommt später.
// Falsch beantwortet → zurück in Box 1, die Karte ist sofort wieder fällig.
//
// Gespeichert wird je Karte: { b: Box, f: fällig ab (JJJJ-MM-TT), r: richtig, x: falsch, z: zuletzt }

export const ABSTAND_TAGE = [0, 1, 3, 7, 16, 35];
export const HOECHSTE_BOX = ABSTAND_TAGE.length - 1;
export const SICHER_AB_BOX = 4;

export function tagText(datum = new Date()) {
  const j = datum.getFullYear();
  const m = String(datum.getMonth() + 1).padStart(2, '0');
  const t = String(datum.getDate()).padStart(2, '0');
  return `${j}-${m}-${t}`;
}

export function tagPlus(tag, tage) {
  const [j, m, t] = tag.split('-').map(Number);
  return tagText(new Date(j, m - 1, t + tage));
}

export function karteBewerten(karte, richtig, heute = tagText()) {
  const alt = karte ?? { b: 0, r: 0, x: 0 };
  const b = richtig ? Math.min(alt.b + 1, HOECHSTE_BOX) : 1;
  return {
    b,
    f: tagPlus(heute, richtig ? ABSTAND_TAGE[b] : 0),
    r: (alt.r ?? 0) + (richtig ? 1 : 0),
    x: (alt.x ?? 0) + (richtig ? 0 : 1),
    z: heute,
  };
}

export const istFaellig = (karte, heute = tagText()) => Boolean(karte) && karte.f <= heute;
export const istSicher = (karte) => Boolean(karte) && karte.b >= SICHER_AB_BOX;

// ---------- Lernstufen für die Fortschrittsanzeige ----------
// ungelernt       – noch nie beantwortet
// angefangen      – Fach 1: einmal beantwortet oder zuletzt falsch
// fortgeschritten – Fach 2 und 3: zwei- bis dreimal hintereinander richtig
// fertig          – ab Fach 4 (SICHER_AB_BOX): mindestens viermal hintereinander richtig
export const LERNSTUFEN = ['ungelernt', 'angefangen', 'fortgeschritten', 'fertig'];

export function lernstufe(karte) {
  if (!karte) return 'ungelernt';
  if (karte.b >= SICHER_AB_BOX) return 'fertig';
  return karte.b >= 2 ? 'fortgeschritten' : 'angefangen';
}

/** Anteil einer Frage am Lernfortschritt: jedes Fach bis „fertig“ ist ein Viertel (Fach 1 = ¼ … ab Fach 4 = ganz). */
export const fortschrittsPunkte = (karte) => (karte ? Math.min(Math.max(karte.b, 1), SICHER_AB_BOX) / SICHER_AB_BOX : 0);

function mischen(liste, zufall) {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

/**
 * Wählt die Karten für eine Lernrunde: zuerst fällige (die unsichersten zuerst),
 * dann neue in der vorgegebenen Reihenfolge.
 */
export function lernrunde(ids, karten, { anzahl = 10, neueHoechstens = 5, heute = tagText(), zufall = Math.random } = {}) {
  const faellig = mischen(ids.filter((id) => istFaellig(karten[id], heute)), zufall)
    .sort((a, b) => karten[a].b - karten[b].b);
  const runde = faellig.slice(0, anzahl);
  const platz = Math.min(anzahl - runde.length, neueHoechstens);
  if (platz > 0) runde.push(...ids.filter((id) => !karten[id]).slice(0, platz));
  return runde;
}

/** Freies Üben: alle Karten, die unsichersten und am längsten nicht gesehenen zuerst. */
export function uebungsrunde(ids, karten, { anzahl = 10, zufall = Math.random } = {}) {
  return mischen(ids, zufall)
    .sort((a, b) => (karten[a]?.b ?? -1) - (karten[b]?.b ?? -1) || (karten[a]?.z ?? '').localeCompare(karten[b]?.z ?? ''))
    .slice(0, anzahl);
}

/**
 * Zahlen für die Anzeige: gesamt, neu (= ungelernt), fällig, je Lernstufe, sicher (= fertig)
 * und der Lernfortschritt 0–1 (punkte ÷ gesamt; punkte lassen sich über Themen addieren).
 */
export function statistik(ids, karten, heute = tagText()) {
  let neu = 0, faellig = 0, angefangen = 0, fortgeschritten = 0, fertig = 0, punkte = 0;
  for (const id of ids) {
    const karte = karten[id];
    if (!karte) { neu++; continue; }
    if (istFaellig(karte, heute)) faellig++;
    const stufe = lernstufe(karte);
    if (stufe === 'fertig') fertig++;
    else if (stufe === 'fortgeschritten') fortgeschritten++;
    else angefangen++;
    punkte += fortschrittsPunkte(karte);
  }
  return {
    gesamt: ids.length, neu, faellig, gesehen: ids.length - neu,
    ungelernt: neu, angefangen, fortgeschritten, fertig, sicher: fertig,
    punkte, fortschritt: ids.length ? punkte / ids.length : 0,
  };
}

/** Zählt die Werte mehrerer Statistiken zusammen (z. B. alle Themen eines Fachs). */
export function statistikSumme(liste) {
  const summe = { gesamt: 0, neu: 0, faellig: 0, gesehen: 0, ungelernt: 0, angefangen: 0, fortgeschritten: 0, fertig: 0, sicher: 0, punkte: 0 };
  for (const s of liste) for (const k of Object.keys(summe)) summe[k] += s?.[k] ?? 0;
  return { ...summe, fortschritt: summe.gesamt ? summe.punkte / summe.gesamt : 0 };
}
