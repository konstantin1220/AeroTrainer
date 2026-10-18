# Flug-Lernapp – Projektkontext

## Worum es geht
Eine Lernapp für die Theorie zum Flugschein (SPL, UL, PPL/LAPL), gedacht für die Nutzung im Fliegerverein. Gestartet wird mit einem Modul zum Lesen und Verstehen von METARs. Weitere Module (Luftraum, Sprechfunk/BZF, Navigation, Masse & Schwerpunkt, Meteorologie, Aerodynamik, Signale) folgen später.

Sprache der App: Deutsch. Zielgruppe: Flugschüler und Piloten im Verein, ohne technische Vorkenntnisse.

## Technische Grundentscheidungen
- **Web-App (PWA)**, gehostet über **GitHub Pages**. Auf dem Handy installierbar (Home-Bildschirm), funktioniert **offline** über einen Service Worker.
- **Kein Server, keine Benutzerkonten, kein Tracking.** Rein statische Seite.
- **Mobile first**, muss gut auf iPhone (Safari) und Android (Chrome) laufen, ebenso am PC.
- **Möglichst einfach halten:** wenige Abhängigkeiten, gut lesbarer Code, damit auch andere im Verein mitarbeiten können. Framework/Build-Setup bitte vorschlagen und begründen, bevor es eingeführt wird.
- **Modularer Aufbau:** Jedes Lernthema ist ein eigenes Modul. Neue Module sollen sich ohne Umbau der App ergänzen lassen.
- **Inhalte getrennt vom Code:** Lerninhalte (Erklärungen, Beispiele, Fragen) liegen als Datendateien (z. B. JSON) vor, damit sie ohne Programmierkenntnisse geprüft und korrigiert werden können, etwa von einem Fluglehrer.

## Lernstand
- Wird **lokal im Browser** gespeichert (z. B. IndexedDB/localStorage).
- **Export/Import als JSON-Datei** („Lernstand sichern“ / „Lernstand laden“). Die Datei legt der Nutzer selbst ab, z. B. in iCloud, OneDrive oder Google Drive. Das dient als Sicherung und zur Übertragung auf andere Geräte.
- Fester Dateiname, z. B. `flug-lernstand.json`. Beim Import mit Versionsfeld im Dateiformat arbeiten, damit spätere Änderungen am Format abwärtskompatibel bleiben.
- Dezenter Hinweis, wenn länger nicht gesichert wurde (z. B. „Letzte Sicherung vor 10 Tagen“). Hintergrund: Safari kann Website-Daten nach längerer Nichtnutzung löschen, wenn die App nicht auf dem Home-Bildschirm installiert ist.
- Die Datei enthält **nur den Lernstand** (Fortschritt, Wiederholungsplanung, Statistik), **nicht die Inhalte**.

## Erstes Modul: METAR
Lernstufen, vom Einfachen zum Schweren:
1. **Antippen & erklären:** METAR anzeigen, jede Gruppe (Wind, Sicht, Wetter, Wolken, Temperatur/Taupunkt, QNH, Trend) ist antippbar und wird erklärt.
2. **Selbst entschlüsseln:** Nutzer füllt die Bedeutung der Gruppen selbst aus, die App prüft.
3. **Rückwärts bauen:** Wetterlage wird in Worten beschrieben, Nutzer schreibt das METAR.
4. **Entscheidung treffen:** Praxisfragen wie „Kannst du hier fliegen?“, inkl. Seitenwindkomponente aus Windgruppe und Pistenrichtung, Wolkenuntergrenze für die Platzrunde.

Schwierigkeit steigt von CAVOK-Tagen bis zu VRB, Schauern, niedrigen Wolken, TEMPO/BECMG und RMK. Wiederholung nach dem Prinzip der verteilten Wiederholung (Spaced Repetition). TAF als mögliches Folgemodul.

Beispiel-METARs werden **selbst erstellt**. Abruf echter, aktueller METARs ist eine spätere Option (Datenquelle, Nutzungsbedingungen und technische Machbarkeit im Browser dann prüfen).

