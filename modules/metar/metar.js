// Zerlegt ein METAR in seine Gruppen und übersetzt jede Gruppe in Klartext.
// Reines JavaScript ohne Abhängigkeiten – läuft im Browser und in Node (für die Tests).
//
// Jede Gruppe bekommt einen „typ“. Zu jedem Typ gibt es in content/gruppen.json
// eine allgemeine Erklärung; die „bedeutung“ hier beschreibt die konkrete Gruppe.

const BEDECKUNG = {
  FEW: 'Wenige Wolken (1–2 Achtel)',
  SCT: 'Aufgelockert (3–4 Achtel)',
  BKN: 'Durchbrochen (5–7 Achtel)',
  OVC: 'Bedeckt (8 Achtel)',
};

const WOLKENART = {
  CB: 'Cumulonimbus (Gewitterwolke)',
  TCU: 'Towering Cumulus (mächtige Quellwolke)',
};

const HIMMELSRICHTUNG = {
  N: 'Norden', NE: 'Nordosten', E: 'Osten', SE: 'Südosten',
  S: 'Süden', SW: 'Südwesten', W: 'Westen', NW: 'Nordwesten',
};

const ERSCHEINUNG = {
  DZ: 'Sprühregen', RA: 'Regen', SN: 'Schnee', SG: 'Schneegriesel', PL: 'Eiskörner',
  GR: 'Hagel', GS: 'Graupel', UP: 'unbekannter Niederschlag',
  BR: 'feuchter Dunst', FG: 'Nebel', FU: 'Rauch', VA: 'Vulkanasche', DU: 'Staub',
  SA: 'Sand', HZ: 'trockener Dunst', PO: 'Staub- oder Sandwirbel', SQ: 'Böen (Squall)',
  FC: 'Trichterwolke (Tornado oder Wasserhose)', SS: 'Sandsturm', DS: 'Staubsturm',
};
const NIEDERSCHLAG = new Set(['DZ', 'RA', 'SN', 'SG', 'PL', 'GR', 'GS', 'UP']);
const FEGEN = { SN: 'Schneefegen', SA: 'Sandfegen', DU: 'Staubfegen' };
const TREIBEN = { SN: 'Schneetreiben', SA: 'Sandtreiben', DU: 'Staubtreiben' };

const WETTER_MUSTER = /^(\+|-|VC)?(MI|BC|PR|DR|BL|SH|TS|FZ)?((?:DZ|RA|SN|SG|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PO|SQ|FC|SS|DS)*)$/;

const grossAnfang = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const aufzaehlen = (liste) => liste.length <= 1 ? (liste[0] ?? '') : `${liste.slice(0, -1).join(', ')} und ${liste.at(-1)}`;
const gradText = (n) => `${String(n).replace('-', '−')} °C`;

/** Übersetzt eine Wettergruppe wie „-SHRA“ oder „BCFG“. Liefert null, wenn es keine ist. */
export function wetterText(code) {
  const treffer = WETTER_MUSTER.exec(code);
  if (!treffer) return null;
  const [, vorzeichen = '', beschreibung = '', erscheinungen = ''] = treffer;
  if (!beschreibung && !erscheinungen) return null;

  const codes = erscheinungen.match(/../g) ?? [];
  const namen = codes.map((c) => ERSCHEINUNG[c]);
  const nebel = erscheinungen === 'FG';

  let text;
  switch (beschreibung) {
    case 'SH': text = namen.length ? `Schauer mit ${aufzaehlen(namen)}` : 'Schauer'; break;
    case 'TS': text = namen.length ? `Gewitter mit ${aufzaehlen(namen)}` : 'Gewitter'; break;
    case 'FZ': text = `gefrierender ${aufzaehlen(namen)}`; break;
    case 'MI': text = nebel ? 'flacher Nebel (Bodennebel)' : `flach: ${aufzaehlen(namen)}`; break;
    case 'BC': text = nebel ? 'Nebelschwaden' : `Schwaden: ${aufzaehlen(namen)}`; break;
    case 'PR': text = nebel ? 'Nebel über Teilen des Flugplatzes' : `teilweise: ${aufzaehlen(namen)}`; break;
    case 'DR': text = `${aufzaehlen(codes.map((c) => FEGEN[c] ?? ERSCHEINUNG[c]))} (bodennah, unter 2 m)`; break;
    case 'BL': text = `${aufzaehlen(codes.map((c) => TREIBEN[c] ?? ERSCHEINUNG[c]))} (2 m hoch oder mehr)`; break;
    default: text = aufzaehlen(namen);
  }

  const mitNiederschlag = codes.some((c) => NIEDERSCHLAG.has(c));
  let zusatz = '';
  if (vorzeichen === '-') zusatz = 'leicht';
  else if (vorzeichen === '+') zusatz = 'stark';
  else if (vorzeichen === 'VC') zusatz = 'in der Umgebung (8–16 km vom Flugplatz)';
  else if (mitNiederschlag) zusatz = 'mäßig';

  return grossAnfang(text) + (zusatz ? ` – ${zusatz}` : '');
}

