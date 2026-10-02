import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { berechnePrognose } from './index'
import type { EingabeFach, RegelwerkInput } from './types'

const TEST_JSON_DIR = resolve(__dirname, '../../test-json')

interface TestFach {
  kuerzel: string
  note: number
  kursart: 'E' | 'G' | 'Sonstige'
  bezeichnung?: string
  istFremdsprache?: boolean
}

interface TestCase {
  input: {
    jahrgang: string | null
    abschnitt: 1 | 2 | null
    'apo-s1': string
    faecher: TestFach[]
  }
  Prognose: {
    abschluss: string
  }
}

const files = readdirSync(TEST_JSON_DIR).filter(f => f.endsWith('.JSON') || f.endsWith('.json'))

describe('APO-SI20 gegen 78 Testfälle', () => {
  for (const file of files) {
    it(file.replace(/\.(JSON|json)$/, ''), () => {
      const raw = readFileSync(join(TEST_JSON_DIR, file), 'utf-8')
      const tc: TestCase = JSON.parse(raw)

      const faecher: EingabeFach[] = tc.input.faecher.map(f => ({
        kuerzel: f.kuerzel,
        note: f.note,
        kursart: f.kursart,
        bezeichnung: f.bezeichnung,
        istFremdsprache: f.istFremdsprache,
      }))

      const input: RegelwerkInput = {
        jahrgang: tc.input.jahrgang,
        halbjahr: tc.input.abschnitt,
        schulform: 'GESAMTSCHULE',
        faecher,
      }

      const result = berechnePrognose(input)
      expect(result.empfehlung).toBe(tc.Prognose.abschluss)
    })
  }
})

// Kurzform: 'KZ:Note[:E|G][:FS]', z.B. 'D:4:E E:4:E:FS WP1:4'
function faecherAus(s: string): EingabeFach[] {
  return s.split(' ').map(t => {
    const [kuerzel, note, kursart, fs] = t.split(':')
    return {
      kuerzel,
      note: Number(note),
      kursart: kursart === 'E' || kursart === 'G' ? kursart : 'Sonstige',
      istFremdsprache: fs === 'FS' || undefined,
    }
  })
}

function prognose(jahrgang: string, faecher: string) {
  return berechnePrognose({ jahrgang, schulform: 'GESAMTSCHULE', faecher: faecherAus(faecher) }).empfehlung
}

// Erwartungen aus PrognoseUtils.pas (CheckMSAAusgleich) abgeleitet, nicht aus Delphi-Exporten
describe('MSA-Ausgleich einer fehlenden "3" in FG2', () => {
  const basis = 'D:4:E E:4:E:FS M:3:G WP1:4 LBNW:3 GL:4 RePP:4 SP:3'

  it('FLD-NW G-Kurs mit Note 3 gleicht nicht aus', () => {
    expect(prognose('10', `${basis} BI:3:G`)).toBe('EESA')
  })

  it('FLD-NW G-Kurs mit Note 2 gleicht aus', () => {
    expect(prognose('10', `${basis} BI:2:G`)).toBe('MSA')
  })

  it('FLD-NW E-Kurs mit Note 3 gleicht aus', () => {
    expect(prognose('10', 'D:4:E E:4:E:FS M:3:G WP1:4 LBNW:3 GL:4 RePP:4 SP:3 BI:3:E')).toBe('MSA')
  })
})

