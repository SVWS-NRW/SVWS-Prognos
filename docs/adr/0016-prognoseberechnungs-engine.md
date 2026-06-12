# ADR 0016: Clientseitige Prognoseberechnungs-Engine

## Status

Proposed

## Kontext

Das Kernmerkmal von SVWS-Prognos ist die automatische Berechnung, welcher
Schulabschluss ein Schüler voraussichtlich erreichen wird. Diese Berechnung
basiert auf den NRW-Vorschriften für Gesamt- und Sekundarschulen.

Die Berechnung muss:
* Transparent und nachvollziehbar sein (Begründungen für Nutzer)
* Schulformspezifisch sein (Gesamtschule / Sekundarschule haben unterschiedliche Regeln)
* Erweiterbar sein (neue Schulformen, geänderte Vorschriften)
* Vollständig clientseitig laufen (kein eigenes Backend)

## Entscheidung

Die Prognose-Engine wird als **regelbasiertes, isoliertes Modul** in `src/rules/` implementiert.

### Architektur der Engine

```typescript
// rules/types.ts
interface RegelwerkInput {
  notenbid: NotenbidSchueler
  schulform: 'GESAMTSCHULE' | 'SEKUNDARSCHULE'
  zielklasse: number               // z.B. 10 für MSA-Berechnung
}

interface RegelwerkErgebnis {
  empfehlung: AbschlussTyp
  alternativen: AbschlussTyp[]
  hinweise: RegelHinweis[]         // Begründungen
  vollstaendig: boolean            // genug Daten für sichere Prognose?
}

interface RegelHinweis {
  schwere: 'info' | 'warnung' | 'kritisch'
  text: string                     // Deutsch, nutzerlesbar
  regelId: string                  // z.B. 'MSA-PFLICHTFACH-DEUTSCH'
}

// Signatur eines Regelwerks
type Regelwerk = (input: RegelwerkInput) => RegelwerkErgebnis
```

### Registry-Muster

```typescript
// rules/index.ts
const regelwerke: Record<string, Regelwerk> = {
  GESAMTSCHULE: gesamtschuleRegelwerk,
  SEKUNDARSCHULE: sekundarschuleRegelwerk,
}

export function berechnePrognose(input: RegelwerkInput): RegelwerkErgebnis {
  const regelwerk = regelwerke[input.schulform]
  if (!regelwerk) throw new Error(`Kein Regelwerk für ${input.schulform}`)
  return regelwerk(input)
}
```

### Regeln je Schulform

Jede Schulform-Datei (`rules/gesamtschule.ts`, `rules/sekundarschule.ts`)
implementiert die spezifischen NRW-Anforderungen als kommentierte, benannte
Regelfunktionen. Einzelne Regeln sind isoliert testbar.

Beispielstruktur:
```typescript
// rules/gesamtschule.ts
function pruefeHA9(leistungen: Leistung[]): RegelHinweis[] { ... }
function pruefeHA10(leistungen: Leistung[]): RegelHinweis[] { ... }
function pruefeMSA(leistungen: Leistung[]): RegelHinweis[] { ... }
function pruefeMSA_Q(leistungen: Leistung[]): RegelHinweis[] { ... }

export const gesamtschuleRegelwerk: Regelwerk = (input) => {
  // Prüft von höchstem zu niedrigstem Abschluss
  // Gibt ersten erreichbaren Abschluss als Empfehlung zurück
}
```

### Berechnung im Datenfluss

```
notenbidStore.load() → NotenbidSchueler
       │
       ↓
berechnePrognose(input) → RegelwerkErgebnis
       │
       ↓
prognoseStore.setErgebnis() → PrognoseErgebnis
       │
       ↓  (nach Bestätigung)
svwsService.writePrgnoseErgebnis()
```

## Begründung

* Isoliertes Modul in `rules/` trennt domänenspezifische Logik von UI und API
* Registry-Muster erlaubt neue Schulformen ohne Änderung des Kerns
* Vollständig clientseitig — konsistent mit ADR 0003
* TypeScript-Typen erzwingen vollständige Implementierung aller Ausgabefelder
* Benannte Regel-IDs in `RegelHinweis` ermöglichen späteres Linking zur Rechtsgrundlage

## Alternativen

* Berechnung inline in Komponenten → nicht testbar, nicht wiederverwendbar
* Serverbasiertes Regelwerk → eigenes Backend erforderlich
* Konfigurierbare Regelwerke (JSON-basiert) → zu komplex für den ersten Release

## Konsequenzen

* Spezifische NRW-Regeln (Notengrenzen, Pflichtfächer, Kursarten) werden in einem
  separaten ADR 0017 dokumentiert, sobald die Regelwerke vollständig definiert sind
* Tests für die Regelwerke in `rules/*.test.ts` (Vitest empfohlen)
* Änderungen an Schulgesetzen erfordern nur Anpassungen in den `rules/`-Dateien
* Die Engine liefert immer ein Ergebnis — bei unvollständigen Daten wird
  `vollstaendig: false` gesetzt und Hinweise erklären, was fehlt
