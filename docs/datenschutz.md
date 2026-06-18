# Datenschutzhinweise

## 1. Keine Daten ohne Nutzeraktion

SVWS-Prognos sendet Daten nur dann an einen Server, wenn Sie sich ausdrücklich mit dem SVWS-Server Ihrer Schule verbinden.

- Die Verbindung zum SVWS-Server wird ausschließlich auf Ihren expliziten Abruf hin hergestellt.
- In der **Manuellen Prognose** werden keinerlei Daten übertragen — alle Berechnungen laufen vollständig lokal.

## 2. Keine Speicherung von Zugangsdaten

Benutzername und Passwort werden ausschließlich temporär im Arbeitsspeicher gehalten.

- Es werden **keine** Zugangsdaten in `localStorage`, `sessionStorage`, Cookies oder Dateien gespeichert.
- Nach dem Beenden der App oder einem Seiten-Reload sind alle Zugangsdaten unwiderruflich gelöscht.
- SVWS-Prognos schreibt **keine** Credentials auf die Festplatte.

## 3. Schutz der Schülerdaten

- SVWS-Prognos liest Noten- und Schülerdaten aus dem SVWS-Server — es werden in der aktuellen Version **keine** Daten zurückgeschrieben.
- Alle geladenen Daten verbleiben ausschließlich im Arbeitsspeicher Ihres Geräts.
- Nach dem Schließen der App gehen alle geladenen Daten unwiderruflich verloren.

## 4. Datenhaltung

- Kein Tracking, keine Cookies, keine Drittserver.
- Die Prognoseberechnung erfolgt vollständig clientseitig — es wird kein eigenes Backend betrieben.
- Theme-Einstellung (Hell/Dunkel) wird im `localStorage` gespeichert — ohne Bezug zu Schüler- oder Zugangsdaten.

## 5. Empfehlungen für Lehrkräfte

- Arbeiten Sie nach Möglichkeit über eine verschlüsselte `https://`-Verbindung.
- Schließen Sie die App nach Abschluss Ihrer Arbeit.
- Geben Sie Ihren SVWS-Zugang nicht an unbefugte Personen weiter.
