// Fragetypen: Prüfen der Antworten und Kontrolle der Fragedaten.
// Reines JavaScript ohne Oberfläche – wird auch von den Tests genutzt.
//
// Fragetypen (so stehen sie in den Inhaltsdateien):
//   auswahl     { frage, richtig: "Text", falsch: ["…", "…"] }          – eine richtige Antwort
//   mehrfach    { frage, richtig: ["…", "…"], falsch: ["…"] }           – mehrere richtige Antworten
//   wahrfalsch  { aussage, richtig: true | false }
//   zahl        { frage, loesung: 12, toleranz: 1, einheit: "kt" }      – Zahleneingabe (kreis: true bei Kursen)
//   zuordnung   { frage, paare: [["links", "rechts"], …] }              – Paare zuordnen
// Alle Typen können zusätzlich haben: erklaerung, abbildung (Name einer Abbildung).

export const FRAGETYPEN = ['auswahl', 'mehrfach', 'wahrfalsch', 'zahl', 'zuordnung'];

/** Liest eine Zahl wie „1,5“, „-3“ oder „−12“. Gibt null zurück, wenn es keine Zahl ist. */
export function zahlLesen(eingabe) {
  const text = String(eingabe ?? '').trim().replace(/\s+/g, '').replace('−', '-').replace(',', '.');
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(text)) return null;
  return Number(text);
}

export function zahlText(wert, nachkomma = 0) {
  const gerundet = Number(wert.toFixed(nachkomma));
  return gerundet.toLocaleString('de-DE', { maximumFractionDigits: nachkomma, useGrouping: false }).replace('-', '−');
}

/** Prüft eine Antwort. Gibt true zurück, wenn sie richtig ist. */
export function bewerten(frage, antwort) {
  switch (frage.typ) {
    case 'auswahl':
      return antwort === frage.richtig;
    case 'wahrfalsch':
      return antwort === frage.richtig;
    case 'mehrfach': {
      const gewaehlt = new Set(antwort ?? []);
      return gewaehlt.size === frage.richtig.length && frage.richtig.every((r) => gewaehlt.has(r));
    }
    case 'zahl': {
      const wert = zahlLesen(antwort);
      if (wert === null) return false;
      // Bei Kursen (kreis: true) sind z. B. 360° und 000° gleich.
      const abstand = frage.kreis ? Math.abs((((wert - frage.loesung) % 360) + 540) % 360 - 180) : Math.abs(wert - frage.loesung);
      return abstand <= (frage.toleranz ?? 0) + 1e-9;
    }
    case 'zuordnung':
      return Array.isArray(antwort) && frage.paare.every(([, rechts], i) => antwort[i] === rechts);
    default:
      return false;
  }
}

/** Die richtige Antwort als lesbarer Text (für die Rückmeldung). */
export function loesungText(frage) {
  switch (frage.typ) {
    case 'auswahl': return frage.richtig;
    case 'wahrfalsch': return frage.richtig ? 'Die Aussage stimmt.' : 'Die Aussage stimmt nicht.';
    case 'mehrfach': return frage.richtig.join(' · ');
    case 'zahl': {
      const nachkomma = String(frage.loesung).split('.')[1]?.length ?? 0;
      const wert = frage.kreis ? String(Math.round(frage.loesung) % 360 || 360).padStart(3, '0') : zahlText(frage.loesung, Math.min(nachkomma, 2));
      const spanne = frage.toleranz ? ` (± ${zahlText(frage.toleranz, 2)})` : '';
      return `${wert}${frage.einheit ? ` ${frage.einheit}` : ''}${spanne}`;
    }
    case 'zuordnung': return frage.paare.map(([l, r]) => `${l} → ${r}`).join(' · ');
    default: return '';
  }
}

/** Sucht Fehler in einer Frage. Gibt eine Beschreibung zurück oder null, wenn alles passt. */
export function frageProblem(frage) {
  if (!frage || typeof frage !== 'object') return 'keine Frage';
  if (!FRAGETYPEN.includes(frage.typ)) return `unbekannter Fragetyp „${frage.typ}“`;
  const text = frage.typ === 'wahrfalsch' ? frage.aussage : frage.frage;
  if (typeof text !== 'string' || !text.trim()) return 'Fragetext fehlt';
  const doppelt = (liste) => new Set(liste).size !== liste.length;

  switch (frage.typ) {
    case 'auswahl':
      if (typeof frage.richtig !== 'string' || !frage.richtig) return 'richtige Antwort fehlt';
      if (!Array.isArray(frage.falsch) || frage.falsch.length < 1) return 'falsche Antworten fehlen';
      if (doppelt([frage.richtig, ...frage.falsch])) return 'Antworten doppelt';
      break;
    case 'mehrfach':
      if (!Array.isArray(frage.richtig) || frage.richtig.length < 1) return 'richtige Antworten fehlen';
      if (!Array.isArray(frage.falsch)) return 'falsche Antworten fehlen';
      if (doppelt([...frage.richtig, ...frage.falsch])) return 'Antworten doppelt';
      break;
    case 'wahrfalsch':
      if (typeof frage.richtig !== 'boolean') return 'richtig muss true oder false sein';
      break;
    case 'zahl':
      if (typeof frage.loesung !== 'number' || !Number.isFinite(frage.loesung)) return 'Lösung fehlt oder ist keine Zahl';
      if (frage.toleranz !== undefined && !(frage.toleranz >= 0)) return 'Toleranz ungültig';
      break;
    case 'zuordnung':
      if (!Array.isArray(frage.paare) || frage.paare.length < 2) return 'mindestens zwei Paare nötig';
      if (frage.paare.some((p) => !Array.isArray(p) || p.length !== 2)) return 'Paare ungültig';
      if (doppelt(frage.paare.map((p) => p[0]))) return 'linke Seite doppelt';
      break;
  }
  return null;
}
