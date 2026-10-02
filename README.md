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
npm run release:build   # AppImage + NSIS-Installer + Web-ZIP → release/ (ohne Versionserhöhung/Upload)
npm run release         # Version erhöhen, bauen, Commit + Tag pushen, GitHub-Draft (s. u.)
```

### Release erstellen

Voraussetzungen: `wine` (für den Windows-Installer), angemeldete [GitHub CLI](https://cli.github.com/)
(`gh auth status`), alle Änderungen committet und der Branch hat einen Upstream auf GitHub.

```bash
npm run release          # patch: 0.3.3 → 0.3.4
npm run release --patch  # dasselbe, Flag-Schreibweise (mit oder ohne -- davor)
npm run release minor    # minor: 0.3.3 → 0.4.0
npm run release major    # major: 0.3.3 → 1.0.0
```

[scripts/release.mjs](scripts/release.mjs) (wie in SVWS-Import) führt nacheinander aus:

1. Voraussetzungen prüfen – bricht ab, bevor irgendetwas verändert wird
2. `npm version <patch|minor|major>` – erhöht die Version in `package.json`/`package-lock.json`,
   erzeugt Commit und Tag `v<version>`
3. `npm run release:build` – baut AppImage, Windows-Installer und Webserver-ZIP nach `release/`
4. `git push --follow-tags` – pusht Commit und Tag
5. `npm run release:github` – legt den Release-Entwurf „Release `<version>`“ mit den drei Dateien an

Danach auf GitHub unter **Releases** den Entwurf öffnen, Release-Notes eintragen und veröffentlichen.

Fehlerfälle:

- **Build schlägt fehl:** Commit und Tag werden lokal zurückgenommen, nichts wurde gepusht.
  Fehler beheben und denselben Befehl erneut ausführen.
- **Push oder Upload schlägt fehl:** Version ist erhöht, Dateien liegen in `release/`. Fortsetzen mit
  `git push --follow-tags && npm run release:github`.
- **Release existiert bereits:** `gh` bricht ab. Entwurf auf GitHub löschen und
  `npm run release:github` erneut ausführen.

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
