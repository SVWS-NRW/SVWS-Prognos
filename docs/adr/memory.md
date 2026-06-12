# SVWS-Prognos — Projekt-Memory für neue Sessions

> Diese Datei ersetzt nicht die ADRs, sondern bietet einen schnellen Einstieg.
> Bitte nach jeder größeren Änderung aktualisieren.

---

## Was ist dieses Projekt?

**SVWS-Prognos** ist eine Vue 3 Single-Page-Application (+ Electron-Wrapper) für
Gesamtschulen, Sekundarschulen und Primusschulen in NRW. Die App berechnet automatisch,
welchen Schulabschluss ein Schüler voraussichtlich erreichen wird — gemäß der
**APO-SI20** (Ausbildungsordnung Sek. I, gültig ab 01.08.2020).

Sie verbindet sich direkt mit dem **SVWS-Server** der Schule (NRW-Schulverwaltungssoftware)
und liest Noten-/Lernabschnittsdaten per REST-API. Die Berechnung läuft vollständig
clientseitig — kein eigenes Backend.

---

## ⚠️ Sicherheits-Constraints (absolut einzuhalten)

| Regel | Details |
|---|---|
| **Credentials nur im RAM** | Benutzername + Passwort ausschließlich im Pinia-`authStore`. KEIN localStorage, KEIN sessionStorage. |
| **`delphiSrc/` niemals einchecken** | Enthält alten proprietären Delphi-Quellcode. Steht in `.gitignore`. |
| **`test-json/` niemals einchecken** | Enthält Schülerdaten als Testfälle. Steht in `.gitignore`. |
| **Credentials nie loggen** | Weder in Konsole noch in Fehlermeldungen. |

---

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | Vue 3 (`<script setup>`, Composition API) |
| Sprache | TypeScript 5.7 |
| UI-Komponenten | PrimeVue 4 (Aura-Preset) + PrimeIcons |
| State Management | Pinia |
| Routing | Vue Router 4 (Hash-History, wegen Electron) |
| HTTP | Axios |
| Build | Vite 6 |
| Tests | Vitest 3 |
| Desktop | Electron 42 (main: `electron/main.cjs`) |
| Design-System | Eigenes Emerald-Token-Set (ADR 0017, `src/style.css`) |

---

## Projektstruktur

```
src/
├── main.ts                  # App-Einstiegspunkt, PrimeVue-Config, initTheme()
├── App.vue                  # Nur Toast + RouterView
├── style.css                # Design-Tokens (Light + Dark)
├── components/
│   └── ThemeToggle.vue      # Floating-Button: System/Hell/Dunkel
├── composables/
│   └── useTheme.ts          # Theme-State (preference: Ref<'system'|'light'|'dark'>)
├── models/                  # Reine TypeScript-Interfaces, kein State
│   ├── AppError.ts
│   ├── Lernabschnitt.ts     # NotenbildSchueler, Lernabschnitt, Leistung
│   ├── PrognoseErgebnis.ts  # AbschlussTyp, PrognoseErgebnis, PrognoseHinweis
│   └── Schueler.ts          # Schueler, Klasse, Schuljahresabschnitt
├── rules/                   # Prognose-Engine (APO-SI20)
│   ├── types.ts             # EingabeFach, RegelwerkInput, RegelwerkErgebnis
│   ├── apoSI20.ts           # Vollständige APO-SI20-Implementierung
│   ├── apoSI20.test.ts      # 78 Testfälle gegen test-json/
│   └── index.ts             # berechnePrognose() — öffentlicher Einstiegspunkt
├── router/index.ts          # Hash-History, Auth-Guard
├── services/
│   ├── apiClient.ts         # Axios-Client (Basic Auth, Electron-/Browser-Proxy)
│   ├── svwsService.ts       # SVWS-REST-Endpunkte (viele noch TODO)
│   └── errorService.ts      # toAppError(), useErrorService()
├── stores/
│   ├── auth.ts              # baseUrl, schema, username, isConnected
│   ├── prognose.ts          # notenbilder (Map), ergebnisse (Map)
│   ├── schueler.ts          # klassen[], schueler[]
│   └── schuljahresabschnitt.ts
└── views/
    ├── ConnectView.vue       # Login-Formular → authStore.connect()
    ├── DashboardView.vue     # 6 Kacheln: Jg8/9/10, Manuell, Auswertungen, Schuldaten
    ├── ManuellePrognoseView.vue  # ⭐ Hauptfeature, voll implementiert
    ├── SchuelerauswahlView.vue   # Jahrgang-Filter + Klassenliste (Stub)
    ├── AuswertungenView.vue      # Platzhalter
    ├── NotenbildView.vue         # Platzhalter
    ├── PrognoseView.vue          # Platzhalter
    └── EinstellungenView.vue     # Platzhalter
```

