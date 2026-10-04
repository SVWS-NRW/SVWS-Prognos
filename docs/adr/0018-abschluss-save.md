# ADR 0018: Rückschreibung von Abschlussprognosen in Schild-NRW

## Status

Accepted

## Kontext

Dieser ADR dokumentiert, welche Datenbankfelder der alte Delphi-Client (PM2 — Prognose-Modul 2)
in die Schild-NRW-Datenbank schreibt, wenn ein Abschluss-Prognoseergebnis gespeichert wird.
Die Erkenntnisse dienen als Grundlage für die REST-API-Implementierung in `svwsService.ts`.

Analysiert wurden folgende Quelldateien aus `delphiSrc/`:

- `PM2/mPM2Main.pas` — Hauptfenster, `SaveSchILDLeistungsdaten`, `SaveSchILDSchuelerLeistung`
- `PM2/mDMPM2.pas` — Datenzugriff, `SpeicherLernabschnittsDaten`, `SpeicherLeistung`
- `PM2/mPrognoseEinzelAnalyse.pas` — Einzelanalyse, `SavePrognoseErgebnis`
- `Shared/BaseUtils.pas` — Konvertierungsfunktionen `PMAbschlusstoSchILDAbschluss`, `SchildAbschlusstoPMAbschluss`
- `Shared/PrognoseUtils.pas` — Prognosedatenmodell

## Entscheidung

Die Rückschreibung in SVWS-Prognos erfolgt per REST-PUT/-PATCH auf den Lernabschnitt des
Schülers und setzt exakt die Felder, die PM2 in `SchuelerLernabschnittsdaten` schreibt.

## Zieltabelle: `SchuelerLernabschnittsdaten`

Der Datensatz wird über seine `ID` (`LernabschnittsID`) identifiziert.
PM2 nutzt ADO `Edit/Post` (kein rohes SQL-UPDATE).

### Felder

| Logischer Name (PM2) | DB-Feldname         | Wert / Format                             | Hinweis                            |
|---|---|---|---|
| `Prognose`           | `Abschluss`         | `GE/APO-SI20/<Kürzel>` (s. u.)            | Pflichtfeld                        |
| _(implizit)_         | `AbschlIstPrognose` | `'+'`                                     | **Immer mitsetzen** (s. u.)        |
| `Prognoseergebnis`   | `PruefAlgoErgebnis` | HTML-Text (normiert per `PEGetExportFormat`) | Berechnungsprotokoll             |
| `LBNW`               | `Gesamtnote_NW`     | Note als String (`'1'`–`'6'`)             | Lernbereichsnote Naturwissenschaften |
| `LBAL`               | `Gesamtnote_GS`     | Note als String (`'1'`–`'6'`)             | **Nur APO-SI05**, entfällt bei APO-SI20 |
| `MoeglNPFaecher`     | `MoeglNPFaecher`    | Kommagetrennte Fachkürzel, z. B. `'M,D'`  | Nachprüfungsmöglichkeiten          |

### Abschluss-Schlüssel (PM2-intern → SchILD-DB)

| PM2-Prognose | `Abschluss`-Feldwert in SchILD |
|---|---|
| `OA`    | `GE/APO-SI20/OA`      |
| `ESA`   | `GE/APO-SI20/ESA`     |
| `EESA`  | `GE/APO-SI20/EESA`    |
| `MSA`   | `GE/APO-SI20/MSA`     |
| `MSAQ`  | `GE/APO-SI20/MSAQ-E`  |
| `MSAQ2` | `GE/APO-SI20/MSAQ-Q`  |

Für die ältere APO-SI05 lautet das Präfix entsprechend `GE/APO-SI05/`.

### Kritisches Detail: `AbschlIstPrognose`

In `mDMPM2.pas` (Zeile 405) wird bei jedem Schreiben des `Abschluss`-Feldes automatisch
`AbschlIstPrognose = '+'` gesetzt. Ohne dieses Flag wertet SchILD-NRW den Eintrag als
**endgültigen Abschluss**, nicht als Prognose. Dieses Feld muss daher immer mitgeschrieben werden.

## Optionale Schreiboperation: `SchuelerLeistungsdaten`

Nur wenn der angemeldete Benutzer die Berechtigung `UserDarfNotenAendern` besitzt, schreibt
PM2 zusätzlich Einzelnoten zurück:

| Logischer Name | DB-Feldname | Wert       |
|---|---|---|
| `Note`         | `NotenKrz`  | `'1'`–`'6'` |
| `Niv` / `Art`  | `KursArt`   | `'E'` / `'G'` |

## Aufrufpfad (Delphi-Referenz)

