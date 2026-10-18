// Interaktive Darstellungen für „Betriebsverfahren & Notfälle“.
import { h } from '../../js/ui.js';
import { regler, umschalter, wertanzeige, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { svg, text, linie, pfeil, flugzeug } from '../../js/grafik.js';
import { umkehrkurve, querlageFuer, wirbelLage } from './rechnen.js';

const r1 = (n) => Math.round(n * 10) / 10;
const ganz = (n) => String(Math.round(n));

// ---------- Umkehrkurve nach Motorausfall ----------

const FT_PX = 0.05; // 1 px = 20 ft – feste Draufsicht, damit Radius und Weg maßstäblich wachsen und schrumpfen

function umkehrBild(hoehe, querlage, fahrt) {
  const u = umkehrkurve({ hoeheFt: hoehe, querlage, fahrtKt: fahrt });
  const r = u.radiusFt * FT_PX;
  // Draufsicht: Piste nach Osten, Motorausfall hinter dem Pistenende, Kurve nach links (Norden) um 225°
  const pisteL = 30, pisteR = 150, py = 236, sx = 190;
  const cx = sx, cy = py - r;
  const ende = 225;
  const punkt = (grad) => [cx + r * Math.sin((grad * Math.PI) / 180), cy + r * Math.cos((grad * Math.PI) / 180)];
  // Kreisbogen von unten (Startpunkt) gegen den Uhrzeigersinn um 225°
  let bogen = `M${sx} ${py}`;
  for (let g = 0; g <= ende; g += 5) {
    const [x, y] = punkt(g);
    bogen += `L${r1(x)} ${r1(y)}`;
  }
  const [ex, ey] = punkt(ende);
  const sichtbar = r <= 112;
  // Höhenskala rechts: −1200 bis 1500 ft über Grund, fest
  const hy = (ft) => 270 - ((Math.max(-1200, Math.min(1500, ft)) + 1200) / 2700) * 240;
  const rest = u.restFt;
  const farbe = rest < 0 ? 'fehler' : rest < 200 ? 'orange' : 'ok';
  return svg(400, 290, `
    <rect width="400" height="290" class="g-f-land"/>
    <rect x="${pisteL}" y="${py - 6}" width="${pisteR - pisteL}" height="12" rx="2" class="g-f-text"/>
    ${linie(pisteL + 6, py, pisteR - 6, py, 'g-s-flaeche', 1, 'stroke-dasharray="6 5"')}
    ${text(90, py + 20, 'Piste', { groesse: 11, gewicht: 700 })}
    ${linie(pisteR, py, sx, py, 'g-s-primaer', 2)}
    ${sichtbar ? `<path d="${bogen}" class="g-s-${farbe}" stroke-width="2.4" fill="none"/>${pfeil(r1(ex), r1(ey), r1(ex - 28), r1(ey + 28), { farbe, breite: 2, spitze: 9 })}` : text(190, 120, 'Radius größer als das Bild', { groesse: 11, gewicht: 700, klasse: 'g-f-leise' })}
    ${flugzeug(sx, py, 90, 22, 'g-f-fehler')}
    ${text(sx, py + 20, 'Motor aus', { groesse: 11, gewicht: 800, klasse: 'g-f-fehler g-halo' })}
    ${sichtbar ? text(r1(cx), r1(cy), `Radius ${ganz(u.radiusFt)} ft`, { groesse: 11, gewicht: 700, klasse: 'g-f-text g-halo' }) : ''}
    ${linie(14, 22, 64, 22, 'g-s-text', 1.4)}${text(39, 14, '1000 ft', { groesse: 10, gewicht: 700 })}
    <rect x="300" y="24" width="92" height="252" rx="10" class="g-f-weiss" opacity=".85"/>
    ${linie(346, r1(hy(1500)), 346, r1(hy(-1200)), 'g-s-leise', 1)}
    ${linie(306, r1(hy(0)), 386, r1(hy(0)), 'g-s-text', 1.6)}
    ${text(346, r1(hy(0) + 12), 'Piste', { groesse: 10, gewicht: 700 })}
    <rect x="330" y="${r1(hy(hoehe))}" width="12" height="${r1(hy(0) - hy(hoehe))}" class="g-f-primaer" opacity=".7"/>
    <rect x="350" y="${r1(Math.min(hy(hoehe), hy(rest)))}" width="12" height="${r1(Math.abs(hy(rest) - hy(hoehe)))}" class="g-f-${farbe}" opacity=".75"/>
    ${text(346, 36, `Start ${ganz(hoehe)} ft`, { groesse: 10, gewicht: 700, klasse: 'g-f-primaer' })}
    ${text(346, 266, `danach ${ganz(rest)} ft`, { groesse: 10, gewicht: 800, klasse: `g-f-${farbe}` })}
  `, `Umkehrkurve: Radius ${ganz(u.radiusFt)} Fuß, Höhenverlust ${ganz(u.verlustFt)} Fuß, danach ${ganz(rest)} Fuß über der Piste`);
}

// ---------- Wirbelschleppen am Boden ----------

const M_PX = 1.05; // Pixel je Meter (Querschnitt quer zur Piste), fest
const PISTE_M = 45;

function wirbelBild(sekunden, wind, spannweite) {
  const l = wirbelLage({ sekunden, seitenwindKt: wind, spannweiteM: spannweite });
  const hoehe = Math.max(10, 40 - 1.5 * sekunden);
  const x = (m) => 200 + m * M_PX;
  const boden = 236;
  const y = boden - hoehe * 2.2;
  // Beschriftung nach außen (Luv links, Lee rechts) und im Bild gehalten
  const wirbel = (m, name, gefahr, seite) => {
    if (Math.abs(m) > 185) return '';
    const cx = x(m);
    const breite = name.length * 6.6;
    const lx = seite < 0 ? Math.max(8 + breite, cx - 4) : Math.min(392 - breite, cx + 4);
    return `<circle cx="${r1(cx)}" cy="${r1(y)}" r="14" class="g-s-${gefahr ? 'fehler' : 'primaer'}" stroke-width="2.2" fill="none" stroke-dasharray="20 6"/>`
      + `<circle cx="${r1(cx)}" cy="${r1(y)}" r="6" class="g-s-${gefahr ? 'fehler' : 'primaer'}" stroke-width="1.6" fill="none"/>`
      + text(r1(lx), r1(y - 26), name, { groesse: 11, gewicht: 800, klasse: `g-f-${gefahr ? 'fehler' : 'primaer'} g-halo`, anker: seite < 0 ? 'end' : 'start' });
  };
  const ueberPiste = (m) => Math.abs(m) < PISTE_M / 2;
  return svg(400, 290, `
    <rect width="400" height="290" class="g-f-himmel"/>
    <rect x="0" y="${boden}" width="400" height="${290 - boden}" class="g-f-wald"/>
    <rect x="${r1(x(-PISTE_M / 2))}" y="${boden - 3}" width="${r1(PISTE_M * M_PX)}" height="8" class="g-f-text"/>
    ${text(200, boden + 22, `Piste (${PISTE_M} m breit), Blick in Landerichtung`, { groesse: 11, gewicht: 700 })}
    ${linie(200, boden - 8, 200, boden - 30, 'g-s-leise', 1, 'stroke-dasharray="3 3"')}
    ${wind > 0 ? `${pfeil(16, 28, r1(16 + 10 + wind * 6), 28, { farbe: 'primaer', breite: 2.4, spitze: 9 })}${text(16, 46, `Seitenwind ${wind} kt von links`, { groesse: 11, gewicht: 700, klasse: 'g-f-primaer', anker: 'start' })}` : text(16, 34, 'Windstille', { groesse: 11, gewicht: 700, klasse: 'g-f-leise', anker: 'start' })}
    ${wirbel(l.luv, 'Luv-Wirbel', ueberPiste(l.luv), -1)}
    ${wirbel(l.lee, 'Lee-Wirbel', ueberPiste(l.lee), 1)}
    ${linie(270, 70, 370, 70, 'g-s-text', 1.4)}${text(320, 62, '100 m', { groesse: 10, gewicht: 700 })}
    ${text(384, 28, `nach ${sekunden} s`, { groesse: 12, gewicht: 800, anker: 'end' })}
    ${ueberPiste(l.luv) || ueberPiste(l.lee) ? text(200, 92, 'Wirbel über der Piste!', { groesse: 13, gewicht: 800, klasse: 'g-f-fehler g-halo' }) : ''}
  `, `Wirbelschleppen nach ${sekunden} Sekunden bei ${wind} Knoten Seitenwind: Luv-Wirbel ${Math.round(l.luv)} Meter, Lee-Wirbel ${Math.round(l.lee)} Meter von der Pistenmitte`);
}

export const interaktiv = {
  umkehrkurve: {
    titel: 'Zurück zur Piste? Die Umkehrkurve',
    kurz: 'Motorausfall nach dem Start: Stelle Höhe, Querneigung und Fahrt ein – und sieh, wie viel Höhe die Kurve kostet.',
    symbol: 'warnung',
    scheine: ['ppl', 'ul'],
    anleitung: 'Stelle ein, in welcher Höhe der Motor ausfällt, mit welcher Querneigung du die Umkehrkurve fliegst und wie schnell. Die Draufsicht zeigt maßstäblich den Kurvenkreis bis 225° (dann zeigt die Nase wieder zur Piste), rechts siehst du die Höhe vorher und danach. Gerechnet wird wie im Beispiel der FAA: 4 s Reaktionszeit, 1000 ft pro Minute Sinken geradeaus, in der Kurve mehr.',
    legende: [['primaer', 'Höhe beim Motorausfall'], ['ok', 'Höhe danach noch über der Piste'], ['fehler', 'unter der Piste – die Kurve geht nicht auf']],
    probier: ['Stelle die Standardkurve ein (etwa 10°): Wie viel Höhe kostet die Kurve aus 300 ft?', 'Erhöhe die Querneigung auf 45°: Wie verändern sich Radius und Höhenverlust?', 'Ab welcher Höhe käme das Flugzeug mit 45° Querneigung rechnerisch noch über der Piste an? Bedenke: Steile Kurven ohne Motor bringen dich nahe an den Strömungsabriss.'],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const hoehe = regler({ name: 'Höhe beim Motorausfall', min: 200, max: 1500, schritt: 50, wert: 300, format: (w) => `${w} ft über Grund`, beiAenderung: zeichnen });
      const standard = Math.round(querlageFuer(3, 65));
      const querlage = regler({ name: 'Querneigung', min: 10, max: 60, schritt: 5, wert: standard, format: (w) => `${w}°`, beiAenderung: zeichnen });
      const fahrt = regler({ name: 'Gleitgeschwindigkeit', min: 55, max: 80, schritt: 1, wert: 65, format: (w) => `${w} kt`, beiAenderung: zeichnen });
      function zeichnen() {
        const u = umkehrkurve({ hoeheFt: hoehe.wert, querlage: querlage.wert, fahrtKt: fahrt.wert });
        bild.zeichnen(umkehrBild(hoehe.wert, querlage.wert, fahrt.wert));
        werte.setzen([
          { titel: 'Kurvenrate', wert: `${r1(u.rate).toString().replace('.', ',')}° pro s` },
          { titel: 'Zeit bis 225°', wert: `${Math.round(u.zeitS)} s`, hinweis: 'mit 4 s Reaktion' },
          { titel: 'Höhenverlust', wert: `${ganz(u.verlustFt)} ft`, art: 'schlecht' },
          { titel: 'Höhe danach', wert: `${ganz(u.restFt)} ft`, art: u.restFt < 0 ? 'schlecht' : 'gut' },
        ]);
        if (u.restFt < 0) hinweis.setzen('Die Kurve geht nicht auf: Das Flugzeug wäre unter der Piste, bevor es zurückzeigt. Geradeaus oder leicht seitlich landen.', 'fehler');
        else if (querlage.wert >= 40) hinweis.setzen('Rechnerisch reicht die Höhe – aber eine steile Kurve ohne Motor in Bodennähe birgt die Gefahr eines Strömungsabrisses. Nur mit Übung in deinem Muster und in sicherer Höhe trainiert.', 'warnung');
        else hinweis.setzen('Rechnerisch bleibt Höhe übrig. Bedenke: Danach musst du noch zur Piste zurückgleiten – mit Rückenwind und wenig Platz.', 'warnung');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, hoehe.el), h('div', { class: 'breit' }, querlage.el), h('div', { class: 'breit' }, fahrt.el)), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Vereinfachtes Modell nach dem Beispiel im Airplane Flying Handbook der FAA (Kapitel 18). Die Sinkrate in der Kurve steigt hier mit dem Lastvielfachen (n hoch 1,5). Echte Werte hängen von Muster, Masse und Technik ab – üben nur mit Fluglehrer in sicherer Höhe.'));
    },
  },

  wirbelschleppe: {
    titel: 'Wo bleiben die Wirbelschleppen?',
    kurz: 'Ein großes Flugzeug ist gelandet: Stelle Seitenwind und Zeit ein und sieh, wohin die Wirbel wandern.',
    symbol: 'thermik',
    anleitung: 'Du schaust in Landerichtung auf die Piste, auf der gerade ein großes Flugzeug gelandet ist. Nahe am Boden wandern seine beiden Wirbel mit etwa 2,5 kt nach außen und sinken. Seitenwind bremst den Wirbel auf der Luvseite und schiebt den anderen schneller weg. Der Querschnitt ist maßstäblich (Maßstabsleiste oben rechts).',
    legende: [['primaer', 'Wirbel neben der Piste'], ['fehler', 'Wirbel über der Piste']],
    probier: ['Bei Windstille: Wie schnell sind beide Wirbel von der Piste weg?', 'Stelle 2 bis 3 kt Seitenwind ein: Was passiert mit dem Luv-Wirbel?', 'Bei welchem Seitenwind liegt der Luv-Wirbel nach 2 Minuten noch über der Piste?'],
    erstellen() {
      const bild = buehne();
      const werte = wertanzeige();
      const hinweis = meldung();
      const art = umschalter({ name: 'Flugzeug davor', optionen: [['60', 'großes (60 m Spannweite)'], ['35', 'mittleres (35 m)']], wert: '60', beiAenderung: zeichnen });
      const wind = regler({ name: 'Seitenwind', min: 0, max: 10, schritt: 0.5, wert: 0, format: (w) => `${String(w).replace('.', ',')} kt`, beiAenderung: zeichnen });
      const zeit = regler({ name: 'Zeit nach der Landung', min: 0, max: 120, schritt: 5, wert: 30, format: (w) => `${w} s`, beiAenderung: zeichnen });
      function zeichnen() {
        const spannweite = Number(art.wert);
        const l = wirbelLage({ sekunden: zeit.wert, seitenwindKt: wind.wert, spannweiteM: spannweite });
        bild.zeichnen(wirbelBild(zeit.wert, wind.wert, spannweite));
        const ueber = Math.abs(l.luv) < PISTE_M / 2 || Math.abs(l.lee) < PISTE_M / 2;
        werte.setzen([
          { titel: 'Luv-Wirbel', wert: `${Math.round(Math.abs(l.luv))} m`, hinweis: l.luv < 0 ? 'links der Mitte' : 'rechts der Mitte', art: Math.abs(l.luv) < PISTE_M / 2 ? 'schlecht' : '' },
          { titel: 'Lee-Wirbel', wert: `${Math.round(Math.abs(l.lee))} m`, hinweis: 'rechts der Mitte', art: Math.abs(l.lee) < PISTE_M / 2 ? 'schlecht' : '' },
        ]);
        hinweis.setzen(ueber ? 'Ein Wirbel liegt noch über der Piste. Warte – nach einem großen Flugzeug mindestens 2 Minuten – oder setze hinter seinem Aufsetzpunkt auf.' : 'Die Wirbel sind neben der Piste. Bedenke: Echte Wirbel sind unsichtbar und verhalten sich nicht immer so gleichmäßig.', ueber ? 'fehler' : 'warnung');
      }
      zeichnen();
      return h('div', {}, bild.el, bedienfeld(h('div', { class: 'breit' }, art.el), wind.el, zeit.el), werte.el, hinweis.el,
        h('p', { class: 'interaktiv-erklaerung' }, 'Schematisch nach dem Pilot’s Handbook of Aeronautical Knowledge der FAA (Kapitel 14): Abstand der Wirbel etwas weniger als eine Spannweite, am Boden 2 bis 3 kt nach außen, Seitenwind verschiebt beide. Das Sinken ist nur angedeutet.'));
    },
  },
};