function sichtText(meter) {
  if (meter === 9999) return '10 km oder mehr';
  if (meter === 0) return 'unter 50 m';
  return meter >= 5000 ? `${meter / 1000} km` : `${meter} m`;
}

function temperaturWert(text) {
  return text.startsWith('M') ? -Number(text.slice(1)) : Number(text);
}

/** Deutet eine einzelne Gruppe. zustand merkt sich, was vorher schon kam. */
function deuten(t, zustand) {
  let m;

  if (t === 'METAR') return { typ: 'kennung', bedeutung: 'Routinemäßige Flugplatz-Wettermeldung' };
  if (t === 'SPECI') return { typ: 'kennung', bedeutung: 'Sonder-Wettermeldung bei deutlicher Wetteränderung' };
  if (t === 'COR') return { typ: 'zusatz', bedeutung: 'Korrigierte Meldung' };
  if (t === 'AUTO') return { typ: 'zusatz', bedeutung: 'Vollautomatisch erstellte Meldung, ohne Beobachter' };

  if (!zustand.station && /^[A-Z]{4}$/.test(t)) {
    zustand.station = true;
    return { typ: 'station', bedeutung: `Flugplatz mit der ICAO-Kennung ${t}` };
  }

  if ((m = /^(\d{2})(\d{2})(\d{2})Z$/.exec(t))) {
    return { typ: 'zeit', bedeutung: `Beobachtet am ${Number(m[1])}. des Monats um ${m[2]}:${m[3]} UTC` };
  }

  if ((m = /^(\d{3}|VRB|\/{3})(\d{2,3}|\/\/)(?:G(\d{2,3}))?(KT|MPS)$/.exec(t))) {
    const [, richtung, staerke, boeen, einheitCode] = m;
    const einheit = einheitCode === 'KT' ? 'kt' : 'm/s';
    const werte = { richtung: /^\d{3}$/.test(richtung) ? Number(richtung) : null, vrb: richtung === 'VRB', staerke: Number(staerke) || 0, boeen: boeen ? Number(boeen) : null, einheit };
    if (richtung === '000' && Number(staerke) === 0) return { typ: 'wind', bedeutung: 'Windstille', werte };
    if (staerke === '//') return { typ: 'wind', bedeutung: 'Wind nicht gemessen', werte };
    let text = richtung === 'VRB'
      ? 'Wind aus wechselnden Richtungen'
      : richtung === '///' ? 'Wind aus unbekannter Richtung' : `Wind aus ${richtung}°`;
    text += ` mit ${Number(staerke)} ${einheit}`;
    if (boeen) text += `, Böen bis ${Number(boeen)} ${einheit}`;
    return { typ: 'wind', bedeutung: text, werte };
  }

  if ((m = /^(\d{3})V(\d{3})$/.exec(t))) {
    return { typ: 'windvariabel', bedeutung: `Windrichtung schwankt zwischen ${m[1]}° und ${m[2]}°`, werte: { von: Number(m[1]), bis: Number(m[2]) } };
  }

  if (t === 'CAVOK') {
    zustand.sicht = true;
    return { typ: 'cavok', bedeutung: 'Sicht 10 km oder mehr, keine Wolken unter 5000 ft, keine CB/TCU, kein signifikantes Wetter', werte: { meter: 10000 } };
  }

  if ((m = /^(\d{4})(N|NE|E|SE|S|SW|W|NW)$/.exec(t))) {
    return { typ: 'mindestsicht', bedeutung: `Geringste Sicht ${sichtText(Number(m[1]))}, in Richtung ${HIMMELSRICHTUNG[m[2]]}`, werte: { meter: Number(m[1]), richtung: m[2] } };
  }
  if ((m = /^(\d{4})(NDV)?$/.exec(t))) {
    const erste = !zustand.sicht;
    zustand.sicht = true;
    const text = erste ? `Sicht ${sichtText(Number(m[1]))}` : `Geringste Sicht ${sichtText(Number(m[1]))}`;
    return { typ: erste ? 'sicht' : 'mindestsicht', bedeutung: text + (m[2] ? ' (automatisch gemessen, ohne Richtungsangabe)' : ''), werte: { meter: Number(m[1]) === 9999 ? 10000 : Number(m[1]) } };
  }

  if ((m = /^R(\d{2}[LCR]?)\/(CLRD\/\/|[\d/]{6})$/.exec(t))) {
    const text = m[2] === 'CLRD//'
      ? `Piste ${m[1]}: Verunreinigungen beseitigt`
      : `Zustand der Piste ${m[1]} (Belag, Ausdehnung, Tiefe, Bremswirkung)`;
    return { typ: 'pistenzustand', bedeutung: text };
  }

  if ((m = /^R(\d{2}[LCR]?)\/([PM])?(\d{4})(?:V([PM])?(\d{4}))?(FT)?([UDN])?$/.exec(t))) {
    const [, piste, vor1, wert1, vor2, wert2, fuss, tendenz] = m;
    const einheit = fuss ? 'ft' : 'm';
    const wert = (vor, w) => `${vor === 'P' ? 'mehr als ' : vor === 'M' ? 'weniger als ' : ''}${Number(w)} ${einheit}`;
    let text = `Pistensichtweite auf Piste ${piste}: ${wert(vor1, wert1)}`;
    if (wert2) text += ` bis ${wert(vor2, wert2)}`;
    if (tendenz) text += `, ${{ U: 'zunehmend', D: 'abnehmend', N: 'gleichbleibend' }[tendenz]}`;
    return { typ: 'rvr', bedeutung: text };
  }

  if (t === 'NSW') return { typ: 'wetter', bedeutung: 'Keine signifikanten Wettererscheinungen mehr', werte: { code: t } };
  const wetter = wetterText(t);
  if (wetter) return { typ: 'wetter', bedeutung: wetter, werte: { code: t } };

  if ((m = /^(FEW|SCT|BKN|OVC)(\d{3}|\/{3})(CB|TCU|\/{3})?$/.exec(t))) {
    const [, menge, hoehe, art] = m;
    let text = BEDECKUNG[menge];
    if (hoehe === '///') text += ', Höhe unbekannt';
    else if (hoehe === '000') text += ', Untergrenze unter 100 ft über Platzhöhe';
    else text += `, Untergrenze ${Number(hoehe) * 100} ft über Platzhöhe`;
    if (art === '///') text += ', Wolkenart nicht erkennbar';
    else if (art) text += `, ${WOLKENART[art]}`;
    return { typ: 'wolken', bedeutung: text, werte: { menge, hoehe: /^\d{3}$/.test(hoehe) ? Number(hoehe) * 100 : null, art: art && art !== '///' ? art : null } };
  }
  if (t === 'NSC') return { typ: 'wolken', bedeutung: 'Keine signifikante Bewölkung', werte: { menge: 'NSC', hoehe: null, art: null } };
  if (t === 'NCD') return { typ: 'wolken', bedeutung: 'Keine Wolken erkannt (automatische Station)', werte: { menge: 'NCD', hoehe: null, art: null } };
  if ((m = /^VV(\d{3}|\/{3})$/.exec(t))) {
    return {
      typ: 'wolken',
      bedeutung: m[1] === '///' ? 'Himmel nicht erkennbar, Vertikalsicht unbekannt' : `Himmel nicht erkennbar, Vertikalsicht ${Number(m[1]) * 100} ft`,
      werte: { menge: 'VV', hoehe: m[1] === '///' ? null : Number(m[1]) * 100, art: null },
    };
  }

  if ((m = /^(M?\d{2})\/(M?\d{2})?$/.exec(t))) {
    const temperatur = temperaturWert(m[1]);
    if (!m[2]) return { typ: 'temperatur', bedeutung: `Temperatur ${gradText(temperatur)}, Taupunkt nicht gemeldet`, werte: { t: temperatur, td: null } };
    const taupunkt = temperaturWert(m[2]);
    const spread = temperatur - taupunkt;
    let text = `Temperatur ${gradText(temperatur)}, Taupunkt ${gradText(taupunkt)}, Spread ${gradText(spread)}`;
    if (spread <= 2) text += ' – sehr feuchte Luft, Dunst, Nebel oder tiefe Wolken möglich';
    return { typ: 'temperatur', bedeutung: text, werte: { t: temperatur, td: taupunkt } };
  }

  if ((m = /^Q(\d{4})$/.exec(t))) return { typ: 'qnh', bedeutung: `QNH ${Number(m[1])} hPa`, werte: { hpa: Number(m[1]) } };
  if ((m = /^A(\d{2})(\d{2})$/.exec(t))) return { typ: 'qnh', bedeutung: `QNH ${m[1]},${m[2]} inHg (Zoll Quecksilbersäule)` };

  if ((m = /^RE(.+)$/.exec(t)) && wetterText(m[1])) {
    return { typ: 'vorwetter', bedeutung: `Kürzlich (seit der letzten Meldung): ${wetterText(m[1])}` };
  }

  if (t === 'NOSIG') return { typ: 'trend', bedeutung: 'Keine wesentliche Änderung in den nächsten 2 Stunden erwartet', werte: { art: t } };
  if (t === 'BECMG') return { typ: 'trend', bedeutung: 'Änderung erwartet: Die folgenden Gruppen beschreiben das Wetter danach', werte: { art: t } };
  if (t === 'TEMPO') return { typ: 'trend', bedeutung: 'Vorübergehend: Die folgenden Gruppen treten zeitweise auf', werte: { art: t } };

  if ((m = /^(FM|TL|AT)(\d{2})(\d{2})$/.exec(t))) {
    const wort = { FM: 'Ab', TL: 'Bis', AT: 'Um' }[m[1]];
    return { typ: 'trendzeit', bedeutung: `${wort} ${m[2]}:${m[3]} UTC` };
  }

  return { typ: 'unbekannt', bedeutung: 'Diese Gruppe kennt die App noch nicht.' };
}