```
"Speichern"-Button
└─ Action_PrognosedatenSaveExecute           mPM2Main.pas:1068
   └─ SaveSchILDLeistungsdaten               mPM2Main.pas:3453
      └─ SaveSchILDSchuelerLeistung(R)       mPM2Main.pas:3463
         ├─ SpeicherLernabschnittsDaten(LAID, 'GE/APO-SI20/MSA', 'Prognose')
         │    → Abschluss         = 'GE/APO-SI20/MSA'
         │    → AbschlIstPrognose = '+'
         ├─ SpeicherLernabschnittsDaten(LAID, '<html...>', 'Prognoseergebnis')
         │    → PruefAlgoErgebnis = '<html...>'
         ├─ SpeicherLernabschnittsDaten(LAID, '3', 'LBNW')
         │    → Gesamtnote_NW = '3'
         ├─ SpeicherLernabschnittsDaten(LAID, '2', 'LBAL')   // nur APO-SI05
         │    → Gesamtnote_GS = '2'
         └─ SpeicherLernabschnittsDaten(LAID, 'M,D', 'MoeglNPFaecher')
              → MoeglNPFaecher = 'M,D'
```

Die Konvertierung zwischen PM2-Kürzeln und SchILD-Feldwerten übernimmt
`PMAbschlusstoSchILDAbschluss()` in `Shared/BaseUtils.pas:4081`.

## Umsetzung in SVWS-Prognos

`PrognoseView.doSpeichern()` schreibt in zwei Schritten, Zuordnung zentral in `services/schildAbschluss.ts`:

1. `PATCH /db/{schema}/schueler/lernabschnittsdaten/{id}` — Prüfungsordnung, Prognose-Flag, LBNW.
2. `PATCH /db/{schema}/abschluesse/schueler/lernabschnittsdaten/{id}` — der Abschluss selbst.
   Erst nach Schritt 1, weil der Server den Abschluss gegen die Prüfungsordnung prüft.

| SVWS-Feld | Endpunkt | Wert | PM2/SchILD-Entsprechung |
|---|---|---|---|
| `pruefungsOrdnung` | 1 | gewählte Prüfungsordnung (`GE/APO-SI20/5-10`) | – |
| `istAbschlussPrognose` | 1 | Checkbox „Ist Prognose“: beim Laden gesetzt, außer Jg. 10 im 2. Halbjahr (dann tatsächlicher Abschluss); gespeicherter Wert wird nicht übernommen, manuell änderbar | `AbschlIstPrognose` |
| `noteLernbereichNW` | 1 | nur bei Änderung | `Gesamtnote_NW` |
| `idAbschluss` | 2 | Katalog-ID: OA `0` · ESA `2001` · EESA `5001` · MSA `10000` · MSA-Q `11000` | `Abschluss` |
| `idAbschlussart` | 2 | `1` = Abschluss erreicht, `2` = ohne Abschluss (OA) | `AbschlussArt` |
| `textErgebnisPruefungsalgorithmus` | 2 | Kopfzeile + Berechnungsprotokoll als Text | `PruefAlgoErgebnis` |
| `idAbschlussQuartalsprognose` | 2 | statt `idAbschluss`, wenn mit Quartalsnoten gerechnet wurde | – |
| `textErgebniseQuartalsprognose` | 2 | statt `textErgebnisPruefungsalgorithmus` bei Quartalsnoten | – |

- Die Katalog-IDs stammen aus dem ASD-Katalog `SchulabschlussAllgemeinbildend`
  (`data/openAPI/allinone.json`, Einträge gültig ab Schuljahr 2022). Ältere Einträge (HA9 = `2000`,
  HA10 = `5000`) werden nicht gebraucht, da es Jg. 8 nach APO-SI20 erst ab 2023/24 gibt.
- Der Server leitet daraus das Schild-Feld `abschluss` der Lernabschnittsdaten ab
  (`GE/APO-SI20/OA` · `/ESA` · `/EESA` · `/MSA` · `/MSAQ-E`) und setzt auch `abschlussart`.
  Gelesen wird der gespeicherte Abschluss für Schülertabelle und Auswertungen weiter aus
  `abschluss` über `schildZuAbschluss()`.
- Prüfungsordnung: Der neue Endpunkt arbeitet bewusst mit der Kurzform (`APO-SI20`) und lehnt
  die Langform `GE/APO-SI20/5-10` mit 400 ab. In der Datenbank speichert der Server weiterhin
  Schild3-kompatibel (Langform in den Lernabschnittsdaten). Prognos setzt die Prüfungsordnung
  vorerst über Schritt 1 und sendet sie am neuen Endpunkt nicht mit.
- Geplant: Umstieg auf eine atomarere Speicherung, d.h. Prüfungsordnung (Kurzform), Prognose-Flag
  und Abschluss in einem PATCH über `/abschluesse/…` statt zwei getrennter Aufrufe.
