// METAR-Generator: erzeugt frei erfundene, in sich stimmige METARs in fünf Schwierigkeitsstufen.
// Die Flugplatzkennungen sind echt, das Wetter ist ausgedacht.
//
// Eingehaltene Regeln (u. a.):
//  - Böen werden nur gemeldet, wenn sie den Mittelwind um mindestens 10 kt übersteigen.
//  - VRB nur bei schwachem Wind; Schwankungsgruppe dddVddd nur ab 3 kt und 60° Schwankung.
//  - FG nur bei Sicht unter 1000 m, BR nur bei 1000–5000 m; Gewitter immer mit CB.
//  - Wolkenschichten: 1. Schicht beliebig, 2. mindestens SCT, 3. mindestens BKN; nach OVC keine weitere.
//  - CAVOK, wenn Sicht ≥ 10 km, kein Wetter, keine Wolken unter 5000 ft und kein CB/TCU.

// Frei erfundene Plätze des Übungsgebiets (wie in content/plaetze.json und auf der Übungskarte).
// Bewusst keine echten Kennungen: Die Wetterlagen sind erfunden und sollen nicht mit echten Meldungen verwechselt werden.
export const STATIONEN = [
  { kennung: 'XMUS', pisten: ['09', '27'] },
  { kennung: 'XALT', pisten: ['07', '25'] },
  { kennung: 'XBER', pisten: ['03', '21'] },
];

const LAGEN = {
  1: ['cavok', 'heiter'],
  2: ['heiter', 'bewoelkt', 'dunstig', 'winter', 'boeig'],
  3: ['regen', 'dunst', 'niesel', 'bewoelkt'],
  4: ['schauer', 'nebel', 'gewitter', 'regen'],
  5: ['schnee', 'gefrierend', 'auto', 'front', 'gewitter'],
};

const zwei = (n) => String(n).padStart(2, '0');
const drei = (n) => String(n).padStart(3, '0');

function richtung360(grad) {
  const r = ((Math.round(grad / 10) * 10) % 360 + 360) % 360;
  return r === 0 ? 360 : r;
}

export function sichtRunden(meter) {
  if (meter >= 10000) return 10000;
  if (meter < 800) return Math.max(50, Math.round(meter / 50) * 50);
  if (meter < 5000) return Math.round(meter / 100) * 100;
  return Math.min(9000, Math.round(meter / 1000) * 1000);
}

const sichtGruppe = (meter) => (meter >= 10000 ? '9999' : String(meter).padStart(4, '0'));
const temp = (n) => (n < 0 ? `M${zwei(-n)}` : zwei(n));

function wind(z, { min, max, boeen = false, vrb = false, variabel = false, richtung }) {
  if (vrb) return { text: `VRB${zwei(z.ganz(1, 3))}KT`, richtung: null, staerke: 2 };
  const r = richtung ?? richtung360(z.ganz(0, 35) * 10);
  const staerke = z.ganz(min, max);
  let text = `${drei(r)}${zwei(staerke)}`;
  let b = null;
  if (boeen && staerke >= 8) {
    b = staerke + z.ganz(10, 18);
    text += `G${zwei(b)}`;
  }
  text += 'KT';
  let variabelText = null;
  if (variabel && staerke >= 4) {
    const links = z.ganz(3, 6) * 10;
    const rechts = z.ganz(3, 6) * 10;
    variabelText = `${drei(richtung360(r - links))}V${drei(richtung360(r + rechts))}`;
  }
  return { text, richtung: r, staerke, boeen: b, variabel: variabelText };
}

/** Wolkenschichten aufsteigend nach den Melderegeln. schichten: [[menge, hoeheFt, art?], …] */
function wolken(schichten) {
  const gruppen = [];
  let rang = 0;
  const RANG = { FEW: 1, SCT: 2, BKN: 3, OVC: 4 };
  const sortiert = [...schichten].sort((a, b) => a[1] - b[1]);
  for (const [menge, hoehe, art = ''] of sortiert) {
    // 2. Schicht mindestens SCT, 3. mindestens BKN (CB/TCU dürfen zusätzlich mit jeder Menge stehen)
    let m = menge;
    if (!art) {
      if (rang === 1 && RANG[m] < 2) m = 'SCT';
      if (rang >= 2 && RANG[m] < 3) m = 'BKN';
      rang++;
    }
    gruppen.push(`${m}${drei(Math.round(hoehe / 100))}${art}`);
    if (m === 'OVC' && !art) break;
  }
  return gruppen;
}

