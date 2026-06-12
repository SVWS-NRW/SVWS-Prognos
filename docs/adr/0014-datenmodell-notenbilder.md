# ADR 0014: Internes Datenmodell für Notenbilder

## Status

Accepted

## Kontext

Die SVWS-REST-API liefert Rohdaten in einem SVWS-spezifischen Format. Für die
Prognoseberechnung und die Darstellung in der UI werden diese Daten in ein
anwendungsinternes, einheitliches Modell transformiert. Dieses Modell muss
alle für NRW-Abschlüsse relevanten Informationen abbilden.

## Entscheidung

Es werden folgende Kernmodelle definiert (`models/`):

**`Schueler`**
```typescript
interface Schueler {
  id: number
  vorname: string
  nachname: string
  klasseId: number
  schuljahresabschnittId: number
  // weitere Stammdaten
}
```

**`Lernabschnitt`**
```typescript
interface Lernabschnitt {
  id: number
  schuelerId: number
  schuljahresabschnittId: number
  schuljahr: number
  abschnitt: 1 | 2           // Halbjahr
  fehlstundenGesamt: number
  fehlstundenUnentschuldigt: number
  leistungen: Leistung[]
}
```

**`Leistung`** (eine Note in einem Fach)
```typescript
interface Leistung {
  fachId: number
  fachKuerzel: string
  kursart: 'GK' | 'EK' | 'ZK' | 'LK' | string  // Kursarten NRW
  note: number | null         // 1–6 oder null (noch keine Note)
  noteText: string | null     // z.B. "befriedigend"
  istPflichtfach: boolean
  istAbschlussfach: boolean
}
```

**`NotenbidSchueler`** (aggregierter Datensatz pro Schüler)
```typescript
interface NotenbidSchueler {
  schueler: Schueler
  lernabschnitte: Lernabschnitt[]  // chronologisch sortiert
  letzterAbschnitt: Lernabschnitt  // aktuell / neuester
}
```

**`PrognoseErgebnis`**
```typescript
interface PrognoseErgebnis {
  schuelerId: number
  berechnungsstand: 'berechnet' | 'unvollstaendig' | 'fehler'
  empfehlungAbschluss: AbschlussTyp
  alternativen: AbschlussTyp[]
  hinweise: string[]           // Begründungen, Warnungen
  berechnetAm: string          // ISO-Datum
  bestaetigt: boolean
  bestaetigtAm?: string
}
```

**`AbschlussTyp`** (NRW-Abschlüsse für Gesamt-/Sekundarschulen)
```typescript
type AbschlussTyp =
  | 'KEIN_ABSCHLUSS'
  | 'HA9'              // Hauptschulabschluss nach Klasse 9
  | 'HA10'             // Hauptschulabschluss nach Klasse 10
  | 'MSA'              // Mittlerer Schulabschluss / Fachoberschulreife
  | 'MSA_Q'            // MSA mit Qualifikationsvermerk (Berechtigung Oberstufe)
```

## Begründung

* Klare Trennung zwischen SVWS-Datenformat und internem Modell
* Validierung und Berechnung operieren ausschließlich auf internen Typen
* Änderungen an der SVWS-API erfordern nur Anpassungen im Mapping-Layer
* Typsicherheit durch TypeScript verhindert Fehler bei der Berechnung

## Alternativen

* Rohdaten direkt verarbeiten → starke Kopplung an SVWS-API-Format

## Konsequenzen

* Mapping-Funktion `mapSvwsToNotenbid()` in `services/svwsService.ts` transformiert
  SVWS-Rohantworten in das interne Modell
* `models/`-Verzeichnis enthält alle Interfaces
* Änderungen am Datenmodell erfordern Anpassung der Regelwerke in `rules/`
