# ADR 0006: State Management mit Pinia

## Status

Accepted

## Kontext

SVWS-Prognos verwaltet mehrere voneinander abhängige Datenbereiche: Verbindungsstatus,
ausgewählter Schuljahresabschnitt, geladene Schülerliste, Notenbilder und berechnete
Prognosen. Diese Zustände müssen komponentenübergreifend konsistent verfügbar sein.

## Entscheidung

Es wird Pinia als State-Management-Lösung verwendet.

## Store-Struktur

* **`authStore`** — Verbindungsstatus, Serveradresse, Schema, Credentials (nur Speicher)
* **`schuljahresabschnittStore`** — Verfügbare Abschnitte, aktuell ausgewählter Abschnitt
* **`klassenStore`** — Klassen des ausgewählten Abschnitts
* **`schuelerStore`** — Schülerliste der ausgewählten Klasse, ausgewählter Schüler
* **`notenbidStore`** — Geladene Lernabschnittsdaten (Notenbilder) des aktuellen Schülers
* **`prognoseStore`** — Berechnete Prognosen, Bestätigungsstatus, Schreibstatus

## Begründung

* Offizielle Empfehlung für Vue 3, vollständige TypeScript-Unterstützung
* Modularer Store-Ansatz bildet die fachliche Trennung sauber ab
* Gleiche Technologiewahl wie SVWS-Import — kein zusätzliches Lernaufwand
* Reaktive Berechnungen (`computed`) in Stores reduzieren Doppellogik in Komponenten

## Alternativen

* Vuex → veraltet, mehr Boilerplate
* Kein State Management → führt zu Props-/Event-Chaos bei mehreren Navigationsebenen
* Lokaler Component-State → unzureichend für den Datenfluss Auswahl → Berechnung → Schreiben

## Konsequenzen

* Klare Richtung des Datenflusses: API-Call → Store → Komponente
* `prognoseStore` enthält die berechneten Ergebnisse und deren Persistenzstatus
* Kein Speichern von Credentials in persistentem Storage (localStorage / sessionStorage)
