// Aufgaben rund ums METAR – reine Funktionen ohne Oberfläche (werden auch getestet).
//   entschluesselnFragen()  Stufe 2: Werte aus einem METAR herauslesen
//   bauenVergleichen()      Stufe 3: selbst geschriebenes METAR mit der Lösung vergleichen
//   szenarioErzeugen()      Stufe 4: Entscheidungsfragen zu einem fiktiven Flugplatz
import { zerlegen, auswerten, wetterText } from './metar.js';
import { metarErzeugen, LAGEN } from './erzeugen.js';
import { ctrWeg } from '../luftraum/generatoren.js';

const RAD = Math.PI / 180;

const WETTER_POOL = ['-RA', 'RA', '+RA', '-SHRA', 'SHRA', '+SHRA', 'TSRA', '+TSRA', '-DZ', 'BR', 'FG', 'BCFG', 'MIFG', 'HZ', '-SN', 'SN', '-FZDZ', '-FZRA', 'VCSH', 'VCTS', 'GR', 'BLSN', 'DRSN', 'SHGS'];

/** Gruppen für die Anzeige als Chips, mit markierten Positionen. */
export function gruppenAnzeige(gruppen, markiert = []) {
  return gruppen.map((g, i) => ({ text: g.text, typ: g.typ, imTrend: g.imTrend, markiert: markiert.includes(i) }));
}

function verschiedene(richtig, kandidaten, anzahl = 3) {
  const liste = [];
  for (const k of kandidaten) {
    if (k && k !== richtig && !liste.includes(k)) liste.push(k);
    if (liste.length === anzahl) break;
  }
  return liste;
}

// ---------- Stufe 2: Entschlüsseln ----------

const minus = (n) => String(n).replace('-', '−');

