// APO-SI20: Ausbildungsordnung Sekundarschule / Gesamtschule, in Kraft seit 2020
// Referenz: delphiSrc/Shared/PrognoseUtils.pas (tPrognoseBerechnung)

import type { Regelwerk, RegelwerkErgebnis, EingabeFach } from './types'
import type { AbschlussTyp } from '@/models/PrognoseErgebnis'

const APO20_IGNO = new Set(['LBAL', 'AT', 'AH', 'AW', 'PK'])

type Niveau = 'E' | 'G' | 'X'

interface FGFach {
  kuerzel: string
  fgNote: number
  fgNiveau: Niveau
}

function normKuerzel(kuerzel: string): string {
  return /^WP\d/.test(kuerzel) ? 'WPU' : kuerzel
}

function toNiveau(kursart: string): Niveau {
  if (kursart === 'E') return 'E'
  if (kursart === 'G') return 'G'
  return 'X'
}

// Zusätzliche Fremdsprache (istFremdsprache=true, kuerzel≠'E') — nur in ESA/EESA ignoriert
function isZusatzFS(f: EingabeFach): boolean {
  return f.istFremdsprache === true && normKuerzel(f.kuerzel) !== 'E'
}

function countNote(fg: FGFach[], noten: Set<number>, niveau: Niveau | '' = ''): number {
  return fg.filter(f => noten.has(f.fgNote) && (niveau === '' || f.fgNiveau === niveau)).length
}

// ─── ESA / EESA ────────────────────────────────────────────────────────────

function buildFG_ESA(faecher: EingabeFach[]): { fg1: FGFach[]; fg2: FGFach[] } | null {
  const fg1: FGFach[] = []
  const fg2: FGFach[] = []
  const fg1Keys = new Set(['D', 'M'])

  for (const f of faecher) {
    const kz = normKuerzel(f.kuerzel)
    if (APO20_IGNO.has(kz)) continue
    if (kz === 'LBNW') continue
    if (isZusatzFS(f)) continue

    const niv = toNiveau(f.kursart)
    const fgNote = niv === 'E' && f.note > 1 ? f.note - 1 : f.note
    const fach: FGFach = { kuerzel: kz, fgNote, fgNiveau: niv === 'E' ? 'G' : niv }

    if (fg1Keys.has(kz)) fg1.push(fach)
    else fg2.push(fach)
  }

  return fg1.length > 0 && fg2.length > 0 ? { fg1, fg2 } : null
}

function buildFG_EESA(faecher: EingabeFach[]): { fg1: FGFach[]; fg2: FGFach[] } | null {
  if (!faecher.some(f => normKuerzel(f.kuerzel) === 'LBNW')) return null

  const fg1: FGFach[] = []
  const fg2: FGFach[] = []
  const fg1Keys = new Set(['D', 'M', 'LBNW'])
  const eesaIgno = new Set(['BI', 'CH', 'PH'])

  for (const f of faecher) {
    const kz = normKuerzel(f.kuerzel)
    if (APO20_IGNO.has(kz)) continue
    if (eesaIgno.has(kz)) continue
    if (isZusatzFS(f)) continue

    const niv = toNiveau(f.kursart)
    const fgNote = niv === 'E' && f.note > 1 ? f.note - 1 : f.note
    const fach: FGFach = { kuerzel: kz, fgNote, fgNiveau: niv === 'E' ? 'G' : niv }

    if (fg1Keys.has(kz)) fg1.push(fach)
    else fg2.push(fach)
  }

  return fg1.length > 0 && fg2.length > 0 ? { fg1, fg2 } : null
}

// Gemeinsame Prüfung für ESA(Jg.9) und EESA — auf post-FLD-Noten angewendet
function isEESA(fg1: FGFach[], fg2: FGFach[]): boolean {
  const fg1_5 = countNote(fg1, new Set([5]))
  const fg1_6 = countNote(fg1, new Set([6]))
  const fg2_5 = countNote(fg2, new Set([5]))
  const fg2_6 = countNote(fg2, new Set([6]))
  const fg2_56 = fg2_5 + fg2_6

  if (fg1_6 >= 1) return false
  if (fg1_5 > 1) return false
  if (fg2_6 >= 2) return false
  if (fg2_6 === 1 && fg2_5 > 1) return false
  if (fg2_5 > 2) return false

  if (fg1_5 === 0) return fg2_56 <= 2
  if (fg1_5 === 1) return fg2_56 <= 1
  return false
}

