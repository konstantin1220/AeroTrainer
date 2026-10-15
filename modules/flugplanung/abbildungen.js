// Abbildungen für „Flugplanung“ – selbst gezeichnet. Karte: Übungsgebiet aus dem Thema Navigation.
import { svg, text, linie, pfeil, massstab } from '../../js/grafik.js';
import { uebungskarte } from '../navigation/abbildungen.js';
import { WEGPUNKTE, etappe, kraftstoffPlan, startstrecke } from './rechnen.js';

const r1 = (n) => n.toFixed(1);
const komma = (n, s = 0) => Number(n.toFixed(s)).toLocaleString('de-DE', { minimumFractionDigits: s, maximumFractionDigits: s });

/** Ablauf der Flugvorbereitung: acht Schritte und am Ende die Entscheidung. */
export function ablauf() {
  const schritte = ['Wetter', 'NOTAM & Luftraum', 'Strecke & Höhe', 'Navigationsflugplan', 'Kraftstoff', 'Masse & Leistung', 'Flugplan & Unterlagen', 'Persönliche Verfassung'];
  const b = 160, hh = 34, xl = 24, xr = 216;
  let inhalt = '';
  schritte.forEach((titel, i) => {
    const spalte = i % 2;
    const zeile = Math.floor(i / 2);
    const x = spalte ? xr : xl;
    const y = 16 + zeile * 56;
    inhalt += `<rect x="${x}" y="${y}" width="${b}" height="${hh}" rx="9" class="g-f-flaeche g-s-mf" stroke-width="1.6"/>`;
    inhalt += `<circle cx="${x + 18}" cy="${y + hh / 2}" r="10" class="g-f-mf"/>${text(x + 18, y + hh / 2 + 4, String(i + 1), { groesse: 11, gewicht: 800, klasse: 'g-f-weiss' })}`;
    inhalt += text(x + 34, y + hh / 2 + 4, titel, { groesse: 12, gewicht: 700, anker: 'start' });
    if (spalte === 0) inhalt += pfeil(x + b + 2, y + hh / 2, xr - 4, y + hh / 2, { farbe: 'leise', breite: 1.4, spitze: 7 });
    else if (i < schritte.length - 1) inhalt += pfeil(xr + b / 2, y + hh + 2, xl + b / 2, y + 56 - 3, { farbe: 'leise', breite: 1.2, spitze: 7 });
  });
  const yE = 16 + 4 * 56 + 6;
  inhalt += pfeil(xr + b / 2, yE - 20, 200, yE + 2, { farbe: 'leise', breite: 1.4, spitze: 7 });
  inhalt += `<path d="M200 ${yE + 4}l70 26-70 26-70-26z" class="g-f-orange" opacity=".18"/><path d="M200 ${yE + 4}l70 26-70 26-70-26z" class="g-s-orange" stroke-width="1.6" fill="none"/>`;
  inhalt += text(200, yE + 34, 'Go oder No-Go?', { groesse: 12, gewicht: 800 });
  inhalt += text(36, yE + 34, 'Plan B steht?', { groesse: 11, gewicht: 700, klasse: 'g-f-leise', anker: 'start' });
  inhalt += text(364, yE + 34, 'Abflug', { groesse: 11, gewicht: 700, klasse: 'g-f-ok', anker: 'end' });
  inhalt += pfeil(272, yE + 30, 318, yE + 30, { farbe: 'ok', breite: 1.4, spitze: 7 });
  inhalt += pfeil(128, yE + 30, 112, yE + 30, { farbe: 'leise', breite: 1.4, spitze: 7 });
  return svg(400, yE + 66, inhalt, 'Ablauf der Flugvorbereitung in acht Schritten bis zur Entscheidung');
}

/** Übungskarte mit einer Strecke aus Wegpunkt-IDs. */
export function routeKarte(ids) {
  const punkte = ids.map((id) => WEGPUNKTE[id]);
  return uebungskarte({ route: punkte, markiert: ids.filter((id) => ['altdorf', 'bergen', 'seefeld', 'neuheim', 'musterstadt'].includes(id)) });
}

/**
 * Kraftstoff als Balken im Maßstab des Tanks: Rollen, Strecke, Zuschlag, Endreserve – und was übrig bleibt.
 * plan aus kraftstoffPlan(); anBord = getankte Liter; tank = nutzbarer Inhalt.
 */
export function kraftstoffBalken(plan, anBord, tank) {
  const l = 14, r = 386, y = 52, hb = 34;
  const px = (liter) => (liter / tank) * (r - l);
  const teile = [
    ['Rollen', plan.rollen, 'g-f-leise'],
    ['Strecke', plan.strecke, 'g-f-primaer'],
    ['Zuschlag', plan.zuschlag, 'g-f-orange'],
    ['Endreserve', plan.reserve, 'g-f-fehler'],
  ];
  let x = l;
  let inhalt = `<rect x="${l}" y="${y}" width="${r - l}" height="${hb}" rx="6" class="g-f-flaeche g-s-rand" stroke-width="1"/>`;
  for (const [, liter, klasse] of teile) {
    const w = Math.max(0, Math.min(px(liter), r - x));
    if (w > 0) inhalt += `<rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="${hb}" class="${klasse}"/>`;
    if (w > 24) inhalt += text(r1(x + w / 2), y + hb / 2 + 5, `${Math.round(liter)}`, { groesse: 13, gewicht: 800, klasse: 'g-f-weiss' });
    x += w;
  }
  const xb = l + px(Math.min(anBord, tank));
  const reicht = anBord >= plan.gesamt;
  inhalt += linie(r1(xb), y - 16, r1(xb), y + hb + 8, reicht ? 'g-s-ok' : 'g-s-fehler', 2.6);
  inhalt += text(r1(Math.min(Math.max(xb, l + 50), r - 50)), y - 21, `an Bord ${Math.round(anBord)} l`, { groesse: 13, gewicht: 800, klasse: reicht ? 'g-f-ok' : 'g-f-fehler' });
  inhalt += text(l, y + hb + 22, `benötigt ${Math.round(plan.gesamt)} l`, { groesse: 13, gewicht: 800, anker: 'start' });
  inhalt += text(r, y + hb + 22, `Tank ${tank} l`, { groesse: 12, klasse: 'g-f-leise', anker: 'end' });
  // Legende in zwei Spalten
  teile.forEach(([name, liter, klasse], i) => {
    const lx = l + (i % 2) * 190;
    const ly = y + hb + 44 + Math.floor(i / 2) * 20;
    inhalt += `<rect x="${lx}" y="${ly - 10}" width="12" height="12" rx="2" class="${klasse}"/>` + text(lx + 18, ly, `${name}: ${komma(liter, liter < 10 && liter % 1 ? 1 : 0)} l`, { groesse: 12, anker: 'start' });
  });
  inhalt += massstab(l, 24, px(20), '20 l');
  return svg(400, y + hb + 74, inhalt, `Kraftstoff: benötigt ${Math.round(plan.gesamt)} Liter, an Bord ${Math.round(anBord)} Liter`);
}

