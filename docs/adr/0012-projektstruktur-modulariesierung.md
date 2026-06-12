# ADR 0012: Projektstruktur und Modularisierung

## Status

Accepted

## Kontext

SVWS-Prognos soll langfristig wartbar und erweiterbar sein. Die App wird mit der Zeit
weitere Abschlusstypen, neue Schulformen und möglicherweise weitere Berechnungsmodule
erhalten. Die Verzeichnisstruktur muss diese Erweiterungen aufnehmen können.

## Entscheidung

```
src/
├── App.vue
├── main.ts
├── vite-env.d.ts
│
├── views/              # Seiten (Routing-Ziele, ein File pro Route)
├── components/
│   ├── prognose/       # Prognose-spezifische Komponenten
│   ├── notenbilder/    # Notenansicht-Komponenten
│   └── shared/         # App-übergreifend nutzbar
│
├── stores/             # Pinia Stores
├── services/           # API-Kommunikation + Fachlogik
├── models/             # TypeScript-Interfaces und -Types
├── composables/        # Vue Composition Hooks
├── utils/              # Reine Hilfsfunktionen
├── rules/              # NRW-Abschlussregelwerke (isoliert, austauschbar)
└── router/
    └── index.ts
```

**`rules/`-Verzeichnis** (Prognos-spezifisch)
Enthält die NRW-Regelwerke für Abschlussberechnungen als isolierte Module:
```
rules/
├── index.ts                    # Registry aller Regelwerke
├── gesamtschule.ts             # Gesamtschul-Abschlussregeln
├── sekundarschule.ts           # Sekundarschul-Abschlussregeln
└── types.ts                    # Typen für Regelwerke
```

Diese Isolation erlaubt es, Regelwerke unabhängig zu pflegen und zu testen,
ohne andere Teile der Anwendung zu berühren.

## Begründung

* Klare Verantwortlichkeiten durch fachliche Verzeichnistrennung
* Gleiche Grundstruktur wie SVWS-Import — kein Umdenken bei Entwicklern
* `rules/` als eigene Ebene betont den domänenspezifischen Charakter der Berechnung

## Alternativen

* Flache Struktur → unübersichtlich bei wachsender Komplexität
* Regelwerke in `services/` → schlechtere Auffindbarkeit, schwerer austauschbar

## Konsequenzen

* Initialer Strukturaufwand beim Anlegen des Projekts
* Naming Conventions müssen dokumentiert und eingehalten werden
* Neue Schulformen werden durch Ergänzung in `rules/` unterstützt
