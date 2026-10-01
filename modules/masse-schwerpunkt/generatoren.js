// Rechenaufgaben für „Masse & Schwerpunkt“ mit dem Übungsflugzeug aus content/flugzeug.json.
import { beladungRechnen, bewertung, runden, BEWERTUNG_TEXT } from './rechnen.js';
import { huellkurve } from './abbildungen.js';

const komma = (wert, stellen = 2) => runden(wert, stellen).toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

function zufallsBeladung(z, flugzeug) {
  const s = Object.fromEntries(flugzeug.stationen.map((st) => [st.id, st]));
  return {
    vorn: z.ganz(70, Math.min(200, s.vorn.max), 5),
    hinten: z.wahl([0, 0, z.ganz(55, s.hinten.max, 5)]),
    kraftstoff: z.ganz(4, s.kraftstoff.max / 10) * 10,
    gepaeck: z.ganz(0, s.gepaeck.max / 5) * 5,
  };
}

function beladungsTabelle(flugzeug, beladung) {
  const zeile = (name, wert, einheit, arm) => `${name.padEnd(11)} ${String(wert).padStart(4)} ${einheit.padEnd(2)} · ${komma(arm)} m`;
  return [
    `${'Station'.padEnd(11)} ${'Wert'.padStart(7)} · Hebelarm`,
    zeile('Leermasse', flugzeug.leermasse, 'kg', flugzeug.leerArm),
    ...flugzeug.stationen.map((st) => zeile(st.kurz ?? st.name, beladung[st.id], st.einheit, st.arm)),
  ].join('\n');
}

