# SVWS-Prognos

Web-Client für Gesamtschulen, Sekundarschulen und Primusschulen in NRW zur Darstellung von
Notenbildern und zur Berechnung von Abschlussprognosen.

## Architektur auf einen Blick

| Bereich | Entscheidung | ADR |
|---|---|---|
| Frontend | Vue 3 + TypeScript SPA | 0001 |
| Build / Deployment | Vite + Electron (AppImage, NSIS) + statisches Web-Bundle | 0002 |
| Datenzugriff | SVWS REST API (lesen + schreiben) | 0003, 0004 |
| Komponentenstruktur | SFC + Composition API, `/views`, `/components`, `/composables` | 0005 |
| State Management | Pinia | 0006 |
| Validierung | 3-lagig: Datenvollständigkeit → Vorbedingungen → Schreibvalidierung | 0008 |
| Fehlerhandling | Zentraler Error-Service, Toast-Notifications | 0009 |
| API-Layer | Axios mit Interceptors, Service-Kapselung | 0010 |
| Authentifizierung | Basic Auth, nur im Arbeitsspeicher | 0011 |
| Projektstruktur | Modulare Verzeichnisstruktur + `rules/` für NRW-Regelwerke | 0012 |
| Routing | Vue Router, Hash-History | 0013 |
| Datenmodell | Interne Typen (Schueler, Lernabschnitt, Leistung, PrognoseErgebnis) | 0014 |
| UX-Konzept | Auswahl → Notenansicht → Prognosedarstellung → Bestätigung | 0015 |
| Prognose-Engine | Regelbasiert, clientseitig, schulformspezifisch | 0016 |
| Design System | Emerald-Palette, PrimeVue 4 / Aura, CSS Custom Properties | 0017 |

Alle Architekturentscheidungen sind in [docs/adr/](docs/adr/) dokumentiert.

## Entwicklung

```bash
npm install
npm run dev        # Dev-Server auf http://localhost:5173
npm run build      # Statisches Bundle → dist/
npm run release    # AppImage + NSIS-Installer + Web-ZIP → release/
```

## Verwandte Projekte

* [SVWS-Import](https://github.com/SVWS-NRW/SVWS-Import) — gleiche technische Basis, Daten in SVWS importieren
* [SVWS-Server](https://github.com/SVWS-NRW/SVWS-Server) — REST-API
