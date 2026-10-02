import { describe, it, expect } from 'vitest'
import { abschlussZuKatalogId, katalogIdZuAbschluss, abschlussZuSchild, abschlussartZuSchild, istAOSF, istApoSI20, schildZuAbschluss } from './schildAbschluss'

describe('Abschluss → Schild-NRW', () => {
  it('Kürzel wie in Prueford_Optionen (OP_Krz)', () => {
    expect(abschlussZuSchild('OA')).toBe('GE/APO-SI20/OA')
    expect(abschlussZuSchild('ESA')).toBe('GE/APO-SI20/ESA')
    expect(abschlussZuSchild('EESA')).toBe('GE/APO-SI20/EESA')
    expect(abschlussZuSchild('MSA')).toBe('GE/APO-SI20/MSA')
    expect(abschlussZuSchild('MSA_Q')).toBe('GE/APO-SI20/MSAQ-E')
  })

  it('Abschlussart: 1 = Abschluss erreicht, 2 = ohne Abschluss', () => {
    expect(abschlussartZuSchild('OA')).toBe(2)
    expect(abschlussartZuSchild('ESA')).toBe(1)
    expect(abschlussartZuSchild('MSA_Q')).toBe(1)
  })
})

describe('Abschluss → ID im Katalog SchulabschlussAllgemeinbildend', () => {
  it('Einträge ab Schuljahr 2022', () => {
    expect(abschlussZuKatalogId('OA')).toBe(0)
    expect(abschlussZuKatalogId('ESA')).toBe(2001)
    expect(abschlussZuKatalogId('EESA')).toBe(5001)
    expect(abschlussZuKatalogId('MSA')).toBe(10000)
    expect(abschlussZuKatalogId('MSA_Q')).toBe(11000)
  })

  it('Rückrichtung', () => {
    expect(katalogIdZuAbschluss(0)).toBe('OA')
    expect(katalogIdZuAbschluss(5001)).toBe('EESA')
    expect(katalogIdZuAbschluss(11000)).toBe('MSA_Q')
    expect(katalogIdZuAbschluss(2000)).toBeNull()
    expect(katalogIdZuAbschluss(null)).toBeNull()
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

describe('istAOSF', () => {
  it('erkennt AOSF-Prüfungsordnungen', () => {
    expect(istAOSF('S/AOSF-SI05/5-10')).toBe(true)
    expect(istAOSF('GE/APO-SI20/5-10')).toBe(false)
    expect(istAOSF(null)).toBe(false)
  })
})
