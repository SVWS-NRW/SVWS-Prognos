# ADR 0009: Fehlerhandling und Logging im Frontend

## Status

Accepted

## Kontext

Fehler können in SVWS-Prognos an verschiedenen Stellen auftreten: beim Laden von
Notenbildern, während der clientseitigen Prognoseberechnung oder beim Zurückschreiben
der Ergebnisse in SVWS. Benutzer sollen verständliche Rückmeldungen erhalten, ohne
technische Details zu sehen. Entwickler benötigen vollständige Fehlerinformationen.

## Entscheidung

* Zentraler Error-Service (`services/errorService.ts`) als einziger Einstiegspunkt
  für alle Fehler
* Strukturierter `AppError`-Typ mit Klassifizierung nach Fehlerart
* Benutzerorientierte Fehlermeldungen auf Deutsch (UI-Layer)
* Technische Details ausschließlich in der Browser-Konsole
* Toast-Benachrichtigungen (PrimeVue) für sofortiges Feedback

## Fehlerklassen

| Typ | Beispiel |
|---|---|
| `network` | SVWS-Server nicht erreichbar |
| `auth` | Ungültige Zugangsdaten, Session abgelaufen |
| `api` | HTTP 4xx/5xx von SVWS-REST |
| `validation` | Fehlende Pflichtfelder im Notenbild |
| `berechnung` | Prognose-Engine kann kein Ergebnis liefern |
| `unexpected` | Unbekannte Laufzeitfehler |

## Begründung

* Einheitliches Fehlerformat vereinfacht Debugging und Support
* Trennung von Benutzer- und Entwicklerkontext schützt vor Informationslecks
* Gleicher Ansatz wie SVWS-Import — bewährtes Muster übernommen

## Alternativen

* Verteiltes Error Handling in Komponenten → inkonsistentes Verhalten
* Kein Logging → schwer nachvollziehbar im Supportfall

## Konsequenzen

* Alle API-Calls und Berechnungen müssen Fehler an den Error-Service delegieren
* Toast-Service von PrimeVue wird in `main.ts` registriert
* `AppError` wird im `models/`-Verzeichnis definiert