// ─── MSA / MSAQ Fächergruppen ──────────────────────────────────────────────

// Sucht erstes CH/PH/BI mit E- oder G-Kurs
function getFLDNW(faecher: EingabeFach[]): string | null {
  for (const kz of ['CH', 'PH', 'BI']) {
    const f = faecher.find(f => normKuerzel(f.kuerzel) === kz && (f.kursart === 'E' || f.kursart === 'G'))
    if (f) return kz
  }
  return null
}

interface MSAFaecher {
  fg1: FGFach[]
  fg2: FGFach[]
  fldNW: string | null  // kuerzel des FLD-NW-Fachs (nach Konvertierung)
}

function buildFG_MSA(faecher: EingabeFach[], forMSAQ: boolean): MSAFaecher | null {
  const fldNWKuerzel = getFLDNW(faecher)
  if (fldNWKuerzel === null) return null

  const fg1Keys = new Set(['D', 'E', 'M', 'WPU'])
  const igno = new Set([...APO20_IGNO, 'LBNW'])

  const raw1 = new Map<string, { note: number; niveau: Niveau }>()
  const raw2 = new Map<string, { note: number; niveau: Niveau }>()

  for (const f of faecher) {
    const kz = normKuerzel(f.kuerzel)
    if (igno.has(kz)) continue
    const niv = toNiveau(f.kursart)
    if (fg1Keys.has(kz)) raw1.set(kz, { note: f.note, niveau: niv })
    else raw2.set(kz, { note: f.note, niveau: niv })
  }

  // PrepareZusaetzlicheEFaecher: überzählige E-Kurse auf G reduzieren (note-1)
  const threshold = forMSAQ ? 3 : 2
  const eCount1 = [...raw1.values()].filter(f => f.niveau === 'E').length
  const eCount2 = [...raw2.values()].filter(f => f.niveau === 'E').length
  let remaining = eCount1 + eCount2

  if (remaining > threshold) {
    // Schritt 1: FLD-NW aus FG2 konvertieren
    const fldEntry = raw2.get(fldNWKuerzel)
    if (fldEntry && fldEntry.niveau === 'E') {
      fldEntry.note = fldEntry.note > 1 ? fldEntry.note - 1 : 1
      fldEntry.niveau = 'G'
      remaining--
    }
    // Schritt 2: M aus FG1 konvertieren, wenn noch zu viele E-Kurse
    if (remaining > threshold) {
      const m = raw1.get('M')
      if (m && m.niveau === 'E') {
        m.note = m.note > 1 ? m.note - 1 : 1
        m.niveau = 'G'
      }
    }
  }

  const makeFach = (kz: string, f: { note: number; niveau: Niveau }): FGFach =>
    ({ kuerzel: kz, fgNote: f.note, fgNiveau: f.niveau })

  const fg1 = [...raw1.entries()].map(([kz, f]) => makeFach(kz, f))
  const fg2 = [...raw2.entries()].map(([kz, f]) => makeFach(kz, f))

  if (fg1.length === 0 || fg2.length === 0) return null
  return { fg1, fg2, fldNW: fldNWKuerzel }
}

// ─── IsMSA ─────────────────────────────────────────────────────────────────

