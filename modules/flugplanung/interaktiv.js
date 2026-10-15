// Interaktive Darstellungen für „Flugplanung“: Navigationsflugplan mit Kraftstoffplanung und
// Startstrecken-Rechner. Grundlage: Übungskarte (Navigation) und das erfundene Übungsflugzeug MF-4.
import { h } from '../../js/ui.js';
import { regler, umschalter, wertanzeige, buehne, bedienfeld, meldung } from '../../js/interaktiv.js';
import { WEGPUNKTE, etappe, kraftstoffPlan, durchKontrollzone, startstrecke, druckhoehe, MISSWEISUNG } from './rechnen.js';
import { routeKarte, kraftstoffBalken, startstreckeBild } from './abbildungen.js';

const grad3 = (g) => String(Math.round(((g % 360) + 360) % 360) || 360).padStart(3, '0');
const komma = (n, s = 0) => Number(n.toFixed(s)).toLocaleString('de-DE', { minimumFractionDigits: s, maximumFractionDigits: s });
const minText = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min` : `${Math.round(min)} min`);

export const ROUTEN = {
  'alt-mus': { name: 'XALT – W – XMUS', ids: ['altdorf', 'whiskey', 'musterstadt'] },
  'alt-ber': { name: 'XALT – XBER', ids: ['altdorf', 'bergen'] },
  'mus-ber': { name: 'XMUS – N – XBER', ids: ['musterstadt', 'november', 'bergen'] },
  'alt-see': { name: 'XALT – BGN – XSEE', ids: ['altdorf', 'bgn', 'seefeld'] },
};

export function interaktivFuer(flugzeug) {
  return {
    navflugplan: {
      titel: 'Navigationsflugplan mit Kraftstoffplanung',
      kurz: 'Strecke wählen, Wind einstellen – Kurse, Zeiten und Kraftstoff werden für jede Etappe berechnet.',
      symbol: 'karte',
      anleitung: `Wähle eine Strecke auf der Übungskarte und stelle Eigengeschwindigkeit, Wind, Verbrauch und getankten Kraftstoff ein. Die Tabelle zeigt für jede Etappe den Kurs, den Steuerkurs mit Luvwinkel (Missweisung ${MISSWEISUNG}° Ost), Entfernung, Grundgeschwindigkeit und Flugzeit. Der Balken darunter zeigt im Maßstab des Tanks, wie viel Kraftstoff du brauchst – mit 3 l zum Rollen, 10 % Zuschlag und 30 Minuten Endreserve.`,
      legende: [['orange', 'geplante Strecke'], ['primaer', 'Kraftstoff für die Strecke'], ['fehler', 'Endreserve (nicht anrühren)']],
      probier: ['Wie ändert sich die Flugzeit von Altdorf nach Bergen bei 25 kt Nordwind?', 'Mit wie wenig Kraftstoff an Bord reicht es auf der längsten Strecke gerade noch?', 'Warum führt die Strecke nach Seefeld über das Funkfeuer BGN?'],
      erstellen() {
        const karte = buehne();
        const balken = buehne();
        const werte = wertanzeige();
        const hinweis = meldung();
        const tabelle = h('div', { class: 'tabelle-rahmen' });
        const route = umschalter({ name: 'Strecke', optionen: Object.entries(ROUTEN).map(([id, r]) => [id, r.name]), wert: 'alt-mus', beiAenderung: zeichnen });
        const tas = regler({ name: 'Eigengeschwindigkeit (TAS)', min: 80, max: 130, schritt: 5, wert: flugzeug.reiseTas, format: (w) => `${w} kt`, beiAenderung: zeichnen });
        const wr = regler({ name: 'Wind aus', min: 0, max: 350, schritt: 10, wert: 270, format: (w) => `${grad3(w)}°`, beiAenderung: zeichnen });
        const ws = regler({ name: 'Windstärke', min: 0, max: 40, wert: 15, format: (w) => `${w} kt`, beiAenderung: zeichnen });
        const verbrauch = regler({ name: 'Verbrauch', min: 20, max: 40, wert: flugzeug.verbrauch, format: (w) => `${w} l/h`, beiAenderung: zeichnen });
        const anBord = regler({ name: 'Kraftstoff an Bord', min: 20, max: flugzeug.kraftstoffNutzbar, schritt: 5, wert: 60, format: (w) => `${w} l`, beiAenderung: zeichnen });
        function zeichnen() {
          const ids = ROUTEN[route.wert].ids;
          const punkte = ids.map((id) => WEGPUNKTE[id]);
          const etappen = punkte.slice(1).map((b, i) => ({ von: punkte[i], nach: b, ...etappe(punkte[i], b, { tas: tas.wert, windRichtung: wr.wert, windStaerke: ws.wert }) }));
          const minuten = etappen.reduce((s, e) => s + e.minuten, 0);
          const nm = etappen.reduce((s, e) => s + e.nm, 0);
          const plan = kraftstoffPlan({ minuten, verbrauch: verbrauch.wert, rollen: flugzeug.rollKraftstoff, zuschlag: 0.1, reserveMinuten: 30 });
          karte.zeichnen(routeKarte(ids));
          balken.zeichnen(kraftstoffBalken(plan, anBord.wert, flugzeug.kraftstoffNutzbar));
          tabelle.replaceChildren(h('table', { class: 'tabelle navlog' },
            h('thead', {}, h('tr', {}, ['Etappe', 'rwK', 'WCA', 'mwSK', 'NM', 'GS', 'min'].map((t) => h('th', {}, t)))),
            h('tbody', {}, etappen.map((e) => h('tr', {},
              h('td', { class: 'navlog-etappe' }, `${e.von.kurz}–${e.nach.kurz}`),
              h('td', {}, `${grad3(e.rwk)}°`),
              h('td', {}, `${e.luv >= 0 ? '+' : '−'}${Math.abs(Math.round(e.luv))}°`),
              h('td', {}, h('strong', {}, `${grad3(e.mwsk)}°`)),
              h('td', {}, komma(e.nm, 1)),
              h('td', {}, Math.round(e.gs)),
              h('td', {}, Math.round(e.minuten))))),
            h('tfoot', {}, h('tr', {}, h('td', {}, 'Summe'), h('td', {}), h('td', {}), h('td', {}), h('td', {}, komma(nm, 1)), h('td', {}), h('td', {}, Math.round(minuten))))));
          const reicht = anBord.wert >= plan.gesamt;
          werte.setzen([
            { titel: 'Flugzeit', wert: minText(minuten) },
            { titel: 'Kraftstoff benötigt', wert: Math.ceil(plan.gesamt), einheit: 'l', hinweis: `davon ${Math.round(plan.reserve)} l Endreserve`, art: reicht ? 'gut' : 'schlecht' },
            { titel: 'Reicht bis', wert: minText(((anBord.wert - flugzeug.rollKraftstoff) / verbrauch.wert) * 60), hinweis: 'Flugzeit bis der Tank leer ist' },
          ]);
          // Etappen von oder nach Musterstadt sind geplante An- und Abflüge über die Meldepunkte
          const ctr = etappen.some((e) => durchKontrollzone(e.von, e.nach) && e.von.kurz !== 'XMUS' && e.nach.kurz !== 'XMUS');
          if (!reicht) hinweis.setzen(`Zu wenig Kraftstoff: Es fehlen ${Math.ceil(plan.gesamt - anBord.wert)} l – nachtanken oder Strecke ändern.`, 'fehler');
          else if (ctr) hinweis.setzen('Eine Etappe führt durch die Kontrollzone Musterstadt – dafür brauchst du eine Freigabe.', 'warnung');
          else if (ids.includes('musterstadt')) hinweis.setzen('Musterstadt liegt in einer Kontrollzone: Ein- und Ausflug über die Meldepunkte, mit Freigabe vom Turm.', '');
          else hinweis.setzen('Kraftstoff reicht – mit Zuschlag und Endreserve.', 'ok');
        }
        zeichnen();
        return h('div', {}, karte.el, bedienfeld(h('div', { class: 'breit' }, route.el), tas.el, verbrauch.el, wr.el, ws.el, h('div', { class: 'breit' }, anBord.el)), tabelle, werte.el, balken.el, hinweis.el,
          h('p', { class: 'interaktiv-erklaerung' }, 'WCA = Luvwinkel (wind correction angle), mwSK = missweisender Steuerkurs, GS in kt, Zeit in Minuten. Steigflug und Sinkflug sind hier nicht eingerechnet. Alle Orte und Werte sind frei erfunden – nicht für echte Flüge verwenden.'));
      },
    },

    startstrecke: {
      titel: 'Reicht die Piste? Startstrecke berechnen',
      kurz: 'Platzhöhe, Temperatur, Masse, Wind und Belag – wie lang wird die Startstrecke des Übungsflugzeugs?',
      symbol: 'flugzeug',
      anleitung: 'Wähle einen Flugplatz des Übungsgebiets und stelle Temperatur, QNH, Startmasse und Wind ein. Die Grafik zeigt im selben Maßstab die Piste, die Startrollstrecke und die Strecke, bis das Flugzeug 15 m Höhe erreicht hat. Gerechnet wird mit der (erfundenen) Tabelle aus dem Flughandbuch des MF-4 und seinen Korrekturen.',
      legende: [['primaer', 'Startrollstrecke'], ['ok', 'bis 15 m Höhe – Piste reicht'], ['fehler', 'Piste reicht nicht']],
      probier: ['Bergen an einem heißen Sommertag mit voller Beladung – reicht die Piste?', 'Wie viel bringen 10 kt Gegenwind?', 'Vergleiche trockenes und nasses Gras.'],
      erstellen() {
        const bild = buehne();
        const werte = wertanzeige();
        const hinweis = meldung();
        const plaetze = flugzeug.plaetze;
        const platz = umschalter({ name: 'Flugplatz', optionen: plaetze.map((p) => [p.kennung, p.kennung]), wert: 'XBER', beiAenderung: zeichnen });
        const nass = umschalter({ name: 'Grasbahn', optionen: [['trocken', 'trocken'], ['nass', 'nass']], wert: 'trocken', beiAenderung: zeichnen });
        const temperatur = regler({ name: 'Temperatur', min: -10, max: 35, wert: 25, format: (w) => `${w} °C`, beiAenderung: zeichnen });
        const qnh = regler({ name: 'QNH', min: 990, max: 1035, wert: 1013, format: (w) => `${w} hPa`, beiAenderung: zeichnen });
        const masse = regler({ name: 'Startmasse', min: 850, max: flugzeug.mtom, schritt: 10, wert: 1100, format: (w) => `${w} kg`, beiAenderung: zeichnen });
        const wind = regler({ name: 'Wind', min: -6, max: 20, wert: 5, format: (w) => (w === 0 ? 'Windstille' : w > 0 ? `${w} kt Gegenwind` : `${-w} kt Rückenwind`), beiAenderung: zeichnen });
        function zeichnen() {
          const p = plaetze.find((x) => x.kennung === platz.wert);
          const belag = p.belag === 'asphalt' ? 'asphalt' : nass.wert === 'nass' ? 'grasNass' : 'grasTrocken';
          nass.el.style.display = p.belag === 'asphalt' ? 'none' : '';
          const hoehe = druckhoehe(p.hoehe, qnh.wert);
          const e = startstrecke(flugzeug, { hoehe, temperatur: temperatur.wert, masse: masse.wert, wind: wind.wert, belag });
          bild.zeichnen(startstreckeBild(e, p.laenge, `${p.kennung} ${p.piste}`));
          const anteil = e.startstrecke / p.laenge;
          werte.setzen([
            { titel: 'Druckhöhe', wert: komma(Math.round(hoehe / 10) * 10), einheit: 'ft', hinweis: `Platz ${p.hoehe} ft, QNH ${qnh.wert}` },
            { titel: 'Tabelle (MTOM, Asphalt)', wert: Math.round(e.basis), einheit: 'm' },
            { titel: 'Startstrecke über 15 m', wert: Math.round(e.startstrecke), einheit: 'm', hinweis: e.schritte.join(' · ') || 'keine Korrektur', art: anteil > 1 ? 'schlecht' : anteil > 0.75 ? 'warnung' : 'gut' },
          ]);
          if (anteil > 1) hinweis.setzen(`Die Piste ist ${Math.round(e.startstrecke - p.laenge)} m zu kurz – so darfst du nicht starten. Weniger laden, kühlere Tageszeit abwarten oder anderen Platz wählen.`, 'fehler');
          else if (anteil > 0.75) hinweis.setzen('Das wird knapp: Plane eine Sicherheitsreserve ein und lege vorher fest, bis wohin du den Start abbrichst.', 'warnung');
          else hinweis.setzen('Die Piste reicht mit Reserve.', 'ok');
        }
        zeichnen();
        return h('div', {}, bild.el, bedienfeld(platz.el, nass.el, temperatur.el, qnh.el, masse.el, wind.el), werte.el, hinweis.el,
          h('p', { class: 'interaktiv-erklaerung' }, 'Druckhöhe ≈ Platzhöhe + (1013 − QNH) × 30 ft. Flughandbuch und Flugplätze sind frei erfunden – für echte Flüge gilt nur das Flughandbuch deines Luftfahrzeugs.'));
      },
    },
  };
}