function trendZeit(z, stunde, minute) {
  const start = stunde * 60 + minute;
  const ab = start + z.ganz(1, 4) * 15;
  const bis = Math.min(start + 120, ab + z.ganz(2, 4) * 15);
  const hhmm = (m) => `${zwei(Math.floor(m / 60) % 24)}${zwei(m % 60)}`;
  return [`FM${hhmm(ab)}`, `TL${hhmm(bis)}`];
}

/** Baut ein METAR aus den Bestandteilen und wendet die CAVOK/NSC-Regeln an. */
function zusammensetzen(t) {
  const teile = ['METAR', t.station, t.zeit];
  if (t.auto) teile.push('AUTO');
  teile.push(t.wind.text);
  if (t.wind.variabel) teile.push(t.wind.variabel);
  const wolkenGruppen = wolken(t.wolken ?? []);
  const cavok = t.sicht >= 10000 && !(t.wetter?.length) && !t.mindestsicht
    && (t.wolken ?? []).every(([, h, art]) => h >= 5000 && !art);
  if (cavok) {
    teile.push('CAVOK');
  } else {
    teile.push(sichtGruppe(t.sicht) + (t.ndv ? 'NDV' : ''));
    if (t.mindestsicht) teile.push(t.mindestsicht);
    if (t.rvr) teile.push(t.rvr);
    teile.push(...(t.wetter ?? []));
    if (t.vv) teile.push(t.vv);
    else if (wolkenGruppen.length) teile.push(...wolkenGruppen);
    else teile.push(t.auto ? 'NCD' : 'NSC');
  }
  teile.push(`${temp(t.t)}/${temp(t.td)}`, `Q${String(t.qnh).padStart(4, '0')}`);
  if (t.re) teile.push(t.re);
  teile.push(...(t.trend ?? ['NOSIG']));
  return teile.join(' ');
}

function pisteImWind(station, richtung) {
  if (richtung === null) return station.pisten[0];
  const abstand = (p) => Math.abs(((parseInt(p, 10) * 10 - richtung + 540) % 360) - 180);
  return [...station.pisten].sort((a, b) => abstand(a) - abstand(b))[0];
}

