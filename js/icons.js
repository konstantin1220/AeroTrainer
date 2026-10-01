// Eigene Symbole der App – alle selbst gezeichnet, keine fremden Icon-Sammlungen.
// Stil: Linien in der Textfarbe, dazu eine zarte Fläche („f“) und kräftige Akzente („a“).
// Bedienelemente nutzen ein 24er-Raster, die Themen-Symbole ein 32er-Raster.

const BEDIENUNG = {
  start: `
    <path class="f" d="M4 20v-8c0-4.1 3.6-7.5 8-7.5s8 3.4 8 7.5v8z"/>
    <path d="M4 20v-8c0-4.1 3.6-7.5 8-7.5s8 3.4 8 7.5v8"/>
    <path d="M2.5 20h19M8 20v-6.5h8V20M12 13.5V20"/>`,
  wiederholen: `
    <path d="M7.5 10.5V4.5a1 1 0 0 1 1-1h6.2l2.8 2.8v4.2M14.5 3.5v3h3"/>
    <path class="f" d="M3.5 10.5h17v8a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5z"/>
    <path d="M3.5 10.5h17v8a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5zM9.5 14.5h5"/>`,
  lernstand: `
    <path class="f" d="M5 19.5v-14a2 2 0 0 1 2-2h12v14H7a2 2 0 0 0-2 2z"/>
    <path d="M5 19.5v-14a2 2 0 0 1 2-2h12v14H7a2 2 0 0 0 0 4h12v-4"/>
    <path d="M12 7v6M9 9.5h6M10.5 12.5h3"/>`,
  info: `
    <circle class="f" cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 11v5.5M10.5 16.5h3"/>
    <circle class="a" cx="12" cy="7.6" r="1.1"/>`,
  zurueck: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  weiter: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  haken: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  kreuz: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  flugzeug: `
    <g transform="rotate(45 12 12)">
      <path class="f" d="M12 2.5c.9 0 1.4.8 1.4 2v5l7.1 4v2l-7.1-2v4.3l2.3 1.7V21L12 20l-3.7 1v-1.5l2.3-1.7v-4.3l-7.1 2v-2l7.1-4v-5c0-1.2.5-2 1.4-2z"/>
      <path d="M12 2.5c.9 0 1.4.8 1.4 2v5l7.1 4v2l-7.1-2v4.3l2.3 1.7V21L12 20l-3.7 1v-1.5l2.3-1.7v-4.3l-7.1 2v-2l7.1-4v-5c0-1.2.5-2 1.4-2z"/>
    </g>`,
  thermik: `
    <ellipse class="f" cx="12" cy="18.5" rx="7.5" ry="2.5"/>
    <ellipse cx="12" cy="18.5" rx="7.5" ry="2.5"/>
    <ellipse cx="12" cy="12.6" rx="4.5" ry="1.6"/>
    <path d="M12 10V3M9.2 5.8 12 3l2.8 2.8"/>`,
  sichern: `
    <path class="f" d="M3.5 14.5h4l1.5 2.5h6l1.5-2.5h4v4a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5z"/>
    <path d="M3.5 14.5h4l1.5 2.5h6l1.5-2.5h4v4a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5zM12 3v9.5M8 8.5l4 4 4-4"/>`,
  laden: `
    <path class="f" d="M3.5 14.5h4l1.5 2.5h6l1.5-2.5h4v4a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5z"/>
    <path d="M3.5 14.5h4l1.5 2.5h6l1.5-2.5h4v4a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5zM12 12.5V3M8 7l4-4 4 4"/>`,
  loeschen: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.2a1.5 1.5 0 0 0 1.5 1.3h6a1.5 1.5 0 0 0 1.5-1.3l1-12.2M10 11v5.5M14 11v5.5"/>',
  theorie: `
    <path class="f" d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5z"/>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5zM12 6.5V20"/>`,
  ueben: `
    <circle cx="12" cy="12" r="8"/>
    <circle class="f" cx="12" cy="12" r="4"/>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>`,
  pruefen: `
    <path class="f" d="M6.5 4.5h11A1.5 1.5 0 0 1 19 6v13.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5V6a1.5 1.5 0 0 1 1.5-1.5z"/>
    <path d="M9 4.5H6.5A1.5 1.5 0 0 0 5 6v13.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H15"/>
    <rect x="9" y="3" width="6" height="3" rx="1"/>
    <path d="M8.5 13.5l2.5 2.5 4.5-5"/>`,
  kalender: `
    <rect class="f" x="3.5" y="5" width="17" height="15.5" rx="2.5"/>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/>
    <path d="M3.5 10h17M8 3v4M16 3v4"/>`,
  lampe: `
    <path class="f" d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9v.7h5v-.7c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z"/>
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9v.7h5v-.7c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3zM9.5 19.5h5M10.5 22h3"/>`,
  warnung: `
    <path class="f" d="M10.3 4.2 2.8 17.5a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/>
    <path d="M10.3 4.2 2.8 17.5a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0zM12 9.5v4.5"/>
    <circle class="a" cx="12" cy="17" r="1.1"/>`,
  rechner: `
    <rect class="f" x="5" y="2.5" width="14" height="19" rx="2.5"/>
    <rect x="5" y="2.5" width="14" height="19" rx="2.5"/>
    <path d="M8.5 6.5h7v3h-7zM8.5 13.2h.01M12 13.2h.01M15.5 13.2h.01M8.5 17.2h.01M12 17.2h.01M15.5 17.2h.01"/>`,
  karte: `
    <path class="f" d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/>
    <path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2zM9 4.5v13M15 6.5v13"/>`,
  ziel: `
    <path class="f" d="M5 4h13l-2.5 4.5L18 13H5z"/>
    <path d="M5 21V3.5M5 4h13l-2.5 4.5L18 13H5"/>`,
  wuerfel: `
    <rect class="f" x="4" y="4" width="16" height="16" rx="3.5"/>
    <rect x="4" y="4" width="16" height="16" rx="3.5"/>
    <circle class="a" cx="8.6" cy="8.6" r="1.3"/>
    <circle class="a" cx="12" cy="12" r="1.3"/>
    <circle class="a" cx="15.4" cy="15.4" r="1.3"/>`,
  auge: `
    <path class="f" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>
    <circle cx="12" cy="12" r="3"/>`,
  lexikon: `
    <path class="f" d="M5 19.5v-15A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/>
    <path d="M5 19.5v-15A1.5 1.5 0 0 1 6.5 3H19v15H6.5a1.5 1.5 0 0 0 0 3H19v-3"/>
    <path d="M9.5 14l2.5-7 2.5 7M10.4 11.6h3.2"/>`,
  merken: `
    <path class="f" d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.3-6.5 4.3v-16a1 1 0 0 1 1-1z"/>
    <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.3-6.5 4.3v-16a1 1 0 0 1 1-1zM9.5 8.5h5"/>`,
  sprechblase: `
    <path class="f" d="M4 6a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 6v7.5a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/>
    <path d="M4 6a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 6v7.5a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5zM8.5 9.8h.01M12 9.8h.01M15.5 9.8h.01"/>`,
  stufen: `
    <path class="f" d="M3.5 20.5v-4h5v-4h5v-4h5v-4h2v16z"/>
    <path d="M3.5 20.5v-4h5v-4h5v-4h5v-4h2M3.5 20.5h17"/>`,
};