function isMSA(f: MSAFaecher): { passes: boolean; checkAusgleich: boolean } {
  const { fg1, fg2, fldNW } = f

  // FLD-NW 2NS-Defizit → kein MSA möglich (E≥6 oder G>4)
  if (fldNW) {
    const fac = fg2.find(f => f.kuerzel === fldNW)
    if (fac && ((fac.fgNiveau === 'E' && fac.fgNote === 6) || (fac.fgNiveau === 'G' && fac.fgNote > 4)))
      return { passes: false, checkAusgleich: false }
  }

  const eAnz = fg1.filter(f => f.fgNiveau === 'E').length + fg2.filter(f => f.fgNiveau === 'E').length

  // MSA 1NS-Schwellen: E≥5, G≥4, X≥5
  const def1 = (fg: FGFach[]) =>
    countNote(fg, new Set([5, 6]), 'E') + countNote(fg, new Set([4, 5, 6]), 'G') + countNote(fg, new Set([5, 6]), 'X')
  // MSA 2NS-Schwellen: E≥6, G≥5, X≥6
  const def2 = (fg: FGFach[]) =>
    countNote(fg, new Set([6]), 'E') + countNote(fg, new Set([5, 6]), 'G') + countNote(fg, new Set([6]), 'X')

  const fg1_1NS = def1(fg1), fg2_1NS = def1(fg2)
  const fg1_2NS = def2(fg1), fg2_2NS = def2(fg2)
  const fg2_X3 = countNote(fg2, new Set([1, 2, 3]), 'X')

  // Direkter Pass: ≥2 E-Kurse, keine Defizite, ≥2 Sonstige mit Note≤3
  if (eAnz >= 2 && fg1_1NS === 0 && fg2_1NS === 0 && fg2_X3 >= 2)
    return { passes: true, checkAusgleich: false }

  // Sofortiger Ausschluss
  if (fg1_1NS >= 2 || fg1_2NS >= 1 || fg2_2NS >= 2)
    return { passes: false, checkAusgleich: false }

  return { passes: false, checkAusgleich: eAnz >= 2 }
}

// ─── CheckMSAAusgleich ─────────────────────────────────────────────────────

function checkMSAAusgleich(f: MSAFaecher): boolean {
  const { fg1, fg2 } = f

  // 3NS: G-Kurs note=6 → kein Ausgleich
  if (countNote(fg1, new Set([6]), 'G') + countNote(fg2, new Set([6]), 'G') > 0) return false

  // FG1-Analyse
  const fg1_1NS = countNote(fg1, new Set([5, 6]), 'E') + countNote(fg1, new Set([4, 5, 6]), 'G') + countNote(fg1, new Set([5, 6]), 'X')
  const fg1_2NS = countNote(fg1, new Set([6]), 'E') + countNote(fg1, new Set([5, 6]), 'G') + countNote(fg1, new Set([6]), 'X')
  if (fg1_1NS > 1 || fg1_2NS > 0) return false

  // FG1-Ausgleiche: E≤3, G≤2, X≤3
  const fg1Aus = countNote(fg1, new Set([1, 2, 3]), 'E') + countNote(fg1, new Set([1, 2]), 'G') + countNote(fg1, new Set([1, 2, 3]), 'X')
  if (fg1_1NS === 1 && fg1Aus === 0) return false

  let fg1Ausgleich = fg1_1NS === 1

  // LoescheMinderleistung: ein X-Defizit in FG2 entfernen (note=6 vor note=5)
  let fg2Rest = [...fg2]
  for (const note of [6, 5]) {
    const idx = fg2Rest.findIndex(f => f.fgNiveau === 'X' && f.fgNote === note)
    if (idx !== -1) { fg2Rest = [...fg2Rest.slice(0, idx), ...fg2Rest.slice(idx + 1)]; break }
  }

  // FG2-Defizite nach Entfernung
  const fg2_1NS = countNote(fg2Rest, new Set([5, 6]), 'E') + countNote(fg2Rest, new Set([4, 5, 6]), 'G') + countNote(fg2Rest, new Set([5, 6]), 'X')
  const fg2_2NS = countNote(fg2Rest, new Set([6]), 'E') + countNote(fg2Rest, new Set([5, 6]), 'G') + countNote(fg2Rest, new Set([6]), 'X')
  const fg2_X3 = countNote(fg2Rest, new Set([1, 2, 3]), 'X')
  const fehlX3 = Math.max(0, 2 - fg2_X3)

  if (fg2_1NS > 1 || fg2_2NS > 0) return false
  if (fg2_1NS + fehlX3 > 1) return false

  // FG2-Ausgleiche: alle Note≤2 + überzählige X-Note=3 über den 2 notwendigen
  const fg2Aus = countNote(fg2Rest, new Set([1, 2]), '') + Math.max(0, countNote(fg2Rest, new Set([3]), 'X') - 2)

  let fg2Ausgleich = false

  if (fehlX3 > 0) {
    // "1x3-Defizit": ausgleichbar durch X≤2, FLD-NW≤3, oder freien FG1-Surplus
    const xLe2 = countNote(fg2Rest, new Set([1, 2]), 'X')
    const fldNWAus = countNote(fg2Rest, new Set([1, 2, 3]), 'E') + countNote(fg2Rest, new Set([1, 2, 3]), 'G')
    const fg1Frei = fg1Aus > 0 && !fg1Ausgleich
    if (xLe2 === 0 && fldNWAus === 0 && !fg1Frei) return false
    if (xLe2 > 0 || fldNWAus > 0) fg2Ausgleich = true
    else fg1Ausgleich = true
  }

  if (fg2_1NS > 0) {
    if (fg2Aus > 0) fg2Ausgleich = true
    else if (fg1Aus > 0 && !fg1Ausgleich) fg1Ausgleich = true
    else return false
  }

  // XOR: genau eine Gruppe darf ausgleichen (oder keine Defizite)
  if (fg1Ausgleich && fg2Ausgleich) return false
  if (fg1_1NS === 0 && fg2_1NS === 0 && fehlX3 === 0) return true
  return fg1Ausgleich || fg2Ausgleich
}