export function entschluesselnFragen(z, text) {
  const a = auswerten(text);
  const g = a.gruppen;
  const lesen = (rechenweg) => ({ rechenweg, wegTitel: 'So liest du es' });
  const index = (typ) => g.findIndex((x) => x.typ === typ && !x.imTrend);
  const fragen = [];
  const neu = (markiert, frage) => fragen.push({ gruppen: gruppenAnzeige(g, markiert), ...frage });

  const wi = index('wind');
  const w = a.wind;
  if (w && w.staerke === 0) {
    neu([wi], { typ: 'auswahl', frage: 'Wie ist der Wind?', richtig: 'Windstille', falsch: ['Wind aus wechselnden Richtungen', 'Wind aus Norden mit 10 kt', 'Wind nicht gemessen'], erklaerung: '00000KT bedeutet Windstille.' });
  } else if (w?.vrb) {
    neu([wi], { typ: 'auswahl', frage: 'Woher weht der Wind?', richtig: 'Aus wechselnden Richtungen', falsch: ['Aus Norden', 'Aus Süden', 'Aus Westen'], erklaerung: 'VRB steht für variable – wechselnde Windrichtung, meist bei schwachem Wind.' });
    neu([wi], { typ: 'zahl', frage: 'Mit welcher mittleren Geschwindigkeit weht der Wind?', loesung: w.staerke, einheit: 'kt', ...lesen(['Nach **VRB** (wechselnde Richtung) folgen zwei Ziffern für die mittlere Geschwindigkeit, dann **KT** für Knoten.', `${g[wi].text} → **${w.staerke} kt**.`]) });
  } else if (w) {
    neu([wi], { typ: 'zahl', frage: 'Aus welcher Richtung weht der Wind?', loesung: w.richtung, einheit: '°', kreis: true, ...lesen([`In der Windgruppe sind die **ersten drei Ziffern** die Richtung, aus der der Wind kommt (rechtweisend).`, `${g[wi].text} → **${String(w.richtung).padStart(3, '0')}°**.`]) });
    neu([wi], { typ: 'zahl', frage: 'Mit welcher mittleren Geschwindigkeit weht der Wind?', loesung: w.staerke, einheit: 'kt', ...lesen(['Nach den drei Ziffern der Richtung folgen **zwei Ziffern** für die mittlere Geschwindigkeit, am Ende **KT** für Knoten.', `${g[wi].text} → **${w.staerke} kt**.`]) });
    if (w.boeen) neu([wi], { typ: 'zahl', frage: 'Wie stark sind die Böen?', loesung: w.boeen, einheit: 'kt', ...lesen(['Hinter dem **G** (gusts) stehen die Spitzenböen.', `${g[wi].text} → G${w.boeen} → **${w.boeen} kt**.`]) });
  }

  if (a.windvariabel) {
    const { von, bis } = a.windvariabel;
    const vi = index('windvariabel');
    neu([vi], { typ: 'auswahl', frage: `Was bedeutet **${g[vi].text}**?`, richtig: `Die Windrichtung schwankt zwischen ${von}° und ${bis}°`, falsch: [`Der Wind dreht bis zum Abend von ${von}° auf ${bis}°`, `Böen kommen aus ${von}° bis ${bis}°`, `Die Sicht schwankt zwischen ${von} m und ${bis} m`] });
  }

  if (a.cavok) {
    neu([index('cavok')], { typ: 'auswahl', frage: 'Was bedeutet **CAVOK**?', richtig: 'Sicht 10 km oder mehr, keine Wolken unter 5000 ft, keine CB/TCU, kein signifikantes Wetter', falsch: ['Wolkenlos und windstill', 'Sicht mehr als 5 km, keine Wolken unter 1500 ft', 'Keine Wolken unter 10 000 ft und kein Niederschlag'] });
  } else if (a.sicht >= 10000) {
    neu([index('sicht')], { typ: 'auswahl', frage: 'Wie groß ist die Sicht?', richtig: '10 km oder mehr', falsch: ['9999 m – knapp unter 10 km', 'Unter 10 km', 'Sicht nicht gemessen'], erklaerung: '9999 steht für 10 km oder mehr.' });
  } else if (a.sicht !== null) {
    neu([index('sicht')], { typ: 'zahl', frage: 'Wie groß ist die vorherrschende Sicht?', loesung: a.sicht, einheit: 'm', ...lesen(['Die Sicht steht als **vierstellige Zahl in Metern** – 9999 hieße 10 km oder mehr.', `${g[index('sicht')].text} → **${a.sicht} m**.`]) });
  }

  const ri = index('rvr');
  if (ri >= 0) neu([ri], { typ: 'auswahl', frage: `Was bedeutet **${g[ri].text}**?`, richtig: g[ri].bedeutung, falsch: ['Piste gesperrt', 'Pistenzustand: nass', 'Windscherung auf der Piste'] });

  a.wetter.slice(0, 2).forEach((code) => {
    const wi2 = g.findIndex((x) => x.text === code && !x.imTrend);
    const richtig = code === 'NSW' ? g[wi2].bedeutung : wetterText(code);
    neu([wi2], { typ: 'auswahl', frage: `Was bedeutet **${code}**?`, richtig, falsch: verschiedene(richtig, z.mischen(WETTER_POOL).map(wetterText)) });
  });

  const wolkenIdx = g.map((x, i) => (x.typ === 'wolken' && !x.imTrend ? i : -1)).filter((i) => i >= 0);
  const vv = a.wolken.find((x) => x.menge === 'VV');
  if (vv) {
    const vvText = g.find((x) => x.typ === 'wolken' && !x.imTrend && x.text.startsWith('VV'))?.text ?? 'VV';
    neu(wolkenIdx, { typ: 'zahl', frage: 'Der Himmel ist nicht erkennbar. Wie groß ist die Vertikalsicht?', loesung: vv.hoehe, einheit: 'ft', ...lesen(['**VV** heißt Vertikalsicht – die drei Ziffern sind **Hundert Fuß**.', `${vvText} → ${vvText.slice(2, 5)} × 100 = **${vv.hoehe} ft**.`]) });
  } else if (a.hauptwolkenuntergrenze !== null) {
    const schicht = g.find((x) => x.typ === 'wolken' && !x.imTrend && /^(BKN|OVC)\d{3}/.test(x.text) && Number(x.text.slice(3, 6)) * 100 === a.hauptwolkenuntergrenze);
    neu(wolkenIdx, {
      typ: 'zahl', frage: 'Wo liegt die Hauptwolkenuntergrenze (über Platzhöhe)?', loesung: a.hauptwolkenuntergrenze, einheit: 'ft',
      ...lesen([
        'Suche die **tiefste Schicht mit BKN oder OVC** – FEW und SCT zählen nicht.',
        schicht ? `${schicht.text} → ${schicht.text.slice(3, 6)} × 100 = **${a.hauptwolkenuntergrenze} ft** über Platzhöhe.` : `Die drei Ziffern sind Hundert Fuß → **${a.hauptwolkenuntergrenze} ft** über Platzhöhe.`,
      ]),
    });
  } else if (a.wolken.some((x) => ['FEW', 'SCT'].includes(x.menge))) {
    const richtig = 'Keine – es gibt keine Schicht mit BKN oder OVC';
    neu(wolkenIdx, { typ: 'auswahl', frage: 'Wo liegt die Hauptwolkenuntergrenze?', richtig, falsch: verschiedene(richtig, a.wolken.filter((x) => x.hoehe).map((x) => `Bei ${x.hoehe} ft`).concat(['Bei 1500 ft', 'Bei 5000 ft'])), erklaerung: 'FEW und SCT bedecken höchstens 4 Achtel – sie zählen nicht als Hauptwolkenuntergrenze.' });
  }

  const ti = index('temperatur');
  if (ti >= 0) {
    neu([ti], { typ: 'zahl', frage: 'Wie hoch ist die Temperatur?', loesung: a.temperatur, einheit: '°C', ...lesen(['**Vor** dem Schrägstrich steht die Temperatur, dahinter der Taupunkt. **M** heißt minus.', `${g[ti].text} → **${minus(a.temperatur)} °C**.`]) });
    neu([ti], { typ: 'zahl', frage: 'Wie hoch ist der Taupunkt?', loesung: a.taupunkt, einheit: '°C', ...lesen(['Vor dem Schrägstrich steht die Temperatur, **dahinter der Taupunkt**. **M** heißt minus.', `${g[ti].text} → **${minus(a.taupunkt)} °C**.`]) });
  }

  const qi = index('qnh');
  if (qi >= 0) neu([qi], { typ: 'zahl', frage: 'Welches QNH ist gemeldet?', loesung: a.qnh, einheit: 'hPa', ...lesen(['**Q** steht für das QNH in Hektopascal.', `${g[qi].text} → **${a.qnh} hPa**.`]) });

  const tri = g.findIndex((x) => x.typ === 'trend');
  if (tri >= 0) {
    const BEDEUTUNG = { NOSIG: 'Keine wesentliche Änderung in den nächsten 2 Stunden', BECMG: 'Das Wetter ändert sich dauerhaft zu den folgenden Werten', TEMPO: 'Die folgenden Werte treten nur vorübergehend auf' };
    const richtig = BEDEUTUNG[g[tri].text];
    const markiert = g.map((x, i) => (x.imTrend ? i : -1)).filter((i) => i >= 0);
    neu(markiert, { typ: 'auswahl', frage: `Was sagt der Trend **${g[tri].text}** aus?`, richtig, falsch: [...Object.values(BEDEUTUNG).filter((b) => b !== richtig), 'So war das Wetter in den letzten 2 Stunden'] });
  }
  return fragen;
}

