import type { AbschlussTyp } from '@/models/PrognoseErgebnis'
import type { Schulform } from '@/rules/types'
import { katalogIdZuAbschluss, istAOSF } from '@/services/schildAbschluss'
import {
  abschlussGeaendert,
  abschlussWirdGespeichert,
  berechne,
  faecherMitAnnahmen,
  gespeicherterPrognosetext,
  prognosetextGeaendert,
  prognosetextSpeicherbar,
  protokollText,
  standardIstPrognose,
} from '@/services/prognoseBerechnung'
import type { NotenModus, PrognoseKontext, SpeicherAuftrag } from '@/services/prognoseBerechnung'

// Gruppenprognose: berechnet die Prognose für mehrere Schüler einer Klasse genau wie die
// Einzelansicht (gleicher Service, gleicher Prognosetext) und speichert sie auf Wunsch.
// Noten werden dabei nie verändert.

export interface GruppenOptionen {
  notenModus: NotenModus
  // false: erst Vorschau, gespeichert wird nach Bestätigung
  sofortSpeichern: boolean
  // Schüler, deren gespeicherter Abschluss als endgültig markiert ist ("Ist Prognose" = nein)
  endgueltigeUeberschreiben: boolean
}

export interface GruppenParameter {
  jahrgang: string | null
  halbjahr: 1 | 2 | null
  schulform: Schulform
  // Langform der APO-SI20 aus dem Katalog der Schule
  apoSI20Po: string
}

export type GruppenStatus = 'wartet' | 'aenderung' | 'unveraendert' | 'uebersprungen' | 'fehler' | 'gespeichert'

export interface GruppenBewertung {
  status: GruppenStatus
  hinweis: string | null
  alt: AbschlussTyp | null
  neu: AbschlussTyp | null
  // Nur bei status 'aenderung'
  auftrag: SpeicherAuftrag | null
}

export function bewerteGruppenEintrag(
  k: PrognoseKontext,
  p: GruppenParameter,
  o: Pick<GruppenOptionen, 'notenModus' | 'endgueltigeUeberschreiben'>,
): GruppenBewertung {
  const la = k.lernabschnitt
  const modus = o.notenModus
  const alt = k.abschlussNichtUnterstuetzt
    ? null
    : katalogIdZuAbschluss(modus === 'quartal' ? k.abschlussdaten?.idAbschlussQuartalsprognose : k.abschlussdaten?.idAbschluss)
  const ueberspringen = (hinweis: string): GruppenBewertung => ({ status: 'uebersprungen', hinweis, alt, neu: null, auftrag: null })

  // Wie in der Einzelansicht: Prognos überschreibt weder AOSF-Prüfungsordnung noch Abschluss
  if (istAOSF(la.pruefungsOrdnung)) return ueberspringen('Prüfungsordnung AOSF')
  if (la.istAbschlussPrognose === false && la.abschluss && !o.endgueltigeUeberschreiben) {
    return ueberspringen('Endgültiger Abschluss gespeichert')
  }
  if (k.abschlussNichtUnterstuetzt && modus === 'quartal') {
    return ueberspringen('Quartalsprognose in diesem Jahrgang nicht speicherbar')
  }

  const params = { jahrgang: p.jahrgang, halbjahr: p.halbjahr, schulform: p.schulform, notenModus: modus }
  const faecher = faecherMitAnnahmen(k.rohFaecher, modus, gespeicherterPrognosetext(k, modus))
  const ergebnis = berechne(faecher, k.rohFaecher, la.noteLernbereichNW, params)
  if (!ergebnis) return ueberspringen(modus === 'quartal' ? 'Keine Quartalsnoten' : 'Keine Noten')

  const text = protokollText(ergebnis, faecher, k.rohFaecher, params)
  const po = p.apoSI20Po
  const istPrognose = standardIstPrognose(p.jahrgang, p.halbjahr)
  const geaendert = po !== la.pruefungsOrdnung
    || istPrognose !== la.istAbschlussPrognose
    || (abschlussWirdGespeichert(po, k.abschlussNichtUnterstuetzt) && abschlussGeaendert(ergebnis.empfehlung, k.abschlussdaten, modus))
    || (prognosetextSpeicherbar(po, k.abschlussNichtUnterstuetzt, modus) && prognosetextGeaendert(text, gespeicherterPrognosetext(k, modus)))

  const hinweise = [
    ...(k.abschlussNichtUnterstuetzt ? ['Abschluss in diesem Jahrgang nicht speicherbar, nur Prognosetext'] : []),
    ...ergebnis.hinweise.map(h => h.text),
  ]
  return {
    status: geaendert ? 'aenderung' : 'unveraendert',
    hinweis: hinweise.length > 0 ? hinweise.join(' · ') : null,
    alt,
    neu: ergebnis.empfehlung,
    auftrag: geaendert
      ? {
          lernabschnittId: la.id,
          pruefungsOrdnung: po,
          istAbschlussPrognose: istPrognose,
          abschlussNichtUnterstuetzt: k.abschlussNichtUnterstuetzt,
          notenModus: modus,
          empfehlung: ergebnis.empfehlung,
          text,
        }
      : null,
  }
}

// Führt fn für alle Einträge mit höchstens `parallel` gleichzeitigen Aufrufen aus; nach einem
// Abbruch werden keine neuen Einträge mehr begonnen
export async function fuerAlle<T>(
  eintraege: T[],
  parallel: number,
  fn: (eintrag: T) => Promise<void>,
  abgebrochen: () => boolean,
): Promise<void> {
  let naechster = 0
  const arbeiter = async () => {
    while (naechster < eintraege.length && !abgebrochen()) {
      await fn(eintraege[naechster++])
    }
  }
  await Promise.all(Array.from({ length: Math.min(parallel, eintraege.length) }, arbeiter))
}
