# ADR 0015: UX-Konzept — Schülerauswahl, Notenansicht und Prognose

## Status

Proposed

## Kontext

Das Kernziel der App ist es, Lehrkräften und Schulverwaltungspersonal an Gesamt- und
Sekundarschulen einen schnellen Überblick über die Notenbilder ihrer Schüler zu
geben und auf einen Blick zu zeigen, welcher Abschluss voraussichtlich erreicht wird.

Der Workflow muss ohne technisches Vorwissen bedienbar sein und typische Schulszenarien
unterstützen: gesamte Klasse auf einen Blick, Detailansicht einzelner Schüler, Prognose
bestätigen und zurückschreiben.

## Entscheidung

Die App ist in drei aufeinander aufbauende Hauptbereiche gegliedert:

---

### Bereich 1 — Verbindung und Start (`ConnectView`)

* Identisch zu SVWS-Import: Eingabe von Serveradresse, Schema, Benutzername, Passwort
* Test-Request beim Verbinden, Fehlermeldung bei ungültigen Daten
* Nach erfolgreichem Login: weiter zum Dashboard

---

### Bereich 2 — Schülerauswahl (`SchuelerauswahlView`)

**Schritt 2a — Schuljahresabschnitt wählen**
* Dropdown mit verfügbaren Schuljahresabschnitten (z.B. "2024/25 · 1. Halbjahr")
* Standard: aktuell aktiver Abschnitt vorausgewählt

**Schritt 2b — Klasse oder Jahrgang wählen**
* Klassenübersicht als Kacheln oder Liste
* Filter nach Jahrgang (z.B. "nur Klasse 9 und 10")

**Schritt 2c — Schülerliste**
* Tabelle mit allen Schülern der gewählten Klasse
* Spalten: Name, Klasse, Prognose-Status (berechnet / offen / bestätigt)
* Ampel-Symbol je Schüler: grün = MSA erreichbar, gelb = unsicher, rot = kein Abschluss
* Klick auf Schüler → Detailansicht

**Klassenübersicht (Aggregiert)**
* Zusätzliche Ansicht: alle Schüler der Klasse mit Kurzprognose auf einem Bildschirm
* Ermöglicht schnelle Übersicht ohne Einzelnavigation

---

### Bereich 3 — Detailansicht Schüler

**3a — Notenansicht (`NotenbidView`)**
* Tabellarische Darstellung aller Lernabschnitte des Schülers
* Spalten: Schuljahr, Halbjahr, Fach, Kursart, Note
* Farbliche Hervorhebung nach Notenqualität (Ampelfarben)
* Abschnitte chronologisch geordnet
* Hinweis auf fehlende Noten (leere Zellen hervorgehoben)

**3b — Prognoseansicht (`PrognoseView`)**

```
┌─────────────────────────────────────────────────────┐
│  Max Mustermann · Klasse 9b · 2024/25 HJ1           │
│                                                      │
│  Prognose: ███████████████░░░░  MSA                 │
│            Wahrscheinlichster Abschluss              │
│                                                      │
│  Alternativen: HA10 (bei Verbesserung in Mathe)     │
│                                                      │
│  Hinweise:                                           │
│  ⚠ Mathematik: Note 4 in E-Kurs — grenzwertig       │
│  ✓ Deutsch: ausreichend für MSA                     │
│                                                      │
│  [Prognose bestätigen]  [Neu berechnen]             │
└─────────────────────────────────────────────────────┘
```

* Anzeige des berechneten Abschluss-Ergebnisses
* Visuelle Darstellung der Prognose-Stärke (Fortschrittsbalken / Badge)
* Auflistung aller Hinweise aus dem Regelwerk (Begründungen transparent)
* Button "Prognose bestätigen" → schreibt Ergebnis zurück in SVWS
* Button "Neu berechnen" → triggert erneute Berechnung (nach manueller Notenkorrektur)

---

### Navigation

* Breadcrumb: `Auswahl → Klasse 9b → Max Mustermann → Prognose`
* Zurück-Navigation zwischen den Ansichten ohne Datenverlust (Pinia-State)
* Keyboard-Navigation: Tab zwischen Schülern in der Liste

---

## Technische Umsetzung (Überblick)

| Aspekt | Ansatz |
|---|---|
| Schülerliste | AG Grid (ADR 0007) mit Status-Spalte und Ampel-Renderer |
| Notenansicht | AG Grid mit gruppierten Zeilen (nach Schuljahr/Abschnitt) |
| Prognose-Badge | PrimeVue Tag / Badge-Komponenten |
| Rückschreiben | svwsService.writePrgnoseErgebnis() nach Bestätigung |
| State | prognoseStore hält Berechnungszustand pro Schüler |

---

## Begründung

* Dreistufiger Flow (Auswahl → Noten → Prognose) entspricht dem mentalen Modell der Nutzer
* Klassenübersicht ermöglicht Massenauswertung ohne Einzelklicks
* Transparente Begründungen stärken Vertrauen in die berechneten Prognosen

## Konsequenzen

* Prognose-Berechnung kann aus der Prognoseansicht direkt getriggert werden
* Bestätigung ist explizit — kein automatisches Zurückschreiben ohne Nutzerinteraktion
* AG Grid-Lizenz (Community) deckt alle benötigten Features ab
