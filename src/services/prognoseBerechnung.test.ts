import { describe, it, expect } from 'vitest'
import type { FachDaten } from '@/models/Fach'
import type { SvwsAbschlussdaten, SvwsLeistungsdaten, SvwsLernabschnittsdaten } from '@/models/Lernabschnitt'
import {
  AUSGESCHLOSSEN_PRAEFIX,
  KURSARTEN_PRAEFIX,
  abschlussFelder,
  abschlussGeaendert,
  baueRohFaecher,
  berechne,
  faecherMitAnnahmen,
  faecherOhneAnnahmen,
  gespeicherterPrognosetext,
  ohneKopfzeile,
  prognosetextGeaendert,
  prognosetextSpeicherbar,
  protokollText,
  standardIstPrognose,
} from './prognoseBerechnung'
import type { BerechnungsParameter, PrognoseKontext } from './prognoseBerechnung'

// Fächerkatalog: [id, Schulkürzel, Statistik-Kürzel, Sortierung, Fremdsprache]
const KATALOG: Array<[number, string, string | null, number, boolean?]> = [
  [1, 'D', 'D', 10], [2, 'M', 'M', 20], [3, 'E5', 'E', 30, true], [4, 'F6', 'F', 40, true],
  [5, 'CH', 'CH', 50], [6, 'BI', 'BI', 60], [7, 'ER', 'ER', 70], [8, 'KU', 'KU', 80],
  [9, 'GE', 'GE', 90], [10, 'SPK', 'SP', 100], [11, 'AW', 'AW', 110],
]
const faecherMap = new Map<number, FachDaten>(KATALOG.map(([id, kuerzel, kuerzelStatistik, sortierung, fs]) =>
  [id, { id, kuerzel, kuerzelStatistik, bezeichnung: `Fach ${kuerzel}`, istFremdsprache: fs === true, sortierung }]))

function ld(id: number, fachID: number, kursart: string | null, note: string, kursID: number | null = null): SvwsLeistungsdaten {
  return { id, fachID, kursID, kursart, note, noteQuartal: note }
}

// Wie Schülerin 524 (primus): zweimal ER, einmal im Kurs WS-3-Werte
const LEISTUNGEN: SvwsLeistungsdaten[] = [
  ld(101, 1, 'G', '1'), ld(102, 2, 'E', '1'), ld(103, 3, 'G', '1'), ld(104, 4, 'WPI', '1'),
  ld(105, 5, 'E', '1'), ld(106, 6, null, '1'), ld(107, 7, null, '1', 900), ld(108, 7, null, '2', 901),
  ld(109, 8, null, '1'), ld(110, 9, null, '1'), ld(111, 10, null, '1'), ld(112, 11, null, '1'),
]
const KURSE = new Map<number, string | null>([[900, 'ER-10'], [901, 'WS-3-Werte']])

function lernabschnitt(leistungsdaten: SvwsLeistungsdaten[], text: string | null = null): SvwsLernabschnittsdaten {
  return {
    id: 1, schuelerID: 524, schuljahresabschnitt: 1, noteLernbereichNW: 1, noteLernbereichGSbzwAL: null,
    abschluss: null, abschlussart: null, istAbschlussPrognose: null, pruefungsOrdnung: null,
    textErgebnisPruefungsalgorithmus: text, leistungsdaten,
  }
}

function abschlussdaten(felder: Partial<SvwsAbschlussdaten> = {}): SvwsAbschlussdaten {
  return {
    idLernabschnitt: 1, pruefungsordnung: 'APO-SI20', idAbschluss: null, istAbschlussPrognose: null, idAbschlussart: null,
    textErgebnisPruefungsalgorithmus: null, idAbschlussQuartalsprognose: null, textErgebniseQuartalsprognose: null,
    ...felder,
  }
}

const P: BerechnungsParameter = { jahrgang: '10', halbjahr: 1, schulform: 'GESAMTSCHULE', notenModus: 'halbjahr' }
const ZEIT = new Date(2026, 9, 4, 12, 0, 0)

function textFuer(leistungsdaten: SvwsLeistungsdaten[], gespeichert: string | null = null): string {
  const roh = baueRohFaecher(lernabschnitt(leistungsdaten), faecherMap, KURSE)
  const faecher = faecherMitAnnahmen(roh, 'halbjahr', gespeichert)
  const ergebnis = berechne(faecher, roh, 1, P)!
  return protokollText(ergebnis, faecher, roh, P, ZEIT)
}

