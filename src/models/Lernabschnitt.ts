export type Kursart = 'E' | 'G' | 'ZK' | 'LK' | string

export interface Leistung {
  fachId: number
  fachKuerzel: string
  fachBezeichnung: string
  kursart: Kursart
  note: number | null
  istPflichtfach: boolean
}

export interface Lernabschnitt {
  id: number
  schuelerId: number
  schuljahresabschnittId: number
  schuljahr: number
  abschnitt: 1 | 2
  fehlstundenGesamt: number
  fehlstundenUnentschuldigt: number
  leistungen: Leistung[]
}

export interface NotenbidSchueler {
  schuelerId: number
  lernabschnitte: Lernabschnitt[]
}
