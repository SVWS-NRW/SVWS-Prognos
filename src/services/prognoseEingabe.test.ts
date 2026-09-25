import { describe, it, expect } from 'vitest'
import { ordneRechenKuerzelZu, rechenKuerzel } from './prognoseEingabe'
import type { FachDaten } from '@/models/Fach'

let id = 0
function fach(kuerzel: string, kuerzelStatistik: string | null, istFremdsprache = false): FachDaten {
  return { id: ++id, kuerzel, kuerzelStatistik, bezeichnung: null, istFremdsprache }
}

describe('rechenKuerzel', () => {
  it('WP-Fach über Kursart WPI', () => {
    expect(rechenKuerzel(fach('F6 WP1', 'F6', true), 'WPI')).toBe('WPU')
    expect(rechenKuerzel(fach('AH WP1', 'AH'), 'WPI')).toBe('WPU')
  })

  it('EGSN-Fach über Kursart EGSN', () => {
    expect(rechenKuerzel(fach('S8', 'S8', true), 'EGSN')).toBe('EGSN')
  })

  it('Englisch mit Schulkürzel über Statistik-Kürzel', () => {
    expect(rechenKuerzel(fach('E5', 'E', true), 'E')).toBe('E')
  })

  it('Fächer ohne Rolle behalten ihr Schulkürzel', () => {
    expect(rechenKuerzel(fach('REL', 'PP'), 'PUT')).toBe('REL')
    expect(rechenKuerzel(fach('SP', 'SP'), 'PUT')).toBe('SP')
  })
})

describe('ordneRechenKuerzelZu', () => {
  it('doppelt belegte Rolle geht an das Fach mit passendem Schulkürzel', () => {
    const erg = ordneRechenKuerzelZu([
      { fach: fach('E BILI', 'E'), kursart: 'PUK' },
      { fach: fach('E', 'E', true), kursart: 'G' },
    ])
    expect(erg).toEqual(['E BILI', 'E'])
  })

  it('AH als WP-Fach und AH als Pflichtfach bleiben getrennt', () => {
    const erg = ordneRechenKuerzelZu([
      { fach: fach('AH', 'AH'), kursart: 'PUK' },
      { fach: fach('AH WP1', 'AH'), kursart: 'WPI' },
    ])
    expect(erg).toEqual(['AH', 'WPU'])
  })
})