const ERZEUGER = {
  cavok: (z) => ({ wind: wind(z, { min: 3, max: 12 }), sicht: 10000, wolken: [['FEW', z.ganz(55, 90) * 100]], t: z.ganz(12, 27), spread: z.ganz(7, 15), qnh: z.ganz(1016, 1032) }),
  heiter: (z) => ({ wind: wind(z, { min: 3, max: 14 }), sicht: 10000, wolken: [[z.wahl(['FEW', 'SCT']), z.ganz(25, 45) * 100]], t: z.ganz(8, 25), spread: z.ganz(5, 12), qnh: z.ganz(1012, 1028) }),
  bewoelkt: (z) => ({ wind: wind(z, { min: 5, max: 16 }), sicht: 10000, wolken: [[z.wahl(['SCT', 'BKN']), z.ganz(18, 35) * 100], ['BKN', z.ganz(50, 80) * 100]], t: z.ganz(4, 20), spread: z.ganz(3, 8), qnh: z.ganz(1005, 1022) }),
  dunstig: (z) => ({ wind: wind(z, { min: 1, max: 3, vrb: true }), sicht: z.ganz(6, 9) * 1000, wolken: [], t: z.ganz(10, 24), spread: z.ganz(4, 9), qnh: z.ganz(1020, 1032) }),
  winter: (z) => { const t = z.ganz(-8, 1); return { wind: wind(z, { min: 3, max: 10 }), sicht: z.wahl([10000, 8000, 7000]), wolken: [['BKN', z.ganz(12, 35) * 100]], t, spread: z.ganz(2, 5), qnh: z.ganz(1018, 1036) }; },
  boeig: (z) => ({ wind: wind(z, { min: 14, max: 22, boeen: true }), sicht: 10000, wolken: [['SCT', z.ganz(30, 45) * 100], ['BKN', z.ganz(60, 90) * 100]], t: z.ganz(8, 22), spread: z.ganz(5, 10), qnh: z.ganz(998, 1012) }),
  regen: (z) => { const sicht = sichtRunden(z.ganz(30, 80) * 100); return { wind: wind(z, { min: 6, max: 16 }), sicht, wetter: [z.wahl(['-RA', '-RA', 'RA']), ...(sicht <= 5000 ? ['BR'] : [])], wolken: [['BKN', z.ganz(7, 14) * 100], ['OVC', z.ganz(20, 40) * 100]], t: z.ganz(5, 16), spread: z.ganz(1, 2), qnh: z.ganz(996, 1010), trend: z.janein() ? ['BECMG', `BKN${drei(z.ganz(15, 25))}`] : ['NOSIG'] }; },
  dunst: (z) => ({ wind: wind(z, { min: 2, max: 8 }), sicht: sichtRunden(z.ganz(15, 50) * 100), wetter: ['BR'], wolken: [['SCT', z.ganz(5, 9) * 100], ['BKN', z.ganz(12, 20) * 100]], t: z.ganz(2, 14), spread: z.ganz(1, 2), qnh: z.ganz(1015, 1030), trend: ['BECMG', '9999', 'NSW'] }),
  niesel: (z) => ({ wind: wind(z, { min: 4, max: 10 }), sicht: sichtRunden(z.ganz(30, 50) * 100), wetter: ['-DZ', 'BR'], wolken: [['BKN', z.ganz(4, 8) * 100], ['OVC', z.ganz(12, 18) * 100]], t: z.ganz(6, 15), spread: 1, qnh: z.ganz(1008, 1020), trend: ['NOSIG'] }),
  schauer: (z) => ({ wind: wind(z, { min: 12, max: 20, boeen: true, variabel: true }), sicht: 10000, wetter: [z.wahl(['-SHRA', 'SHRA', 'VCSH'])], wolken: [[z.wahl(['FEW', 'SCT']), z.ganz(18, 30) * 100, z.wahl(['CB', 'TCU'])], ['BKN', z.ganz(40, 60) * 100]], t: z.ganz(10, 22), spread: z.ganz(4, 8), qnh: z.ganz(1000, 1012), trend: ['TEMPO', z.wahl(['3000', '4000', '2500']), z.wahl(['SHRA', '+SHRA'])] }),
  nebel: (z) => { const sicht = sichtRunden(z.ganz(2, 7) * 100); const vv = z.janein(); return { wind: z.janein() ? { text: '00000KT', richtung: null, staerke: 0 } : wind(z, { vrb: true }), sicht, rvr: true, wetter: ['FG'], wolken: vv ? [] : [['OVC', z.ganz(1, 3) * 100]], vv: vv ? `VV${drei(z.ganz(1, 3))}` : null, t: z.ganz(0, 9), spread: z.ganz(0, 1), qnh: z.ganz(1020, 1034), trend: ['BECMG', z.wahl(['1500', '2000', '3000']), 'BR'] }; },
  gewitter: (z) => { const wetter = z.wahl(['TSRA', '-TSRA', 'VCTS']); return { wind: wind(z, { min: 8, max: 16, boeen: true, variabel: z.janein() }), sicht: sichtRunden(z.ganz(40, 90) * 100), wetter: [wetter], wolken: [['FEW', z.ganz(25, 40) * 100, 'CB'], ['BKN', z.ganz(50, 80) * 100]], t: z.ganz(18, 29), spread: z.ganz(5, 10), qnh: z.ganz(1002, 1014), re: wetter === 'VCTS' && z.janein(0.5) ? 'RETSRA' : null, trend: ['TEMPO', `${drei(z.ganz(18, 30) * 10)}${z.ganz(20, 28)}G${z.ganz(38, 48)}KT`, z.wahl(['2000', '3000']), '+TSRA', `BKN${drei(z.ganz(10, 18))}CB`] }; },
  schnee: (z) => { const sicht = sichtRunden(z.ganz(15, 60) * 100); const t = z.ganz(-6, 1); return { wind: wind(z, { min: 6, max: 14 }), sicht, wetter: [sicht < 3000 ? 'SN' : '-SN', ...(sicht <= 5000 && sicht >= 1000 && z.janein() ? ['BR'] : [])], wolken: [['SCT', z.ganz(6, 10) * 100], ['BKN', z.ganz(12, 18) * 100], ['OVC', z.ganz(25, 40) * 100]], t, spread: z.ganz(1, 3), qnh: z.ganz(990, 1012), trend: ['TEMPO', z.wahl(['1200', '1500', '0800']), 'SN', `BKN${drei(z.ganz(4, 6))}`] }; },
  gefrierend: (z) => ({ wind: wind(z, { min: 3, max: 10 }), sicht: sichtRunden(z.ganz(25, 50) * 100), wetter: [z.wahl(['-FZDZ', '-FZRA']), 'BR'], wolken: [['BKN', z.ganz(4, 9) * 100], ['OVC', z.ganz(14, 20) * 100]], t: z.ganz(-4, 0), spread: 1, qnh: z.ganz(1005, 1022), trend: ['NOSIG'] }),
  auto: (z) => { const sicht = sichtRunden(z.ganz(12, 20) * 100); return { auto: true, wind: wind(z, { min: 2, max: 6 }), sicht, mindestsicht: `${String(sichtRunden(z.ganz(5, 9) * 100)).padStart(4, '0')}${z.wahl(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'])}`, wetter: ['BCFG'], wolken: [], t: z.ganz(1, 10), spread: z.ganz(0, 1), qnh: z.ganz(1018, 1030), trend: [] }; },
  front: (z) => ({ wind: wind(z, { min: 12, max: 20, boeen: true }), sicht: sichtRunden(z.ganz(50, 90) * 100), wetter: ['-RA'], wolken: [['FEW', z.ganz(8, 12) * 100], ['BKN', z.ganz(16, 24) * 100], ['OVC', z.ganz(35, 50) * 100]], t: z.ganz(8, 16), spread: z.ganz(1, 3), qnh: z.ganz(992, 1004), re: z.janein(0.4) ? 'RERA' : null, trend: 'zeit' }),
};

