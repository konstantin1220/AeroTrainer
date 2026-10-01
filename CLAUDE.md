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
- **Interaktiv:** Wo sinnvoll, gibt es interaktive Darstellungen (`modules/<thema>/interaktiv.js`, Bausteine in `js/interaktiv.js`), eingebunden per Theorie-Block `{ "typ": "interaktiv", "id": … }`. Rechenlogik als exportierte reine Funktionen, damit sie getestet werden kann. Jedes Element hat `anleitung` (was tun, was zeigt die Grafik), `legende` (Farben, erscheint direkt unter der Grafik) und `probier` (kleine Aufgaben, je nach Erklär-Level offen, aufklappbar oder ausgeblendet). Linien dünn halten (1–2,5), Werte direkt in die Grafik schreiben.
- **Übungsgebiet:** frei erfundene Plätze mit X-Kennungen (XMUS, XALT, XNEU, XBER, XSEE), gemeinsam genutzt von Navigation und METAR.
- **Gestaltung:** alle Symbole und Grafiken selbst gezeichnet, keine Standard-Icons. Farben über CSS-Variablen, hell und dunkel.

## Arbeitsweise
- Nach Änderungen `node --test` ausführen; vor dem Veröffentlichen `node tools/sw-aktualisieren.mjs`.
- Lokal starten mit `python3 tools/server.py` (Port 8080).
- Frage-IDs nie ändern (sonst geht der Lernstand verloren).
