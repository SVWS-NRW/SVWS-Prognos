export type AbschlussTyp = 'OA' | 'ESA' | 'EESA' | 'MSA' | 'MSA_Q'

export type BerechnungsStand = 'berechnet' | 'unvollstaendig' | 'fehler' | 'offen'

export interface PrognoseErgebnis {
  schuelerId: number
  stand: BerechnungsStand
  empfehlung: AbschlussTyp
  alternativen: AbschlussTyp[]
  hinweise: PrognoseHinweis[]
  berechnetAm: string
  bestaetigt: boolean
  bestaetigtAm?: string
}

export interface PrognoseHinweis {
  schwere: 'info' | 'warnung' | 'kritisch'
  text: string
  regelId: string
}
