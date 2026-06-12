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
        schulform: 'GESAMTSCHULE',
        faecher,
      }

      const result = berechnePrognose(input)
      expect(result.empfehlung).toBe(tc.Prognose.abschluss)
    })
  }
})
