import { describe, it, expect } from 'vitest'
import { abschlussZuSchild, abschlussartZuSchild, istApoSI20, schildZuAbschluss } from './schildAbschluss'

describe('Abschluss → Schild-NRW', () => {
  it('Kürzel wie in Prueford_Optionen (OP_Krz)', () => {
    expect(abschlussZuSchild('OA')).toBe('GE/APO-SI20/OA')
    expect(abschlussZuSchild('ESA')).toBe('GE/APO-SI20/ESA')
    expect(abschlussZuSchild('EESA')).toBe('GE/APO-SI20/EESA')
    expect(abschlussZuSchild('MSA')).toBe('GE/APO-SI20/MSA')
    expect(abschlussZuSchild('MSA_Q')).toBe('GE/APO-SI20/MSAQ-E')
  })

  it('Abschlussart: 0 ohne, 1 mit Abschluss', () => {
    expect(abschlussartZuSchild('OA')).toBe(0)
    expect(abschlussartZuSchild('ESA')).toBe(1)
    expect(abschlussartZuSchild('MSA_Q')).toBe(1)
  })
})

describe('Schild-NRW → Abschluss', () => {
  it('APO-SI20-Kürzel', () => {
    expect(schildZuAbschluss('GE/APO-SI20/EESA')).toBe('EESA')
    expect(schildZuAbschluss('GE/APO-SI20/MSAQ-E')).toBe('MSA_Q')
    expect(schildZuAbschluss('GE/APO-SI20/MSAQ-Q')).toBe('MSA_Q')
  })

  it('APO-SI05-Kürzel aus älteren Daten', () => {
    expect(schildZuAbschluss('GE/APO-SI05/HA')).toBe('ESA')
    expect(schildZuAbschluss('GE/APO-SI05/HA10')).toBe('EESA')
    expect(schildZuAbschluss('GE/APO-SI05/FOR')).toBe('MSA')
    expect(schildZuAbschluss('GE/APO-SI05/FORQ-E')).toBe('MSA_Q')
  })

  it('leer oder unbekannt', () => {
    expect(schildZuAbschluss(null)).toBeNull()
    expect(schildZuAbschluss('GE/APO-SI20/AGZ')).toBeNull()
  })

  it('Prüfungsordnung APO-SI20', () => {
    expect(istApoSI20('GE/APO-SI20/5-10')).toBe(true)
    expect(istApoSI20('GE/APO-SI05/5-10')).toBe(false)
    expect(istApoSI20(null)).toBe(false)
  })
})