function gemischt<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let x = seed
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280
    const j = Math.floor((x / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

describe('Fachreihenfolge', () => {
  it('Leistungsdaten in beliebiger Reihenfolge ergeben denselben Prognosetext', () => {
    const erwartet = textFuer(LEISTUNGEN)
    for (let seed = 1; seed <= 20; seed++) {
      expect(textFuer(gemischt(LEISTUNGEN, seed))).toBe(erwartet)
    }
  })

  it('sortiert nach Fach-Sortierung, bei gleichem Fach nach Leistungs-ID', () => {
    const roh = baueRohFaecher(lernabschnitt(gemischt(LEISTUNGEN, 7)), faecherMap, KURSE)
    expect(roh.map(f => f.svwsId)).toEqual(LEISTUNGEN.map(l => l.id))
  })

  it('Kernfächer oben, NW-Fach mit E-/G-Kurs direkt danach', () => {
    const roh = baueRohFaecher(lernabschnitt(LEISTUNGEN), faecherMap, KURSE)
    expect(faecherOhneAnnahmen(roh, 'halbjahr').slice(0, 5).map(f => f.kuerzel)).toEqual(['D', 'M', 'E', 'WPU', 'CH'])
  })
})

describe('Fach-Kurs-Kürzel und Rechenkürzel', () => {
  it('unterscheidet gleiche Fächer über den Kurs', () => {
    const roh = baueRohFaecher(lernabschnitt(LEISTUNGEN), faecherMap, KURSE)
    expect(roh.filter(f => f.kuerzel === 'ER').map(f => f.fachKuerzel)).toEqual(['ER · ER-10', 'ER · WS-3-Werte'])
  })

  it('ASD-Kürzel aus dem Statistik-Kürzel, WP-Fach über die Kursart', () => {
    const roh = baueRohFaecher(lernabschnitt(LEISTUNGEN), faecherMap, KURSE)
    const fr = roh.find(f => f.svwsId === 104)!
    expect([fr.asdKuerzel, fr.fachKuerzel, fr.kuerzel]).toEqual(['F', 'F6', 'WPU'])
  })
})

describe('Annahmen im Prognosetext (Rundlauf)', () => {
  it('angenommene Kursarten und ausgeschlossene Fächer bleiben nach dem Neuladen erhalten', () => {
    const roh = baueRohFaecher(lernabschnitt(LEISTUNGEN), faecherMap, KURSE)
    // BI auf G (rückt dadurch nach oben), ER im Kurs WS-3-Werte ausgeschlossen
    const geaendert = faecherOhneAnnahmen(roh, 'halbjahr').map(f =>
      f.svwsId === 106 ? { ...f, kursart: 'G' as const } : f.svwsId === 108 ? { ...f, ignorieren: true } : f)
    const text = protokollText(berechne(geaendert, roh, 1, P)!, geaendert, roh, P, ZEIT)
    expect(text).toContain(`${KURSARTEN_PRAEFIX}BI: G (SVWS: Sonstige)`)
    expect(text).toContain(`${AUSGESCHLOSSEN_PRAEFIX}ER · WS-3-Werte`)

    // Neu laden, Server liefert eine andere Reihenfolge
    const rohNeu = baueRohFaecher(lernabschnitt(gemischt(LEISTUNGEN, 3)), faecherMap, KURSE)
    const faecherNeu = faecherMitAnnahmen(rohNeu, 'halbjahr', text)
    expect(faecherNeu.find(f => f.svwsId === 106)?.kursart).toBe('G')
    expect(faecherNeu.find(f => f.svwsId === 108)?.ignorieren).toBe(true)
    const textNeu = protokollText(berechne(faecherNeu, rohNeu, 1, P)!, faecherNeu, rohNeu, P, new Date())
    expect(prognosetextGeaendert(textNeu, text)).toBe(false)
  })

  it('angenommene Kursart entfällt, wenn sich die Kursart in SVWS geändert hat', () => {
    const text = `Kopf\nPrognose: MSA\n${KURSARTEN_PRAEFIX}BI: G (SVWS: Sonstige)\n`
    const geaendert = LEISTUNGEN.map(l => l.id === 106 ? { ...l, kursart: 'E' } : l)
    const roh = baueRohFaecher(lernabschnitt(geaendert), faecherMap, KURSE)
    expect(faecherMitAnnahmen(roh, 'halbjahr', text).find(f => f.svwsId === 106)?.kursart).toBe('E')
  })

  it('ausgeschlossene Fächer zählen nicht in der Berechnung', () => {
    const mit = textFuer(LEISTUNGEN)
    const ohne = textFuer(LEISTUNGEN, `Kopf\n${AUSGESCHLOSSEN_PRAEFIX}KU`)
    expect(ohneKopfzeile(mit)).toContain('KU(1)')
    expect(ohneKopfzeile(ohne)?.split('\n').filter(z => z.includes('FG2')).join()).not.toContain('KU(')
  })
})

describe('Vergleich mit dem Gespeicherten', () => {
  const roh = baueRohFaecher(lernabschnitt(LEISTUNGEN), faecherMap, KURSE)

  it('Prognosetext ohne Kopfzeile verglichen', () => {
    const a = textFuer(LEISTUNGEN)
    const b = a.replace(/^[^\n]*/, 'SVWS-Prognos · andere Uhrzeit')
    expect(prognosetextGeaendert(a, b)).toBe(false)
    expect(prognosetextGeaendert(a, null)).toBe(true)
  })

  it('gespeicherter Text: Jg. 8 aus den Lernabschnittsdaten, sonst je nach Notenart', () => {
    const k = (nichtUnterstuetzt: string | null): PrognoseKontext => ({
      lernabschnitt: lernabschnitt(LEISTUNGEN, 'LA'),
      abschlussdaten: nichtUnterstuetzt ? null : abschlussdaten({ textErgebnisPruefungsalgorithmus: 'HJ', textErgebniseQuartalsprognose: 'Q' }),
      abschlussNichtUnterstuetzt: nichtUnterstuetzt,
      rohFaecher: roh,
    })
    expect(gespeicherterPrognosetext(k(null), 'halbjahr')).toBe('HJ')
    expect(gespeicherterPrognosetext(k(null), 'quartal')).toBe('Q')
    expect(gespeicherterPrognosetext(k('Jg. 8'), 'halbjahr')).toBe('LA')
  })

  it('Prognosetext in Jg. 8 nur mit Halbjahresnoten speicherbar, nur bei APO-SI20', () => {
    expect(prognosetextSpeicherbar('GE/APO-SI20/5-10', null, 'quartal')).toBe(true)
    expect(prognosetextSpeicherbar('GE/APO-SI20/5-10', 'Jg. 8', 'halbjahr')).toBe(true)
    expect(prognosetextSpeicherbar('GE/APO-SI20/5-10', 'Jg. 8', 'quartal')).toBe(false)
    expect(prognosetextSpeicherbar('S/AOSF-SI05/5-10', null, 'halbjahr')).toBe(false)
  })

  it('Abschluss: Halbjahr prüft ID und Abschlussart, Quartal nur die Quartals-ID', () => {
    expect(abschlussGeaendert('MSA', abschlussdaten({ idAbschluss: 10000, idAbschlussart: 1 }), 'halbjahr')).toBe(false)
    expect(abschlussGeaendert('MSA', abschlussdaten({ idAbschluss: 10000, idAbschlussart: 2 }), 'halbjahr')).toBe(true)
    expect(abschlussGeaendert('MSA', abschlussdaten({ idAbschlussQuartalsprognose: 10000 }), 'quartal')).toBe(false)
    expect(abschlussGeaendert('MSA', null, 'quartal')).toBe(true)
  })
})

describe('Speichern', () => {
  it('Felder je nach Notenart', () => {
    expect(abschlussFelder('MSA', 'T', 'halbjahr')).toEqual({ idAbschluss: 10000, idAbschlussart: 1, textErgebnisPruefungsalgorithmus: 'T' })
    expect(abschlussFelder('OA', 'T', 'quartal')).toEqual({ idAbschlussQuartalsprognose: 0, textErgebniseQuartalsprognose: 'T' })
  })

  it('Ist Prognose: immer, außer Jg. 10 im 2. Halbjahr', () => {
    expect(standardIstPrognose('10', 2)).toBe(false)
    expect(standardIstPrognose('10', 1)).toBe(true)
    expect(standardIstPrognose('9', 2)).toBe(true)
    expect(standardIstPrognose(null, null)).toBe(true)
  })
})
