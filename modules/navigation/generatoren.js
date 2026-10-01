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

function missweisungText(mw) {
  return mw >= 0 ? `${mw}° Ost (+${mw}°)` : `${-mw}° West (${mw}°)`;
}

function uhrzeit(minuten) {
  const m = ((minuten % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export const generatoren = {
  einheiten(z) {
    const art = z.wahl(['nm-km', 'km-nm', 'ft-m', 'm-ft', 'kt-kmh']);
    if (art === 'nm-km') {
      const nm = z.ganz(5, 80);
      return { typ: 'zahl', frage: `Wie viele Kilometer sind **${nm} NM**?`, loesung: runden(nm * 1.852, 1), toleranz: runden(Math.max(1, nm * 1.852 * 0.02), 1), einheit: 'km', erklaerung: `1 NM = 1,852 km → ${nm} × 1,852 ≈ ${runden(nm * 1.852, 1).toLocaleString('de-DE')} km. Faustregel: NM × 2 minus 10 %.` };
    }
    if (art === 'km-nm') {
      const km = z.ganz(10, 150, 5);
      return { typ: 'zahl', frage: `Wie viele nautische Meilen sind **${km} km**?`, loesung: runden(km / 1.852, 1), toleranz: runden(Math.max(1, (km / 1.852) * 0.02), 1), einheit: 'NM', erklaerung: `km ÷ 1,852 → ${km} ÷ 1,852 ≈ ${runden(km / 1.852, 1).toLocaleString('de-DE')} NM.` };
    }
    if (art === 'ft-m') {
      const ft = z.ganz(5, 100) * 100;
      return { typ: 'zahl', frage: `Wie viele Meter sind **${ft} ft**?`, loesung: Math.round(ft * 0.3048), toleranz: Math.round(Math.max(10, ft * 0.3048 * 0.02)), einheit: 'm', erklaerung: `1 ft = 0,3048 m → ${ft} × 0,3048 ≈ ${Math.round(ft * 0.3048)} m. Faustregel: ft × 3 ÷ 10.` };
    }
    if (art === 'm-ft') {
      const m = z.ganz(1, 40) * 100;
      return { typ: 'zahl', frage: `Wie viele Fuß sind **${m} m**?`, loesung: Math.round(m / 0.3048), toleranz: Math.round(Math.max(30, (m / 0.3048) * 0.02)), einheit: 'ft', erklaerung: `m ÷ 0,3048 → ${m} ÷ 0,3048 ≈ ${Math.round(m / 0.3048)} ft. Faustregel: m × 3,3.` };
    }
    const kt = z.ganz(40, 150, 5);
    return { typ: 'zahl', frage: `Wie viele km/h sind **${kt} kt**?`, loesung: Math.round(kt * 1.852), toleranz: Math.round(Math.max(2, kt * 1.852 * 0.02)), einheit: 'km/h', erklaerung: `1 kt = 1 NM/h = 1,852 km/h → ${kt} × 1,852 ≈ ${Math.round(kt * 1.852)} km/h.` };
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
      erklaerung: `${zone} = UTC + ${versatz} h. ${zuUtc ? `Also ${versatz} h abziehen.` : `Also ${versatz} h dazuzählen.`}`,
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
      erklaerung: `mwK = rwK − MW = ${grad3(rwk)}° − (${mw > 0 ? '+' : ''}${mw}°) = ${grad3(mwk)}°. Merksatz: Ostmissweisung abziehen, Westmissweisung dazuzählen.`,
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
      erklaerung: `KK = mwK − Dev = ${grad3(mwk)}° − (${dev > 0 ? '+' : ''}${dev}°) = ${grad3(kk)}°. Die Deviation wird genauso behandelt wie die Missweisung.`,
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
      erklaerung: `Der Wind kommt von ${luv > 0 ? 'rechts' : 'links'}, also hältst du ${luv > 0 ? 'rechts' : 'links'} vor: Luvwinkel ≈ ${Math.abs(runden(luv))}°. rwSK ≈ ${grad3(sk)}°.`,
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
      erklaerung: `Gegenwindanteil = Wind × cos(Windeinfallswinkel). Hier ergibt sich eine GS von etwa ${Math.round(gs)} kt.`,
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
      erklaerung: `Zeit = Strecke ÷ GS = ${strecke} ÷ ${gs} h ≈ ${runden(minuten, 1).toLocaleString('de-DE')} min.`,
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
      erklaerung: `${minuten} min = ${runden(minuten / 60, 2).toLocaleString('de-DE')} h × ${verbrauch} l/h = ${runden(liter, 1).toLocaleString('de-DE')} l${reserve ? ` + 30 min Reserve (${runden(verbrauch / 2, 1).toLocaleString('de-DE')} l) = ${runden(gesamt, 1).toLocaleString('de-DE')} l` : ''}.`,
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
      erklaerung: `1:60-Regel: Kursfehler = Ablage × 60 ÷ Strecke = ${ablage} × 60 ÷ ${geflogen} = ${runden(fehler, 1).toLocaleString('de-DE')}°.`,
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
      erklaerung: `1 : 500 000 bedeutet 1 cm = 500 000 cm = 5 km. ${cm.toLocaleString('de-DE')} × 5 = ${runden(km, 1).toLocaleString('de-DE')} km.`,
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
      erklaerung: `Der rechtweisende Kurs beträgt etwa ${grad3(kurs)}° (±3° Messgenauigkeit).`,
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
      erklaerung: `Die Entfernung beträgt etwa ${Math.round(entfernung)} NM.`,
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
