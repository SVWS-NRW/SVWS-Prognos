# ADR 0003: Datenabruf aus SVWS und Rückschreibung von Prognosedaten

## Status

Accepted

## Kontext

SVWS-Prognos liest Notenbilder (Noten, Kurse, Schuljahresabschnitte) aus dem SVWS-Server
aus und berechnet daraus Abschlussprognosen. Im Gegensatz zu SVWS-Import, das externe
Dateien in SVWS hochlädt, arbeitet SVWS-Prognos bidirektional mit der SVWS-API:

* **Lesen:** Schülerdaten, Kurse, Noten, Schuljahresabschnitte, Klassen
* **Berechnen:** Abschlussprognose lokal im Browser (keine eigene Backend-Logik)
* **Schreiben:** Berechnete Prognosen oder Bestätigungsvermerke zurück in SVWS

Die Verarbeitungslogik verbleibt vollständig im Client.

## Entscheidung

* Alle Datenabrufe erfolgen als REST-GET-Requests gegen den SVWS-Server
* Die Prognoseberechnung erfolgt ausschließlich clientseitig im Browser (siehe ADR 0016)
* Berechnete Prognosen werden optional per REST-PUT/-POST zurück in SVWS geschrieben
* Sensible Daten (Schülernoten) verlassen den SVWS-Server nur in Richtung des Browsers des
  angemeldeten Benutzers — kein Zwischenserver

## Begründung

* Clientseitige Berechnung entspricht dem etablierten Muster aus SVWS-Import
* Keine Notwendigkeit eines eigenen Prognose-Backends
* Volle Transparenz: Die Berechnungslogik ist im Quellcode einsehbar und nachvollziehbar
* Rückschreibung per REST hält die Datenhaltung zentral in SVWS

## Alternativen

* Serverseitige Prognoseberechnung → erfordert eigenes Backend, widerspricht dem Ziel
* Nur lesen, keine Rückschreibung → Prognosen wären flüchtig, nicht in SVWS nachvollziehbar
* Dateisystem-Export statt Rückschreibung → für Schulen mit SVWS-Integration nicht sinnvoll

## Konsequenzen

* SVWS-API muss Lese- und Schreibzugriff auf Prognosefelder bieten
* Fehlerhandling für beide Richtungen (Lesefehler, Schreibkonflikte) notwendig
* Clientseitige Validierung vor dem Schreiben reduziert fehlerhafte API-Calls
* Speicherverbrauch im Browser bei großen Schulen (viele Schüler, viele Noten) beachten
