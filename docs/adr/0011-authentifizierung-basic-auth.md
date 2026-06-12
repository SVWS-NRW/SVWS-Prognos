# ADR 0011: Authentifizierung mit Basic Auth

## Status

Accepted

## Kontext

SVWS-Prognos greift direkt aus dem Browser oder dem Electron-Prozess auf den SVWS-Server
zu. SVWS verwendet Basic Authentication. Da die App kein eigenes Backend hat, muss der
Browser die Credentials für die Dauer der Sitzung halten.

## Entscheidung

* Benutzername und Passwort werden ausschließlich im Arbeitsspeicher gehalten
  (Pinia `authStore` — kein LocalStorage, kein SessionStorage)
* Übergabe per `Authorization: Basic {base64(user:pass)}` in jedem HTTP-Request
* Nach Abmelden wird der API-Client zerstört und der Store geleert
* Credentials werden niemals in Logs oder Fehlermeldungen ausgegeben

## Anmeldeablauf

1. Nutzer gibt Serveradresse, Schema, Benutzername und Passwort in `ConnectView` ein
2. Test-Request gegen SVWS-API prüft Gültigkeit der Credentials
3. Bei Erfolg: `authStore` hält Credentials, API-Client wird initialisiert
4. Bei Misserfolg: Fehlermeldung, keine Speicherung

## Begründung

* Minimierung des Sicherheitsrisikos: keine Persistence sensibler Daten
* Konsistenter Ansatz mit SVWS-Import — bewährte und akzeptierte Lösung
* SVWS bietet aktuell keine OAuth- oder Token-basierte Authentifizierung

## Alternativen

* LocalStorage → unsicher (XSS-Angriffsfläche)
* SessionStorage → Daten gehen bei Tab-Schluss verloren (akzeptabel, aber nicht notwendig)
* Backend-Proxy mit Token-Relay → widerspricht dem serverlosen Ziel

## Konsequenzen

* Nutzer muss Credentials bei jedem App-Start neu eingeben
* Sitzungsende bei Browser-Reload (kein automatisches Wiederanmelden)
* `.env`-Datei kann Standardwerte für Entwicklungsumgebung liefern
  (VITE_SVWS_URL, VITE_SVWS_SCHEMA, VITE_SVWS_USERNAME)
