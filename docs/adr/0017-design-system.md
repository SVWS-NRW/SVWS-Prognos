# ADR 0017: Einheitliches Design-System für SVWS-Apps

## Status

Accepted

## Kontext

SVWS-Prognos ist Teil einer wachsenden Familie eigenständiger SVWS-SPAs (u.a. SVWS-Import).
Um ein einheitliches Erscheinungsbild zu gewährleisten und Inkonsistenzen durch
undokumentierte PrimeVue-Interna zu vermeiden, legt dieses ADR das verbindliche
Design-System fest.

Bei der Entwicklung der SVWS-App-Familie wurden mehrere kritische Fehlannahmen zu
PrimeVue 4 / Aura aufgedeckt, die hier dokumentiert werden, damit sie in SVWS-Prognos
von Anfang an vermieden werden.

## Entscheidung

Das Design-System basiert auf der **Emerald-Farbpalette** als Primärfarbe und verwendet
ausschließlich explizit definierte CSS Custom Properties — keine Abhängigkeit von
PrimeVue-internen Tokens.

---

## Kritische Erkenntnisse zu PrimeVue 4 (Aura-Theme)

### Primärfarbe ist Emerald, nicht Blau
PrimeVue Aura verwendet standardmäßig **Emerald** als Primary-Farbe — nicht Blau.
Ermittelbar über:
```
node_modules/@primeuix/themes/dist/aura/base/index.mjs
```
- Light: `#059669` (Emerald-600)
- Dark: `#34d399` (Emerald-400)

### `--p-surface-ground` existiert nicht
PrimeVue 4 generiert **keine** Legacy-Variablen wie `--p-surface-ground` oder
`--p-surface-card`. Nur numerische Stufen (`--p-surface-50` bis `--p-surface-950`)
werden erzeugt. Wer diese Variablen nutzt, erhält `transparent`/`undefined`.

**Konsequenz:** Hintergrundfarben immer selbst explizit definieren.

---

## Farbpalette

### Light Mode
| Token | Wert | Verwendung |
|---|---|---|
| `--accent` | `#059669` | Primäre Akzentfarbe (Emerald-600) |
| `--accent-hover` | `#047857` | Hover-Zustand |
| `--bg-a` / `--bg-b` | `#edfbf4` / `#f0fdf9` | Hintergrund-Gradient |
| `--surface` | `#ffffff` | Karten, Modals |
| `--app-bg` | `#f8fafc` | App-Hintergrund (Slate-50) |
| `--app-accent` | `#059669` | Akzentfarbe in App-Komponenten |
| `--app-ink` | `#1e293b` | Primärer Text |
| `--app-border` | `#cbd5e1` | Rahmen |

### Dark Mode
| Token | Wert | Verwendung |
|---|---|---|
| `--accent` | `#34d399` | Primäre Akzentfarbe (Emerald-400) |
| `--bg-a` / `--bg-b` | `#091c19` / `#0c1a14` | Hintergrund-Gradient |
| `--surface` | `#142b25` | Karten, Modals (Emerald-getönt) |
| `--app-bg` | `#0d201c` | App-Hintergrund |
| `--app-accent` | `#34d399` | Akzentfarbe |
| `--app-ink` | `#f1f5f9` | Primärer Text |
| `--app-border` | `#2a4040` | Rahmen |

### Prognos-spezifische Tokens (fachliche Bedeutung)
Diese Tokens sind bewusst **nicht** in das einheitliche Emerald-System überführt,
da sie fachliche Semantik tragen:

| Token | Verwendung |
|---|---|
| `--n1` … `--n6` | Notenfarben (1 = grün, 6 = rot) + Dark-Varianten |
| `--nf-gut / --nf-ok / --nf-warn / --nf-bad` | Ampelfarben für Notenqualität |
| `--abschluss-sicher` | Farbe für sicher erreichbaren Abschluss |
| `--abschluss-unsicher` | Farbe für grenzwertigen Abschluss |
| `--abschluss-nicht` | Farbe für nicht erreichbaren Abschluss |

### Hintergrund-Gradient (Body)
```css
body {
  background:
    radial-gradient(circle at 10% 20%, rgba(5, 150, 105, 0.10), transparent 38%),
    radial-gradient(circle at 90% 15%, rgba(15, 143, 143, 0.10), transparent 30%),
    linear-gradient(140deg, var(--bg-a), var(--bg-b));
}
```

---

## Dark-Mode-Implementierung

Dark Mode wird über die CSS-Klasse `dark` auf `<html>` gesteuert:
```css
:root { /* Light-Variablen */ }
:root.dark { /* Dark-Variablen */ }
```

Theme-Präferenz (`'light' | 'dark' | 'system'`) wird in `localStorage` unter dem
Schlüssel `dark-mode` gespeichert — identisch mit allen anderen SVWS-Apps, damit
die Einstellung app-übergreifend synchronisiert bleibt.

```typescript
// composables/useTheme.ts
const STORAGE_KEY = 'dark-mode'
```

---

## Implementierungs-Checkliste für neue Komponenten

### 1. CSS Custom Properties
Die vollständige Tokenliste aus `src/style.css` (`:root` und `:root.dark`) als
Ausgangsbasis verwenden. Prognos-spezifische Tokens mit `--prog-`-Prefix anlegen.

### 2. Dark-Mode-Composable einbinden
```typescript
// main.ts
import { initTheme } from './composables/useTheme'
initTheme()
```

### 3. Body-Gradient setzen
Den Emerald-Hintergrund-Gradient auf `body` anwenden. Im Dark Mode wird derselbe
Gradient über die `:root.dark`-Variablen automatisch angepasst.

### 4. PrimeVue-Buttons auf Emerald umstellen
```css
:root {
  --p-primary-color: #059669;
  --p-primary-hover-color: #047857;
}
:root.dark {
  --p-primary-color: #34d399;
  --p-primary-hover-color: #6ee7b7;
}
```

### 5. Native Input-Spinbuttons vermeiden
`input[type=number]`-Spinbuttons lassen sich per `accent-color` nicht zuverlässig
färben. Stattdessen native Pfeile ausblenden:
```css
input[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
  display: none;
}
```

---

## WCAG-Kontrast

Alle Vordergrund-/Hintergrundkombinationen sind auf WCAG AA zu prüfen:
- Normaler Text (< 18px): Kontrast ≥ 4.5:1
- Großer Text / UI-Elemente: Kontrast ≥ 3:1
- Emerald-600 (`#059669`) auf Weiß erreicht 4.54:1 — knapp ausreichend

## Begründung

* Einheitliches Erscheinungsbild aller SVWS-Apps ohne gemeinsame Komponentenbibliothek
* Vollständige Kontrolle über alle Farben — keine Abhängigkeit von undokumentierten
  PrimeVue-Interna
* Dark Mode und Light Mode durch eine einzige Variable (`dark`-Klasse) schaltbar
* Shared `localStorage`-Key synchronisiert Theme-Wahl über alle SVWS-Apps

## Alternativen

* PrimeVue-Theme-Variablen direkt nutzen → bricht bei PrimeVue-Updates
* Eigene Komponentenbibliothek → zu hoher Aufwand für die Projektgröße

## Konsequenzen

* CSS-Tokenliste muss manuell zwischen SVWS-Apps konsistent gehalten werden
* Keine automatische Übernahme von PrimeVue-Theme-Updates
* Prognos-spezifische Farbsemantik (Noten, Abschlüsse) wird in `style.css` ergänzt
