# ADR 0010: Kapselung der API-Kommunikation

## Status

Accepted

## Kontext

SVWS-Prognos kommuniziert mit dem SVWS-Server sowohl lesend (Notenbilder laden) als auch
schreibend (Prognosen zurückschreiben). Diese Kommunikation muss wartbar, testbar und
von der UI-Schicht entkoppelt bleiben.

## Entscheidung

Alle API-Aufrufe werden in einem dedizierten Service-Layer gekapselt:

```
services/
├── apiClient.ts          # Axios-Instanz, Interceptors, Auth-Header
├── svwsService.ts        # Alle REST-Aufrufe gegen SVWS (lesen + schreiben)
└── katalogService.ts     # Caching von Stammdaten (Fächer, Klassen, Abschnitte)
```

**`apiClient.ts`**
* Erzeugt Axios-Instanz mit `baseUrl` + Schema aus `authStore`
* Setzt `Authorization: Basic …`-Header bei jedem Request
* Interceptors für Fehlerklassifizierung (401 → Auth-Fehler, 5xx → Server-Fehler)
* Timeout: 30 Sekunden

**`svwsService.ts`**
* Methoden pro SVWS-Endpunkt: `loadSchueler()`, `loadLernabschnitte()`,
  `writePrgnoseErgebnis()`, etc.
* Rückgabe immer als typisierte Objekte (interne Modelle, keine Rohantworten)

**`katalogService.ts`**
* Lädt und cached Stammdaten beim ersten Zugriff
* Bietet Auflösungsfunktionen: `getFachByKuerzel()`, `getKlasseById()`, etc.

## Begründung

* Trennung von UI und API-Logik ermöglicht unabhängige Wartung
* Identisches Muster zu SVWS-Import — übertragbares Know-how
* Abstraktion vereinfacht späteres Mocken für Tests

## Alternativen

* API-Aufrufe direkt in Komponenten → schwer wartbar, kein Caching

## Konsequenzen

* Neue SVWS-Endpunkte werden ausschließlich in `svwsService.ts` ergänzt
* `apiClient` wird bei Verbindungsaufbau erzeugt und bei Abmeldung zerstört
* Kein Code außerhalb von Services darf direkt Axios aufrufen
