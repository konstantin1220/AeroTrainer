// Interaktive Darstellungen für „Masse & Schwerpunkt“: Hebel-Wippe und Beladungsrechner.
// Die Daten des (frei erfundenen) Übungsflugzeugs stehen in content/flugzeug.json.
import { h, abbildungKnoten } from '../../js/ui.js';
import { icon } from '../../js/icons.js';
import { regler, wertanzeige, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { svg, text, linie } from '../../js/grafik.js';
import { huellkurve } from './abbildungen.js';
import { beladungRechnen, bewertung, BEWERTUNG_TEXT, runden } from './rechnen.js';

const komma = (wert, stellen) => runden(wert, stellen).toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
const r1 = (n) => n.toFixed(1);

function wippeBild(m1, a1, m2, a2) {
  const cx = 200, cy = 140, s = 85; // 1 m = 85 Einheiten
  const momentDiff = m2 * a2 - m1 * a1;
  const neigung = Math.max(-12, Math.min(12, momentDiff / 4));
  const schwerpunkt = (m2 * a2 - m1 * a1) / (m1 + m2);
  const kiste = (x, masse, farbe) => {
    const seite = 18 + masse * 0.32;
    return `<rect x="${r1(x - seite / 2)}" y="${r1(cy - 6 - seite)}" width="${r1(seite)}" height="${r1(seite)}" rx="5" class="${farbe}"/>${text(r1(x), r1(cy - 6 - seite / 2), `${masse}`, { groesse: 12, gewicht: 800, klasse: 'g-f-weiss' })}`;
  };
  const sx = cx + Math.max(-2.1, Math.min(2.1, schwerpunkt)) * s;
  return svg(400, 250, `
    <rect width="400" height="250" class="g-f-himmel"/>
    <rect x="0" y="222" width="400" height="28" class="g-f-boden"/>
    <path d="M${cx} ${cy + 6}l-22 76h44z" class="g-f-leise"/>
    <g transform="rotate(${r1(neigung)} ${cx} ${cy})">
      <rect x="${cx - 190}" y="${cy - 6}" width="380" height="12" rx="4" class="g-f-mf"/>
      ${[-2, -1, 1, 2].map((m) => linie(cx + m * s, cy - 6, cx + m * s, cy + 6, 'g-s-flaeche', 1) + text(cx + m * s, cy + 18, `${Math.abs(m)} m`, { groesse: 10, klasse: 'g-f-leise' })).join('')}
      ${kiste(cx - a1 * s, m1, 'g-f-primaer')}
      ${kiste(cx + a2 * s, m2, 'g-f-orange')}
      ${linie(r1(sx), cy + 10, r1(sx), cy + 24, 'g-s-text', 1)}
      ${text(r1(sx), cy + 36, 'Schwerpunkt', { groesse: 11, gewicht: 700, klasse: 'g-f-text g-halo' })}
      <g transform="translate(${r1(sx)} ${cy})">
        <circle r="9" class="g-f-weiss g-s-text" stroke-width="1.3"/>
        <path d="M0 0V-9A9 9 0 0 0-9 0zM0 0V9A9 9 0 0 0 9 0z" class="g-f-text"/>
      </g>
    </g>
    ${text(cx, 238, 'Drehpunkt', { groesse: 11, gewicht: 600, klasse: 'g-f-leise' })}
  `, 'Wippe mit zwei Massen, Drehpunkt und dem gemeinsamen Schwerpunkt');
}

export function interaktivFuer(flugzeug) {
  return {
    wippe: {
      titel: 'Die Hebel-Wippe',
      kurz: 'Masse mal Hebelarm: Wann ist die Wippe im Gleichgewicht – und wo liegt der Schwerpunkt?',
      symbol: 'masse-schwerpunkt',
      anleitung: "Stelle die beiden Massen und ihre Abstände zum Drehpunkt ein (Markierungen auf dem Balken: 1 m und 2 m). Die Wippe neigt sich zur Seite mit dem größeren Moment; das schwarz-weiße Symbol auf dem Balken zeigt den gemeinsamen Schwerpunkt.",
      legende: [["primaer", "Masse links"], ["orange", "Masse rechts"]],
      probier: ["Bringe die Wippe ins Gleichgewicht: 60 kg bei 1 m links – wie viel kg brauchst du bei 2 m rechts?", "Schiebe eine Masse weiter nach außen – wohin wandert der Schwerpunkt?"],
      erstellen() {
        const bild = buehne();
        const werte = wertanzeige();
        const hinweis = meldung();
        const m1 = regler({ name: 'Masse links', min: 10, max: 100, schritt: 5, wert: 60, format: (w) => `${w} kg`, beiAenderung: zeichnen });
        const a1 = regler({ name: 'Hebelarm links', min: 0.2, max: 2, schritt: 0.1, wert: 1, format: (w) => `${komma(w, 1)} m`, beiAenderung: zeichnen });
        const m2 = regler({ name: 'Masse rechts', min: 10, max: 100, schritt: 5, wert: 30, format: (w) => `${w} kg`, beiAenderung: zeichnen });
        const a2 = regler({ name: 'Hebelarm rechts', min: 0.2, max: 2, schritt: 0.1, wert: 1.5, format: (w) => `${komma(w, 1)} m`, beiAenderung: zeichnen });
        function zeichnen() {
          const links = m1.wert * a1.wert;
          const rechts = m2.wert * a2.wert;
          const s = (rechts - links) / (m1.wert + m2.wert);
          bild.zeichnen(wippeBild(m1.wert, a1.wert, m2.wert, a2.wert));
          werte.setzen([
            { titel: 'Moment links', wert: komma(links, 1), einheit: 'kg·m' },
            { titel: 'Moment rechts', wert: komma(rechts, 1), einheit: 'kg·m' },
            { titel: 'Schwerpunkt', wert: Math.abs(s) < 0.005 ? 'am Drehpunkt' : `${komma(Math.abs(s), 2)} m ${s < 0 ? 'links' : 'rechts'}` },
          ]);
          if (Math.abs(links - rechts) < 0.5) hinweis.setzen('Gleichgewicht: Beide Momente sind gleich groß – der Schwerpunkt liegt genau über dem Drehpunkt.', 'ok');
          else hinweis.setzen(`Die ${links > rechts ? 'linke' : 'rechte'} Seite geht nach unten: Ihr Moment ist größer.`, '');
        }
        zeichnen();
        return h('div', {}, bild.el, bedienfeld(m1.el, m2.el, a1.el, a2.el), werte.el, hinweis.el,
          h('p', { class: 'interaktiv-erklaerung' }, 'Moment = Masse × Hebelarm. Genauso rechnet man den Schwerpunkt eines Flugzeugs – nur mit mehr Stationen.'));
      },
    },

    rechner: {
      titel: 'Beladungsrechner',
      kurz: `${flugzeug.name}: Beladung ausprobieren – mit Hüllkurve für Start und Landung.`,
      symbol: 'rechner',
      anleitung: "Trage ein, wer und was an Bord ist. Die Tabelle berechnet Massen, Momente und Schwerpunkt; in der Hüllkurve siehst du, ob Start (gefüllter Punkt) und Landung (Ring) im erlaubten Bereich liegen.",
      probier: ["Setze zwei schwere Personen auf die Rückbank und 50 kg Gepäck – was passiert?", "Tanke voll (150 l) – bleibst du unter der höchstzulässigen Startmasse?"],
      erstellen() {
        const werte = { vorn: 160, hinten: 0, kraftstoff: 100, gepaeck: 10 };
        let verbrauch = 30;
        const ergebnisBereich = h('div', { class: 'rechner-ergebnis' });

        const felder = flugzeug.stationen.map((station) => {
          const feld = h('input', {
            type: 'number', inputmode: 'decimal', min: 0, max: station.max, step: station.einheit === 'l' ? 5 : 1,
            value: werte[station.id], 'aria-label': station.name,
            oninput: () => { werte[station.id] = Math.max(0, Number(feld.value) || 0); aktualisieren(); },
          });
          return h('label', { class: 'rechner-feld' },
            h('span', { class: 'rechner-name' }, station.name, h('small', {}, `Hebelarm ${komma(station.arm, 2)} m · max. ${station.max} ${station.einheit}`)),
            h('span', { class: 'rechner-eingabe' }, feld, h('span', { class: 'einheit' }, station.einheit)),
          );
        });
        const verbrauchFeld = h('input', {
          type: 'number', inputmode: 'decimal', min: 0, step: 5, value: verbrauch, 'aria-label': 'Kraftstoffverbrauch bis zur Landung',
          oninput: () => { verbrauch = Math.max(0, Number(verbrauchFeld.value) || 0); aktualisieren(); },
        });

        function aktualisieren() {
          const start = beladungRechnen(flugzeug, werte);
          const landung = beladungRechnen(flugzeug, { ...werte, kraftstoff: Math.max(0, werte.kraftstoff - verbrauch) });
          const urteilStart = bewertung(flugzeug, start);
          const urteilLandung = bewertung(flugzeug, landung);
          const ueberMax = flugzeug.stationen.filter((s) => werte[s.id] > s.max);
          const gut = urteilStart === 'ok' && urteilLandung === 'ok' && !ueberMax.length;
          ergebnisBereich.replaceChildren(
            h('div', { class: 'tabelle-rahmen' }, h('table', { class: 'tabelle rechner-tabelle' },
              h('thead', {}, h('tr', {}, h('th', {}, 'Station'), h('th', {}, 'Masse'), h('th', {}, 'Hebelarm'), h('th', {}, 'Moment'))),
              h('tbody', {}, start.zeilen.map((z) => h('tr', {},
                h('td', {}, z.name, z.einheit === 'l' ? h('small', { class: 'leise' }, ` (${z.wert} l)`) : null),
                h('td', {}, `${komma(z.masse, 1)} kg`), h('td', {}, `${komma(z.arm, 2)} m`), h('td', {}, `${komma(z.moment, 1)} kg·m`)))),
              h('tfoot', {}, h('tr', {}, h('td', {}, 'Summe'), h('td', {}, `${komma(start.masse, 1)} kg`), h('td', {}, `${komma(start.schwerpunkt, 3)} m`), h('td', {}, `${komma(start.moment, 1)} kg·m`))),
            )),
            h('div', { class: `rechner-urteil ${gut ? 'gut' : 'schlecht'}` },
              icon(gut ? 'haken' : 'warnung'),
              h('div', {},
                h('strong', {}, `Start: ${BEWERTUNG_TEXT[urteilStart]}`),
                h('p', {}, `Landung (nach ${verbrauch} l Verbrauch): ${BEWERTUNG_TEXT[urteilLandung]}. Masse ${komma(landung.masse, 1)} kg, Schwerpunkt ${komma(landung.schwerpunkt, 3)} m.`),
                ueberMax.map((s) => h('p', {}, `Achtung: ${s.name} über der Höchstlast von ${s.max} ${s.einheit}.`)),
              ),
            ),
            abbildungKnoten(huellkurve(flugzeug, [
              { schwerpunkt: start.schwerpunkt, masse: start.masse, zulaessig: urteilStart === 'ok', art: 'start' },
              { schwerpunkt: landung.schwerpunkt, masse: landung.masse, zulaessig: urteilLandung === 'ok', art: 'landung' },
            ]), 'Gefüllter Punkt = Start, Ring = Landung. Die Fläche ist der zulässige Bereich.'),
          );
        }

        aktualisieren();
        return h('div', {},
          h('div', { class: 'karte wichtig' }, h('p', {}, h('strong', {}, 'Frei erfundenes Übungsflugzeug. '), 'Für echte Flüge gilt ausschließlich das Flughandbuch deines Luftfahrzeugs.')),
          h('div', { class: 'rechner' },
            h('p', { class: 'rechner-fest' }, `Leermasse ${flugzeug.leermasse} kg · Hebelarm ${komma(flugzeug.leerArm, 2)} m · höchstzulässige Startmasse ${flugzeug.mtom} kg · AVGAS ${komma(flugzeug.kraftstoffDichte, 2)} kg/l`),
            felder,
            h('label', { class: 'rechner-feld' },
              h('span', { class: 'rechner-name' }, 'Verbrauch bis zur Landung', h('small', {}, 'verschiebt den Schwerpunkt für die Landung')),
              h('span', { class: 'rechner-eingabe' }, verbrauchFeld, h('span', { class: 'einheit' }, 'l')),
            ),
          ),
          ergebnisBereich,
        );
      },
    },
  };
}
