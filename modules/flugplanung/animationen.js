// Animation für „Flugplanung“: Kraftstoff im Tank – geplant und unterwegs (js/animation.js).
// Werte aus rechnen.js mit den Daten des Übungsflugzeugs MF-4 (flugzeug.json); Tank maßstäblich.
// Grundlage: NCO.OP.125 (Planung), AMC1 NCO.OP.125(b) (Endreserve), NCO.OP.185 (Überwachung im Flug).
import { svg, text, linie, pfeil, flugzeug as flugzeugIcon, wolke, sanft, abschnitt, zwischen, glatterWeg, aufWeg, weglaengen } from '../../js/grafik.js';
import { kraftstoffPlan } from './rechnen.js';

const r1 = (n) => Math.round(n * 10) / 10;

// Beispiel wie im Kapitel: 40 Minuten geplant, 60 l getankt; unterwegs Gegenwind und Umweg
export const ANNAHMEN = { minuten: 40, anBord: 60, geflogen: 60, restMinuten: 30, ausweichMinuten: 10 };

const A = [226, 214], B = [366, 86], C = [350, 162];
const DIREKT = glatterWeg([A, [296, 150], B]);
const UMWEG = glatterWeg([A, [220, 168], [240, 130], [282, 112], [318, 108]]);
const AUSWEICH = glatterWeg([[318, 108], [338, 128], C]);
const pos = (w, s) => aufWeg(w, s, weglaengen(w));

