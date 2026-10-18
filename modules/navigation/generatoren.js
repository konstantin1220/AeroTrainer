// Rechenaufgaben für das Modul „Navigation“ – jedes Mal mit neuen Zahlen.
// Konventionen: Missweisung und Deviation nach Osten positiv; Winkel in Grad.
import { ORTE, kursUndEntfernung, uebungskarte, symbolBild, SYMBOLE } from './abbildungen.js';

const RAD = Math.PI / 180;
const grad3 = (g) => String(Math.round(((g % 360) + 360) % 360) || 360).padStart(3, '0');
const runden = (wert, stellen = 0) => Number(wert.toFixed(stellen));

/** Winddreieck: Luvwinkel und Grundgeschwindigkeit. Wind „aus“ windRichtung. */
export function winddreieck(kurs, tas, windRichtung, windStaerke) {
  const theta = (windRichtung - kurs) * RAD;
  const seitenwind = windStaerke * Math.sin(theta); // positiv = Wind von rechts
  const luv = Math.asin(seitenwind / tas) / RAD;
  const gs = tas * Math.cos(luv * RAD) - windStaerke * Math.cos(theta);
  return { luv, gs };
}

const komma = (n, s = 1) => runden(n, s).toLocaleString('de-DE', { useGrouping: false }).replace('-', '−');
const vz = (n) => (n > 0 ? `+${n}` : String(n).replace('-', '−'));
/** Windeinfallswinkel: −180 … +180°, positiv = Wind von rechts. */
const einfall = (windRichtung, kurs) => ((windRichtung - kurs + 540) % 360) - 180;

/** Rechenweg für Kurs minus Korrektur (Missweisung, Deviation) – mit Übertrag über 360°. */
function kursMinus(kurs, wert, name) {
  const roh = kurs - wert;
  const ergebnis = roh <= 0 ? roh + 360 : roh > 360 ? roh - 360 : roh;
  const teile = [wert > 0 ? `${grad3(kurs)}° − ${wert}°` : `${grad3(kurs)}° − (−${-wert}°) = ${grad3(kurs)}° + ${-wert}°`];
  if (roh <= 0) teile.push(`${vz(roh)}° → plus 360°`);
  if (roh > 360) teile.push(`${roh}° → minus 360°`);
  return [
    `${name} ${Math.abs(wert)}° ${wert > 0 ? 'Ost' : 'West'} → **${vz(wert)}°** (Ost zählt positiv, West negativ).`,
    `${teile.join(' = ')} = **${grad3(ergebnis)}°**.`,
  ];
}

function missweisungText(mw) {
  return mw >= 0 ? `${mw}° Ost (+${mw}°)` : `${-mw}° West (${mw}°)`;
}