const THEMEN = {
  metar: `
    <path class="f" d="M7 6.5l20 3.2v4.6L7 17.5z"/>
    <path class="a" d="M7 6.5l6.7 1.07v8.86L7 17.5zM20.3 8.63l6.7 1.07v4.6l-6.7 1.07z"/>
    <path d="M7 6.5l20 3.2v4.6L7 17.5M13.7 7.6v8.8M20.3 8.6v6.8M7 4v25M4 29h6"/>`,
  luftraum: `
    <path class="f" d="M4 8h24v5H4zM8 13h16v5H8z"/>
    <path class="a2" d="M12 18h8v10h-8z"/>
    <path d="M4 8h24v5H4zM8 13h16v5H8zM12 18h8v10h-8zM2 28h28"/>`,
  sprechfunk: `
    <path d="M7 17v-3a9 9 0 0 1 18 0v3"/>
    <rect class="f" x="4.5" y="16" width="5" height="8.5" rx="2"/>
    <rect class="f" x="22.5" y="16" width="5" height="8.5" rx="2"/>
    <rect x="4.5" y="16" width="5" height="8.5" rx="2"/>
    <rect x="22.5" y="16" width="5" height="8.5" rx="2"/>
    <path d="M7 24.5c0 2.8 2.5 4 7 4"/>
    <circle class="a" cx="16" cy="28.5" r="2"/>`,
  navigation: `
    <circle class="f" cx="16" cy="16" r="12"/>
    <circle cx="16" cy="16" r="12"/>
    <path class="a" d="M16 5.5l3 10.5h-6z"/>
    <path d="M16 5.5l3 10.5-3 10.5-3-10.5zM4 16h2.5M25.5 16H28"/>`,
  'masse-schwerpunkt': `
    <circle class="f" cx="16" cy="16" r="11"/>
    <path class="a" d="M16 16V5A11 11 0 0 0 5 16zM16 16v11a11 11 0 0 0 11-11z"/>
    <circle cx="16" cy="16" r="11"/>
    <path d="M16 5v22M5 16h22"/>`,
  meteorologie: `
    <circle class="a" cx="12" cy="11.5" r="4.2"/>
    <path d="M12 3v1.8M5.4 5.6l1.3 1.3M3 11.5h1.8M18.6 5.6l-1.3 1.3"/>
    <path class="w" d="M9.5 26H24a5 5 0 0 0 .9-9.92 7 7 0 0 0-13.3 1.6 4.2 4.2 0 0 0-2.1 8.32z"/>
    <path class="f" d="M9.5 26H24a5 5 0 0 0 .9-9.92 7 7 0 0 0-13.3 1.6 4.2 4.2 0 0 0-2.1 8.32z"/>
    <path d="M9.5 26H24a5 5 0 0 0 .9-9.92 7 7 0 0 0-13.3 1.6 4.2 4.2 0 0 0-2.1 8.32z"/>`,
  aerodynamik: `
    <path class="f" d="M6 19.6C4.2 19.6 3.6 17.4 5.4 16 8.6 13.5 13.5 12.6 18.5 13c4.3.4 8.1 2 10.5 4.4-7 1.3-16 2.2-23 2.2z"/>
    <path d="M6 19.6C4.2 19.6 3.6 17.4 5.4 16 8.6 13.5 13.5 12.6 18.5 13c4.3.4 8.1 2 10.5 4.4-7 1.3-16 2.2-23 2.2z"/>
    <path d="M3 9.5c7-2.8 15-3.2 26-.6M3 25.5c8 1.3 17 .7 26-3"/>`,
  signale: `
    <rect class="a" x="5" y="5" width="22" height="22" rx="1.5"/>
    <path class="gelb" d="M7 7l18 18M25 7 7 25"/>
    <rect x="5" y="5" width="22" height="22" rx="1.5"/>`,
};

