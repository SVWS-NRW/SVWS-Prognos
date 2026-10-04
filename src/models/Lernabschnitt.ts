export type Kursart = 'E' | 'G' | 'ZK' | 'LK' | string

export interface SvwsLeistungsdaten {
  id: number
  fachID: number
  kursID: number | null
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
  abschlussart: number | null
  istAbschlussPrognose: boolean | null
  pruefungsOrdnung: string | null
  textErgebnisPruefungsalgorithmus: string | null
  leistungsdaten: SvwsLeistungsdaten[]
}

// GET/PATCH /abschluesse/schueler/lernabschnittsdaten/{id}
export interface SvwsAbschlussdaten {
  idLernabschnitt: number
  pruefungsordnung: string | null
  idAbschluss: number | null
  istAbschlussPrognose: boolean | null
  idAbschlussart: number | null
  textErgebnisPruefungsalgorithmus: string | null
  idAbschlussQuartalsprognose: number | null
  textErgebniseQuartalsprognose: string | null
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