export function erstelleGeneratoren(flugzeug) {
  return {
    moment(z) {
      const masse = z.ganz(10, 120, 5);
      const station = z.wahl(flugzeug.stationen.filter((s) => s.einheit === 'kg'));
      const moment = masse * station.arm;
      return {
        typ: 'zahl',
        frage: `Auf „${station.name}“ (Hebelarm ${komma(station.arm)} m) lädst du **${masse} kg**. Wie groß ist das Moment?`,
        loesung: runden(moment, 1),
        toleranz: 0.5,
        einheit: 'kg·m',
        erklaerung: `Moment = Masse × Hebelarm = ${masse} kg × ${komma(station.arm)} m = ${komma(moment, 1)} kg·m.`,
      };
    },

    kraftstoffmasse(z) {
      const liter = z.ganz(20, 150, 5);
      const kg = liter * flugzeug.kraftstoffDichte;
      return {
        typ: 'zahl',
        frage: `Wie schwer sind **${liter} l AVGAS** (Dichte ${komma(flugzeug.kraftstoffDichte)} kg/l)?`,
        loesung: runden(kg, 1),
        toleranz: 0.5,
        einheit: 'kg',
        erklaerung: `${liter} l × ${komma(flugzeug.kraftstoffDichte)} kg/l = ${komma(kg, 1)} kg.`,
      };
    },

    gesamtmasse(z) {
      const beladung = zufallsBeladung(z, flugzeug);
      const e = beladungRechnen(flugzeug, beladung);
      return {
        typ: 'zahl',
        frage: `${flugzeug.name}: Wie groß ist die Startmasse mit dieser Beladung?`,
        code: beladungsTabelle(flugzeug, beladung),
        hinweis: `Kraftstoff: ${komma(flugzeug.kraftstoffDichte)} kg/l.`,
        loesung: runden(e.masse, 1),
        toleranz: 1,
        einheit: 'kg',
        erklaerung: `Summe aller Massen (Kraftstoff ${beladung.kraftstoff} l = ${komma(beladung.kraftstoff * flugzeug.kraftstoffDichte, 1)} kg): ${komma(e.masse, 1)} kg.`,
      };
    },

    schwerpunkt(z) {
      const beladung = zufallsBeladung(z, flugzeug);
      const e = beladungRechnen(flugzeug, beladung);
      return {
        typ: 'zahl',
        frage: `${flugzeug.name}: Wo liegt der Schwerpunkt mit dieser Beladung (in m hinter der Bezugsebene)?`,
        code: beladungsTabelle(flugzeug, beladung),
        hinweis: `Kraftstoff: ${komma(flugzeug.kraftstoffDichte)} kg/l. Ein Taschenrechner ist erlaubt.`,
        loesung: runden(e.schwerpunkt, 3),
        toleranz: 0.01,
        einheit: 'm',
        erklaerung: `Gesamtmoment ${komma(e.moment, 1)} kg·m ÷ Gesamtmasse ${komma(e.masse, 1)} kg = ${komma(e.schwerpunkt, 3)} m.`,
      };
    },

    zulaessig(z) {
      // Gezielt verschiedene Fälle erzeugen: zulässig, zu schwer, Schwerpunkt zu weit hinten
      const ziel = z.wahl(['ok', 'ok', 'schwer', 'hinten']);
      let beladung = zufallsBeladung(z, flugzeug);
      let e = beladungRechnen(flugzeug, beladung);
      for (let versuch = 0; versuch < 300 && bewertung(flugzeug, e) !== ziel; versuch++) {
        beladung = zufallsBeladung(z, flugzeug);
        if (ziel === 'hinten') { beladung.vorn = z.ganz(70, 90, 5); beladung.hinten = z.ganz(140, 200, 5); beladung.gepaeck = z.ganz(30, 50, 5); }
        e = beladungRechnen(flugzeug, beladung);
      }
      const ergebnis = bewertung(flugzeug, e);
      return {
        typ: 'auswahl',
        frage: `${flugzeug.name}: Darf das Flugzeug mit dieser Beladung starten? Prüfe mit der Hüllkurve.`,
        code: beladungsTabelle(flugzeug, beladung),
        svg: huellkurve(flugzeug),
        hinweis: `Kraftstoff: ${komma(flugzeug.kraftstoffDichte)} kg/l.`,
        richtig: BEWERTUNG_TEXT[ergebnis],
        falsch: Object.entries(BEWERTUNG_TEXT).filter(([k]) => k !== ergebnis).map(([, t]) => t),
        erklaerung: `Masse ${komma(e.masse, 1)} kg, Schwerpunkt ${komma(e.schwerpunkt, 3)} m.`,
      };
    },

    verschiebung(z) {
      const gesamt = z.ganz(900, 1140, 10);
      const masse = z.ganz(10, 90, 5);
      const weg = z.wahl([0.46, 0.55, 0.91, 1.46]);
      const aenderung = (masse * weg) / gesamt;
      return {
        typ: 'zahl',
        frage: `Ein Flugzeug wiegt **${gesamt} kg**. Du verlagerst **${masse} kg** um **${komma(weg)} m** nach hinten. Um wie viele **Zentimeter** wandert der Schwerpunkt?`,
        loesung: runden(aenderung * 100, 1),
        toleranz: 0.3,
        einheit: 'cm',
        erklaerung: `Schwerpunktänderung = verlagerte Masse × Weg ÷ Gesamtmasse = ${masse} × ${komma(weg)} ÷ ${gesamt} = ${komma(aenderung, 4)} m ≈ ${komma(aenderung * 100, 1)} cm nach hinten.`,
      };
    },

    restzuladung(z) {
      const beladung = zufallsBeladung(z, flugzeug);
      beladung.gepaeck = 0;
      let e = beladungRechnen(flugzeug, beladung);
      while (e.masse > flugzeug.mtom - 5) {
        beladung.kraftstoff -= 10;
        e = beladungRechnen(flugzeug, beladung);
      }
      const rest = flugzeug.mtom - e.masse;
      return {
        typ: 'zahl',
        frage: `Wie viel Gepäck darfst du höchstens zuladen, bis die höchstzulässige Startmasse von ${flugzeug.mtom} kg erreicht ist?`,
        code: beladungsTabelle(flugzeug, beladung),
        hinweis: `Kraftstoff: ${komma(flugzeug.kraftstoffDichte)} kg/l. Die Höchstlast des Gepäckraums lässt du hier außer Acht.`,
        loesung: runden(rest, 1),
        toleranz: 1,
        einheit: 'kg',
        erklaerung: `${flugzeug.mtom} kg − ${komma(e.masse, 1)} kg = ${komma(rest, 1)} kg.`,
      };
    },
  };
}