function uhrzeit(minuten) {
  const m = ((minuten % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Steuerkurs mit der Faustformel – und dem genauen Wert, falls er davon abweicht. */
export function steuerkursWeg(kurs, tas, windRichtung, windStaerke) {
  const d = einfall(windRichtung, kurs);
  const seite = d > 0 ? 'rechts' : 'links';
  const groesster = (60 * windStaerke) / tas;
  const anteil = Math.abs(Math.sin(d * RAD));
  const faust = groesster * anteil;
  const { luv } = winddreieck(kurs, tas, windRichtung, windStaerke);
  const genau = (kurs + luv + 360) % 360;
  const ueberschlag = (kurs + (d > 0 ? 1 : -1) * Math.round(faust) + 360) % 360;
  return [
    `Windeinfallswinkel: Wind aus ${grad3(windRichtung)}°, Kurs ${grad3(kurs)}° → der Wind kommt **${Math.abs(d)}° von ${seite}**.`,
    `Größter Luvwinkel ≈ 60 × Wind ÷ TAS = 60 × ${windStaerke} ÷ ${tas} ≈ **${komma(groesster)}°**.`,
    `Seitenwindanteil bei ${Math.abs(d)}°: × ${komma(anteil, 2)} (Faustwerte: 30° → 0,5 · 45° → 0,7 · 60° → 0,9 · 90° → 1) → Luvwinkel ≈ **${Math.round(faust)}°**.`,
    `Nase in den Wind, also nach ${seite}: ${grad3(kurs)}° ${d > 0 ? '+' : '−'} ${Math.round(faust)}° = **${grad3(ueberschlag)}°**`
      + (grad3(ueberschlag) === grad3(genau) ? '.' : ` – genau gerechnet **${grad3(genau)}°**, beides gilt als richtig.`),
  ];
}

/** Grundgeschwindigkeit: Gegen- oder Rückenwindanteil, bei viel Seitenwind etwas weniger durch das Vorhalten. */
export function grundgeschwindigkeitWeg(kurs, tas, windRichtung, windStaerke) {
  const d = einfall(windRichtung, kurs);
  const cos = Math.cos(d * RAD);
  const gegen = windStaerke * cos;
  const { luv, gs } = winddreieck(kurs, tas, windRichtung, windStaerke);
  const grob = tas - gegen;
  const schritte = [
    `Windeinfallswinkel: Wind aus ${grad3(windRichtung)}°, Kurs ${grad3(kurs)}° → **${Math.abs(d)}°** ${Math.abs(d) < 90 ? 'von vorn' : Math.abs(d) > 90 ? 'von hinten' : 'genau von der Seite'}.`,
    Math.abs(d) === 90
      ? 'Genau von der Seite: kein Gegen- und kein Rückenwindanteil.'
      : `${gegen > 0 ? 'Gegenwindanteil' : 'Rückenwindanteil'} = Wind × cos ${Math.abs(d)}° = ${windStaerke} × ${komma(Math.abs(cos), 2)} ≈ **${Math.round(Math.abs(gegen))} kt** (Faustwerte: 30° → 0,9 · 45° → 0,7 · 60° → 0,5 · 90° → 0).`,
    `GS ≈ TAS ${gegen >= 0 ? '−' : '+'} ${gegen >= 0 ? 'Gegenwind' : 'Rückenwind'} = ${tas} ${gegen >= 0 ? '−' : '+'} ${Math.round(Math.abs(gegen))} = **${Math.round(grob)} kt**.`,
  ];
  if (Math.round(grob) !== Math.round(gs)) {
    schritte.push(`Weil du ${Math.abs(Math.round(luv))}° vorhältst, geht noch etwas verloren (TAS × cos Luvwinkel): genau **${Math.round(gs)} kt**.`);
  }
  return schritte;
}

export const generatoren = {
  einheiten(z) {
    const art = z.wahl(['nm-km', 'km-nm', 'ft-m', 'm-ft', 'kt-kmh']);
    if (art === 'nm-km') {
      const nm = z.ganz(5, 80);
      return { typ: 'zahl', frage: `Wie viele Kilometer sind **${nm} NM**?`, loesung: runden(nm * 1.852, 1), toleranz: runden(Math.max(1, nm * 1.852 * 0.02), 1), einheit: 'km', rechenweg: ['1 NM = **1,852 km**.', `${nm} × 1,852 = **${komma(nm * 1.852)} km**.`, `Zum Überschlagen: × 2 und 10 % weg → ${nm * 2} − ${komma(nm * 0.2)} ≈ ${komma(nm * 1.8)} km.`] };
    }
    if (art === 'km-nm') {
      const km = z.ganz(10, 150, 5);
      return { typ: 'zahl', frage: `Wie viele nautische Meilen sind **${km} km**?`, loesung: runden(km / 1.852, 1), toleranz: runden(Math.max(1, (km / 1.852) * 0.02), 1), einheit: 'NM', rechenweg: ['1 NM = 1,852 km – also teilst du durch **1,852**.', `${km} ÷ 1,852 = **${komma(km / 1.852)} NM**.`, `Zum Überschlagen: halbieren und 10 % dazu → ${komma(km / 2)} + ${komma(km / 20)} ≈ ${komma(km * 0.55)} NM.`] };
    }
    if (art === 'ft-m') {
      const ft = z.ganz(5, 100) * 100;
      return { typ: 'zahl', frage: `Wie viele Meter sind **${ft} ft**?`, loesung: Math.round(ft * 0.3048), toleranz: Math.round(Math.max(10, ft * 0.3048 * 0.02)), einheit: 'm', rechenweg: ['1 ft = **0,3048 m**.', `${ft} × 0,3048 ≈ **${Math.round(ft * 0.3048)} m**.`, `Zum Überschlagen: × 3 ÷ 10 → ${ft} × 3 ÷ 10 = ${ft * 3 / 10} m.`] };
    }
    if (art === 'm-ft') {
      const m = z.ganz(1, 40) * 100;
      return { typ: 'zahl', frage: `Wie viele Fuß sind **${m} m**?`, loesung: Math.round(m / 0.3048), toleranz: Math.round(Math.max(30, (m / 0.3048) * 0.02)), einheit: 'ft', rechenweg: ['1 ft = 0,3048 m – also teilst du durch **0,3048** (das ist dasselbe wie × 3,28).', `${m} ÷ 0,3048 ≈ **${Math.round(m / 0.3048)} ft**.`, `Zum Überschlagen: × 3,3 → ${m} × 3,3 = ${komma(m * 3.3, 0)} ft.`] };
    }
    const kt = z.ganz(40, 150, 5);
    return { typ: 'zahl', frage: `Wie viele km/h sind **${kt} kt**?`, loesung: Math.round(kt * 1.852), toleranz: Math.round(Math.max(2, kt * 1.852 * 0.02)), einheit: 'km/h', rechenweg: ['1 kt = 1 NM pro Stunde = **1,852 km/h**.', `${kt} × 1,852 ≈ **${Math.round(kt * 1.852)} km/h**.`, `Zum Überschlagen: × 2 und 10 % weg → ${kt * 2} − ${komma(kt * 0.2, 0)} ≈ ${komma(kt * 1.8, 0)} km/h.`] };
  },

  zeitzone(z) {
    const sommer = z.janein();
    const versatz = sommer ? 2 : 1;
    const zone = sommer ? 'MESZ' : 'MEZ';
    const utc = z.ganz(5 * 60, 20 * 60, 15);
    const zuUtc = z.janein();
    const gegeben = zuUtc ? uhrzeit(utc + versatz * 60) : uhrzeit(utc);
    const richtig = zuUtc ? uhrzeit(utc) : uhrzeit(utc + versatz * 60);
    const falsch = zuUtc
      ? [uhrzeit(utc + 2 * versatz * 60), uhrzeit(utc + (sommer ? 60 : 120)), uhrzeit(utc + versatz * 60)]
      : [uhrzeit(utc - versatz * 60), uhrzeit(utc + (sommer ? 60 : 120)), uhrzeit(utc)];
    return {
      typ: 'auswahl',
      frage: zuUtc ? `Es ist **${gegeben} ${zone}**. Wie spät ist es in UTC?` : `Es ist **${gegeben} UTC**. Wie spät ist es in ${zone} (${sommer ? 'Sommerzeit' : 'Winterzeit'})?`,
      richtig,
      falsch: [...new Set(falsch)].filter((f) => f !== richtig),
      rechenweg: [
        `${zone} (${sommer ? 'Sommerzeit' : 'Winterzeit'}) = **UTC + ${versatz} h**.`,
        zuUtc ? `Von ${zone} nach UTC: ${versatz} h **abziehen**.` : `Von UTC nach ${zone}: ${versatz} h **dazuzählen**.`,
        `${gegeben} ${zuUtc ? '−' : '+'} ${versatz}:00 = **${richtig}${zuUtc ? ' UTC' : ` ${zone}`}**.`,
      ],
    };
  },

  missweisung(z) {
    const rwk = z.ganz(5, 355);
    const mw = z.wahl([2, 3, 4, 5, -3, -6, 8, -10]);
    const mwk = (rwk - mw + 360) % 360;
    return {
      typ: 'zahl',
      frage: `Rechtweisender Kurs **${grad3(rwk)}°**, Missweisung **${missweisungText(mw)}**. Wie groß ist der missweisende Kurs?`,
      loesung: mwk === 0 ? 360 : mwk,
      einheit: '°',
      kreis: true,
      rechenweg: ['Formel: **mwK = rwK − MW**.', ...kursMinus(rwk, mw, 'Missweisung')],
      erklaerung: 'Merksatz: Ostmissweisung abziehen, Westmissweisung dazuzählen.',
    };
  },

  kompasskurs(z) {
    const mwk = z.ganz(5, 355);
    const dev = z.wahl([-4, -3, -2, -1, 1, 2, 3, 4]);
    const kk = (mwk - dev + 360) % 360;
    return {
      typ: 'zahl',
      frage: `Missweisender Kurs **${grad3(mwk)}°**, laut Deviationstabelle beträgt die Deviation auf diesem Kurs **${dev > 0 ? '+' : ''}${dev}°**. Welchen Kompasskurs fliegst du?`,
      loesung: kk === 0 ? 360 : kk,
      einheit: '°',
      kreis: true,
      rechenweg: ['Formel: **KK = mwK − Dev** – die Deviation wird genauso behandelt wie die Missweisung.', ...kursMinus(mwk, dev, 'Deviation')],
    };
  },

  steuerkurs(z) {
    const kurs = z.ganz(1, 36) * 10;
    const tas = z.ganz(80, 130, 5);
    const windStaerke = z.ganz(10, 30, 5);
    const windRichtung = ((kurs + z.wahl([-90, -60, -45, -30, 30, 45, 60, 90, 120, -120])) % 360 + 360) % 360 || 360;
    const { luv } = winddreieck(kurs, tas, windRichtung, windStaerke);
    const sk = (kurs + luv + 360) % 360;
    return {
      typ: 'zahl',
      frage: `rwK **${grad3(kurs)}°**, Eigengeschwindigkeit (TAS) **${tas} kt**, Wind **${grad3(windRichtung)}°/${windStaerke} kt**. Welchen rechtweisenden Steuerkurs fliegst du?`,
      loesung: Math.round(sk) || 360,
      toleranz: 2,
      einheit: '°',
      kreis: true,
      hinweis: 'Faustformel: größter Luvwinkel ≈ 60 × Windgeschwindigkeit ÷ TAS, davon der Anteil je nach Windeinfallswinkel.',
      rechenweg: steuerkursWeg(kurs, tas, windRichtung, windStaerke),
    };
  },

  grundgeschwindigkeit(z) {
    const kurs = z.ganz(1, 36) * 10;
    const tas = z.ganz(80, 130, 5);
    const windStaerke = z.ganz(10, 30, 5);
    const windRichtung = ((kurs + z.wahl([0, 30, -30, 45, -45, 60, -60, 90, 135, -135, 180])) % 360 + 360) % 360 || 360;
    const { gs } = winddreieck(kurs, tas, windRichtung, windStaerke);
    return {
      typ: 'zahl',
      frage: `rwK **${grad3(kurs)}°**, TAS **${tas} kt**, Wind **${grad3(windRichtung)}°/${windStaerke} kt**. Wie groß ist deine Grundgeschwindigkeit (GS)?`,
      loesung: Math.round(gs),
      toleranz: 3,
      einheit: 'kt',
      rechenweg: grundgeschwindigkeitWeg(kurs, tas, windRichtung, windStaerke),
    };
  },

  flugzeit(z) {
    const strecke = z.ganz(20, 120, 2);
    const gs = z.ganz(70, 130, 5);
    const minuten = (strecke / gs) * 60;
    return {
      typ: 'zahl',
      frage: `Strecke **${strecke} NM**, Grundgeschwindigkeit **${gs} kt**. Wie lange fliegst du (in Minuten)?`,
      loesung: Math.round(minuten),
      toleranz: 1,
      einheit: 'min',
      rechenweg: [
        'Formel: **Zeit = Strecke ÷ Grundgeschwindigkeit**. Knoten sind NM pro Stunde – das Ergebnis ist also in Stunden.',
        `${strecke} NM ÷ ${gs} kt = **${komma(strecke / gs, 3)} h**.`,
        `In Minuten: ${komma(strecke / gs, 3)} h × 60 ≈ **${Math.round(minuten)} min**.`,
      ],
      erklaerung: `Kopfrechnen geht auch so: ${gs} kt sind ${komma(gs / 60, 2)} NM pro Minute → ${strecke} ÷ ${komma(gs / 60, 2)} ≈ ${Math.round(minuten)} min.`,
    };
  },

  kraftstoff(z) {
    const minuten = z.ganz(40, 180, 5);
    const verbrauch = z.ganz(15, 40);
    const liter = (minuten / 60) * verbrauch;
    const reserve = z.janein();
    const gesamt = reserve ? liter + verbrauch / 2 : liter;
    return {
      typ: 'zahl',
      frage: `Geplante Flugzeit **${Math.floor(minuten / 60)}:${String(minuten % 60).padStart(2, '0')} h**, Verbrauch **${verbrauch} l/h**. Wie viel Kraftstoff brauchst du ${reserve ? '**einschließlich 30 Minuten Reserve**' : '**für den Flug selbst** (ohne Reserve)'}?`,
      loesung: runden(gesamt, 1),
      toleranz: 1,
      einheit: 'l',
      rechenweg: [
        `Flugzeit in Stunden: ${minuten} min ÷ 60 = **${komma(minuten / 60, 2)} h**.`,
        `Kraftstoff = Flugzeit × Verbrauch = ${komma(minuten / 60, 2)} h × ${verbrauch} l/h = **${komma(liter)} l**.`,
        ...(reserve ? [`Dazu 30 min Reserve: 0,5 h × ${verbrauch} l/h = ${komma(verbrauch / 2)} l → ${komma(liter)} + ${komma(verbrauch / 2)} = **${komma(gesamt)} l**.`] : []),
      ],
    };
  },

  einszusechzig(z) {
    const geflogen = z.wahl([20, 30, 40, 60]);
    const ablage = z.wahl([1, 2, 3, 4]);
    const fehler = (ablage * 60) / geflogen;
    return {
      typ: 'zahl',
      frage: `Nach **${geflogen} NM** stellst du fest, dass du **${ablage} NM** neben dem geplanten Kurs bist. Wie groß ist dein Kursfehler?`,
      loesung: runden(fehler, 1),
      toleranz: 0.5,
      einheit: '°',
      rechenweg: [
        '1:60-Regel: **1 NM Ablage nach 60 NM ≈ 1° Kursfehler**.',
        `Kursfehler = Ablage × 60 ÷ geflogene Strecke = ${ablage} × 60 ÷ ${geflogen}.`,
        `${ablage * 60} ÷ ${geflogen} = **${komma(fehler)}°**.`,
      ],
    };
  },

  massstab(z) {
    const cm = runden(z.ganz(20, 160) / 10, 1);
    const km = cm * 5;
    return {
      typ: 'zahl',
      frage: `Auf der Luftfahrtkarte im Maßstab **1 : 500 000** misst du **${cm.toLocaleString('de-DE')} cm**. Wie viele Kilometer sind das?`,
      loesung: runden(km, 1),
      toleranz: 0.5,
      einheit: 'km',
      rechenweg: [
        '1 : 500 000 heißt: **1 cm** auf der Karte sind **500 000 cm** in der Wirklichkeit.',
        '500 000 cm = 5000 m = **5 km** – jeder Zentimeter sind also 5 km.',
        `${komma(cm)} cm × 5 km = **${komma(km)} km**.`,
      ],
    };
  },

  kartenkurs(z) {
    const [a, b] = z.ziehen(Object.keys(ORTE), 2).map((k) => ORTE[k]);
    const { kurs } = kursUndEntfernung(a, b);
    return {
      typ: 'zahl',
      frage: `Miss auf der Übungskarte den **rechtweisenden Kurs** von **${a.name}** nach **${b.name}**.`,
      svg: uebungskarte({ von: a, nach: b, rose: true }),
      hinweis: 'Die Karte ist nach Norden ausgerichtet. Die Skala um den Startort hilft beim Ablesen.',
      loesung: Math.round(kurs) || 360,
      toleranz: 3,
      einheit: '°',
      kreis: true,
      rechenweg: [
        'Lege die Mitte des Kursdreiecks (Winkelmessers) auf die Kurslinie und richte es an einer **Nord-Süd-Linie** aus.',
        'Lies den Winkel **von Norden im Uhrzeigersinn** bis zur Kurslinie ab – in Flugrichtung, nicht zurück.',
        `Ergebnis: rechtweisender Kurs ≈ **${grad3(kurs)}°** (±3° Messgenauigkeit).`,
      ],
    };
  },

  kartenentfernung(z) {
    const [a, b] = z.ziehen(Object.keys(ORTE), 2).map((k) => ORTE[k]);
    const { entfernung } = kursUndEntfernung(a, b);
    return {
      typ: 'zahl',
      frage: `Wie weit ist es auf der Übungskarte von **${a.name}** nach **${b.name}**?`,
      svg: uebungskarte({ von: a, nach: b }),
      hinweis: 'Nutze die Maßstabsleiste unten links oder das Gitter: Die grauen Linien haben 10 NM Abstand.',
      loesung: Math.round(entfernung),
      toleranz: Math.max(2, Math.round(entfernung * 0.06)),
      einheit: 'NM',
      rechenweg: [
        'Nimm die Länge der Linie zwischen beiden Orten ab – mit Zirkel, Lineal oder einem Papierstreifen.',
        'Lege sie an die Maßstabsleiste an oder zähle die Gitterlinien: Sie haben **10 NM** Abstand.',
        `Ergebnis: etwa **${Math.round(entfernung)} NM**.`,
      ],
    };
  },

  kartensymbol(z) {
    const schluessel = z.wahl(Object.keys(SYMBOLE));
    const andere = Object.keys(SYMBOLE).filter((k) => k !== schluessel);
    return {
      typ: 'auswahl',
      frage: 'Was bedeutet dieses Kartensymbol?',
      svg: symbolBild(schluessel),
      richtig: SYMBOLE[schluessel].name,
      falsch: z.ziehen(andere, 3).map((k) => SYMBOLE[k].name),
    };
  },
};
