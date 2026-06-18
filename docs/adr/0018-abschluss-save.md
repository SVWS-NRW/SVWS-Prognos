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

## Ziel-Implementierung in SVWS-Prognos

```typescript
// svwsService.ts — Entwurf
async function speichereAbschlussPrognose(
  lernabschnittId: number,
  prognose: AbschlussTyp,       // 'OA' | 'ESA' | 'EESA' | 'MSA' | 'MSA_Q'
  pruefAlgoErgebnis: string,
  gesamtnoteNW?: string,
  moeglNPFaecher?: string,
): Promise<void> {
  const abschluss = abschlussTypToSchild(prognose); // z.B. 'GE/APO-SI20/MSA'
  await apiClient.patch(`/lernabschnittsdaten/${lernabschnittId}`, {
    abschluss,
    abschlIstPrognose: true,     // PFLICHT — ohne dieses Flag gilt es als Endabschluss
    pruefAlgoErgebnis,
    gesamtnoteNW,
    moeglNPFaecher,
  });
}
```

Die Abbildungsfunktion `abschlussTypToSchild()` entspricht `PMAbschlusstoSchILDAbschluss()`.

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
