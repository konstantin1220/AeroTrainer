// Prüft selbst gezeichnete Grafiken (SVG) auf Beschriftungen, die aus dem Bild oder aus ihrem Kasten laufen
// oder sich gegenseitig überdecken. Läuft im Browser (braucht die echte Schriftbreite).
// Benutzt von tools/abbildungen.html, tools/animationen.html und tools/textpruefung.html.

const TOLERANZ = 1.5; // Pixel

const innen = (x, y, r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
const flaeche = (r) => Math.max(0, r.width) * Math.max(0, r.height);
function schnitt(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}
function sichtbar(el, svg) {
  for (let e = el; e && e !== svg.parentNode; e = e.parentElement) {
    const stil = getComputedStyle(e);
    if (stil.display === 'none' || stil.visibility === 'hidden' || Number(stil.opacity) < 0.15) return false;
    if (Number(e.getAttribute?.('opacity') ?? 1) < 0.15) return false;
  }
  return true;
}

/** Liste der Probleme in einer SVG-Grafik: { art, text } mit art = 'Bildrand' | 'Kasten' | 'überdeckt'. */
export function textProbleme(svg) {
  const probleme = [];
  const bild = svg.getBoundingClientRect();
  if (bild.width < 10) return probleme;
  const texte = [...svg.querySelectorAll('text')]
    .filter((t) => t.textContent.trim() && sichtbar(t, svg))
    .map((t) => ({ el: t, r: t.getBoundingClientRect(), text: t.textContent.trim() }))
    .filter((t) => t.r.width > 0);
  // Kästen: Rechtecke mit Fläche, die kleiner als das halbe Bild sind (keine Hintergründe)
  const kaesten = [...svg.querySelectorAll('rect')]
    .filter((r) => !r.closest('defs, pattern, clipPath, mask') && sichtbar(r, svg))
    .filter((r) => { const m = r.getCTM(); return !m || (Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6); }) // gedreht: kein Textkasten
    .map((r) => ({ el: r, r: r.getBoundingClientRect() }))
    .filter((k) => k.r.width > 24 && k.r.height > 14 && flaeche(k.r) < 0.5 * flaeche(bild));

  for (const t of texte) {
    const { r } = t;
    if (r.left < bild.left - TOLERANZ || r.right > bild.right + TOLERANZ || r.top < bild.top - TOLERANZ || r.bottom > bild.bottom + TOLERANZ) {
      probleme.push({ art: 'Bildrand', text: t.text });
      continue;
    }
    // Der kleinste Kasten, in dem der Text beginnt bzw. seine Mitte liegt, muss ihn ganz enthalten
    const mx = (r.left + r.right) / 2, my = (r.top + r.bottom) / 2;
    const kasten = kaesten.filter((k) => innen(mx, my, k.r)).sort((a, b) => flaeche(a.r) - flaeche(b.r))[0];
    if (kasten && (r.left < kasten.r.left - TOLERANZ || r.right > kasten.r.right + TOLERANZ)) {
      probleme.push({ art: 'Kasten', text: t.text });
    }
  }
  for (let i = 0; i < texte.length; i++) {
    for (let j = i + 1; j < texte.length; j++) {
      const a = texte[i].r, b = texte[j].r;
      if (schnitt(a, b) > 0.2 * Math.min(flaeche(a), flaeche(b))) probleme.push({ art: 'überdeckt', text: `${texte[i].text} ⟷ ${texte[j].text}` });
    }
  }
  return probleme;
}

/** Alle Grafiken unterhalb eines Elements prüfen. */
export function alleTextProbleme(wurzel = document) {
  return [...wurzel.querySelectorAll('svg')].flatMap((svg) => textProbleme(svg).map((p) => ({ ...p, svg })));
}
