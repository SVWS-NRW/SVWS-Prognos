import { describe, it, expect } from 'vitest'
import type { FachDaten } from '@/models/Fach'
import type { SvwsAbschlussdaten, SvwsLernabschnittsdaten } from '@/models/Lernabschnitt'
import { baueRohFaecher } from './prognoseBerechnung'
import { abschlussZuKatalogId, abschlussartZuSchild } from './schildAbschluss'
import type { PrognoseKontext } from './prognoseBerechnung'
import { bewerteGruppenEintrag, fuerAlle } from './gruppenprognose'
import type { GruppenParameter } from './gruppenprognose'

const PO = 'GE/APO-SI20/5-10'

const faecherMap = new Map<number, FachDaten>(
  ([[1, 'D'], [2, 'M'], [3, 'E'], [4, 'BI'], [5, 'KU'], [6, 'GE']] as const).map(([id, kuerzel], i) =>
    [id, { id, kuerzel, kuerzelStatistik: kuerzel, bezeichnung: kuerzel, istFremdsprache: kuerzel === 'E', sortierung: i }]),
)

function lernabschnitt(felder: Partial<SvwsLernabschnittsdaten> = {}, noten: string | null = '2'): SvwsLernabschnittsdaten {
  return {
    id: 7, schuelerID: 1, schuljahresabschnitt: 1, noteLernbereichNW: 3, noteLernbereichGSbzwAL: null,
    abschluss: null, abschlussart: null, istAbschlussPrognose: null, pruefungsOrdnung: null,
    textErgebnisPruefungsalgorithmus: null,
    leistungsdaten: [1, 2, 3, 4, 5, 6].map(fachID => ({
      id: 100 + fachID, fachID, kursID: null, kursart: fachID <= 3 ? 'G' : null, note: noten, noteQuartal: null,
    })),
    ...felder,
  }
}

function kontext(
  la: SvwsLernabschnittsdaten = lernabschnitt(),
  ad: Partial<SvwsAbschlussdaten> | null = {},
  nichtUnterstuetzt: string | null = null,
): PrognoseKontext {
  return {
    lernabschnitt: la,
    abschlussdaten: ad && {
      idLernabschnitt: la.id, pruefungsordnung: 'APO-SI20', idAbschluss: null, istAbschlussPrognose: null, idAbschlussart: null,
      textErgebnisPruefungsalgorithmus: null, idAbschlussQuartalsprognose: null, textErgebniseQuartalsprognose: null, ...ad,
    },
    abschlussNichtUnterstuetzt: nichtUnterstuetzt,
    rohFaecher: baueRohFaecher(la, faecherMap, new Map()),
  }
}

const P: GruppenParameter = { jahrgang: '9', halbjahr: 1, schulform: 'GESAMTSCHULE', apoSI20Po: PO }
const HJ = { notenModus: 'halbjahr' as const, endgueltigeUeberschreiben: false }

describe('bewerteGruppenEintrag', () => {
  it('ohne gespeicherte Prognose: Änderung mit vollständigem Speicherauftrag', () => {
    const b = bewerteGruppenEintrag(kontext(), P, HJ)
    expect(b.status).toBe('aenderung')
    expect(b.neu).not.toBeNull()
    expect(b.auftrag).toMatchObject({ lernabschnittId: 7, pruefungsOrdnung: PO, istAbschlussPrognose: true, notenModus: 'halbjahr' })
    expect(b.auftrag?.text).toContain(`Prognose: `)
  })

  it('unverändert, wenn genau dieser Stand schon gespeichert ist', () => {
    const erst = bewerteGruppenEintrag(kontext(), P, HJ)
    const neu = erst.neu!
    const gespeichert = kontext(
      lernabschnitt({ pruefungsOrdnung: PO, istAbschlussPrognose: true }),
      { idAbschluss: abschlussZuKatalogId(neu), idAbschlussart: abschlussartZuSchild(neu), textErgebnisPruefungsalgorithmus: erst.auftrag!.text },
    )
    const b = bewerteGruppenEintrag(gespeichert, P, HJ)
    expect(b.status).toBe('unveraendert')
    expect(b.auftrag).toBeNull()
    expect(b.alt).toBe(neu)
  })

  it('AOSF wird übersprungen', () => {
    const b = bewerteGruppenEintrag(kontext(lernabschnitt({ pruefungsOrdnung: 'S/AOSF-SI05/5-10' })), P, HJ)
    expect(b.status).toBe('uebersprungen')
  })

  it('endgültiger Abschluss nur mit Option überschrieben', () => {
    const k = kontext(lernabschnitt({ istAbschlussPrognose: false, abschluss: 'GE/APO-SI20/MSA' }))
    expect(bewerteGruppenEintrag(k, P, HJ).status).toBe('uebersprungen')
    expect(bewerteGruppenEintrag(k, P, { ...HJ, endgueltigeUeberschreiben: true }).status).toBe('aenderung')
  })

  it('Jg. 10 im 2. Halbjahr: Ist Prognose nein', () => {
    const b = bewerteGruppenEintrag(kontext(), { ...P, jahrgang: '10', halbjahr: 2 }, HJ)
    expect(b.auftrag?.istAbschlussPrognose).toBe(false)
  })

  it('Jg. 8: Halbjahr nur Prognosetext, Quartal übersprungen', () => {
    const k = kontext(lernabschnitt(), null, 'Für den Jahrgang wird die Abschlussberechnung aktuell nicht unterstützt.')
    const hj = bewerteGruppenEintrag(k, { ...P, jahrgang: '8' }, HJ)
    expect(hj.status).toBe('aenderung')
    expect(hj.hinweis).toContain('nur Prognosetext')
    expect(bewerteGruppenEintrag(k, { ...P, jahrgang: '8' }, { ...HJ, notenModus: 'quartal' }).status).toBe('uebersprungen')
  })

  it('ohne Noten übersprungen', () => {
    const b = bewerteGruppenEintrag(kontext(lernabschnitt({}, null)), P, HJ)
    expect(b.status).toBe('uebersprungen')
    expect(b.hinweis).toBe('Keine Noten')
  })
})

describe('fuerAlle', () => {
  it('höchstens n gleichzeitig, alle bearbeitet', async () => {
    let aktiv = 0
    let maxAktiv = 0
    const erledigt: number[] = []
    await fuerAlle([1, 2, 3, 4, 5, 6, 7], 3, async i => {
      aktiv++
      maxAktiv = Math.max(maxAktiv, aktiv)
      await new Promise(r => setTimeout(r, 1))
      erledigt.push(i)
      aktiv--
    }, () => false)
    expect(maxAktiv).toBe(3)
    expect(erledigt.sort()).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('nach Abbruch keine neuen Einträge', async () => {
    const erledigt: number[] = []
    let abbruch = false
    await fuerAlle([1, 2, 3, 4, 5], 1, async i => {
      erledigt.push(i)
      if (i === 2) abbruch = true
    }, () => abbruch)
    expect(erledigt).toEqual([1, 2])
  })
})