## Rechtliche Leitplanken (wichtig)
Die App soll im Verein geteilt werden, daher muss alles rechtlich sauber sein:
- **Nur eigene Inhalte.** Keine Fragen aus dem lizenzierten Prüfungsfragenkatalog (ECQB), auch nicht umformuliert oder nachgebaut. Fragen werden frei aus dem Stoff entwickelt.
- **Gesetze und Vorschriften** (SERA, LuftVO usw.) dürfen als Grundlage dienen (amtliche Werke).
- **Keine Kartenausschnitte** aus der ICAO-Karte der DFS oder aus kommerziellen Apps. Stattdessen ein fiktives Übungsgebiet mit selbst gezeichneten Standardsymbolen.
- **Bilder:** nur eigene oder mit CC0- bzw. CC-BY-Lizenz, mit Quellenangabe.
- **Grafiken/Diagramme** selbst erstellen, nicht aus Lehrbüchern abzeichnen.
- **Fremde Bibliotheken** nur mit freier, permissiver Lizenz (z. B. MIT, BSD, Apache 2.0). Lizenzhinweise in einer eigenen Datei sammeln (z. B. `THIRD_PARTY_LICENSES.md`).
- Bei Unsicherheit zu einer Quelle: nicht verwenden und nachfragen.

## Hinweis in der App
Gut sichtbar kennzeichnen: Die App ist eine **Lernhilfe** und kein offizielles oder genehmigtes Ausbildungsmaterial. Maßgeblich sind die Ausbildung bei der ATO bzw. im Verein und die gültigen Vorschriften.

## Qualität
- Fachliche Inhalte sollen vor der Freigabe von einem Fluglehrer gegengelesen werden.
- Fachbegriffe korrekt und einheitlich verwenden (deutsche Bezeichnungen, die gängigen Abkürzungen im Original).

