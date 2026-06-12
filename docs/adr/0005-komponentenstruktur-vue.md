# ADR 0005: Strukturierung der Vue-Komponenten

## Status

Accepted

## Kontext

SVWS-Prognos besteht aus mehreren klar abgegrenzten Funktionsbereichen:
Serververbindung, Schülerauswahl, Notenansicht und Prognosedarstellung.
Die Komponentenstruktur soll diese Trennung widerspiegeln und langfristige
Wartbarkeit gewährleisten.

## Entscheidung

* Verwendung von Single File Components (`.vue`) mit `<script setup>` (Composition API)
* Striktes TypeScript in allen Komponenten
* Gliederung nach Verantwortlichkeiten:

```
src/
├── views/          # Seiten (Routing-Ziele)
├── components/     # Wiederverwendbare UI-Bausteine
│   ├── prognose/   # Prognose-spezifische Komponenten
│   └── shared/     # App-übergreifend nutzbar
├── stores/         # Pinia Stores (globaler Zustand)
├── services/       # API-Kommunikation und Fachlogik
├── models/         # TypeScript-Typdefinitionen
├── composables/    # Vue Composition API Hooks
└── utils/          # Reine Hilfsfunktionen
```

## Views (Routing-Ziele)

* `ConnectView.vue` — Serververbindung und Login
* `DashboardView.vue` — Startseite nach Login
* `SchuelerauswahlView.vue` — Klasse / Schüler auswählen
* `NotenbidView.vue` — Notenansicht für einen Schüler
* `PrognoseView.vue` — Prognosedarstellung und Bestätigung
* `EinstellungenView.vue` — App-Konfiguration

## Begründung

* Klare Trennung erleichtert Wartung und parallele Entwicklung
* Wiederverwendbarkeit durch dedizierte `components/`-Ebene
* Gleiche Konventionen wie SVWS-Import — kein Umdenken bei gemeinsamer Entwicklung

## Alternativen

* Monolithische Komponenten → schwer wartbar bei wachsender Berechnungslogik
* Logik direkt in UI → Testbarkeit und Nachvollziehbarkeit sinken

## Konsequenzen

* Initialer Strukturaufwand beim Anlegen des Projekts
* Klare Namenskonventionen sind einzuhalten
* Komponenten aus SVWS-Import können bei Bedarf übernommen werden