/**
 * Erzeugt ein METAR. Optionen: stufe (1–5), station ({ kennung, pisten }), lage (Name aus LAGEN).
 * Ergebnis: { text, stufe, lage, station, piste }
 */
export function metarErzeugen(z, { stufe = z.ganz(1, 5), station = z.wahl(STATIONEN), lage = z.wahl(LAGEN[stufe]) } = {}) {
  const tag = z.ganz(1, 28);
  const stunde = z.ganz(5, 19);
  const minute = z.wahl([20, 50]);
  const b = ERZEUGER[lage](z);
  if (b.trend === 'zeit') {
    b.trend = ['TEMPO', ...trendZeit(z, stunde, minute), z.wahl(['4000', '3000']), z.wahl(['RA', '+RA', 'SHRA']), `BKN${drei(z.ganz(8, 12))}`];
  }
  const piste = pisteImWind(station, b.wind.richtung);
  const teile = {
    ...b,
    station: station.kennung,
    zeit: `${zwei(tag)}${zwei(stunde)}${zwei(minute)}Z`,
    td: b.t - b.spread,
    rvr: b.rvr ? `R${piste}/${String(Math.min(2000, sichtRunden(b.sicht + z.ganz(1, 4) * 50))).padStart(4, '0')}${z.wahl(['U', 'D', 'N'])}` : null,
    trend: b.trend ?? ['NOSIG'],
  };
  return { text: zusammensetzen(teile), stufe, lage, station, piste };
}

export { LAGEN, pisteImWind };
