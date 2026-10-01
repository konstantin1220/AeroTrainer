# AeroTrainer

Lernapp für die Flugtheorie (SPL, UL, PPL/LAPL) für die Nutzung im Fliegerverein.

**Online:** https://konstantin1220.github.io/AeroTrainer/

> AeroTrainer ist eine **Lernhilfe** und kein offizielles oder genehmigtes Ausbildungsmaterial.
> Maßgeblich sind die Ausbildung bei der ATO bzw. im Verein und die gültigen Vorschriften.

## Was die App kann

- **8 Themen**: METAR lesen, Luftraum & Regeln, Sprechfunk, Navigation, Masse & Schwerpunkt,
  Meteorologie, Aerodynamik, Signale – jeweils mit Theorie-Kapiteln, Abbildungen und Fragen.
- **Verteilte Wiederholung** (Leitner-Karteikasten mit 5 Fächern): Jede Frage kommt wieder, wenn sie dran ist.
- **Merkliste**: Jede Frage lässt sich überall mit „Merken“ vormerken und später gezielt üben – auch erzeugte Rechenaufgaben
  (sie werden genau so gespeichert, wie sie gestellt wurden). Die Merkliste gehört zum Lernstand und wird mitgesichert.
  Fällige Fragen aller Themen lassen sich gemeinsam wiederholen.
- **Rechenaufgaben, die jedes Mal neu entstehen**: Winddreieck, Missweisung, Schwerpunkt, Wolkenbasis,
  Lastvielfaches, Frequenzen sprechen, Kurs auf der Übungskarte messen u. v. m.
- **METAR in vier Stufen**: Antippen & erklären → selbst entschlüsseln → rückwärts bauen → Entscheidung treffen.
  Ein Generator erzeugt unbegrenzt viele, in sich stimmige METARs in fünf Schwierigkeitsstufen.
- **Zum Ausprobieren**: 21 interaktive Darstellungen mit Reglern und Umschaltern – z. B. Winddreieck,
  antippbare Übungskarte, Sichtflugbedingungen, Kontrollzonen-Wetter, Wer weicht aus?, Wolkenbasis,
  Höhenmesser mit Fehleinstellung, Anstellwinkel bis zum Strömungsabriss, Kurvenflug, Signalscheinwerfer,
  Buchstabieren und Zahlen sprechen (mit Anhören), Hebel-Wippe, Beladungsrechner, METAR-Baukasten und Seitenwind.
  Sie stehen direkt in den Theorie-Kapiteln und gesammelt in jedem Thema unter „Zum Ausprobieren“.
- **Lernstand**: Statistik, Lernserie, Aktivitätskalender; Sichern und Laden als Datei (`flug-lernstand.json`).
- **Prüfansicht für Fluglehrer** in jedem Thema: alle Inhalte, Lösungen und Beispiele der Rechenaufgaben auf einer Seite.
- PWA: offline nutzbar, auf dem Home-Bildschirm installierbar, helles und dunkles Farbschema.
- Kein Server, keine Konten, kein Tracking. Alle Symbole und Grafiken sind selbst gezeichnet.

## Technik – bewusst einfach

Reines HTML, CSS und JavaScript (ES-Module), **ohne Framework, ohne Build-Schritt, ohne Abhängigkeiten**.
Ein Texteditor und ein Browser genügen, um mitzuarbeiten.

### Lokal starten

```bash
python3 tools/server.py
```

Dann http://localhost:8080 öffnen. Der Server schickt „nicht zwischenspeichern“ mit, damit Änderungen sofort sichtbar sind.
Auf `localhost` ist der Offline-Modus abgeschaltet; mit `http://localhost:8080/?offline` lässt er sich testen.

### Tests

```bash
node --test
```

Benötigt Node.js 22 oder neuer. Die Tests prüfen u. a.:

- jede Frage aller Themen (Aufbau, Lösung wird als richtig erkannt, falsche Antworten nicht),
- jede Rechenaufgabe mit 300 zufälligen Durchläufen,
- dass jede verwendete Abbildung existiert,
- den METAR-Parser und 3000 erzeugte METARs gegen die Melderegeln,
- die Rechenlogik der interaktiven Darstellungen (Sichtflugbedingungen, Ausweichregeln, Sprechweise u. a.),
- dass der Service Worker alle Dateien kennt.

### Vor dem Veröffentlichen

```bash
node tools/sw-aktualisieren.mjs
```

Das trägt alle Dateien in die Offline-Liste von `sw.js` ein und erhöht dessen Version.

## Ordnerstruktur

```
index.html, manifest.webmanifest, sw.js
css/app.css               gesamte Gestaltung (Farben als Variablen, hell/dunkel)
js/app.js                 Navigation, Startseite, gemeinsame Wiederholung, Lernstand, Info
js/lernmodul.js           Baukasten für Themenmodule (Kapitel, Lernrunden, Prüfansicht)
js/quiz.js                Fragerunde mit Rückmeldung
js/fragen.js              Fragetypen und Auswertung
js/srs.js                 verteilte Wiederholung (Leitner)
js/storage.js             Lernstand speichern, sichern, laden
js/interaktiv.js          Bausteine für interaktive Darstellungen (Regler, Umschalter, Wertanzeigen)
js/icons.js, js/grafik.js eigene Symbole und Zeichenhelfer für Abbildungen
modules/index.json        Liste der Themen
modules/<thema>/
  module.js               bindet das Thema ein (meist 3 Zeilen)
  content/inhalt.json     Kapitel, Theorie und Fragen  ← hier wird Inhalt gepflegt
  generatoren.js          Rechenaufgaben mit wechselnden Werten
  abbildungen.js          selbst gezeichnete Grafiken (SVG)
  interaktiv.js           interaktive Darstellungen (optional)
modules/metar/            zusätzlich: Parser, METAR-Generator, Lernstufen, Beispiele, fiktive Flugplätze
tests/                    automatische Tests
tools/                    Entwicklungsserver, Symbol- und Abbildungsübersicht, App-Symbol, Handyvorschau
```

## Inhalte prüfen und bearbeiten (z. B. als Fluglehrer)

Am einfachsten in der App: Thema öffnen → ganz unten **„Alle Inhalte zum Gegenlesen anzeigen“**.
Die Seite lässt sich auch ausdrucken.

Die Texte stehen in `modules/<thema>/content/inhalt.json` und lassen sich direkt auf GitHub im Browser bearbeiten.
Aufbau eines Kapitels:

```json
{
  "id": "vmc",
  "titel": "Sichtflugbedingungen (VMC)",
  "kurz": "Kurzbeschreibung",
  "theorie": [
    { "typ": "absatz", "text": "Text mit **fett**" },
    { "typ": "liste", "punkte": ["…", "…"] },
    { "typ": "tabelle", "kopf": ["…"], "zeilen": [["…"]] },
    { "typ": "merke", "text": "…" },
    { "typ": "achtung", "text": "…" },
    { "typ": "formel", "titel": "…", "text": "…" },
    { "typ": "abbildung", "id": "name", "unterschrift": "…" },
    { "typ": "interaktiv", "id": "name-in-interaktiv.js" }
  ],
  "fragen": [
    { "id": "eindeutige-id", "typ": "auswahl", "frage": "…", "richtig": "…", "falsch": ["…", "…"], "erklaerung": "…" },
    { "id": "…", "typ": "mehrfach", "frage": "…", "richtig": ["…"], "falsch": ["…"] },
    { "id": "…", "typ": "wahrfalsch", "aussage": "…", "richtig": true },
    { "id": "…", "typ": "zahl", "frage": "…", "loesung": 1500, "toleranz": 0, "einheit": "ft" },
    { "id": "…", "typ": "zuordnung", "frage": "…", "paare": [["links", "rechts"]] },
    { "id": "…", "typ": "generator", "generator": "name-in-generatoren.js" }
  ]
}
```