// Erwartungen aus PrognoseUtils.pas (AddDokuPreCheck, SetFaecherGruppen) abgeleitet
describe('Vorprüfung', () => {
  const berechne = (jahrgang: string, faecher: string) =>
    berechnePrognose({ jahrgang, schulform: 'GESAMTSCHULE', faecher: faecherAus(faecher) })

  it('ohne Befund ist das Ergebnis vollständig', () => {
    const r = berechne('10', 'D:2:E E:2:E:FS M:2:E WP1:2 LBNW:2 BI:2:G GL:2 RePP:2 SP:2')
    expect(r.vollstaendig).toBe(true)
    expect(r.hinweise).toEqual([])
  })

  it('GL-Note: EK/GE werden ignoriert, Ergebnis unvollständig', () => {
    const r = berechne('9', 'D:3:G E:3:G:FS M:3:G WP1:3 LBNW:3 BI:3:G GL:3 GE:6 EK:6 RePP:3 SP:3')
    expect(r.empfehlung).toBe('EESA')
    expect(r.vollstaendig).toBe(false)
    expect(r.hinweise.map(h => h.regelId)).toEqual(['VOR-GL-EINZELNOTEN'])
  })

  it('mehrere NW-Fächer mit Kurs: alle Prüfungen abgebrochen (Jg. 9 → OA)', () => {
    const r = berechne('9', 'D:3:G E:3:G:FS M:3:G WP1:3 LBNW:3 BI:3:G CH:3:G GL:3 RePP:3 SP:3')
    expect(r.empfehlung).toBe('OA')
    expect(r.hinweise.map(h => h.regelId)).toEqual(['VOR-FLD-NW-MEHRFACH'])
  })

  it('mehrere NW-Fächer mit Kurs: Jg. 10 behält ESA', () => {
    expect(berechne('10', 'D:2:E E:2:E:FS M:2:E WP1:2 LBNW:2 BI:2:G CH:2:G GL:2 RePP:2 SP:2').empfehlung).toBe('ESA')
  })

  it('D ohne Kurs in Jg. 10: keine MSA-Prüfung', () => {
    const r = berechne('10', 'D:2 E:2:E:FS M:2:E WP1:2 LBNW:2 BI:2:G GL:2 RePP:2 SP:2')
    expect(r.empfehlung).toBe('EESA')
    expect(r.hinweise.map(h => h.regelId)).toEqual(['VOR-FLD-DEM'])
  })

  it('D ohne Kurs in Jg. 9 ist ohne Halbjahresangabe zulässig', () => {
    const r = berechne('9', 'D:2 E:2:E:FS M:2:E WP1:2 LBNW:2 BI:2:G GL:2 RePP:2 SP:2')
    expect(r.hinweise).toEqual([])
  })

  it('Jg. 10 ohne NW-Kurs: Hinweis', () => {
    const r = berechne('10', 'D:2:E E:2:E:FS M:2:E WP1:2 LBNW:2 BI:2 GL:2 RePP:2 SP:2')
    expect(r.hinweise.map(h => h.regelId)).toEqual(['VOR-FLD-NW'])
  })
})

// Erwartungen aus PrognoseUtils.pas (AddDokuPreCheck, PrepareZusaetzlicheEFaecher) abgeleitet
describe('FLD-Pflicht nach Jahrgang und Halbjahr', () => {
  const ohneNW = 'D:2:G E:2:E:FS M:2:E WP1:2 LBNW:2 BI:2 CH:2 GL:2 RePP:2 SP:2'
  const berechne = (jahrgang: string, halbjahr: 1 | 2 | null, faecher: string) =>
    berechnePrognose({ jahrgang, halbjahr, schulform: 'GESAMTSCHULE', faecher: faecherAus(faecher) })

  it('Jg. 8: MSA ohne NW-Kurs prüfbar', () => {
    const r = berechne('8', 1, ohneNW)
    expect(r.empfehlung).toBe('MSA')
    expect(r.hinweise).toEqual([])
  })

  it('Jg. 9, 1. Halbjahr: MSA ohne NW-Kurs prüfbar, D ohne Kurs zulässig', () => {
    const r = berechne('9', 1, ohneNW.replace('D:2:G', 'D:2'))
    expect(r.empfehlung).toBe('MSA')
    expect(r.hinweise).toEqual([])
  })

  it('Jg. 9, 2. Halbjahr: ohne NW-Kurs kein MSA', () => {
    const r = berechne('9', 2, ohneNW)
    expect(r.empfehlung).toBe('EESA')
    expect(r.hinweise.map(h => h.regelId)).toEqual(['VOR-FLD-NW'])
  })

  it('Jg. 9, 2. Halbjahr: D ohne Kurs → kein MSA', () => {
    const r = berechne('9', 2, `${ohneNW.replace('D:2:G', 'D:2')} PH:2:G`)
    expect(r.empfehlung).toBe('EESA')
    expect(r.hinweise.map(h => h.regelId)).toEqual(['VOR-FLD-DEM'])
  })

  it('Jg. 8: E/M ohne Kurs → kein MSA', () => {
    const r = berechne('8', 2, ohneNW.replace('M:2:E', 'M:2'))
    expect(r.empfehlung).toBe('EESA')
    expect(r.hinweise.map(h => h.regelId)).toEqual(['VOR-FLD-DEM'])
  })
})
