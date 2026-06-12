# ADR 0008: Validierungsstrategie für Prognosedaten

## Status

Accepted

## Kontext

Vor der Berechnung einer Abschlussprognose und vor der Rückschreibung ins SVWS muss
sichergestellt sein, dass die geladenen Daten vollständig und plausibel sind. Fehlende
Noten, inkonsistente Schuljahresabschnitte oder unbekannte Fächerkürzel können die
Berechnung verfälschen oder zu fehlerhaften Einträgen im SVWS führen.

## Entscheidung

Validierung erfolgt auf drei Ebenen:

**Ebene 1 — Datenvollständigkeit (nach dem Laden)**
* Pflichtfelder im Notenbild vorhanden (Schüler-ID, Abschnitt, Fachkürzel)
* Keine leeren Pflichtbewertungen bei Fächern, die für den Abschluss relevant sind
* Ergebnis: Liste von Warnungen pro Schüler, die vor der Berechnung angezeigt werden

**Ebene 2 — Prognose-Vorbedingungen (vor der Berechnung)**
* Ausreichend Schuljahresabschnitte vorhanden (z.B. mindestens 2 Halbjahre für valide Prognose)
* Kursarten / Niveaus bekannt und klassifizierbar (G-Kurs, E-Kurs, Erweiterungskurs)
* Ergebnis: Blockade der Berechnung mit konkretem Hinweis auf fehlende Voraussetzungen

**Ebene 3 — Schreibvalidierung (vor dem API-Call)**
* Prognose-Ergebnis entspricht einem gültigen NRW-Abschlusswert
* Rückschreibung nur für Schüler, bei denen Berechnung fehlerfrei abgeschlossen wurde
* HTTP-Fehler des SVWS-Servers werden als strukturierter `AppError` behandelt

## Begründung

* Frühzeitiges Feedback verhindert fehlerhafte Berechnungen und API-Calls
* Dreilagige Validierung deckt alle Fehlerpunkte im Datenfluss ab
* Schulverwaltungspersonal soll keine kryptischen Fehlermeldungen sehen

## Alternativen

* Nur Servervalidierung → keine Rückmeldung vor dem Schreiben, schlechte UX
* Keine Validierung → fehlerhafte Prognosen werden ins SVWS geschrieben

## Konsequenzen

* Validierungslogik wird in `services/validierungService.ts` gekapselt
* Warnungen und Fehler werden über den `prognoseStore` weitergeleitet
* UI zeigt Validierungsstatus inline (Ampel-Anzeige pro Schüler)
