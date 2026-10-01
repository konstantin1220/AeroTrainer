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

export function statistik(ids, karten, heute = tagText()) {
  let neu = 0, faellig = 0, sicher = 0;
  for (const id of ids) {
    const karte = karten[id];
    if (!karte) neu++;
    else {
      if (istFaellig(karte, heute)) faellig++;
      if (istSicher(karte)) sicher++;
    }
  }
  return { gesamt: ids.length, neu, faellig, sicher, gesehen: ids.length - neu };
}
