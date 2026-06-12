# ADR 0004: Integration mit SVWS-Server über REST API

## Status

Accepted

## Kontext

SVWS-Prognos muss auf Schülerdaten, Notenbilder und Kursinformationen des SVWS-Servers
zugreifen. Für die Abschlussprognose werden Noten aus mehreren Schuljahresabschnitten
gelesen; berechnete Ergebnisse werden zurückgeschrieben.

Referenz SVWS-Server: https://github.com/SVWS-NRW/SVWS-Server

## Entscheidung

* Kommunikation erfolgt ausschließlich über die REST API des SVWS-Servers
* Authentifizierung via Basic Auth (siehe ADR 0011)
* Direkte Kommunikation vom Browser / Electron-Prozess zum Server (kein eigener Proxy)
* CORS wird im Electron-Modus durch Header-Manipulation im Main Process umgangen

## Genutzte API-Bereiche

**Lesend:**
* `/db/{schema}/schuljahresabschnitte/` — Schuljahre und Abschnitte
* `/db/{schema}/klassen/` — Klassen und Jahrgänge
* `/db/{schema}/schueler/` — Schülerstammdaten
* `/db/{schema}/schueler/{id}/lernabschnitte/` — Lernabschnittsdaten mit Noten
* `/db/{schema}/faecher/` — Fächerkatalog

**Schreibend:**
* Endpunkte für Prognosefelder werden bei Verfügbarkeit in der SVWS-API genutzt
* Bis zur Verfügbarkeit: Notizen oder benutzerdefinierte Felder als Zwischenlösung

## Begründung

* SVWS stellt eine vollständige REST-Schnittstelle bereit
* Kein zusätzlicher Middleware-Layer erforderlich
* Gleicher Ansatz wie in SVWS-Import, bereits erprobt und validiert

## Alternativen

* Proxy-Backend → erhöht Komplexität, widerspricht dem serverlosen Ziel
* GraphQL → SVWS bietet keine GraphQL-Schnittstelle
* Direktzugriff auf Datenbank → nicht möglich, unsicher, nicht unterstützt

## Konsequenzen

* CORS-Konfiguration am SVWS-Server oder Electron-Workaround notwendig
* Fehlerhandling bei Netzwerkproblemen und 4xx/5xx-Antworten erforderlich
* Axios-Instanz mit Interceptors kapselt Authentifizierung und Fehlerbehandlung
* Timeouts für langsame SVWS-Instanzen (große Schulen) einplanen