## Entschieden
- **Name:** AeroTrainer.
- **Lizenz:** Programmcode MIT (`LICENSE`), Lerninhalte CC BY 4.0 (`LICENSE-INHALTE.md`).
- **Technik:** reines HTML/CSS/JavaScript mit ES-Modulen, kein Framework, kein Build-Schritt, keine npm-Abhängigkeiten. Tests mit `node --test`.
- **Aufbau:** Themenmodule nutzen den Baukasten `js/lernmodul.js`; Inhalte in `modules/<thema>/content/inhalt.json`, Rechenaufgaben in `generatoren.js`, Grafiken in `abbildungen.js`.
- **Wiederholung:** Leitner-System mit 5 Fächern (`js/srs.js`).
- **Interaktiv:** Wo sinnvoll, gibt es interaktive Darstellungen (`modules/<thema>/interaktiv.js`, Bausteine in `js/interaktiv.js`), eingebunden per Theorie-Block `{ "typ": "interaktiv", "id": … }`. Rechenlogik als exportierte reine Funktionen, damit sie getestet werden kann. Jedes Element hat `anleitung` (was tun, was zeigt die Grafik), `legende` (Farben, erscheint direkt unter der Grafik) und `probier` (kleine Aufgaben, je nach Erklär-Level offen, aufklappbar oder ausgeblendet). Linien dünn halten (1–2,5), Werte direkt in die Grafik schreiben. Grafiken zeichnen **maßstäblich**: Jede Eingabe ändert sichtbar die Grafik (feste Achsen oder Achsen, die in runden Stufen mitwachsen – `stufenMaximum` in `js/grafik.js`; Maßstabsleiste mit `massstab`). Nie alles auf Bildgröße strecken; Überhöhungen werden in der Grafik angegeben.
- **Gliederung:** Startseite nach den 9 Prüfungsfächern (FCL.120 / FCL.215, SFCL.135); jedes Thema in `modules/index.json` hat ein `fach`. Unter „Ich lerne für …“ wählt der Nutzer PPL/LAPL, SPL und/oder UL (`js/schein.js`). Inhalte, die nur für bestimmte Scheine gelten, tragen `"scheine": [...]` (Thema, Kapitel, Frage oder interaktives Element); ohne Feld gelten sie für alle. Regeln je Schein sauber trennen: Part-NCO für Flugzeuge, Part-SAO für Segelflugzeuge und Motorsegler, UL national (z. B. LuftVO, LuftPersV), SERA für alle.
- **Animationen:** in `modules/<thema>/animationen.js` als `{ titel, schritte: [{ text, dauer }], bild(schritt, t) }`; `bild()` ist eine reine Funktion (t von 0 bis 1) und liefert SVG-Text, gezeichnet mit `js/grafik.js` (Bewegung: `sanft`, `abschnitt`, `glatterWeg`, `aufWeg`). Eingebunden per Theorie-Block `{ "typ": "animation", "id": … }`, abgespielt von `js/animation.js` (Start beim Hineinscrollen, „Bewegung reduzieren“ = Standbilder, Prüfansicht zeigt Standbilder). Themen mit Flugzeugdaten (Masse & Schwerpunkt, Flugplanung) exportieren stattdessen `animationenFuer(flugzeug)`; Zahlen in Schritt-Texten dann aus `rechnen.js` berechnen, nicht abtippen. Jede Animation wird in `tests/animationen.test.mjs` zu vielen Zeitpunkten gezeichnet; fachliche Aussagen (z. B. Abstände, Wolkenbasis, Schwerpunkt) dort prüfen. Inhalte der Schritte nur aus dem, was im Kapitel und in den Quellen steht. Jedes Thema hat mindestens eine Animation.
- **Texte bleiben in Kästen:** Beschriftungen in Abbildungen, interaktiven Grafiken, Animationen und Rechenaufgaben dürfen nicht über den Bildrand oder aus ihrem Kasten laufen und sich nicht überdecken. Prüfen mit `tools/textpruefung.js` über `tools/abbildungen.html`, `tools/interaktiv.html`, `tools/animationen.html` und `tools/generatoren.html` (Funde rot markiert). Gefüllte Flächen mit Rand: Füllung per `g-f-*`-Klasse, Rand per `style` – eine `g-s-*`-Klasse schaltet die Füllung ab. Textmarker hinter Text als `<path>`, nicht als `<rect>`.
- **Oberfläche:** helle Kopfzeile (auf Unterseiten Zurück-Pfeil aus den Brotkrumen der Seite), „Lernhilfe“-Marke oben rechts und Hinweis in der Fußzeile auf jeder Seite; Themen als Listen je Prüfungsfach; Kapitel einer Themenseite als Lernpfad. Hinweisfarben: „Einfach erklärt“ grün, „Merke“ blau, „Achtung“ gelb-orange. Bewegungen kurz halten und `prefers-reduced-motion` beachten. Entwurf in Claude Design: „AeroTrainer Redesign“.
- **Luftraum:** Höhen nach AIP VFR (ENR 1-1, 1-3, 1-14, 1-17) in `modules/luftraum/luftraeume.js` (G bis 2500 ft GND bzw. 1000 ft GND an Flugplätzen mit Luftraum E ab 1000 ft, C ab FL 100 bzw. FL 130 in den Alpen bis FL 660, Transponderpflicht ab 5000 ft MSL bzw. 3500 ft GND, Segelflug ausgenommen). Tabellen, Animation `steigflug`, interaktives Element `luftraumcheck` und Generator `luftraumhoehe` nutzen diese Werte.
- **Betriebsverfahren & Notfälle** (`modules/betrieb/`) und **Technik** (`modules/technik/`): Rechnungen in `rechnen.js` (Umkehrkurve nach dem FAA-Beispiel 300 ft/65 kt/225° ≈ 79 s und 1316 ft; Fahrtmesser-Bögen des erfundenen MF-4; Vergaservereisung nach PHAK). Grundlagen: Part-NCO, VO (EU) 376/2014, LuftVO §§ 7 und 18, LuftVG § 25, FAA PHAK/AFH/GFH (als Herleitung, nicht als amtliche Vorschrift).
- **Versteckte Themen:** `"versteckt": true` in `modules/index.json` (und `fach: null`) – erscheint nicht in den Fächern; wer `#/<id>` öffnet, schaltet es frei (`einstellung('extra')`), danach steht es auf der Startseite unter „Extra für dich“. `modules/tim/` ist ein solcher Einsteigerkurs: jedes Fach ganz einfach erklärt, nutzt Abbildungen und Animationen anderer Themen.
- **Übungsgebiet:** frei erfundene Plätze mit X-Kennungen (XMUS, XALT, XNEU, XBER, XSEE), gemeinsam genutzt von Navigation und METAR.
- **Gestaltung:** alle Symbole und Grafiken selbst gezeichnet, keine Standard-Icons. Farben über CSS-Variablen, hell und dunkel.
- **Impressum:** `modules/impressum.json` (Name und ladungsfähige Anschrift nach § 18 Abs. 1 MStV). Keine persönlichen Daten ohne ausdrückliche Freigabe eintragen.
- **Sprechfunk/BZF:** Sprechgruppen nur nach der aktuellen „Bekanntmachung über die Sprechfunkverfahren“ (NfL 2024-1-3266) und den Richtlinien für Plätze ohne Flugverkehrsdienst (NfL 2024-1-3240): RADIO statt „Info“, RADIO-Stationen geben keine Freigaben, kein QNH, keine genauen Windwerte. Zahlen sprechen über `modules/sprechfunk/funkwerte.js`. Funkgespräche haben vier Stufen (auswählen, große Bausteine, Wort für Wort, frei tippen); die freie Eingabe prüft `freitextPruefen` in `funklogik.js` tolerant (Schreibweise, Tippfehler, gesprochene Zahlen), aber streng bei Zahlen, Rufzeichen und echten anderen Funkwörtern. Jede falsche Antwort eines Schritts muss bei freier Eingabe durchfallen (Test) – sonst `pflicht`, `tabu` oder `reihenfolge` schärfen. Keine Fragen aus den Fragenkatalogen der Bundesnetzagentur. Keine Karten aus dem Luftfahrthandbuch der DFS – Übungskarten selbst zeichnen (Übungsgebiet, `uebungsgebiet.js`).
- **Flugplanung:** Rechtsgrundlagen SERA (2010 b, 4001–4020, 5005), Part-NCO (NCO.GEN.105/135, NCO.OP.125/135/160/185, NCO.POL.100/110), Part-FCL (FCL.045) und LuftVO (§§ 27, 32, 35). Die Minuten der Kraftstoff-Endreserve (10/30/45) stehen **nicht** in NCO.OP.125, sondern in AMC1 NCO.OP.125(b) der EASA – so benennen. Planungsdaten des erfundenen Übungsflugzeugs MF-4 und der Plätze in `modules/flugplanung/content/flugzeug.json`, Rechnungen in `rechnen.js`. Zahlen in Beispieltabellen und -texten werden per Test gegen `rechnen.js` geprüft – bei Änderungen beides anpassen. NOTAM, METAR und TAF nur erfunden, für die X-Plätze.
- **METAR:** fünf Lernstufen; Stufe 3 als Bausteine, Bausteine mit Fallen (`bauBausteine` in `aufgaben.js`, jede Falle mit Begründung) oder Eintippen; Stufe 5 „Fehler finden“ (`fehlerEinbauen`). TAF-Kapitel mit Generator `taf`.
- **Quellen:** `modules/quellen.json`, angezeigt unter Info → Quellen & Grundlagen. Neue Inhalte dort mit Quelle, Fundstelle und ehrlichem Status eintragen; „abgeglichen“ nur, wenn wirklich mit dem amtlichen Originaltext verglichen (SERA auf EUR-Lex, LuftVO auf gesetze-im-internet.de).

## Arbeitsweise
- Nach Änderungen `node --test` ausführen; vor dem Veröffentlichen `node tools/sw-aktualisieren.mjs` und die Prüfseiten in `tools/` ansehen (nichts rot).
- Lokal starten mit `python3 tools/server.py` (Port 8080).
- Frage-IDs nie ändern (sonst geht der Lernstand verloren).
