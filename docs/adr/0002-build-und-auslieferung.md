# ADR 0002: Build-Prozess und Auslieferung

## Status

Accepted

## Kontext

SVWS-Prognos soll sowohl als Desktop-Anwendung (für Schulen ohne direkten Serverzugang
im Browser) als auch als statisches Web-Bundle (für zentral gehostete Lösungen) ausgeliefert
werden. Die Anforderungen entsprechen exakt denen von SVWS-Import.

## Entscheidung

Zwei parallele Auslieferungsformen werden unterstützt:

**Web-Bundle (statisch)**
* Build über `npm run build`
* Ergebnis: statisches Bundle (`dist/`) mit `index.html` + `/assets/*.js` + `/assets/*.css`
* Deploybar auf beliebigem Webserver (Apache, Nginx) oder Dateiserver

**Desktop-App (Electron)**
* Linux: AppImage über `npm run electron:build`
* Windows: NSIS-Installer über `npm run electron:build:win`
* Electron löst das CORS-Problem des SVWS-Servers durch Header-Manipulation im Main Process

**Release-Skript**
* `npm run release` baut beide Ziele und erzeugt ein ZIP des Web-Bundles

## Begründung

* Schulen mit restriktiver IT-Umgebung können die Desktop-App ohne Serverinfrastruktur nutzen
* Das statische Web-Bundle eignet sich für zentrales Schulnetz-Hosting
* Electron ist das erprobte Mittel zur CORS-Umgehung — bereits in SVWS-Import validiert
* Keine Serverabhängigkeit: die App selbst hat kein eigenes Backend

## Alternativen

* Nur Electron → kein Browser-Zugang für zentrales Hosting
* Nur Web → CORS-Problem bei Direktzugriff auf SVWS ohne Proxy
* Serverseitiges Rendering → widerspricht dem Ziel einer serverlosen Anwendung

## Konsequenzen

* Routing muss clientseitig erfolgen (Hash-History, siehe ADR 0013)
* API-Zugriffe erfolgen direkt aus dem Browser / Electron-Prozess zum SVWS-Server
* Electron Main Process (`electron/main.cjs`) wird für CORS-Header-Handling benötigt
* Deployment erfordert keine eigene Serverinfrastruktur für die App selbst