export const ICON_NAMEN = Object.keys(BEDIENUNG);
export const THEMEN_NAMEN = Object.keys(THEMEN);

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(inhalt, groesse, klasse, titel) {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', `0 0 ${groesse} ${groesse}`);
  el.setAttribute('class', klasse);
  if (titel) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', titel);
  } else {
    el.setAttribute('aria-hidden', 'true');
  }
  el.innerHTML = inhalt;
  return el;
}

/** Symbol für Bedienelemente, z. B. icon('start'). */
export function icon(name, titel) {
  if (!BEDIENUNG[name] && THEMEN[name]) return themenIcon(name, titel);
  return svg(BEDIENUNG[name] ?? BEDIENUNG.info, 24, 'ico', titel);
}

/** Symbol eines Lernthemas, z. B. themenIcon('metar'). */
export function themenIcon(name, titel) {
  return svg(THEMEN[name] ?? THEMEN.navigation, 32, 'ico ico-thema', titel);
}

export const LOGO_PFAD = 'M256 68c12 0 20 16 22 42l2 90 152 6c9 .4 14 6 14 14v18c0 8-5 12-14 12l-152 12-8 126 52 8c6 .9 9 4 9 10v8c0 6-4 8-10 8h-55l-5 20c-2 6-12 6-14 0l-5-20h-55c-6 0-10-2-10-8v-8c0-6 3-9.1 9-10l52-8-8-126-152-12c-9 0-14-4-14-12v-18c0-8 5-13.6 14-14l152-6 2-90c2-26 10-42 22-42z';

/** Grafik des App-Zeichens als SVG-Text. rund = abgerundete Ecken (für Favicon und Kopfzeile). */
export function logoSvg({ rund = true, id = 'logo-himmel' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3b8cf0"/><stop offset="1" stop-color="#0f2f63"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="${rund ? 112 : 0}" fill="url(#${id})"/>
    <path d="M64 408c118-58 266-58 384 0" fill="none" stroke="#f28c28" stroke-width="18" stroke-linecap="round"/>
    <path transform="translate(256 228) rotate(40) scale(.72) translate(-256 -256)" d="${LOGO_PFAD}" fill="#fff"/>
  </svg>`;
}

/** Das App-Zeichen als Element (Flugzeug über dem Horizont). */
export function logo() {
  const vorlage = document.createElement('template');
  vorlage.innerHTML = logoSvg().trim();
  const el = vorlage.content.firstElementChild;
  el.setAttribute('class', 'logo');
  el.setAttribute('aria-hidden', 'true');
  return el;
}
