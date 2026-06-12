import type { AbschlussTyp, PrognoseHinweis } from '@/models/PrognoseErgebnis'

export type Schulform = 'GESAMTSCHULE' | 'SEKUNDARSCHULE' | 'PRIMUSSCHULE'

export interface EingabeFach {
  kuerzel: string
  note: number
  kursart: 'E' | 'G' | 'Sonstige'
  bezeichnung?: string
  istFremdsprache?: boolean
}

export interface RegelwerkInput {
  jahrgang: string | null
  schulform: Schulform
  faecher: EingabeFach[]
}

export interface RegelwerkErgebnis {
  empfehlung: AbschlussTyp
  alternativen: AbschlussTyp[]
  hinweise: PrognoseHinweis[]
  vollstaendig: boolean
}

export type Regelwerk = (input: RegelwerkInput) => RegelwerkErgebnis
