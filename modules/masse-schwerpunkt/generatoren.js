// Rechenaufgaben für „Masse & Schwerpunkt“ mit dem Übungsflugzeug aus content/flugzeug.json.
import { beladungRechnen, bewertung, grenzen, runden, BEWERTUNG_TEXT } from './rechnen.js';
import { huellkurve } from './abbildungen.js';

const komma = (wert, stellen = 2) => runden(wert, stellen).toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen, useGrouping: false });

/** Ganze Zahlen ohne, sonst mit einer Nachkommastelle (für Massen und Momente). */
const zahl = (n) => komma(n, Number.isInteger(runden(n, 1)) ? 0 : 1);

/** Rechenschritte für Masse und Schwerpunkt einer Beladung (ohne Zeilen mit 0 kg). */
function beladungsWeg(flugzeug, beladung, e, { schwerpunkt = true } = {}) {
  const zeilen = e.zeilen.filter((z) => z.masse > 0);
  const schritte = [`Kraftstoff in kg: ${beladung.kraftstoff} l × ${komma(flugzeug.kraftstoffDichte)} kg/l = **${zahl(beladung.kraftstoff * flugzeug.kraftstoffDichte)} kg**.`];
  if (schwerpunkt) {
    schritte.push(`Moment je Zeile = Masse × Hebelarm: ${zeilen.map((z) => `${zahl(z.masse)} × ${komma(z.arm)} = ${zahl(z.moment)}`).join(' · ')}.`);
    schritte.push(`Summe der Massen: **${zahl(e.masse)} kg** · Summe der Momente: **${zahl(e.moment)} kg·m**.`);
    schritte.push(`Schwerpunkt = Momente ÷ Masse = ${zahl(e.moment)} ÷ ${zahl(e.masse)} = **${komma(e.schwerpunkt, 3)} m**.`);
  } else {
    schritte.push(`Alle Massen addieren: ${zeilen.map((z) => zahl(z.masse)).join(' + ')} = **${zahl(e.masse)} kg**.`);
  }
  return schritte;
}

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
        rechenweg: [
          'Formel: **Moment = Masse × Hebelarm**.',
          `${masse} kg × ${komma(station.arm)} m = **${zahl(moment)} kg·m**.`,
        ],
        erklaerung: 'Je weiter hinten eine Last liegt, desto größer ist ihr Moment – und desto stärker schiebt sie den Schwerpunkt nach hinten.',
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
        rechenweg: [
          `AVGAS wiegt etwa **${komma(flugzeug.kraftstoffDichte)} kg je Liter**: Masse = Liter × Dichte.`,
          `${liter} l × ${komma(flugzeug.kraftstoffDichte)} kg/l = **${zahl(kg)} kg**.`,
        ],
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
        rechenweg: beladungsWeg(flugzeug, beladung, e, { schwerpunkt: false }),
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
        rechenweg: beladungsWeg(flugzeug, beladung, e),
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
        rechenweg: (() => {
          const schritte = beladungsWeg(flugzeug, beladung, e);
          schritte.push(`Höchstzulässige Startmasse ${flugzeug.mtom} kg: ${e.masse <= flugzeug.mtom ? 'eingehalten' : `**um ${zahl(e.masse - flugzeug.mtom)} kg überschritten**`}.`);
          const g = e.masse <= flugzeug.mtom ? grenzen(flugzeug.huellkurve, e.masse) : null;
          if (g) {
            const lage = e.schwerpunkt < g.vorn ? '**zu weit vorn**' : e.schwerpunkt > g.hinten ? '**zu weit hinten**' : '**innerhalb**';
            schritte.push(`Bei ${zahl(e.masse)} kg erlaubt die Hüllkurve ${komma(g.vorn, 3)} bis ${komma(g.hinten, 3)} m – ${komma(e.schwerpunkt, 3)} m liegt ${lage}.`);
          }
          schritte.push(`Also: **${BEWERTUNG_TEXT[ergebnis]}**.`);
          return schritte;
        })(),
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
        rechenweg: [
          'Formel: **Änderung = verlagerte Masse × Weg ÷ Gesamtmasse** – die Gesamtmasse bleibt dabei gleich.',
          `${masse} kg × ${komma(weg)} m = **${komma(masse * weg, 2)} kg·m**.`,
          `${komma(masse * weg, 2)} kg·m ÷ ${gesamt} kg = **${komma(aenderung, 4)} m**.`,
          `In Zentimetern: × 100 = **${komma(aenderung * 100, 1)} cm** nach hinten.`,
        ],
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
        rechenweg: [
          ...beladungsWeg(flugzeug, beladung, e, { schwerpunkt: false }),
          `Rest bis zur höchstzulässigen Startmasse: ${flugzeug.mtom} − ${zahl(e.masse)} = **${zahl(rest)} kg**.`,
        ],
      };
    },
  };
}