/**
 * Zerlegt ein METAR in seine Gruppen.
 * Ergebnis: Liste von { text, typ, bedeutung, imTrend, hauptwolkenuntergrenze? }
 */
export function zerlegen(metar) {
  const teile = metar.trim().toUpperCase().replace(/=$/, '').split(/\s+/);
  const zustand = { station: false, sicht: false, imTrend: false };
  const gruppen = [];

  for (let i = 0; i < teile.length; i++) {
    const t = teile[i];

    if (t === 'RMK') {
      gruppen.push({ text: teile.slice(i).join(' '), typ: 'rmk', bedeutung: 'Bemerkungen – zusätzliche, meist nationale Angaben', imTrend: false });
      break;
    }

    if (t === 'WS') {
      let text = 'WS';
      let bedeutung = 'Windscherung gemeldet';
      if (teile[i + 1] === 'ALL' && teile[i + 2] === 'RWY') {
        text = 'WS ALL RWY';
        bedeutung = 'Windscherung auf allen Pisten';
        i += 2;
      } else if (/^R\d{2}[LCR]?$/.test(teile[i + 1] ?? '')) {
        text = `WS ${teile[i + 1]}`;
        bedeutung = `Windscherung auf Piste ${teile[i + 1].slice(1)}`;
        i += 1;
      }
      gruppen.push({ text, typ: 'windscherung', bedeutung, imTrend: zustand.imTrend });
      continue;
    }

    if (t === 'BECMG' || t === 'TEMPO' || t === 'NOSIG') {
      zustand.imTrend = true;
      zustand.sicht = false;
    }
    gruppen.push({ text: t, ...deuten(t, zustand), imTrend: zustand.imTrend });
  }

  // Die niedrigste Schicht mit BKN oder OVC unter 20 000 ft ist die Hauptwolkenuntergrenze.
  const ceiling = gruppen.find((g) => !g.imTrend && /^(BKN|OVC)(\d{3})/.test(g.text) && Number(g.text.slice(3, 6)) < 200);
  if (ceiling) {
    ceiling.hauptwolkenuntergrenze = true;
    ceiling.bedeutung += ' – das ist die Hauptwolkenuntergrenze (Ceiling)';
  }

  return gruppen;
}