- Verhalten des Servers (getestet gegen `1.5.0-SNAPSHOT`, Oktober 2026):
  - Der PATCH antwortet mit 200 und den gespeicherten `Abschlussdaten`.
  - Eine im Schuljahr ungültige `idAbschluss` wird ohne Fehler auf `null` gesetzt. Prognos
    vergleicht deshalb die Antwort des PATCH mit dem gesendeten Wert und meldet sonst einen Fehler.
  - `null` leert ein Feld (anfangs führte das zu 500, inzwischen im Server behoben).
  - Für Jg. 8 lehnt der Server GET und PATCH mit 400 ab („Für den Jahrgang wird die
    Abschlussberechnung aktuell nicht unterstützt.“). `loadAbschlussdaten()` liefert dann den
    Grund statt der Daten; die PrognoseView rechnet weiter, zeigt den Grund an und lässt
    Schritt 2 aus (Noten, Prüfungsordnung und Prognose-Flag werden gespeichert).
    Den Prognosetext schreibt Prognos in Jg. 8 stattdessen in Schritt 1 nach
    `textErgebnisPruefungsalgorithmus` der Lernabschnittsdaten (nur mit Halbjahresnoten; für die
    Quartalsprognose gibt es dort kein Feld).
    Entscheidung (Oktober 2026): so belassen. Melden Schulen Bedarf für das Speichern in Jg. 8,
    muss der SVWS-Server das freischalten; in Prognos ist dafür keine Änderung nötig.
- Die Kürzel entsprechen `OP_Krz` aus `/schild3/pruefungsordnungen/optionen`. Gesamt-,
  Sekundar- und Primusschule nutzen alle die Prüfungsordnung `GE/APO-SI20/5-10`. Die Schulform
  steht nicht im Kürzel, sondern in `PO_Schulform` (`/schild3/pruefungsordnungen`) bzw.
  `OP_Schulformen` (`/schild3/pruefungsordnungen/optionen`). Das Schulform-Kürzel der
  Primusschule ist `PS`.
- `loadPruefungsordnungen()` liest `PO_Krz`/`PO_Name` und filtert auf `PO_Schulform` der Schule,
  weil der Katalog die Prüfungsordnungen aller Schulformen enthält.
- Zur Auswahl steht nur APO-SI20, weil nur sie für die Jahrgänge 8–10 noch gültig ist und nur sie
  von der Engine berechnet wird. Andere Prüfungsordnungen der Schulform (APO-SI05, AOSF-SI05,
  AO-SI99 …) werden mit anderen Programmen berechnet. Beim Laden wird APO-SI20 vorausgewählt.
- Ausnahme AOSF (sonderpädagogische Förderung, z.B. `S/AOSF-SI05/5-10`): Eine gespeicherte
  AOSF-Prüfungsordnung bleibt ausgewählt, das Dropdown ist gesperrt, und Schritt 2 (Abschluss,
  Abschlussart, Protokoll) entfällt. Ob eine Prognose bei Förderbedarf sinnvoll ist, ist offen.
  Kommt eine neue APO-SI hinzu, muss sie hier angeboten werden (neues Regelwerk in der Engine,
  `apoSI20Option`/`poOptionen` in `PrognoseView` und `istApoSI20()` in `schildAbschluss.ts` erweitern).
- Der Abschluss wird nur geschrieben, wenn die gewählte Prüfungsordnung APO-SI20 ist,
  weil die Engine nur APO-SI20 berechnet.
- Kursarten ändert Prognos nicht in SVWS. Für die Prognose angenommene Kursarten stehen im
  Prognosetext („FLD-Kursarten für die Prognose geändert, nicht in SVWS gespeichert: M: E (SVWS: Sonstige)“; auch
  im Protokoll auf dem Bildschirm) und werden beim
  Öffnen wieder angenommen, solange die Kursart in SVWS noch die notierte ist. „Speichern“ wird
  auch aktiv, wenn sich nur der Prognosetext ändert (Vergleich ohne Kopfzeile mit Zeitstempel).
- Fächer lassen sich per Haken „Ign.“ von der Prognose ausschließen. Auch das wird nicht in SVWS
  gespeichert, sondern im Prognosetext vermerkt („Von der Prognose ausgeschlossen, nicht in SVWS
  gespeichert: ER · WS-3-Werte“) und beim Öffnen über das Fach-Kurs-Kürzel wieder gesetzt.
- Nicht geschrieben werden `versetzungsvermerk` (eigene Berechnung, folgt später) und
  `nachpruefungen.moegliche` (Nachprüfungsfächer berechnet die Engine noch nicht).
- Gelesen werden gespeicherte Abschlüsse über `schildZuAbschluss()`, das auch die
  APO-SI05-Kürzel (`HA`, `HA10`, `FOR`, `FORQ-E`) älterer Daten versteht.

## Konsequenzen

- Das SVWS-REST-API muss PATCH/PUT auf Lernabschnittsdaten unterstützen und die genannten
  Felder exponieren.
- `AbschlIstPrognose` ist kein optionales Feld — es muss immer zusammen mit `Abschluss`
  geschrieben werden.
- Bei APO-SI20 entfällt `Gesamtnote_GS` (LBAL), da die APO-SI20 keinen Lernbereich
  Arbeitslehre mehr kennt.
- Das Prognoseergebnis (`PruefAlgoErgebnis`) sollte vor dem Speichern in ein
  speicherfreundliches Format normiert werden (kein reines HTML, sondern ein
  portables Textformat).