/** Startstrecke und Pistenlänge im selben Maßstab. */
export function startstreckeBild(ergebnis, laenge, kennung) {
  const l = 20, r = 380, y = 70;
  const groesste = Math.max(laenge, ergebnis.startstrecke) * 1.05;
  const px = (m) => l + (m / groesste) * (r - l);
  const reicht = ergebnis.startstrecke <= laenge;
  let inhalt = `<rect x="${l}" y="${y}" width="${r1(px(laenge) - l)}" height="22" rx="3" fill="#4b5563"/>`;
  inhalt += `<line x1="${l + 4}" y1="${y + 11}" x2="${r1(px(laenge) - 4)}" y2="${y + 11}" stroke="#fff" stroke-width="1.2" stroke-dasharray="10 8"/>`;
  inhalt += text(l, y + 40, `Piste ${kennung}: ${komma(laenge)} m`, { groesse: 11, gewicht: 700, anker: 'start' });
  // Rollstrecke und Startstrecke über 15 m
  const yb = y - 28;
  inhalt += `<rect x="${l}" y="${yb}" width="${r1(px(ergebnis.rollstrecke) - l)}" height="10" rx="2" class="g-f-primaer"/>`;
  inhalt += text(r1(px(ergebnis.rollstrecke) + 6), yb + 9, `Rollen ${komma(Math.round(ergebnis.rollstrecke / 10) * 10)} m`, { groesse: 11, gewicht: 700, klasse: 'g-f-primaer g-halo', anker: 'start' });
  const steig = `M${r1(px(ergebnis.rollstrecke))} ${y - 2}Q${r1((px(ergebnis.rollstrecke) + px(ergebnis.startstrecke)) / 2)} ${y - 4} ${r1(px(ergebnis.startstrecke))} ${y - 44}`;
  inhalt += `<path d="${steig}" class="${reicht ? 'g-s-ok' : 'g-s-fehler'}" stroke-width="2.2" fill="none" stroke-dasharray="5 4"/>`;
  inhalt += linie(r1(px(ergebnis.startstrecke)), y - 44, r1(px(ergebnis.startstrecke)), y + 22, reicht ? 'g-s-ok' : 'g-s-fehler', 1.6);
  // Beschriftung links oder rechts der Marke – je nachdem, wo Platz ist
  const links = px(ergebnis.startstrecke) > 200;
  inhalt += text(r1(px(ergebnis.startstrecke) + (links ? -4 : 4)), y - 50, `15 m Höhe nach ${komma(Math.round(ergebnis.startstrecke / 10) * 10)} m`, { groesse: 11, gewicht: 800, klasse: `${reicht ? 'g-f-ok' : 'g-f-fehler'} g-halo`, anker: links ? 'end' : 'start' });
  inhalt += massstab(l, y + 64, px(100) - l, '100 m');
  return svg(400, y + 72, inhalt, `Startstrecke ${Math.round(ergebnis.startstrecke)} Meter bei ${laenge} Metern Pistenlänge`);
}

// Beispielflug Altdorf → Whiskey → Musterstadt (Kapitel „Ein Überlandflug von A bis Z“)
const BEISPIEL = { ids: ['altdorf', 'whiskey', 'musterstadt'], tas: 100, windRichtung: 270, windStaerke: 15 };

export function beispielEtappen() {
  const p = BEISPIEL.ids.map((id) => WEGPUNKTE[id]);
  return p.slice(1).map((b, i) => ({ von: p[i], nach: b, ...etappe(p[i], b, BEISPIEL) }));
}

export function abbildungenFuer(flugzeug) {
  const xber = flugzeug.plaetze.find((p) => p.kennung === 'XBER');
  return {
    ablauf,
    'route-beispiel': () => routeKarte(BEISPIEL.ids),
    'route-umweg': () => routeKarte(['altdorf', 'bgn', 'seefeld']),
    'kraftstoff-beispiel': () => kraftstoffBalken(kraftstoffPlan({ minuten: 40, verbrauch: flugzeug.verbrauch, rollen: flugzeug.rollKraftstoff, zuschlag: 0.1, reserveMinuten: 30 }), 60, flugzeug.kraftstoffNutzbar),
    'startstrecke-beispiel': () => startstreckeBild(startstrecke(flugzeug, { hoehe: xber.hoehe, temperatur: 25, masse: 1100, wind: 5, belag: xber.belag }), xber.laenge, `${xber.kennung} ${xber.piste}`),
  };
}