---

## Routen

| Name | Pfad | View | Auth |
|---|---|---|---|
| `connect` | `/connect` | ConnectView | Nein |
| `dashboard` | `/` | DashboardView | Ja |
| `jahrgang` | `/jahrgang/:jg` | SchuelerauswahlView | Ja |
| `manuell` | `/manuell` | ManuellePrognoseView | Ja |
| `auswertungen` | `/auswertungen` | AuswertungenView | Ja |
| `notenbilder` | `/schueler/:id/notenbilder` | NotenbildView | Ja |
| `prognose` | `/schueler/:id/prognose` | PrognoseView | Ja |
| `einstellungen` | `/einstellungen` | EinstellungenView | Ja |

---

## Prognose-Engine (APO-SI20) — das Kernstück

### Einstiegspunkt

```typescript
// src/rules/index.ts
import { berechnePrognose } from '@/rules'

const ergebnis = berechnePrognose({
  jahrgang: '10',           // '8' | '9' | '10' | null
  schulform: 'GESAMTSCHULE',
  faecher: EingabeFach[],
})
// ergebnis.empfehlung: 'OA' | 'ESA' | 'EESA' | 'MSA' | 'MSA_Q'
// ergebnis.protokoll: string[]  — Berechnungsprotokoll für Beratungslehrer
```

### EingabeFach-Format (flach, nicht verschachtelt)

```typescript
interface EingabeFach {
  kuerzel: string          // 'D', 'M', 'WP1' → wird zu 'WPU' normiert
  note: number             // 1–6
  kursart: 'E' | 'G' | 'Sonstige'
  bezeichnung?: string
  istFremdsprache?: boolean  // true → ZusatzFS (außer 'E')
}
```

### Berechnungsreihenfolge

```
1. ESA prüfen:
   - Jg. 10 → automatisch ESA (§40 Abs. 3)
   - Sonst: FG_ESA bauen + isEESA() prüfen

2. EESA prüfen (immer, unabhängig von ESA):
   - Nur wenn LBNW vorhanden
   - FG_EESA bauen + isEESA() prüfen

3. MSA/MSA-Q prüfen (nur wenn Prognose ≠ OA):
   - FLD-NW finden (erstes CH/PH/BI mit E- oder G-Kurs)
   - isMSA() → direkter Pass oder Ausgleichsprüfung
   - checkMSAAusgleich() → XOR-Regel (FG1 ODER FG2 gleicht aus)
   - isMSAQ() → strengere Schwellen (E≥4, G≥3 statt E≥5, G≥4)
   - checkMSAQAusgleich() → OR-Regel (FG1 UND FG2 dürfen ausgleichen)

4. Wenn !esaErreicht → Prognose = 'OA' (überschreibt alles)
```

### Wichtige Konstanten und Sonderfälle