/**
 * Fasst die wichtigsten Werte eines METARs zusammen (nur aktuelles Wetter, ohne Trend).
 * Sicht 9999 und CAVOK werden als 10000 m angegeben.
 */
export function auswerten(metar) {
  const gruppen = zerlegen(metar);
  const jetzt = gruppen.filter((g) => !g.imTrend);
  const finde = (typ) => jetzt.find((g) => g.typ === typ);
  const decke = jetzt.find((g) => g.hauptwolkenuntergrenze);
  return {
    gruppen,
    station: finde('station')?.text ?? null,
    wind: finde('wind')?.werte ?? null,
    windvariabel: finde('windvariabel')?.werte ?? null,
    sicht: (finde('sicht') ?? finde('cavok'))?.werte.meter ?? null,
    cavok: Boolean(finde('cavok')),
    wetter: jetzt.filter((g) => g.typ === 'wetter').map((g) => g.text),
    wolken: jetzt.filter((g) => g.typ === 'wolken').map((g) => ({ text: g.text, ...g.werte })),
    hauptwolkenuntergrenze: decke ? decke.werte.hoehe : null,
    temperatur: finde('temperatur')?.werte.t ?? null,
    taupunkt: finde('temperatur')?.werte.td ?? null,
    qnh: finde('qnh')?.werte.hpa ?? null,
    trend: gruppen.find((g) => g.typ === 'trend')?.text ?? null,
    gewitter: gruppen.some((g) => /TS/.test(g.text) && g.typ === 'wetter') || gruppen.some((g) => g.typ === 'wolken' && /CB$/.test(g.text)),
  };
}
