<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="52" viewBox="0 0 220 52" role="img" aria-label="SVWS Prognos">
  <defs>
    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A2E5A"/>
      <stop offset="100%" stop-color="#2D5FA6"/>
    </linearGradient>
    <linearGradient id="gd" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F7B32B"/>
      <stop offset="100%" stop-color="#F28F3B"/>
    </linearGradient>
  </defs>
  <rect width="52" height="52" rx="12" fill="url(#hg)"/>
  <rect x="10" y="36" width="6" height="8"  rx="1.5" fill="white" fill-opacity="0.40"/>
  <rect x="19" y="28" width="6" height="16" rx="1.5" fill="white" fill-opacity="0.40"/>
  <rect x="28" y="18" width="6" height="26" rx="1.5" fill="white" fill-opacity="0.40"/>
  <polyline points="13,40 22,32 31,22 39,13" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="39" cy="13" r="4.5" fill="url(#gd)"/>
  <circle cx="39" cy="13" r="2"   fill="white"/>
  <text x="64" y="22" font-family="system-ui,-apple-system,sans-serif" font-size="16" font-weight="700" fill="#111827">SVWS Prognos</text>
  <text x="64" y="38" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="#6b7280">Abschlussprognose · NRW Sek. I</text>
</svg>
</div>

---

# Dashboard

[← Funktionen](index.md) · [← Übersicht](../index.md)

Das Dashboard ist die Startseite nach dem erfolgreichen Verbinden mit dem SVWS-Server. Von hier aus erreichen Sie alle Funktionen der App.

---

## Aufbau des Dashboards

Das Dashboard zeigt sechs Kacheln:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│       8         │  │       9         │  │      10         │
│  Jahrgang 8     │  │  Jahrgang 9     │  │  Jahrgang 10    │
│  Schülerprognos.│  │  Schülerprognos.│  │  Schülerprognos.│
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  ✏ Manuelle     │  │  📊 Auswertungen│  │  🏫 Schuldaten  │
│  Prognose       │  │  (folgt)        │  │  Schema: ...    │
│  JSON importier.│  │                 │  │  Server: ...    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Jahrgangs-Kacheln (8 / 9 / 10)

Ein Klick auf eine der drei Jahrgangs-Kacheln öffnet die **Schülerübersicht** für diesen Jahrgang. Dort sehen Sie alle Klassen und Schülerinnen und Schüler aus Ihrem SVWS-System für den aktuellen Schuljahresabschnitt.

→ Mehr dazu: [Jahrgangsprognose](jahrgangsanalyse.md)

---

## Manuelle Prognose

Die Kachel **„Manuelle Prognose"** öffnet ein Eingabeformular, in das Sie Noten ohne Verbindung zu einem bestimmten Schüler eingeben können. Dies ist nützlich für:

- Schnelle „Was-wäre-wenn"-Szenarien bei Beratungsgesprächen
- Überprüfung von Notenkombinationen
- Import von JSON-Testfällen

→ Mehr dazu: [Manuelle Prognose](manuelle-prognose.md)

---

## Auswertungen

Die Kachel **„Auswertungen"** bietet Statistiken und Übersichten über Prognosen im Jahrgang. Diese Funktion befindet sich in Entwicklung.

---

## Schuldaten-Kachel (Info)

Die Kachel **„Schuldaten"** ist keine Navigation, sondern zeigt Ihnen die aktuell verbundene Instanz:

| Feld | Beschreibung |
|---|---|
| **Schema** | Der Datenbank-Mandant (Schulname) |
| **Server** | Die URL des verbundenen SVWS-Servers |
| **Benutzer** | Ihr angemeldeter Benutzername |
| **Abschnitt** | Der aktuell gewählte Schuljahresabschnitt (z. B. „2024/25 · 2. Halbjahr") |

---

## Hell- und Dunkelmodus

Oben rechts im Dashboard befindet sich der **Theme-Umschalter**. Er wechselt zwischen drei Modi:

- **System** — übernimmt die Einstellung des Betriebssystems
- **Hell** — heller Hintergrund
- **Dunkel** — dunkler Hintergrund

Die Einstellung wird gespeichert und beim nächsten Start der App wiederhergestellt.

---

## Abmelden

Über den Button **„Abmelden"** oben rechts trennen Sie die Verbindung zum SVWS-Server und kehren zum Verbindungsformular zurück. Alle Daten und Zugangsdaten werden aus dem Speicher gelöscht.

---

[← Zurück zur Übersicht](../index.md)
