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

# Manuelle Prognose

[← Funktionen](index.md) · [← Übersicht](../index.md)

Die **Manuelle Prognose** ist das zentrale Werkzeug für Beratungsgespräche. Sie können hier beliebige Notenkombinationen eingeben — unabhängig von einem konkreten Schüler im SVWS-System — und sofort das Prognoseergebnis sehen.

---

## Aufbau der Ansicht

Die Ansicht besteht aus zwei Bereichen:

```
┌─────────────────────────────────┬──────────────────────────┐
│  Fächer                         │  Prognose                │
│  ┌──────┬────────┬─────┬──────┐ │  ┌──────────────────────┐│
│  │Kürzel│Bezeichn│Note │Kursart│ │  │  ✓ MSA-Q             ││
│  ├──────┼────────┼─────┼──────┤ │  │  Mittlerer Schulabs. ││
│  │  D   │Deutsch │  2  │  E   │ │  │  mit Qualif.-Vermerk ││
│  │  M   │Mathem. │  3  │  E   │ │  ├──────────────────────┤│
│  │  E   │Englisch│  2  │  E   │ │  │ Berechnungsprotokoll ││
│  └──────┴────────┴─────┴──────┘ │  │  Prüfe ESA...        ││
│  [+ Fach hinzufügen] [JSON]     │  │  Prüfe MSA...        ││
└─────────────────────────────────┴──────────────────────────┘
```

**Links:** Fächertabelle mit allen eingetragenen Fächern  
**Rechts:** Das Prognoseergebnis und das Berechnungsprotokoll

---

## Einstellungen in der Kopfzeile

Bevor Sie Noten eingeben, wählen Sie in der Kopfzeile:

### Jahrgang

Wählen Sie den Jahrgang des Schülers oder der Schülerin:

- **Jahrgang 8** — Frühprognose; EESA und MSA/MSA-Q werden geprüft
- **Jahrgang 9** — Prüfung auf EESA und MSA/MSA-Q
- **Jahrgang 10** — ESA wird automatisch gewährt; MSA/MSA-Q wird geprüft
- **Kein Jahrgang** — Nur Prüfung auf MSA/MSA-Q ohne Jahrgangsbeschränkung

### Schulform

Wählen Sie die Schulform:

- **Gesamtschule**
- **Sekundarschule**
- **Primusschule**

---

## Fächer eingeben

### Fach hinzufügen

Klicken Sie auf **„+ Fach hinzufügen"**, um eine neue Zeile in der Tabelle zu erstellen. Füllen Sie dann die Felder aus:

| Feld | Inhalt | Beispiel |
|---|---|---|
| **Kürzel** | Fachkürzel laut SVWS (Großbuchstaben) | `D`, `M`, `E`, `BI`, `WP1` |
| **Bezeichnung** | Optionaler Klartextname | `Deutsch`, `Mathematik` |
| **Note** | Schulnote 1–6 | `3` |
| **Kursart** | Kurstyp des Faches | E-Kurs, G-Kurs oder Sonstige |
| **FS** | Fremdsprache (Häkchen) | Für Zusatzfremdsprachen wie Französisch, Spanisch |

### Fachkürzel

SVWS-Prognos erkennt die Standard-Fachkürzel aus dem SVWS-System:

| Kürzel | Fach |
|---|---|
| `D` | Deutsch |
| `M` | Mathematik |
| `E` | Englisch |
| `BI` | Biologie |
| `CH` | Chemie |
| `PH` | Physik |
| `GE` | Geschichte |
| `EK` | Erdkunde |
| `RE`, `ER`, `KR`, `IF`, `PA` | Religion / Ethik |
| `SP`, `MU`, `KU`, `TE` | Sport, Musik, Kunst, Textil |
| `WP1`, `WP2` | Wahlpflichtunterricht (wird intern zu `WPU` normiert) |
| `LBAL` | Lernbereichsarbeit |

> **Hinweis:** Fächer mit den Kürzeln `LBAL`, `AT`, `AH`, `AW` und `PK` werden von der Prognoseberechnung ignoriert.

### Kursarten

