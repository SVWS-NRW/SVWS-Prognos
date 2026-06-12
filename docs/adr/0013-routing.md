# ADR 0013: Clientseitiges Routing

## Status

Accepted

## Kontext

SVWS-Prognos besteht aus mehreren klar abgegrenzten Ansichten: Verbindung, Schülerauswahl,
Notenansicht und Prognosedarstellung. Der Nutzer soll zwischen diesen Ansichten navigieren
können, ohne Daten zu verlieren. Als statisch ausgeliefertes Bundle darf kein server-seitiges
URL-Rewriting erforderlich sein.

## Entscheidung

* Vue Router 4 mit `createWebHashHistory()` (Hash-basiertes Routing, `/#/…`)
* Routen-Guards prüfen `authStore.isConnected` für alle geschützten Routen
* Nicht authentifizierte Zugriffe werden auf `/#/connect` umgeleitet

## Routen-Übersicht

| Route | Ansicht | Geschützt |
|---|---|---|
| `/#/connect` | ConnectView | Nein |
| `/#/` | DashboardView | Ja |
| `/#/auswahl` | SchuelerauswahlView | Ja |
| `/#/schueler/:id/notenbilder` | NotenbidView | Ja |
| `/#/schueler/:id/prognose` | PrognoseView | Ja |
| `/#/einstellungen` | EinstellungenView | Ja |

## Navigationsfluss

```
Browser öffnet / → /#/connect (falls nicht verbunden)
       │
       ↓ (Verbindung erfolgreich)
   /#/ (Dashboard)
       │
       ├─→ /#/auswahl (Schuljahr + Klasse wählen)
       │         │
       │         ↓ (Schüler ausgewählt)
       │   /#/schueler/:id/notenbilder
       │         │
       │         ↓ (Prognose berechnen)
       │   /#/schueler/:id/prognose
       │         │
       │         ↓ (optional: zurückschreiben)
       │   ← Bestätigung, dann zurück zur Auswahl
       │
       └─→ /#/einstellungen
```

## Begründung

* Hash-History erfordert keine Serverkonfiguration — ideal für statisches Hosting
* Gleicher Ansatz wie SVWS-Import — keine Abweichung ohne Mehrwert
* Route-Parameter (`:id`) halten den Schüler-Kontext beim Navigieren zwischen Tabs

## Alternativen

* HTML5 History Mode → erfordert Server-Rewrite-Regeln (nicht bei statischem Hosting)
* Kein Routing → alles in einer View → unübersichtlich und nicht deep-linkfähig

## Konsequenzen

* URLs sind nicht direkt teilbar (Hash nicht indexierbar) — für Schulanwendungen akzeptabel
* Zurück-Navigation im Browser funktioniert korrekt durch Vue Router-History
