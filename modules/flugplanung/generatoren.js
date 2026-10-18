// Rechenaufgaben für „Flugplanung“ – jedes Mal mit neuen Zahlen.
// Flugzeug- und Platzdaten (frei erfunden) kommen aus content/flugzeug.json.
import { uebungskarte } from '../navigation/abbildungen.js';
import { winddreieck, steuerkursWeg, grundgeschwindigkeitWeg } from '../navigation/generatoren.js';
import { WEGPUNKTE, kursEntfernung, durchKontrollzone, kraftstoffPlan, endreserveMinuten, reiseflughoehen, startstrecke, tabellenWeg, MISSWEISUNG } from './rechnen.js';

const grad3 = (g) => String(Math.round(((g % 360) + 360) % 360) || 360).padStart(3, '0');
const komma = (n, s = 0) => Number(n.toFixed(s)).toLocaleString('de-DE', { minimumFractionDigits: s, maximumFractionDigits: s });
const runden = (n, s = 0) => Number(n.toFixed(s));
/** Ergebnis wie in der Lösung: höchstens s Nachkommastellen, ohne „,0“. */
const ergebnis = (n, s = 1) => runden(n, s).toLocaleString('de-DE', { maximumFractionDigits: s, useGrouping: false });
const uhr = (min) => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const zwei = (n) => String(n).padStart(2, '0');

/** Rechenweg der Startstrecke: Tabellenwert, dann jede Korrektur nacheinander. */
function startstreckeWeg(e, hoehe, temperatur, flugzeug) {
  const t = flugzeug.startstrecke;
  const tw = tabellenWeg(t, hoehe, temperatur);
  const schritte = [];
  if (t.hoehen.includes(hoehe) && t.temperaturen.includes(temperatur)) {
    schritte.push(`Tabelle für ${hoehe} ft und ${temperatur} °C: **${Math.round(e.basis)} m**.`);
  } else {
    const [h0, h1] = tw.hoehen, [t0, t1] = tw.temperaturen;
    schritte.push(`Aus der Tabelle: ${h0} ft → ${tw.werte[0][0]} m (${t0} °C) und ${tw.werte[0][1]} m (${t1} °C); ${h1} ft → ${tw.werte[1][0]} m und ${tw.werte[1][1]} m.`);
    schritte.push(`Anteilig für ${temperatur} °C: ${h0} ft ≈ ${Math.round(tw.oben)} m, ${h1} ft ≈ ${Math.round(tw.unten)} m. Dann anteilig für ${hoehe} ft: **${Math.round(e.basis)} m**.`);
  }
  let wert = e.basis;
  for (const k of e.korrekturen) {
    const neu = wert * (1 + k.anteil);
    schritte.push(`${k.text}: ${k.anteil > 0 ? '+' : '−'}${Math.round(Math.abs(k.anteil) * 100)} % → ${Math.round(wert)} m × ${komma(1 + k.anteil, 2)} = **${Math.round(neu)} m**.`);
    wert = neu;
  }
  if (!e.korrekturen.length) schritte.push('Keine Korrekturen – Asphalt, Windstille und höchstzulässige Startmasse.');
  return schritte;
}

/** Halbkreisflugregel als Rechenweg. */
function halbkreisWeg(kurs, ergebnis) {
  const ost = ((kurs % 360) + 360) % 360 < 180;
  return [
    `Kurs über Grund ${grad3(kurs)}° liegt ${ost ? 'zwischen 000° und 179°' : 'zwischen 180° und 359°'}.`,
    ost ? 'Dafür gilt: **ungerade Tausender plus 500 ft** – FL 035, 055, 075, 095 …' : 'Dafür gilt: **gerade Tausender plus 500 ft** – FL 045, 065, 085, 105 …',
    `Passend ist hier: **${ergebnis}**.`,
  ];
}