| Kursart | Bedeutung |
|---|---|
| **E-Kurs** | Erweiterungskurs — höheres Anforderungsniveau |
| **G-Kurs** | Grundkurs — grundlegendes Anforderungsniveau |
| **Sonstige** | Alle anderen Fächer (Sport, Musik, Religion …) |

### Fremdsprache (FS)

Aktivieren Sie die **FS-Checkbox** für Fächer, die eine Fremdsprache sind und als *Zusatzfremdsprache* gelten sollen — also alle Fremdsprachen außer Englisch. Beispiele: Französisch (`F`), Spanisch (`S`), Latein (`L`).

> Englisch (`E`) ist grundsätzlich keine Zusatzfremdsprache, auch wenn die FS-Checkbox aktiv ist.

Zusatzfremdsprachen werden bei der ESA- und EESA-Berechnung ignoriert, fließen jedoch in die MSA-Berechnung ein.

---

## Standardfächer

Beim Öffnen der Manuellen Prognose sind typische Fächer einer Gesamtschule bereits vorausgefüllt (Deutsch, Mathematik, Englisch, etc.). Sie können diese überschreiben oder weitere Fächer hinzufügen.

---

## JSON importieren

Sie können eine vorbereitete Notenliste im JSON-Format importieren. Klicken Sie auf **„JSON laden"** und wählen Sie eine `.json`-Datei aus.

Das unterstützte Format:

```json
{
  "input": {
    "jahrgang": "10",
    "faecher": [
      { "kuerzel": "D",  "note": 2, "kursart": "E" },
      { "kuerzel": "M",  "note": 3, "kursart": "E" },
      { "kuerzel": "E",  "note": 2, "kursart": "E" },
      { "kuerzel": "BI", "note": 4, "kursart": "G" }
    ]
  }
}
```

Jahrgang und Schulform aus der JSON-Datei werden automatisch übernommen, sofern vorhanden.

---

## Testfall exportieren

Haben Sie ein Ergebnis berechnet, können Sie die aktuelle Eingabe über **„Testfall exportieren"** als JSON-Datei speichern. Diese Datei enthält Fächer, Jahrgang und Schulform und kann später erneut importiert werden.

---

## Fächer entfernen / zurücksetzen

Der Button **„Entfernen"** setzt die Fächertabelle auf die Standardfächer zurück. Einzelne Zeilen entfernen Sie über das **✕**-Symbol am Ende jeder Zeile.

---

## Das Prognoseergebnis lesen

Sobald alle Fächer eingetragen sind, berechnet die App automatisch das Ergebnis im rechten Panel.

### Ergebnis-Badge

Oben im rechten Panel erscheint ein farbiger Badge mit dem Abschluss:

| Farbe | Prognose |
|---|---|
| 🔴 Rot | OA — Ohne Abschluss |
| 🟠 Orange | EESA — Erweiterter Erster Schulabschluss |
| 🟡 Gelb | ESA — Erster Schulabschluss |
| 🔵 Blau | MSA — Mittlerer Schulabschluss |
| 🟢 Grün | MSA-Q — Mittlerer Schulabschluss mit Qualifikationsvermerk |

### Berechnungsprotokoll

Unterhalb des Badges sehen Sie das **Berechnungsprotokoll** — eine schrittweise Erläuterung, wie die App zum Ergebnis gelangt ist. Die Zeichen helfen beim Lesen:

| Symbol | Bedeutung |
|---|---|
| `✓` | Bedingung erfüllt |
| `✗` | Bedingung nicht erfüllt |
| `⚠` | Hinweis / Warnung |
| `──` | Abschnitt / Trennlinie |

Das Protokoll zeigt u. a.:
- Welche Fächergruppen gebildet wurden
- Ob Defizite vorhanden sind und ob sie ausgeglichen werden
- Warum ein bestimmter Abschluss erreicht oder verfehlt wird

---

## Abschlüsse im Detail

Eine Erklärung der einzelnen Abschlüsse (OA, EESA, ESA, MSA, MSA-Q) finden Sie auf der Seite:

→ [Schulabschlüsse verstehen](../abschluesse.md)

---

[← Zurück zur Übersicht](../index.md)