Die Reihenfolge der Antworten wird in der App gemischt. Nach der fachlichen Prüfung bitte `"_geprueft"`
oben in der Datei auf Name und Datum setzen, z. B. `"_geprueft": "M. Muster, 2026-10-15"` –
die Prüfansicht zeigt das dann an. Wichtig: Frage-IDs nie ändern, sonst geht der Lernstand dieser Frage verloren.

Die **Quellen** stehen in `modules/quellen.json` und erscheinen in der App unter *Info → Quellen & Grundlagen*.
Jeder Punkt hat eine Quelle, ggf. eine Fundstelle (z. B. `SERA.5001`) und einen Status: `abgeglichen` (mit dem amtlichen
Originaltext verglichen), `grundlage`, `herleitung`, `erfunden` oder `offen`. Nach einem neuen Abgleich `abgleich` (Datum) und
den Status anpassen. Der Fluglehrer-Vermerk `_geprueft` wird dort automatisch je Thema angezeigt.

## Ein neues Thema anlegen

1. Ordner `modules/<id>/` mit `content/inhalt.json` und einer `module.js`:
   ```js
   import { lernmodul } from '../../js/lernmodul.js';
   export default lernmodul({});
   ```
   (Rechenaufgaben und Abbildungen wie in den anderen Modulen über `generatoren.js` und `abbildungen.js`.)
2. Eintrag in `modules/index.json` mit `"status": "aktiv"` und `"pfad": "modules/<id>/"`.
3. Ein Themensymbol in `js/icons.js` (Abschnitt `THEMEN`) und eine Themenfarbe in `css/app.css` (`[data-modul="<id>"]`).
4. `node --test` und `node tools/sw-aktualisieren.mjs` ausführen.

## Gestaltung

- Alle Symbole und Grafiken sind selbst gezeichnet (`js/icons.js`, `modules/*/abbildungen.js`).
  Übersichten: `tools/symbole.html`, `tools/abbildungen.html` und `tools/interaktiv.html`.
- `tools/grafiktest.html?modul=navigation&element=winddreieck&werte=[[90,100,30,20],[270,150,90,40]]` zeigt
  eine interaktive Grafik mit mehreren Reglerstellungen nebeneinander – gut für Grenzfälle (Beschriftungen am Rand).
- Das App-Symbol entsteht aus `logoSvg()` in `js/icons.js`. Die PNG-Dateien in `icons/` werden mit
  `tools/app-symbol.html?groesse=512&rund=0` erzeugt (z. B. per Bildschirmfoto mit Headless-Chrome).
- `tools/handy.html?seite=metar/1` zeigt die App in Handybreite.

## Veröffentlichen (GitHub Pages)

Repository auf GitHub anlegen, Dateien hochladen, unter *Settings → Pages* als Quelle „Deploy from a branch“,
Branch `main`, Ordner `/ (root)` wählen. Alle Pfade sind relativ – die App läuft auch unter
`https://<name>.github.io/<repo>/`.

## Rechtliches

- **Impressum:** Weil die App öffentlich erreichbar ist und nicht nur privaten Zwecken dient, braucht sie eine
  Anbieterkennzeichnung (§ 18 Abs. 1 Medienstaatsvertrag: Name und ladungsfähige Anschrift). Die Angaben stehen in
  `modules/impressum.json`; sobald `name` ausgefüllt ist, erscheinen Impressum und Link automatisch.

- Nur eigene Inhalte. Keine Fragen aus dem Prüfungsfragenkatalog (ECQB), auch nicht umformuliert.
- Grundlage sind frei zugängliche Vorschriften, vor allem SERA (Durchführungsverordnung (EU) Nr. 923/2012).
- Keine Kartenausschnitte, keine fremden Grafiken. Flugplätze, Karte und Flugzeugdaten sind frei erfunden;
  METARs verwenden echte Flugplatzkennungen mit erfundenem Wetter.
- Fremde Bibliotheken nur mit permissiver Lizenz, eingetragen in `THIRD_PARTY_LICENSES.md` (derzeit keine).

Lizenzen: Programmcode **MIT** (`LICENSE`), Lerninhalte **CC BY 4.0** (`LICENSE-INHALTE.md`).