export function erstelleGeneratoren(flugzeug) {
  const plaetze = flugzeug.plaetze;
  return {
    /** Gesamter Kraftstoffbedarf: Rollen + Strecke + 10 % + Endreserve 30 min */
    kraftstoffbedarf(z) {
      const nm = z.ganz(20, 90);
      const gs = z.ganz(85, 120, 5);
      const verbrauch = z.ganz(24, 36, 2);
      const minuten = (nm / gs) * 60;
      const p = kraftstoffPlan({ minuten, verbrauch, rollen: flugzeug.rollKraftstoff, zuschlag: 0.1, reserveMinuten: 30 });
      return {
        typ: 'zahl',
        frage: `Überlandflug am Tag: **${nm} NM** bei **${gs} kt** Grundgeschwindigkeit, Verbrauch **${verbrauch} l/h**. Wie viel Kraftstoff brauchst du mindestens – mit ${flugzeug.rollKraftstoff} l zum Rollen, 10 % Zuschlag auf die Strecke und 30 Minuten Endreserve?`,
        loesung: runden(p.gesamt, 1),
        toleranz: runden(Math.max(1, p.gesamt * 0.04), 1),
        einheit: 'l',
        rechenweg: [
          `Flugzeit: ${nm} NM ÷ ${gs} kt = ${komma(minuten / 60, 3)} h ≈ **${komma(minuten)} min**.`,
          `Strecke: ${komma(minuten / 60, 3)} h × ${verbrauch} l/h ≈ **${komma(p.strecke, 1)} l**.`,
          `Zuschlag 10 %: ${komma(p.strecke, 1)} l × 0,1 ≈ **${komma(p.zuschlag, 1)} l**.`,
          `Endreserve 30 min: 0,5 h × ${verbrauch} l/h = **${komma(p.reserve, 1)} l**.`,
          `Dazu ${flugzeug.rollKraftstoff} l zum Rollen. Zusammen: ${flugzeug.rollKraftstoff} + ${komma(p.strecke, 1)} + ${komma(p.zuschlag, 1)} + ${komma(p.reserve, 1)} ≈ **${ergebnis(p.gesamt)} l**.`,
        ],
      };
    },

    /** Wie lange darfst du fliegen, ohne die Endreserve anzugreifen? */
    flugzeitMoeglich(z) {
      let liter, verbrauch, minuten;
      do {
        liter = z.ganz(40, 150, 5);
        verbrauch = z.ganz(24, 36, 2);
        minuten = ((liter - flugzeug.rollKraftstoff) / verbrauch) * 60 - 30;
      } while (minuten < 15);
      return {
        typ: 'zahl',
        frage: `An Bord sind **${liter} l** nutzbarer Kraftstoff, der Verbrauch beträgt **${verbrauch} l/h**, zum Rollen brauchst du ${flugzeug.rollKraftstoff} l. Wie viele Minuten darfst du fliegen, ohne die Endreserve von 30 Minuten anzugreifen?`,
        loesung: Math.round(minuten),
        toleranz: Math.max(2, Math.round(minuten * 0.03)),
        einheit: 'min',
        rechenweg: [
          `Für den Flug bleiben: ${liter} l − ${flugzeug.rollKraftstoff} l Rollen = **${liter - flugzeug.rollKraftstoff} l**.`,
          `So lange reicht das: ${liter - flugzeug.rollKraftstoff} l ÷ ${verbrauch} l/h = ${komma((liter - flugzeug.rollKraftstoff) / verbrauch, 2)} h ≈ **${Math.round(minuten + 30)} min**.`,
          `Die letzten 30 min sind die Endreserve: ${Math.round(minuten + 30)} − 30 = **${Math.round(minuten)} min**.`,
        ],
      };
    },

    /** Endreserve je nach Art des Fluges (AMC1 NCO.OP.125(b), Flugzeuge) */
    endreserve(z) {
      const fall = z.wahl([
        { text: 'Platzrunden in Altdorf am Nachmittag, du bleibst immer in Sichtweite des Platzes', min: endreserveMinuten({ inSichtDesStartplatzes: true }) },
        { text: 'Überlandflug am Tag von Altdorf nach Bergen', min: endreserveMinuten() },
        { text: 'Rundflug am Tag mit Start und Landung in Altdorf, aber außer Sichtweite des Platzes', min: endreserveMinuten() },
        { text: 'VFR-Flug bei Nacht von Musterstadt nach Altdorf', min: endreserveMinuten({ nacht: true }) },
      ]);
      return {
        typ: 'auswahl',
        frage: `Für welche Flugzeit soll die Kraftstoff-Endreserve deines Flugzeugs mindestens reichen? **${fall.text}**.`,
        richtig: `${fall.min} Minuten`,
        falsch: ['10 Minuten', '30 Minuten', '45 Minuten', '60 Minuten'].filter((t) => t !== `${fall.min} Minuten`).slice(0, 3),
        rechenweg: [
          'Nach AMC1 NCO.OP.125(b) für Flugzeuge: **10 min**, wenn Start und Landung am selben Platz sind und du ihn immer in Sicht behältst · **30 min** bei allen anderen Flügen am Tag · **45 min** nachts.',
          `Hier: ${fall.text} → **${fall.min} Minuten**.`,
        ],
        erklaerung: 'Gemeint ist jeweils die Zeit für einen Warteflug in 1500 ft über dem Ziel.',
      };
    },

    /** Halbkreisflugregel: passende Reiseflughöhe für einen Kurs über Grund */
    halbkreis(z) {
      const kurs = z.ganz(0, 35) * 10 + z.wahl([0, 5]);
      const passend = reiseflughoehen(kurs);
      const richtig = z.wahl(passend.slice(1, 4)); // ab FL 055/065 – sicher mehr als 3000 ft über Grund
      const andere = reiseflughoehen(kurs + 180);
      const fl = (h) => `FL ${String(h).padStart(3, '0')}`;
      const falsch = z.ziehen([...andere.filter((x) => Math.abs(x - richtig) <= 20), richtig - 5, richtig + 5].filter((x) => x > 30 && !passend.includes(x)), 3).map(fl);
      return {
        typ: 'auswahl',
        frage: `Du fliegst VFR mit einem Kurs über Grund von **${grad3(kurs)}°** mehr als 3000 ft über Grund. Welche dieser Reiseflughöhen passt zur Halbkreisflugregel?`,
        richtig: fl(richtig),
        falsch,
        rechenweg: halbkreisWeg(kurs, fl(richtig)),
      };
    },

    /** Etappe aus der Übungskarte: Grundgeschwindigkeit und Steuerkurs */
    etappe(z) {
      const paare = [['altdorf', 'whiskey'], ['whiskey', 'musterstadt'], ['altdorf', 'bergen'], ['musterstadt', 'november'], ['november', 'bergen'], ['altdorf', 'bgn'], ['bgn', 'seefeld'], ['neuheim', 'altdorf']];
      const [a, b] = z.wahl(paare).map((id) => WEGPUNKTE[id]);
      const { kurs, nm } = kursEntfernung(a, b);
      const rwk = Math.round(kurs / 5) * 5;
      const tas = z.ganz(90, 115, 5);
      const windR = z.ganz(0, 35) * 10;
      const windS = z.ganz(8, 25);
      const { luv, gs } = winddreieck(rwk, tas, windR, windS);
      const frageArt = z.wahl(['gs', 'mwsk', 'zeit']);
      const kopf = `Etappe **${a.name} → ${b.name}**: rechtweisender Kurs ${grad3(rwk)}°, ${komma(nm, 1)} NM. TAS ${tas} kt, Wind aus ${grad3(windR)}° mit ${windS} kt, Missweisung ${MISSWEISUNG}° Ost.`;
      if (frageArt === 'gs') return { typ: 'zahl', frage: `${kopf} Wie groß ist die Grundgeschwindigkeit?`, loesung: Math.round(gs), toleranz: 3, einheit: 'kt', rechenweg: grundgeschwindigkeitWeg(rwk, tas, windR, windS) };
      const mwsk = rwk + luv - MISSWEISUNG;
      if (frageArt === 'mwsk') {
        return {
          typ: 'zahl', frage: `${kopf} Welchen missweisenden Steuerkurs steuerst du?`, loesung: Math.round(((mwsk % 360) + 360) % 360) || 360, toleranz: 2, einheit: '°', kreis: true,
          rechenweg: [
            ...steuerkursWeg(rwk, tas, windR, windS),
            `Ostmissweisung abziehen: mwSK = rwSK − MW = ${grad3(rwk + luv)}° − ${MISSWEISUNG}° = **${grad3(mwsk)}°**.`,
          ],
        };
      }
      const min = (nm / gs) * 60;
      return {
        typ: 'zahl', frage: `${kopf} Wie lange dauert die Etappe?`, loesung: Math.round(min), toleranz: Math.max(1, Math.round(min * 0.06)), einheit: 'min',
        rechenweg: [
          ...grundgeschwindigkeitWeg(rwk, tas, windR, windS),
          `Zeit = Strecke ÷ GS × 60 = ${komma(nm, 1)} NM ÷ ${Math.round(gs)} kt × 60 ≈ **${Math.round(min)} min**.`,
        ],
      };
    },

    /** Voraussichtliche Ankunftszeit */
    eta(z) {
      const ab = z.ganz(7 * 60, 17 * 60, 5);
      const nm = z.ganz(25, 110);
      const gs = z.ganz(80, 125, 5);
      const min = (nm / gs) * 60;
      return {
        typ: 'auswahl',
        frage: `Abflug um **${uhr(ab)} UTC**, ${nm} NM bei ${gs} kt Grundgeschwindigkeit. Wann bist du voraussichtlich am Ziel (ETA)?`,
        richtig: `${uhr(ab + min)} UTC`,
        falsch: [...new Set([uhr(ab + min + 10), uhr(ab + min - 10), uhr(ab + (nm / (gs * 1.852)) * 60), uhr(ab + min + 60)])].filter((t) => t !== uhr(ab + min)).slice(0, 3).map((t) => `${t} UTC`),
        rechenweg: [
          `Flugzeit = Strecke ÷ GS × 60 = ${nm} NM ÷ ${gs} kt × 60 ≈ **${Math.round(min)} min**.`,
          `ETA = Abflug + Flugzeit: ${uhr(ab)} + ${Math.round(min)} min = **${uhr(ab + min)} UTC**.`,
        ],
      };
    },

    /** Startstrecke nach dem (erfundenen) Flughandbuch */
    startstrecke(z) {
      const p = z.wahl(plaetze);
      const temperatur = z.ganz(0, 30, 5);
      const masse = z.ganz(95, 115) * 10;
      const wind = z.wahl([0, 0, 5, 10, -2]);
      const nass = p.belag !== 'asphalt' && z.janein(0.3);
      const belag = p.belag === 'asphalt' ? 'asphalt' : nass ? 'grasNass' : 'grasTrocken';
      const e = startstrecke(flugzeug, { hoehe: p.hoehe, temperatur, masse, wind, belag });
      const lage = `${p.name} (${p.kennung}), ${p.hoehe} ft, QNH 1013 hPa, ${temperatur} °C, ${p.belag === 'asphalt' ? 'Asphalt' : nass ? 'nasses Gras' : 'trockenes Gras'}, Startmasse ${masse} kg, ${wind === 0 ? 'Windstille' : wind > 0 ? `${wind} kt Gegenwind` : `${-wind} kt Rückenwind`}.`;
      if (z.janein()) {
        return {
          typ: 'zahl',
          frage: `${flugzeug.name}: ${lage} Wie lang ist die Startstrecke über ein 15-m-Hindernis? (Tabelle und Korrekturen siehe Kapitel)`,
          loesung: Math.round(e.startstrecke),
          toleranz: Math.round(e.startstrecke * 0.04),
          einheit: 'm',
          rechenweg: [...startstreckeWeg(e, p.hoehe, temperatur, flugzeug), `Startstrecke über 15 m ≈ **${Math.round(e.startstrecke)} m**.`],
        };
      }
      return {
        typ: 'wahrfalsch',
        aussage: `${flugzeug.name}: ${lage} Die Piste mit ${p.laenge} m reicht für die Startstrecke über 15 m.`,
        richtig: e.startstrecke <= p.laenge,
        rechenweg: [
          ...startstreckeWeg(e, p.hoehe, temperatur, flugzeug),
          `Vergleich mit der Piste: ${Math.round(e.startstrecke)} m ${e.startstrecke <= p.laenge ? '≤' : '>'} ${p.laenge} m → **${e.startstrecke <= p.laenge ? 'reicht' : 'reicht nicht'}**.`,
        ],
        erklaerung: 'Plane zusätzlich eine Sicherheitsreserve ein – die Werte im Flughandbuch gelten für ein neues Flugzeug und gute Technik.',
      };
    },

    /** Führt die direkte Strecke durch die Kontrollzone? */
    kontrollzone(z) {
      const ids = ['altdorf', 'bergen', 'seefeld', 'neuheim', 'bgn'];
      let a, b;
      do { [a, b] = z.ziehen(ids, 2); } while (a === b);
      const pa = WEGPUNKTE[a], pb = WEGPUNKTE[b];
      const durch = durchKontrollzone(pa, pb);
      return {
        typ: 'wahrfalsch',
        aussage: `Die direkte Strecke von ${pa.name} nach ${pb.name} führt durch die Kontrollzone Musterstadt.`,
        svg: uebungskarte({ von: pa, nach: pb }),
        richtig: durch,
        erklaerung: durch
          ? 'Die Linie schneidet den gestrichelten Kreis der Kontrollzone. Dafür brauchst du eine Freigabe – oder du planst einen Umweg.'
          : 'Die Linie bleibt außerhalb des gestrichelten Kreises der Kontrollzone.',
      };
    },

    /** Einen (erfundenen) NOTAM lesen */
    notam(z) {
      const jahr = 26;
      const monat = z.ganz(4, 9);
      const tag = z.ganz(2, 24);
      const von = z.ganz(6, 12);
      const bis = von + z.ganz(3, 6);
      const art = z.wahl([
        { q: 'QMRLC', e: 'RWY 07/25 CLSD DUE TO WIP.', ort: 'XALT', deutsch: 'Piste 07/25 gesperrt wegen Bauarbeiten' },
        { q: 'QWPLW', e: 'PJE WILL TAKE PLACE WI 2NM RADIUS OF XBER.', ort: 'XBER', deutsch: 'Fallschirmspringen im Umkreis von 2 NM um Bergen' },
        { q: 'QOBCE', e: 'CRANE ERECTED 1NM NORTH OF THR 27, HGT 250FT AGL.', ort: 'XMUS', deutsch: 'Kran 1 NM nördlich der Schwelle 27, 250 ft hoch' },
        { q: 'QFAAH', e: 'AD HR OF SER 0800-1600.', ort: 'XNEU', deutsch: 'Geänderte Betriebszeiten des Flugplatzes' },
      ]);
      const datum = (h) => `${jahr}${zwei(monat)}${zwei(tag)}${zwei(h)}00`;
      const text = `A0${z.ganz(100, 999)}/${jahr} NOTAMN\nQ) XXXX/${art.q}/IV/BO/A/000/999/\nA) ${art.ort} B) ${datum(von)} C) ${datum(bis)}\nE) ${art.e}`;
      if (z.janein()) {
        const stunde = z.janein() ? z.ganz(von, bis - 1) : z.wahl([von - 1, bis, bis + 1].filter((x) => x >= 0 && x < 24));
        return {
          typ: 'wahrfalsch', code: text,
          aussage: `Am ${tag}.${monat}. um ${zwei(stunde)}:30 UTC gilt dieser NOTAM.`,
          richtig: stunde >= von && stunde < bis,
          rechenweg: [
            'B) ist der Beginn, C) das Ende – jeweils im Format **JJMMTThhmm** in UTC.',
            `B) ${datum(von)} → ${tag}.${monat}. um ${zwei(von)}:00 UTC · C) ${datum(bis)} → ${tag}.${monat}. um ${zwei(bis)}:00 UTC.`,
            `${zwei(stunde)}:30 UTC liegt ${stunde >= von && stunde < bis ? '**innerhalb** – der NOTAM gilt' : '**außerhalb** – der NOTAM gilt dann nicht'}.`,
          ],
        };
      }
      return {
        typ: 'auswahl', code: text,
        frage: 'Was besagt dieser (frei erfundene) NOTAM?',
        richtig: art.deutsch,
        falsch: ['Piste 07/25 gesperrt wegen Bauarbeiten', 'Fallschirmspringen im Umkreis von 2 NM um Bergen', 'Kran 1 NM nördlich der Schwelle 27, 250 ft hoch', 'Geänderte Betriebszeiten des Flugplatzes'].filter((t) => t !== art.deutsch),
        erklaerung: `Der Klartext steht in Zeile E). ${art.e.replace('.', '')} heißt: ${art.deutsch}.`,
      };
    },
  };
}
