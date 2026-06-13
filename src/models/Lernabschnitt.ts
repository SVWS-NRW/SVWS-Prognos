export type Kursart = 'E' | 'G' | 'ZK' | 'LK' | string

export interface SvwsLeistungsdaten {
  id: number
  fachID: number
  kursart: string | null
  note: string | null
  noteQuartal: string | null
}

export interface SvwsLernabschnittsdaten {
  id: number
  schuelerID: number
  schuljahresabschnitt: number
  noteLernbereichNW: number | null
  noteLernbereichGSbzwAL: number | null
  abschluss: string | null
  istAbschlussPrognose: boolean | null
  leistungsdaten: SvwsLeistungsdaten[]
}

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

export interface NotenbildSchueler {
  schuelerId: number
  lernabschnitte: Lernabschnitt[]
}
