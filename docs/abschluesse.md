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

# Schulabschlüsse verstehen

[← Übersicht](index.md)

SVWS-Prognos berechnet die Abschlussprognose nach der **APO-SI20** — der Ausbildungsordnung Sekundarstufe I für Nordrhein-Westfalen, gültig ab dem 01.08.2020.

Die App zeigt für jeden Schüler und jede Schülerin eine der folgenden Prognosen an:

---

## Übersicht der Abschlüsse

| Kürzel | Vollständige Bezeichnung | Stufe |
|---|---|---|
| **OA** | Ohne Abschluss | — |
| **EESA** | Erweiterter Erster Schulabschluss | Hauptschulabschluss nach Kl. 9 |
| **ESA** | Erster Schulabschluss | Hauptschulabschluss nach Kl. 10 |
| **MSA** | Mittlerer Schulabschluss | Fachoberschulreife |
| **MSA-Q** | Mittlerer Schulabschluss mit Qualifikationsvermerk | FOR + Q-Vermerk |

Die Prognose gibt an, welchen Abschluss der Schüler oder die Schülerin **voraussichtlich** erreichen wird, wenn sich die Leistungen bis zum Ende des Schuljahres nicht wesentlich ändern.

---

## OA — Ohne Abschluss

Die berechneten Noten erfüllen derzeit **keine** der Abschlussbedingungen. Der Schüler oder die Schülerin erhält voraussichtlich kein Abschlusszeugnis.

> Dies ist ein Warnsignal, das frühzeitig pädagogische Unterstützung und Beratung anstoßen sollte.

---

## EESA — Erweiterter Erster Schulabschluss

Der **Erweiterte Erste Schulabschluss** (früher: Hauptschulabschluss nach Klasse 9) wird nach Jahrgang 9 erteilt, wenn bestimmte Mindestleistungen in den Kernfächern erbracht werden.

**Bedingungen (vereinfacht):**
- Bestimmte Kernfächer (Deutsch, Mathematik, Englisch, WPU) müssen ausreichend (Note 4) sein
- Es wird eine Fächergruppe gebildet; Defizite können unter Umständen ausgeglichen werden
- Naturwissenschaften (Biologie, Chemie, Physik) werden bei EESA **nicht** berücksichtigt

SVWS-Prognos prüft EESA immer, unabhängig davon, ob bereits ein höherer Abschluss erreichbar ist.

---

## ESA — Erster Schulabschluss

Der **Erste Schulabschluss** (früher: Hauptschulabschluss nach Klasse 10) wird nach Jahrgang 10 erteilt.

**Besonderheit:** In Jahrgang 10 wird ESA gemäß APO-SI20 §40 Abs. 3 automatisch gewährt, wenn der Schüler die Schule verlässt — unabhängig von den konkreten Noten. SVWS-Prognos berücksichtigt dies entsprechend.

In Jahrgang 8 und 9 prüft die App, ob ESA **bereits jetzt** erreicht wäre (Hochrechnung).

---

## MSA — Mittlerer Schulabschluss

Der **Mittlere Schulabschluss** entspricht der Fachoberschulreife und ist der Regelabschluss nach der Sekundarstufe I.

**Bedingungen (vereinfacht):**
- Alle Fächer müssen mindestens ausreichend (Note 4) sein — oder Defizite werden durch bessere Noten ausgeglichen
- Es wird ein Fach der Naturwissenschaften als **FLD-NW** (Fach mit Lehrplanorientierung in Naturwissenschaften) herangezogen
- Maximal 2 Fächer mit E-Kurs (Erweiterungskurs) sind erlaubt; weitere E-Kurse werden wie G-Kurse gewertet, jedoch eine Note schlechter

**Kursarten:**
- **E-Kurs** (Erweiterungskurs) — höheres Anforderungsniveau
- **G-Kurs** (Grundkurs) — grundlegendes Anforderungsniveau

---

## MSA-Q — Mittlerer Schulabschluss mit Qualifikationsvermerk

Der Qualifikationsvermerk berechtigt zum Besuch der gymnasialen Oberstufe.

**Strengere Bedingungen im Vergleich zu MSA:**
- Bis zu 3 E-Kurs-Fächer werden berücksichtigt
- Notenschwellen sind höher: E-Kurse müssen mindestens befriedigend (Note 3), G-Kurse mindestens ausreichend (Note 4) sein, um nicht als Defizit zu gelten
- Ausgleichsregelung: Anders als beim MSA können beim MSA-Q zwei Fächergruppen gleichzeitig ausgleichen

---

## Das Berechnungsprotokoll

Die [Manuelle Prognose](funktionen/manuelle-prognose.md) zeigt neben dem Ergebnis immer ein detailliertes **Berechnungsprotokoll**. Dort sehen Sie Schritt für Schritt, wie die App zur Prognose gelangt ist:

- Welche Fächer welcher Fächergruppe zugeordnet wurden
- Ob und wie Defizite ausgeglichen wurden
- Warum ein Abschluss erreicht wurde oder nicht

Das Protokoll ist besonders hilfreich bei der Schülerberatung, um die Prognose zu erläutern.

---

## Hinweis zur Verbindlichkeit

> SVWS-Prognos ist eine **Beratungshilfe**. Die berechneten Prognosen beruhen auf den aktuell im SVWS-System gespeicherten Noten und der Interpretation der APO-SI20. Sie ersetzen **keine** verbindliche schulrechtliche Entscheidung und keine individuelle pädagogische Beurteilung durch die Lehrkraft oder Schulleitung.

---

[← Zurück zur Übersicht](index.md)
