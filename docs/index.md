<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="52" viewBox="0 0 220 52" role="img" aria-label="SVWS Prognos">
  <rect width="52" height="52" rx="12" fill="#059669"/>
  <rect x="11" y="32" width="8" height="12" rx="2" fill="white" opacity="0.75"/>
  <rect x="22" y="22" width="8" height="22" rx="2" fill="white" opacity="0.88"/>
  <rect x="33" y="12" width="8" height="32" rx="2" fill="white"/>
  <text x="64" y="22" font-family="system-ui,-apple-system,sans-serif" font-size="16" font-weight="700" fill="#111827">SVWS Prognos</text>
  <text x="64" y="38" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="#6b7280">Abschlussprognose · NRW Sek. I</text>
</svg>
</div>

---

# Anwenderhandbuch

Willkommen beim Anwenderhandbuch für **SVWS-Prognos** — dem Werkzeug zur automatischen Berechnung von Schulabschlussprognosen an Gesamtschulen, Sekundarschulen und Primusschulen in Nordrhein-Westfalen.

Die App liest Noten und Lernabschnittsdaten direkt aus Ihrem **SVWS-Server** und berechnet vollständig automatisch, welchen Schulabschluss ein Schüler oder eine Schülerin voraussichtlich erreichen wird — gemäß **APO-SI20** (Ausbildungsordnung Sek. I, gültig ab 01.08.2020).

---

## Inhaltsverzeichnis

| Kapitel | Inhalt |
|---|---|
| [Installation](installation.md) | Download, Setup unter Windows und Linux, Web-Betrieb |
| [Verbindung zum SVWS-Server](verbindung.md) | Server-URL, Schema, Anmeldedaten, Fehlerdiagnose |
| **Funktionen** | |
| [Dashboard](funktionen/dashboard.md) | Startseite, Kacheln, Schuldaten, Abmelden |
| [Jahrgangsprognose](funktionen/jahrgangsanalyse.md) | Jahrgang 8 / 9 / 10, Klassenauswahl, Schülerübersicht |
| [Manuelle Prognose](funktionen/manuelle-prognose.md) | Noten manuell eingeben, JSON-Import/-Export, Ergebnis lesen |
| [Schulabschlüsse verstehen](abschluesse.md) | OA, EESA, ESA, MSA, MSA-Q — was bedeutet das? |
| [Hilfe & Problemlösung](hilfe.md) | Häufige Fehler, Verbindungsprobleme, FAQ |

---

## Schnellstart

1. **App starten** — [Installation](installation.md) und Programmstart
2. **Verbinden** — Server-URL, Schema und Zugangsdaten eingeben → [Verbindung](verbindung.md)
3. **Jahrgang wählen** — Jahrgang 8, 9 oder 10 auf dem Dashboard auswählen
4. **Prognosen ansehen** — Schülerprognosen anzeigen lassen
5. **Manuell testen** — Über „Manuelle Prognose" beliebige Notenkombinationen prüfen → [Anleitung](funktionen/manuelle-prognose.md)

---

## Unterstützte Schulformen

SVWS-Prognos unterstützt folgende Schulformen in NRW:

- **Gesamtschule** (GE)
- **Sekundarschule** (SK)
- **Primusschule**

Die Prognoseberechnung erfolgt nach **APO-SI20**, gültig ab dem Schuljahr 2020/21.

---

## Über diese Dokumentation

Diese Dokumentation richtet sich an Lehrerinnen und Lehrer sowie Koordinatorinnen und Koordinatoren, die SVWS-Prognos an ihrer Schule einsetzen. Für technische Hintergründe und Architekturentscheidungen siehe das [Entwicklerverzeichnis](adr/).

> **Hinweis:** SVWS-Prognos ist eine Beratungshilfe. Die Ergebnisse ersetzen keine individuelle pädagogische Beurteilung und keine verbindliche schulrechtliche Entscheidung.
