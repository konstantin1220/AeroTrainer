// Lernmodul „Sprechfunk (BZF I und BZF II)“ – Inhalte in content/inhalt.json,
// Funkgespräche zum Üben in content/funkgespraeche.json (funk.js).
import { lernmodul } from '../../js/lernmodul.js';
import { h } from '../../js/ui.js';
import { icon } from '../../js/icons.js';
import { generatoren } from './generatoren.js';
import { abbildungen } from './abbildungen.js';
import { interaktiv } from './interaktiv.js';
import { funkSeite } from './funk.js';

function funkKarte(ctx) {
  const anzahl = Object.keys(ctx.stand().funk ?? {}).length;
  return h('section', {},
    h('h2', { class: 'abschnitt-titel' }, icon('sprechblase'), 'Funkgespräche'),
    h('ul', { class: 'stufenliste' }, h('li', {}, h('a', { class: 'stufen-karte', href: ctx.link('funk'), 'data-modul': ctx.modul.id },
      h('span', { class: 'stufen-nr' }, icon('sprechblase')),
      h('span', { class: 'stufen-text' },
        h('strong', {}, 'Funkgespräche üben'),
        h('span', {}, 'Komplette Gespräche vom Erstanruf bis zur Landung – auf Deutsch oder Englisch, in vier Stufen vom Auswählen bis zum freien Sprechen.'),
        h('span', { class: 'stufen-stand' }, anzahl ? `${anzahl} Situationen geübt` : 'noch nicht geübt')),
      icon('weiter')))),
  );
}

export default lernmodul({
  generatoren,
  abbildungen,
  interaktiv,
  seiten: { funk: (el, rest, ctx) => funkSeite(el, rest, ctx) },
  uebersichtZusatz: (ctx) => funkKarte(ctx),
});