| Konstante/Regel | Wert/Verhalten |
|---|---|
| `APO20_IGNO` | `['LBAL', 'AT', 'AH', 'AW', 'PK']` — global ignoriert |
| WP-Normierung | `/^WP\d/` → `'WPU'` (WP1, WP2, … alle gleich) |
| ZusatzFS | `istFremdsprache=true && kuerzel≠'E'` — nur in ESA/EESA ignoriert, NICHT in MSA |
| FLD (E-Kurs) | Note-1 für ESA/EESA; für MSA: max. 2 E-Kurse (3 für MSA-Q), Überschuss → G mit note-1 |
| FLD-NW-Block | E=6 oder G>4 → kein MSA/MSA-Q möglich |
| LoescheMinderleistung | Ein X-Kurs-Defizit in FG2 wird gestrichen (MSA-Ausgleich) |
| EESA: ignoriert BI/CH/PH | Diese Fächer zählen in EESA nicht (nur in MSA via FLD-NW) |

### Tests

```bash
npx vitest run   # 78/78 Testfälle grün
```

Die Tests lesen automatisch alle `.json`/`.JSON`-Dateien aus `test-json/` (lokal,
nicht eingecheckt). Format: `{ input: { jahrgang, faecher }, Prognose: { abschluss } }`.

---

## ManuellePrognoseView — Layout-Details

Der aktuell vollständig implementierte View. Zwei-Spalten-Layout:

```
Toolbar: [← Manuelle Prognose] [spacer] [Jahrgang ▼] [Schulform ▼] [ThemeToggle]
─────────────────────────────────────────────────────────────────────────────────
│ Fächerkarte (2fr)                      │ Prognosepanel (1fr)                  │
│ ┌────┬────────┬────┬────────┬──┬──┐    │ ┌──────────────────────────────────┐ │
│ │Kürz│Bezeichn│Note│Kursart │FS│ ✕│    │ │ farbiger Header: Badge + Name    │ │
│ ├────┼────────┼────┼────────┼──┼──┤    │ ├──────────────────────────────────┤ │
│ │... │ ...    │ .. │ ...    │☐ │  │    │ │ Protokoll (scrollbar, Monospace)  │ │
│ └────┴────────┴────┴────────┴──┴──┘    │ │  Prüfe ESA                        │ │
│ Buttons: [Fach hinzufügen][JSON laden] │ │  ─────────                        │ │
│          [Entfernen]                   │ │    FG1: D(3), M(3), ...           │ │
└────────────────────────────────────────└──────────────────────────────────────┘
```

### Wichtige Implementierungsdetails

- **Reaktivität**: Alle Tabellen-Inputs nutzen `:model-value` + `@update:model-value`
  mit explizitem `faecher[idx].field = v` (nicht `v-model="fach.field"`), um sicheres
  reaktives Schreiben in `ref<FormFach[]>` zu gewährleisten.
- **JSON-Import**: Unterstützt `{ input: { jahrgang, faecher } }` (test-json-Format)
  sowie flache Arrays/Objekte.
- **Protokoll**: `ergebnis.protokoll` enthält die Berechnungsschritte als `string[]`,
  generiert in `apoSI20.ts`. Zeilenklassen nach Präfix: `✓` grün, `✗` rot, `⚠` gelb,
  `Prüfe`/`──` fett, `══` Primärfarbe.
- **Grid**: `grid-template-columns: 2fr 1fr; align-items: stretch` — beide Spalten
  gleich hoch; Protokoll füllt mit `flex: 1; min-height: 0`.

---

## Theme-System

- **Klasse**: PrimeVue konfiguriert mit `darkModeSelector: '.dark'`
- **Toggle**: `src/components/ThemeToggle.vue` — Zyklus System → Hell → Dunkel
- **Persistence**: `localStorage['dark-mode']` (kein Sicherheitsbedenken, kein Credential)
- **Systemänderungen**: `matchMedia`-Listener in `useTheme.ts` aktiv
- **Platzierung**: In jedem View-Header integriert (kein globaler Floating-Button)

---

## API-Client (Dual-Mode: Electron vs. Browser)

```typescript
// Electron: direkte HTTPS-Verbindung zum SVWS-Server
resolvedBase = `${baseUrl}/db/${schema}`

// Browser (Dev): Vite-eigener Proxy unter /svws-proxy
// Header X-Proxy-Target leitet den Vite-Middleware-Proxy weiter
resolvedBase = `/svws-proxy/db/${schema}`
```