export function animationenFuer(flugzeug) {
  const { minuten, anBord, geflogen, restMinuten, ausweichMinuten } = ANNAHMEN;
  const plan = kraftstoffPlan({ minuten, verbrauch: flugzeug.verbrauch, rollen: flugzeug.rollKraftstoff, zuschlag: 0.1, reserveMinuten: 30 });
  const liter = (min) => (min / 60) * flugzeug.verbrauch;
  const spielraum = anBord - plan.gesamt;
  const nachPlan = anBord - plan.rollen - plan.strecke;
  const nachGeflogen = anBord - plan.rollen - liter(geflogen);
  const waere = nachGeflogen - liter(restMinuten);
  const nachAusweich = nachGeflogen - liter(ausweichMinuten);
  const L = (n) => `${Math.round(n)} l`;

  // Tank: 1 l ≙ 2,7 px; von unten nach oben in der Reihenfolge, in der man verbraucht (oben zuerst)
  const yL = (l) => 240 - l * 2.7;
  let unten = 0;
  const teile = [
    ['Endreserve', plan.reserve, 'fehler'],
    ['Spielraum', spielraum, 'ok'],
    ['Zuschlag', plan.zuschlag, 'orange'],
    ['Strecke', plan.strecke, 'primaer'],
    ['Rollen', plan.rollen, 'leise'],
  ].map(([name, l, farbe]) => { const t = { name, von: unten, bis: unten + l, l, farbe }; unten += l; return t; });

  function tank(stand, geist) {
    let s = '';
    for (const t of teile) {
      s += `<rect x="44" y="${r1(yL(t.bis))}" width="52" height="${r1(yL(t.von) - yL(t.bis))}" class="g-f-${t.farbe}" opacity=".16"/>`;
      const bis = Math.min(t.bis, stand);
      if (bis > t.von) s += `<rect x="44" y="${r1(yL(bis))}" width="52" height="${r1(yL(t.von) - yL(bis))}" class="g-f-${t.farbe}" opacity=".85"/>`;
      s += text(104, r1(yL((t.von + t.bis) / 2)), `${t.name} ${L(t.l)}`, { groesse: 11, gewicht: t.name === 'Endreserve' ? 800 : 700, klasse: `g-f-${t.farbe === 'leise' ? 'text' : t.farbe}`, anker: 'start' });
    }
    s += `<rect x="44" y="${r1(yL(anBord))}" width="52" height="${r1(yL(0) - yL(anBord))}" rx="4" style="fill: none; stroke: var(--rand-stark); stroke-width: 1.5"/>`;
    s += linie(38, r1(yL(plan.reserve)), 100, r1(yL(plan.reserve)), 'g-s-fehler', 2);
    for (const l of [0, 20, 40, 60]) s += text(36, r1(yL(l)), String(l), { groesse: 9, klasse: 'g-f-leise', anker: 'end' });
    if (geist !== undefined) s += linie(40, r1(yL(geist)), 100, r1(yL(geist)), 'g-s-fehler', 1.5, 'stroke-dasharray="4 3"');
    s += linie(40, r1(yL(stand)), 100, r1(yL(stand)), 'g-s-text', 2.2);
    s += text(70, 52, `an Bord: ${L(stand)}`, { groesse: 12, gewicht: 800 });
    return s;
  }

  function karte(schritt, t) {
    let s = `<rect x="200" y="62" width="192" height="174" rx="10" class="g-f-weiss" style="stroke: var(--rand); stroke-width: 1"/>`;
    s += `<circle cx="${A[0]}" cy="${A[1]}" r="5" class="g-f-text"/>${text(A[0] + 10, A[1], 'Start', { groesse: 10, gewicht: 700, anker: 'start' })}`;
    s += `<circle cx="${B[0]}" cy="${B[1]}" r="5" class="g-f-text"/>${text(B[0], B[1] - 13, 'Ziel', { groesse: 10, gewicht: 700 })}`;
    let flug;
    if (schritt <= 1) {
      s += linie(A[0], A[1], B[0], B[1], 'g-s-leise', 1.5, 'stroke-dasharray="5 4"');
      flug = schritt === 0 ? pos(DIREKT, 0) : pos(DIREKT, sanft(t));
      s += text(212, 78, schritt === 0 ? `geplant: ${minuten} min` : `Flugzeit ${Math.round(minuten * sanft(t))} min`, { groesse: 10, gewicht: 700, anker: 'start' });
    } else {
      s += wolke(286, 168, 46, 'g-f-wolke g-s-rand');
      s += linie(A[0], A[1], B[0], B[1], 'g-s-leise', 1, 'stroke-dasharray="2 4"');
      s += pfeil(384, 214, 358, 228, { farbe: 'primaer', breite: 2, spitze: 7 }) + text(384, 200, 'Gegenwind', { groesse: 10, gewicht: 700, klasse: 'g-f-primaer', anker: 'end' });
      s += `<path d="${UMWEG.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])} ${r1(p[1])}`).join('')}" class="g-s-orange" stroke-width="2" fill="none"/>`;
      if (schritt === 2) {
        flug = pos(UMWEG, sanft(t));
        s += text(212, 78, `Flugzeit ${Math.round(geflogen * sanft(t))} min`, { groesse: 10, gewicht: 700, anker: 'start' });
      } else {
        s += linie(318, 108, B[0], B[1], 'g-s-fehler', 1.5, 'stroke-dasharray="4 4"');
        s += `<circle cx="${C[0]}" cy="${C[1]}" r="5" class="g-f-ok"/>${text(C[0], C[1] + 20, 'Ausweichplatz', { groesse: 10, gewicht: 800, klasse: 'g-f-ok g-halo' })}`;
        const f = sanft(abschnitt(t, 0.4, 1));
        flug = pos(AUSWEICH, f);
        s += text(212, 78, `noch ${restMinuten} min bis zum Ziel?`, { groesse: 10, gewicht: 800, klasse: 'g-f-fehler', anker: 'start' });
      }
    }
    s += flugzeugIcon(r1(flug.x), r1(flug.y), r1(flug.winkel), 22, 'g-f-text');
    return s;
  }

  function bild(schritt, t) {
    const f = sanft(t);
    let stand, geist, hinweis;
    if (schritt === 0) { stand = anBord * f; hinweis = `benötigt ${L(plan.gesamt)}, getankt ${L(anBord)}`; }
    else if (schritt === 1) { stand = zwischen(anBord, nachPlan, f); hinweis = `Landung mit ${L(nachPlan)} – Reserve unberührt`; }
    else if (schritt === 2) { stand = zwischen(anBord, nachGeflogen, f); hinweis = `nach ${geflogen} min: noch ${L(nachGeflogen)}`; }
    else {
      geist = zwischen(nachGeflogen, waere, sanft(abschnitt(t, 0, 0.35)));
      stand = zwischen(nachGeflogen, nachAusweich, sanft(abschnitt(t, 0.4, 1)));
      hinweis = t < 0.4 ? `weiter zum Ziel: nur ${L(waere)} – unter der Endreserve` : `früher landen: ${L(nachAusweich)} im Tank`;
    }
    return svg(400, 280, `
      <rect width="400" height="280" class="g-f-land"/>
      ${tank(stand, geist)}
      ${karte(schritt, t)}
      <rect x="6" y="248" width="388" height="26" rx="10" class="g-f-weiss" style="stroke: var(--rand); stroke-width: 1"/>
      ${text(200, 261, hinweis, { groesse: 12, gewicht: 800, klasse: schritt === 3 && t < 0.4 ? 'g-f-fehler' : 'g-f-text' })}
    `, `Kraftstoff: ${hinweis}`);
  }

  return {
    kraftstoff: {
      titel: 'Kraftstoff – geplant und unterwegs',
      schritte: [
        { text: `Vor dem Start mit dem MF-4 (${flugzeug.verbrauch} l/h, ${minuten} Minuten geplant): **Rollen** ${L(plan.rollen)}, **Strecke** ${L(plan.strecke)}, **Zuschlag** ${L(plan.zuschlag)} und die **Endreserve** ${L(plan.reserve)} – zusammen **${L(plan.gesamt)}**. Getankt sind **${L(anBord)}**, also ${L(spielraum)} Spielraum.`, dauer: 4.4 },
        { text: `Läuft alles nach Plan, verbrauchst du Rollen und Strecke und **landest mit ${L(nachPlan)}**. Zuschlag, Spielraum und Endreserve bleiben unberührt.`, dauer: 3.6 },
        { text: `Anderer Tag: **Gegenwind** und ein **Umweg** um einen Schauer. Nach **${geflogen} Minuten** bist du noch nicht am Ziel – im Tank sind nur noch **${L(nachGeflogen)}**.`, dauer: 4 },
        { text: `Für den Rest brauchst du noch etwa ${restMinuten} Minuten = ${L(liter(restMinuten))}. Dann blieben nur **${L(waere)}** – weniger als die Endreserve. Also handelst du **sofort**: am nahen **Ausweichplatz landen und tanken** (NCO.OP.185).`, dauer: 4.8 },
      ],
      bild,
    },
  };
}