// ---------- Stufe 3: METAR bauen ----------

export function normalisieren(text) {
  return String(text).toUpperCase().replace(/=\s*$/, '').trim().split(/\s+/).filter(Boolean);
}

/** Vergleicht Eingabe und Lösung gruppenweise (längste gemeinsame Teilfolge). */
export function bauenVergleichen(eingabe, soll) {
  const a = normalisieren(eingabe);
  const b = normalisieren(soll);
  const tabelle = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      tabelle[i][j] = a[i] === b[j] ? tabelle[i + 1][j + 1] + 1 : Math.max(tabelle[i + 1][j], tabelle[i][j + 1]);
    }
  }
  const eingabeStatus = a.map((t) => ({ text: t, ok: false }));
  const sollStatus = b.map((t) => ({ text: t, ok: false }));
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { eingabeStatus[i].ok = true; sollStatus[j].ok = true; i++; j++; }
    else if (tabelle[i + 1][j] >= tabelle[i][j + 1]) i++;
    else j++;
  }
  const richtig = a.length === b.length && eingabeStatus.every((t) => t.ok);
  return { richtig, eingabe: eingabeStatus, soll: sollStatus };
}

/** Klartext-Beschreibung eines METARs für Stufe 3 (eine Zeile je Gruppe). */
export function beschreibung(text) {
  return zerlegen(text).map((g) => ({ typ: g.typ, text: g.bedeutung, imTrend: g.imTrend }));
}

// ---------- Stufe 3 mit Bausteinen: fast richtige Gruppen als Fallen ----------

const drei3 = (n) => String(((n % 360) + 360) % 360 || 360).padStart(3, '0');
const RANG_TAUSCH = { FEW: 'SCT', SCT: 'BKN', BKN: 'OVC', OVC: 'BKN' };
const WETTER_TAUSCH = { BR: 'FG', FG: 'BR', HZ: 'BR' };