Der Proxy läuft nur im Vite Dev-Server (`vite.config.ts` → `dynamicProxy()`-Plugin).
Im Production-Build (Electron) wird direkt per HTTPS verbunden.

---

## Pinia-Stores — Überblick

| Store | Inhalt | Besonderheit |
|---|---|---|
| `authStore` | `baseUrl`, `schema`, `username`, `isConnected` | **Kein Passwort gespeichert** — nur im apiClient-Closure |
| `prognoseStore` | `notenbilder: Map<id, NotenbildSchueler>`, `ergebnisse: Map<id, PrognoseErgebnis>` | RAM-only |
| `schuelerStore` | `klassen[]`, `schueler[]`, `ausgewaehltId` | |
| `schuljahresabschnittStore` | `abschnitte[]`, `ausgewaehltId` | Setzt automatisch `istAktuell` |

---

## Was ist noch Platzhalter / TODO

| View/Bereich | Status |
|---|---|
| `SchuelerauswahlView` | Stub — zeigt Klassenfilter, kein API-Abruf |
| `NotenbildView` | Leere Datei |
| `PrognoseView` | Leere Datei |
| `AuswertungenView` | Nur "folgt"-Text |
| `EinstellungenView` | Leere Datei |
| `svwsService.ts` | Alle Funktionen mit `// TODO: Mapping`-Kommentar |
| `prognoseStore.laedt/schreibt` | Flags vorhanden, aber nirgends gesetzt |

---

## Konventionen im Code

- **Sprache**: UI-Text und Kommentare auf Deutsch; TypeScript-Interfaces/Variablen
  in camelCase auf Deutsch (z.B. `jahrgang`, `schulform`, `faecher`)
- **Keine Comments**: Nur wenn der *Warum* nicht offensichtlich ist
- **Keine Features auf Vorrat**: Kein Over-Engineering
- **Imports**: `@/` alias für `src/`, kein relativer Import über Verzeichnisgrenzen
- **PrimeVue-Größen**: Immer `size="small"` in kompakten Views
- **v-for Reaktivität**: Immer `faecher[idx].field = v` statt `fach.field = v`
- **Kein localStorage für Credentials**: Strikt — authStore ist RAM-only

---

## Schnellstart-Befehle

```bash
npm run dev          # Vite Dev-Server (mit CORS-Proxy für SVWS)
npm run test         # Vitest (78 APO-SI20-Testfälle)
npx tsc --noEmit     # TypeScript-Check ohne Build
npm run electron:dev # Electron-App (erfordert vorherigen Build)
npm run build        # Produktions-Build nach dist/
```

---

## Bekannte Stolperfallen

1. **Volar-Cache**: IDE zeigt manchmal stale Typ-Fehler (z.B. `protokoll` nicht gefunden).
   `npx tsc --noEmit` ist die Wahrheit. Lösung: TS-Server in VS Code neustarten.

2. **test-json Pfad**: In `apoSI20.test.ts` ist `TEST_JSON_DIR` zwei Ebenen über
   `src/rules/` → `resolve(__dirname, '../../test-json')`.

3. **WP-Normierung**: `WP1`, `WP2`, etc. werden intern zu `WPU`. Im Eingabeformular
   kann der Nutzer `WP1` eingeben — die Normierung passiert in `normKuerzel()`.

4. **ZusatzFS**: Nur `istFremdsprache=true && kuerzel≠'E'` gilt als Zusatz-FS.
   Englisch (`E`) ist KEIN ZusatzFS, auch wenn `istFremdsprache=true` gesetzt ist.

5. **MSAQ FLD-NW-Schwelle**: Verwendet **MSA-Niveau-Schwellen** (G≥5), NICHT MSAQ-Schwellen
   (G≥4). Das war ein kritischer Bug, der drei Tests zum Scheitern brachte.

6. **MSAQ fg2DefAnz**: Zählt nur `fg2_1NSAnz` (nicht `+ fg2_2NSAnz`), weil 2NS-Fächer
   bereits in 1NS enthalten sind.
