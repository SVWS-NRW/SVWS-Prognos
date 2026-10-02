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

## SVWS-Schnittstelle (OpenAPI + Kataloge)

Unter [data/openAPI/](data/openAPI/) liegen Snapshots der Schnittstelle des SVWS-Servers, gegen
die SVWS-Prognos entwickelt wird:

| Datei | Inhalt | Aktuelle Version abrufen |
|---|---|---|
| `server.json` | OpenAPI-3-Beschreibung aller REST-Endpunkte und Schemas | `https://localhost:8443/openapi/server.json` |
| `allinone.json` | Alle ASD-/Core-Types-Kataloge (z. B. `SchulabschlussAllgemeinbildend`, `ZulaessigeKursart`, `Fach`, `Schulform`) | `https://localhost:8443/types/allinone.json` |

Aktualisieren gegen einen lokal laufenden SVWS-Server (selbstsigniertes Zertifikat → `-k`):

```bash
curl -k -o data/openAPI/server.json    https://localhost:8443/openapi/server.json
curl -k -o data/openAPI/allinone.json  https://localhost:8443/types/allinone.json
git diff --stat data/openAPI/          # Änderungen an API/Katalogen sichtbar machen
```

Beide Dateien werden eingecheckt, damit Änderungen am SVWS-Server (neue/geänderte Endpunkte,
Katalogeinträge, Versionen) über `git diff` nachvollziehbar sind.

## Verwandte Projekte

* [SVWS-Import](https://github.com/SVWS-NRW/SVWS-Import) — gleiche technische Basis, Daten in SVWS importieren
* [SVWS-Server](https://github.com/SVWS-NRW/SVWS-Server) — REST-API