// ─── IsMSAQ ────────────────────────────────────────────────────────────────

function isMSAQ(f: MSAFaecher): { passes: boolean; checkAusgleich: boolean } {
  const { fg1, fg2, fldNW } = f

  // FLD-NW: kein MSAQ wenn schweres Defizit auf MSA-Niveau (E=6 oder G≥5)
  if (fldNW) {
    const fac = fg2.find(f => f.kuerzel === fldNW)
    if (fac && ((fac.fgNiveau === 'E' && fac.fgNote === 6) || (fac.fgNiveau === 'G' && fac.fgNote > 4)))
      return { passes: false, checkAusgleich: false }
  }

  const eAnz = fg1.filter(f => f.fgNiveau === 'E').length + fg2.filter(f => f.fgNiveau === 'E').length

  // MSAQ 1NS-Schwellen: E≥4, G≥3, X≥4
  const def1 = (fg: FGFach[]) =>
    countNote(fg, new Set([4, 5, 6]), 'E') + countNote(fg, new Set([3, 4, 5, 6]), 'G') + countNote(fg, new Set([4, 5, 6]), 'X')
  // MSAQ 2NS-Schwellen: E≥5, G≥4, X≥5
  const def2 = (fg: FGFach[]) =>
    countNote(fg, new Set([5, 6]), 'E') + countNote(fg, new Set([4, 5, 6]), 'G') + countNote(fg, new Set([5, 6]), 'X')

  const fg1_1NS = def1(fg1), fg2_1NS = def1(fg2)
  const fg1_2NS = def2(fg1), fg2_2NS = def2(fg2)

  // Direkter Pass: ≥3 E-Kurse, keine Defizite
  if (eAnz >= 3 && fg1_1NS === 0 && fg2_1NS === 0)
    return { passes: true, checkAusgleich: false }

  // Sofortiger Ausschluss
  if (fg1_1NS >= 2 || fg1_2NS >= 1 || fg2_2NS >= 2)
    return { passes: false, checkAusgleich: false }

  return { passes: false, checkAusgleich: eAnz >= 3 }
}

// ─── CheckMSAQAusgleich ────────────────────────────────────────────────────