/** Fast richtige Varianten einer Gruppe – jeweils mit dem Grund, warum sie falsch ist. */
function fallen(g) {
  const t = g.text;
  const liste = [];
  const neu = (text, grund) => { if (text && text !== t) liste.push({ text, grund }); };
  let m;
  if (g.typ === 'zeit' && (m = /^(\d{6})Z$/.exec(t))) neu(m[1], 'Die Beobachtungszeit endet immer mit Z – sie ist in UTC angegeben.');
  if (g.typ === 'wind' && (m = /^(\d{3})(\d{2})(?:G(\d{2}))?KT$/.exec(t)) && t !== '00000KT') {
    const [, r, f, b] = m;
    neu(`${drei3(Number(r) + 180)}${f}${b ? `G${b}` : ''}KT`, 'Die Richtung ist umgedreht: Ein METAR nennt immer, woher der Wind kommt.');
    neu(`${r}${f}${b ? `G${b}` : ''}MPS`, 'Falsche Einheit: In Deutschland wird der Wind in Knoten (KT) gemeldet.');
    if (!b && Number(f) >= 5) neu(`${r}${f}G${String(Number(f) + 5).padStart(2, '0')}KT`, 'Böen werden erst gemeldet, wenn sie den Mittelwind um mindestens 10 kt übersteigen.');
  }
  if (g.typ === 'wind' && (m = /^VRB(\d{2})KT$/.exec(t))) neu(`VRB${Number(m[1])}KT`, 'Die Windgeschwindigkeit hat immer zwei Ziffern.');
  if (g.typ === 'wind' && t === '00000KT') neu('VRB00KT', 'Windstille wird als 00000KT gemeldet.');
  if (g.typ === 'windvariabel' && (m = /^(\d{3})V(\d{3})$/.exec(t))) neu(`${m[2]}V${m[1]}`, 'Vertauscht: Die Schwankung wird im Uhrzeigersinn angegeben, von der ersten zur zweiten Richtung.');
  if (g.typ === 'sicht' && (m = /^(\d{4})$/.exec(t))) {
    const meter = Number(m[1]);
    if (meter === 9999) neu('CAVOK', 'CAVOK geht nur, wenn außerdem kein Wetter und keine Wolken unter 5000 ft (und keine CB/TCU) gemeldet werden.');
    else if (meter >= 1000) neu(String(meter / 10).padStart(4, '0'), `Eine Null zu wenig: ${String(meter / 10).padStart(4, '0')} wären nur ${meter / 10} m.`);
    else neu(String(meter * 10).padStart(4, '0'), `Eine Null zu viel: ${meter * 10} m statt ${meter} m.`);
  }
  if (g.typ === 'cavok') neu('9999', 'Hier passt CAVOK: Sicht ab 10 km, kein Wetter, keine Wolken unter 5000 ft – dann ersetzt CAVOK Sicht, Wetter und Wolken.');
  if (g.typ === 'wetter' && t !== 'NSW') {
    if ((m = /^([-+]?)(RA|DZ|SN|SHRA|SHSN|TSRA|FZRA|FZDZ)$/.exec(t))) {
      neu(`${m[1] === '+' ? '-' : '+'}${m[2]}`, `Falsche Stärke: ${m[1] === '-' ? 'leicht' : m[1] === '+' ? 'stark' : 'mäßig'} ist gemeldet.`);
      if ((m = /^([-+]?)(SH|TS|FZ)(RA|SN|DZ)$/.exec(t))) neu(`${m[1]}${m[3]}${m[2]}`, 'Falsche Reihenfolge: Erst kommt die Art (SH, TS, FZ), dann die Erscheinung (RA, SN, DZ).');
    }
    if (WETTER_TAUSCH[t]) neu(WETTER_TAUSCH[t], { BR: 'BR (Dunst) steht für 1000 bis 5000 m Sicht – darunter heißt es FG (Nebel).', FG: 'FG (Nebel) gibt es nur unter 1000 m Sicht – darüber heißt es BR (Dunst).', HZ: 'HZ ist trockener Dunst; feuchter Dunst heißt BR.' }[WETTER_TAUSCH[t]]);
    if ((m = /^VC(SH|TS)$/.exec(t))) neu(`${m[1]}VC`, 'Falsche Reihenfolge: VC (in der Nähe) steht vorn.');
  }
  if (g.typ === 'wolken' && (m = /^(FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?$/.exec(t))) {
    const [, menge, hoehe, art = ''] = m;
    const h = Number(hoehe);
    if (h < 100) neu(`${menge}${String(h * 10).padStart(3, '0')}${art}`, `Die Höhe steht in Hundert Fuß: ${String(h * 10).padStart(3, '0')} wären ${h * 1000} ft statt ${h * 100} ft.`);
    else neu(`${menge}${String(Math.round(h / 10)).padStart(3, '0')}${art}`, `Die Höhe steht in Hundert Fuß: ${String(Math.round(h / 10)).padStart(3, '0')} wären nur ${Math.round(h / 10) * 100} ft.`);
    neu(`${RANG_TAUSCH[menge]}${hoehe}${art}`, `Falsche Bedeckung: ${{ FEW: '1–2', SCT: '3–4', BKN: '5–7', OVC: '8' }[RANG_TAUSCH[menge]]} Achtel passt nicht zur Beschreibung.`);
  }
  if (g.typ === 'wolken' && (m = /^VV(\d{3})$/.exec(t))) neu(`VV${String(Number(m[1]) * 10).padStart(3, '0')}`, 'Die Vertikalsicht steht in Hundert Fuß.');
  if (g.typ === 'temperatur' && (m = /^(M?)(\d{2})\/(M?)(\d{2})$/.exec(t))) {
    const [, m1, t1, m2, t2] = m;
    if (m1 || m2) neu(`${m1 ? '-' : ''}${t1}/${m2 ? '-' : ''}${t2}`, 'Minusgrade werden mit M geschrieben, nicht mit einem Minuszeichen.');
    if (m1 || m2) neu(`${t1}/${t2}`, 'Das M für Minusgrade fehlt.');
    if (t !== `${m2}${t2}/${m1}${t1}`) neu(`${m2}${t2}/${m1}${t1}`, 'Vertauscht: Erst kommt die Temperatur, dann der Taupunkt.');
  }
  if (g.typ === 'qnh' && (m = /^Q(\d)(\d)(\d)(\d)$/.exec(t))) {
    if (m[3] !== m[4]) neu(`Q${m[1]}${m[2]}${m[4]}${m[3]}`, 'Zahlendreher im QNH.');
    neu(`A${m[1]}${m[2]}${m[3]}${m[4]}`, 'A steht für Zoll Quecksilbersäule (USA) – in Europa wird das QNH in hPa mit Q gemeldet.');
  }
  if (g.typ === 'trend' && ['BECMG', 'TEMPO'].includes(t)) neu(t === 'BECMG' ? 'TEMPO' : 'BECMG', t === 'BECMG' ? 'TEMPO hieße „nur vorübergehend“ – beschrieben ist eine dauerhafte Änderung.' : 'BECMG hieße „dauerhafte Änderung“ – beschrieben ist eine vorübergehende.');
  if (g.typ === 'trendzeit' && (m = /^(FM|TL)(\d{2})(\d{2})$/.exec(t))) neu(`${m[1] === 'FM' ? 'TL' : 'FM'}${m[2]}${m[3]}`, m[1] === 'FM' ? 'TL heißt „bis“ – hier ist „ab“ gemeint (FM).' : 'FM heißt „ab“ – hier ist „bis“ gemeint (TL).');
  if (g.typ === 'rvr' && (m = /^R(\d{2})\/(\d)(\d{3})([UDN]?)$/.exec(t)) && m[2] === '0') neu(`R${m[1]}/${m[3]}${m[4]}`, 'Die Pistensichtweite hat immer vier Ziffern.');
  if (g.typ === 'mindestsicht' && (m = /^(\d{4})([NESW]{1,2})$/.exec(t))) neu(`${m[2]}${m[1]}`, 'Falsche Reihenfolge: erst die Sicht, dann die Richtung.');
  return liste;
}

/**
 * Bausteine für Stufe 3: alle Gruppen der Lösung und – mit Fallen – fast richtige Varianten.
 * Ergebnis: { teile: [Gruppen], auswahl: [{ text, id, grund? }] } (grund nur bei Fallen)
 */
export function bauBausteine(loesung, z, anzahlFallen = 0) {
  const gruppen = zerlegen(loesung);
  const teile = gruppen.map((g) => g.text);
  const vorhanden = new Set(teile);
  const kandidaten = z.mischen(gruppen.flatMap((g, i) => fallen(g).map((f) => ({ ...f, gruppe: i }))))
    .filter((f) => !vorhanden.has(f.text));
  // höchstens eine Falle je Gruppe, damit die Fallen verteilt sind
  const gewaehlt = [];
  const benutzt = new Set();
  for (const f of kandidaten) {
    if (gewaehlt.length >= anzahlFallen) break;
    if (benutzt.has(f.gruppe) || gewaehlt.some((x) => x.text === f.text)) continue;
    benutzt.add(f.gruppe);
    gewaehlt.push(f);
  }
  return {
    teile,
    auswahl: z.mischen([
      ...teile.map((text, i) => ({ text, id: `r${i}` })),
      ...gewaehlt.map((f, i) => ({ text: f.text, id: `f${i}`, grund: f.grund })),
    ]),
  };
}

// ---------- Stufe 5: Fehler finden ----------

const tausche = (gruppen, i, neu) => gruppen.map((g, j) => (j === i ? neu : g));
const finde = (gruppen, typ, bedingung = () => true) => gruppen.findIndex((g) => g.typ === typ && !g.imTrend && bedingung(g));

/**
 * Baut in ein korrektes METAR genau einen typischen Fehler ein.
 * Ergebnis: { text, stellen: [Index der fehlerhaften Gruppe(n)], grund } oder null, wenn keiner passt.
 */
const FEHLER = {
  boeen(g, z) {
    const i = finde(g, 'wind', (x) => /^\d{5}KT$/.test(x.text) && Number(x.text.slice(3, 5)) >= 6);
    if (i < 0) return null;
    const f = Number(g[i].text.slice(3, 5));
    return { gruppen: tausche(g, i, `${g[i].text.slice(0, 5)}G${String(f + z.ganz(3, 8)).padStart(2, '0')}KT`), stellen: [i], grund: 'Böen werden nur gemeldet, wenn sie den Mittelwind um mindestens 10 kt übersteigen.' };
  },
  windrichtung(g, z) {
    const i = finde(g, 'wind', (x) => /^\d{5}(G\d{2})?KT$/.test(x.text) && x.text !== '00000KT');
    if (i < 0) return null;
    const r = Number(g[i].text.slice(0, 3)) + z.wahl([-3, -2, 2, 3, 4]);
    return { gruppen: tausche(g, i, `${drei3(r)}${g[i].text.slice(3)}`), stellen: [i], grund: 'Die Windrichtung wird im METAR auf volle 10° gerundet – sie endet immer auf 0.' };
  },
  nebel(g, z) {
    const s = finde(g, 'sicht', (x) => /^\d{4}$/.test(x.text) && Number(x.text) >= 1500 && Number(x.text) <= 5000);
    const w = finde(g, 'wetter', (x) => x.text === 'BR');
    if (s < 0) return null;
    if (w >= 0) return { gruppen: tausche(g, w, 'FG'), stellen: [w, s], grund: `Nebel (FG) wird nur bei einer Sicht unter 1000 m gemeldet – bei ${Number(g[s].text)} m heißt es Dunst (BR).` };
    return null;
  },
  dunst(g) {
    const s = finde(g, 'sicht', (x) => /^\d{4}$/.test(x.text) && Number(x.text) >= 6000 && Number(x.text) <= 9000);
    if (s < 0 || g.some((x) => x.typ === 'wetter' && !x.imTrend)) return null;
    return { gruppen: [...g.slice(0, s + 1), 'BR', ...g.slice(s + 1)], stellen: [s + 1, s], grund: `Feuchter Dunst (BR) passt nur zu einer Sicht von 1000 bis 5000 m – bei ${Number(g[s].text)} m wird kein BR gemeldet.` };
  },
  taupunkt(g) {
    const i = finde(g, 'temperatur', (x) => /^M?\d{2}\/M?\d{2}$/.test(x.text) && x.text.split('/')[0] !== x.text.split('/')[1]);
    if (i < 0) return null;
    const [a, b] = g[i].text.split('/');
    return { gruppen: tausche(g, i, `${b}/${a}`), stellen: [i], grund: 'Der Taupunkt kann nie höher als die Temperatur sein – hier sind die beiden Werte vertauscht.' };
  },
  reihenfolge(g) {
    const idx = g.map((x, i) => (x.typ === 'wolken' && !x.imTrend && /^(FEW|SCT|BKN|OVC)\d{3}/.test(x.text) ? i : -1)).filter((i) => i >= 0);
    if (idx.length < 2) return null;
    const [a, b] = idx;
    const neu = [...g];
    [neu[a], neu[b]] = [neu[b], neu[a]];
    return { gruppen: neu, stellen: [a, b], grund: 'Wolkenschichten stehen von unten nach oben – die tiefste Schicht zuerst.' };
  },
  zweiteFew(g) {
    const idx = g.map((x, i) => (x.typ === 'wolken' && !x.imTrend && /^(SCT|BKN|OVC)\d{3}$/.test(x.text) ? i : -1)).filter((i) => i >= 0);
    const erste = g.findIndex((x) => x.typ === 'wolken' && !x.imTrend);
    const zweite = idx.find((i) => i > erste);
    if (erste < 0 || zweite === undefined) return null;
    return { gruppen: tausche(g, zweite, `FEW${g[zweite].text.slice(3)}`), stellen: [zweite], grund: 'Eine zweite Wolkenschicht wird erst ab SCT (3 Achtel) gemeldet – FEW passt hier nicht.' };
  },
  cavok(g, z) {
    const i = finde(g, 'cavok');
    if (i < 0) return null;
    return { gruppen: [...g.slice(0, i + 1), `BKN${String(z.ganz(15, 40)).padStart(3, '0')}`, ...g.slice(i + 1)], stellen: [i + 1, i], grund: 'CAVOK heißt unter anderem „keine Wolken unter 5000 ft“ – eine Schicht darunter passt nicht dazu.' };
  },
  gewitter(g) {
    const w = finde(g, 'wetter', (x) => /TS/.test(x.text));
    if (w < 0) return null;
    const cb = finde(g, 'wolken', (x) => x.text.endsWith('CB'));
    if (cb < 0) return null;
    return { gruppen: tausche(g, cb, g[cb].text.slice(0, -2)), stellen: [w, cb], grund: 'Bei Gewitter (TS) wird immer eine Wolkenschicht mit CB gemeldet – hier fehlt das CB.' };
  },
  qnh(g) {
    const i = finde(g, 'qnh', (x) => /^Q0\d{3}$/.test(x.text));
    if (i < 0) return null;
    return { gruppen: tausche(g, i, `Q${g[i].text.slice(2)}`), stellen: [i], grund: 'Das QNH hat immer vier Ziffern – unter 1000 hPa mit führender Null (z. B. Q0998).' };
  },
  zeit(g) {
    const i = finde(g, 'zeit');
    if (i < 0) return null;
    return { gruppen: tausche(g, i, g[i].text.slice(0, -1)), stellen: [i], grund: 'Die Beobachtungszeit endet mit Z – das Zeichen für UTC.' };
  },
  variabel(g, z) {
    const i = finde(g, 'wind', (x) => /^\d{5}KT$/.test(x.text) && Number(x.text.slice(3, 5)) >= 4);
    if (i < 0 || g.some((x) => x.typ === 'windvariabel')) return null;
    const r = Number(g[i].text.slice(0, 3));
    return { gruppen: [...g.slice(0, i + 1), `${drei3(r - 10)}V${drei3(r + z.wahl([10, 20]))}`, ...g.slice(i + 1)], stellen: [i + 1], grund: 'Eine schwankende Windrichtung (dddVddd) wird erst ab 60° Schwankung gemeldet.' };
  },
};

export const FEHLERARTEN = Object.keys(FEHLER);
// Reine Formfehler (Zeit ohne Z, QNH dreistellig) nur, wenn keine inhaltliche Regel passt
const FORMFEHLER = ['zeit', 'qnh'];

export function fehlerEinbauen(z, text, art = null) {
  const gruppen = zerlegen(text);
  const reihenfolge = art ? [art] : [...z.mischen(FEHLERARTEN.filter((f) => !FORMFEHLER.includes(f))), ...z.mischen(FORMFEHLER)];
  for (const name of reihenfolge) {
    const ergebnis = FEHLER[name](gruppen, z);
    if (!ergebnis) continue;
    const neu = ergebnis.gruppen.map((x) => (typeof x === 'string' ? x : x.text)).join(' ');
    return { text: neu, stellen: ergebnis.stellen, grund: ergebnis.grund, art: name };
  }
  return null;
}

// ---------- Stufe 4: Entscheiden ----------

export function windKomponenten(windRichtung, staerke, piste) {
  const winkel = (windRichtung - parseInt(piste, 10) * 10) * RAD;
  return { gegen: staerke * Math.cos(winkel), seite: Math.abs(staerke * Math.sin(winkel)), vonRechts: Math.sin(winkel) > 0 };
}

export function ctrEntscheidung(sicht, decke) {
  if (sicht >= 5000 && (decke === null || decke >= 1500)) return 'vfr';
  if (sicht >= 1500 && (decke === null || decke >= 600)) return 'sonder';
  return 'nein';
}

const CTR_TEXT = { vfr: 'VFR ohne Sonderfreigabe möglich', sonder: 'Nur mit Sonder-VFR-Freigabe', nein: 'Weder VFR noch Sonder-VFR' };

export function platzKopf(platz) {
  const luftraum = platz.luftraum === 'CTR' ? 'Kontrollzone (Luftraum D)' : `Luftraum G · Platzrunde ${platz.platzrunde} ft GND`;
  return `${platz.name} (fiktiv)\nPlatzhöhe ${platz.hoehe} ft · Pisten ${platz.pisten.join('/')}\n${luftraum}`;
}

const CTR_LAGEN = ['heiter', 'bewoelkt', 'regen', 'dunst', 'niesel', 'nebel', 'boeig', 'schauer'];
const G_LAGEN = ['heiter', 'cavok', 'bewoelkt', 'boeig', 'regen', 'niesel', 'schauer', 'gewitter', 'dunst'];

export function szenarioMetar(z, platz) {
  const lage = z.wahl(platz.luftraum === 'CTR' ? CTR_LAGEN : G_LAGEN);
  const stufe = Number(Object.entries(LAGEN).find(([, l]) => l.includes(lage))[0]);
  return metarErzeugen(z, { stufe, lage, station: { kennung: platz.kennung, pisten: platz.pisten } });
}

/** Einzelne Entscheidungsfragen; art: pistenwahl | seitenwind | boeen | luftraum | qnh | gewitter */
const drei = (g) => String(g).padStart(3, '0');
const komma2 = (n) => n.toFixed(2).replace('.', ',');
/** Winkel zwischen Wind und Piste (0–180°) und Pistenrichtung in Grad. */
function pistenWinkel(windRichtung, piste) {
  const richtung = parseInt(piste, 10) * 10;
  const d = Math.abs(((windRichtung - richtung + 540) % 360) - 180);
  return { richtung, d };
}

export function entscheidungsFrage(art, platz, flugzeug, metar) {
  const a = auswerten(metar);
  // Jede Frage zeigt den Flugplatz (Textblock) und das METAR (Gruppen-Chips).
  const code = platzKopf(platz);
  const gruppen = gruppenAnzeige(a.gruppen);
  const w = a.wind;
  const windNutzbar = w && !w.vrb && w.staerke >= 3;
  const komponenten = windNutzbar ? Object.fromEntries(platz.pisten.map((p) => [p, windKomponenten(w.richtung, w.staerke, p)])) : null;
  const beste = windNutzbar ? [...platz.pisten].sort((p, q) => komponenten[q].gegen - komponenten[p].gegen)[0] : platz.pisten[0];

  switch (art) {
    case 'pistenwahl': {
      if (!windNutzbar) return null;
      const [p1, p2] = platz.pisten;
      if (Math.abs(komponenten[p1].gegen - komponenten[p2].gegen) < 3) return null;
      return {
        typ: 'auswahl', code, gruppen, frage: 'Welche Piste wählst du für die Landung?', richtig: `Piste ${beste}`, falsch: platz.pisten.filter((p) => p !== beste).map((p) => `Piste ${p}`),
        rechenweg: [
          'Man startet und landet möglichst **gegen den Wind** – die Pistennummer ist die Richtung in Zehnergrad.',
          `Wind aus ${drei(w.richtung)}°: ${platz.pisten.map((p) => { const { richtung, d } = pistenWinkel(w.richtung, p); return `Piste ${p} (${drei(richtung)}°) → ${d}° Unterschied`; }).join(' · ')}.`,
          `Der kleinere Unterschied heißt Gegenwind (hier ${Math.round(komponenten[beste].gegen)} kt) → **Piste ${beste}**.`,
        ],
      };
    }
    case 'seitenwind': {
      if (!windNutzbar) return null;
      const k = komponenten[beste];
      const { richtung, d } = pistenWinkel(w.richtung, beste);
      return {
        typ: 'zahl', code, gruppen, frage: `Wie groß ist die Seitenwindkomponente des mittleren Windes auf Piste ${beste}?`, loesung: Math.round(k.seite), toleranz: 2, einheit: 'kt', hinweis: 'Missweisung vernachlässigen. Faustregel: Winkel 30° → ½, 45° → 0,7, 60° → 0,9 der Windgeschwindigkeit.',
        rechenweg: [
          `Piste ${beste} zeigt nach **${drei(richtung)}°**, der Wind kommt aus **${drei(w.richtung)}°** mit ${w.staerke} kt.`,
          `Winkel zwischen Wind und Piste: **${d}°**.`,
          `Seitenwind = Wind × sin ${d}° = ${w.staerke} kt × ${komma2(Math.abs(Math.sin(d * RAD)))} ≈ **${Math.round(k.seite)} kt** von ${k.vonRechts ? 'rechts' : 'links'}.`,
        ],
        erklaerung: 'Zum Kopfrechnen: bei 30° die Hälfte, bei 45° etwa 0,7, bei 60° etwa 0,9 und ab 90° die ganze Windgeschwindigkeit.',
      };
    }
    case 'boeen': {
      if (!windNutzbar || !w.boeen) return null;
      const seite = Math.abs(w.boeen * Math.sin((w.richtung - parseInt(beste, 10) * 10) * RAD));
      const innerhalb = seite <= flugzeug.seitenwind;
      const { d } = pistenWinkel(w.richtung, beste);
      return {
        typ: 'auswahl', code, gruppen, frage: `Du landest auf Piste ${beste}. Liegt die Seitenwindkomponente **in den Böen** innerhalb der nachgewiesenen Seitenwindkomponente deines Flugzeugs (${flugzeug.seitenwind} kt)?`, richtig: innerhalb ? 'Ja, sie liegt innerhalb' : 'Nein, sie liegt darüber', falsch: [innerhalb ? 'Nein, sie liegt darüber' : 'Ja, sie liegt innerhalb'],
        rechenweg: [
          `Rechne mit den **Böen** (${w.boeen} kt), nicht mit dem Mittelwind. Winkel zwischen Wind und Piste ${beste}: **${d}°**.`,
          `Seitenwind in den Böen = ${w.boeen} kt × sin ${d}° = ${w.boeen} × ${komma2(Math.abs(Math.sin(d * RAD)))} ≈ **${Math.round(seite)} kt**.`,
          `${Math.round(seite)} kt ${innerhalb ? '≤' : '>'} ${flugzeug.seitenwind} kt → **${innerhalb ? 'innerhalb' : 'darüber'}**.`,
        ],
        erklaerung: 'Der nachgewiesene Wert ist keine feste Grenze, aber ein wichtiger Anhaltspunkt – entscheidend sind auch deine Erfahrung und die Regeln deines Vereins.',
      };
    }
    case 'luftraum': {
      if (platz.luftraum === 'CTR') {
        const ergebnis = ctrEntscheidung(a.sicht, a.hauptwolkenuntergrenze ?? (a.wolken.find((x) => x.menge === 'VV')?.hoehe ?? null));
        const decke = a.hauptwolkenuntergrenze ?? (a.wolken.find((x) => x.menge === 'VV')?.hoehe ?? null);
        return {
          typ: 'auswahl', code, gruppen, frage: `Du willst in ${platz.name} nach VFR starten. Was ist bei diesem Wetter möglich?`, richtig: CTR_TEXT[ergebnis], falsch: Object.values(CTR_TEXT).filter((t) => t !== CTR_TEXT[ergebnis]),
          rechenweg: ctrWeg(a.sicht, decke, CTR_TEXT[ergebnis]),
          erklaerung: 'Hauptwolkenuntergrenze ist die tiefste Wolkenschicht mit BKN oder OVC unter 20 000 ft.',
        };
      }
      const decke = a.hauptwolkenuntergrenze;
      const richtig = decke === null ? 'Es ist keine Hauptwolkenuntergrenze gemeldet' : decke > platz.platzrunde ? 'Ja, sie liegt darüber' : 'Nein, sie liegt auf oder unter Platzrundenhöhe';
      const schicht = a.wolken.find((x) => x.hoehe === decke && ['BKN', 'OVC'].includes(x.menge));
      return {
        typ: 'auswahl', code, gruppen, frage: `Liegt die gemeldete Hauptwolkenuntergrenze über der Platzrundenhöhe von ${platz.platzrunde} ft über Grund?`, richtig, falsch: ['Ja, sie liegt darüber', 'Nein, sie liegt auf oder unter Platzrundenhöhe', 'Es ist keine Hauptwolkenuntergrenze gemeldet'].filter((t) => t !== richtig),
        rechenweg: decke === null
          ? ['Hauptwolkenuntergrenze = die **tiefste Schicht mit BKN oder OVC**.', `Im METAR gibt es keine solche Schicht${a.cavok ? ' (CAVOK)' : ''} → **keine Hauptwolkenuntergrenze gemeldet**.`]
          : [
            'Hauptwolkenuntergrenze = die **tiefste Schicht mit BKN oder OVC**. Die Zahl dahinter sind Hundert Fuß über dem Platz.',
            `${schicht ? `${schicht.menge}${String(decke / 100).padStart(3, '0')}` : 'Die tiefste solche Schicht'} → ${String(decke / 100).padStart(3, '0')} × 100 = **${decke} ft** über dem Platz.`,
            `${decke} ft ${decke > platz.platzrunde ? '>' : '≤'} ${platz.platzrunde} ft Platzrundenhöhe → **${decke > platz.platzrunde ? 'darüber' : 'auf oder darunter'}**.`,
          ],
        erklaerung: decke === null ? 'Wenige oder aufgelockerte Wolken (FEW, SCT) zählen nicht als Hauptwolkenuntergrenze.' : 'In der Platzrunde musst du frei von Wolken bleiben – plane nach oben ausreichend Abstand ein.',
      };
    }
    case 'qnh':
      return { typ: 'zahl', code, gruppen, frage: 'Du stellst vor dem Start das gemeldete QNH ein. Was zeigt dein Höhenmesser am Boden an?', loesung: platz.hoehe, toleranz: 20, einheit: 'ft', erklaerung: `Mit QNH zeigt der Höhenmesser die Höhe über MSL – am Boden also die Platzhöhe von ${platz.hoehe} ft.` };
    case 'gewitter':
      if (!a.gewitter && !a.gruppen.some((x) => /TS/.test(x.text))) return null;
      return { typ: 'auswahl', code, gruppen, frage: 'Was bedeutet die Gewitterangabe in dieser Meldung für deinen Flug?', richtig: 'Mit Gewittern, Böen und Turbulenz rechnen – Flug verschieben oder Gewitter weiträumig meiden', falsch: ['Unbedenklich, solange die Sicht über 5 km liegt', 'Gewitter betreffen nur den Instrumentenflug', 'Möglichst schnell starten, bevor es ankommt'], erklaerung: 'TS und CB bedeuten Gewitter: Böen, Turbulenz, Hagel, Windscherung. Abstand halten und lieber am Boden bleiben.' };
    default:
      return null;
  }
}

export function szenarioErzeugen(z, daten, kennung) {
  const platz = kennung ? daten.plaetze.find((p) => p.kennung === kennung) : z.wahl(daten.plaetze);
  const metar = szenarioMetar(z, platz);
  const fragen = ['pistenwahl', 'seitenwind', 'boeen', 'luftraum', 'gewitter', 'qnh']
    .map((art) => entscheidungsFrage(art, platz, daten.flugzeug, metar.text))
    .filter(Boolean);
  return { platz, metar, fragen };
}