function checkMSAQAusgleich(f: MSAFaecher): boolean {
  const { fg1, fg2 } = f

  // 3NS: E≥6, G≥5, X≥6 → kein Ausgleich
  const def3 = (fg: FGFach[]) =>
    countNote(fg, new Set([6]), 'E') + countNote(fg, new Set([5, 6]), 'G') + countNote(fg, new Set([6]), 'X')
  if (def3(fg1) + def3(fg2) > 0) return false

  // FG1-Analyse (MSAQ: 1NS = E≥4, G≥3, X≥4)
  const fg1_1NS = countNote(fg1, new Set([4, 5, 6]), 'E') + countNote(fg1, new Set([3, 4, 5, 6]), 'G') + countNote(fg1, new Set([4, 5, 6]), 'X')
  const fg1_2NS = countNote(fg1, new Set([5, 6]), 'E') + countNote(fg1, new Set([4, 5, 6]), 'G') + countNote(fg1, new Set([5, 6]), 'X')
  if (fg1_1NS > 1 || fg1_2NS > 0) return false

  // FG1-Ausgleiche: E≤2, G≤1, X≤2
  let fg1Aus = countNote(fg1, new Set([1, 2]), 'E') + countNote(fg1, new Set([1]), 'G') + countNote(fg1, new Set([1, 2]), 'X')
  if (fg1_1NS === 1 && fg1Aus === 0) return false

  let fg1Ausgleich = false
  if (fg1_1NS === 1) { fg1Ausgleich = true; fg1Aus-- }

  // FG2-Analyse (MSAQ: 1NS = E≥4, G≥3, X≥4)
  const fg2_1NS = countNote(fg2, new Set([4, 5, 6]), 'E') + countNote(fg2, new Set([3, 4, 5, 6]), 'G') + countNote(fg2, new Set([4, 5, 6]), 'X')
  if (fg2_1NS > 3) return false

  // FG2-Ausgleiche: E≤2, G≤1, X≤2
  const fg2Aus = countNote(fg2, new Set([1, 2]), 'E') + countNote(fg2, new Set([1]), 'G') + countNote(fg2, new Set([1, 2]), 'X')

  let fg2Ausgleich = false
  if (fg2_1NS > 0) {
    const totalAus = fg2Aus + fg1Aus
    if (totalAus < fg2_1NS) return false
    fg2Ausgleich = true
  }

  // OR-Regel: FG1 und FG2 dürfen unabhängig voneinander ausgleichen
  if (fg1_1NS === 0 && fg2_1NS === 0) return true
  return fg1Ausgleich || fg2Ausgleich
}

// ─── Hauptlogik ────────────────────────────────────────────────────────────

function berechneApoSI20(jahrgang: string | null, faecher: EingabeFach[]): AbschlussTyp {
  let esaErreicht = false
  let prognose: AbschlussTyp = 'OA'

  // ESA prüfen
  if (jahrgang === '10') {
    esaErreicht = true
    prognose = 'ESA'
  } else {
    const esaFG = buildFG_ESA(faecher)
    if (esaFG !== null && isEESA(esaFG.fg1, esaFG.fg2)) {
      esaErreicht = true
      prognose = 'ESA'
    }
  }

  // EESA prüfen (immer, unabhängig von ESA)
  const eesaFG = buildFG_EESA(faecher)
  if (eesaFG !== null && isEESA(eesaFG.fg1, eesaFG.fg2)) {
    prognose = 'EESA'
  }

  // MSA/MSAQ nur wenn Prognose ≠ OA
  if (prognose !== 'OA') {
    const msaF = buildFG_MSA(faecher, false)
    if (msaF !== null) {
      const { passes, checkAusgleich } = isMSA(msaF)
      if (passes || (checkAusgleich && checkMSAAusgleich(msaF))) {
        prognose = 'MSA'
        const msaqF = buildFG_MSA(faecher, true)
        if (msaqF !== null) {
          const { passes: qP, checkAusgleich: qA } = isMSAQ(msaqF)
          if (qP || (qA && checkMSAQAusgleich(msaqF))) prognose = 'MSA_Q'
        }
      }
    }
  }

  // ESA nicht erreicht → OA (überschreibt auch EESA/MSA)
  if (!esaErreicht) prognose = 'OA'

  return prognose
}

// ─── Regelwerk-Export ──────────────────────────────────────────────────────

export const apoSI20Regelwerk: Regelwerk = (input): RegelwerkErgebnis => ({
  empfehlung: berechneApoSI20(input.jahrgang, input.faecher),
  alternativen: [],
  hinweise: [],
  vollstaendig: true,
})
