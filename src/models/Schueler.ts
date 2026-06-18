export interface Schulstammdaten {
  schulform: string
  idSchuljahresabschnitt: number
  abschnitte: SvwsSchuljahresabschnitt[]
}

export interface SvwsSchuljahresabschnitt {
  id: number
  schuljahr: number
  abschnitt: number
}

export interface SvwsSchuelerListeEintrag {
  id: number
  nachname: string
  vorname: string
  idKlasse: number
  idJahrgang: number
  jahrgang: string
  status: number | null
}

export interface SvwsKlasse {
  id: number
  kuerzel: string | null
  idJahrgang: number | null
}

export interface Schueler {
  id: number
  vorname: string
  nachname: string
  jahrgang: string
  klasseId: number
  klasseKuerzel: string
  schuljahresabschnittId: number
  status: number | null
  svwsAbschluss?: string | null
  svwsIstAbschlussPrognose?: boolean | null
  svwsPruefungsOrdnung?: string | null
}

export interface Schuljahresabschnitt {
  id: number
  schuljahr: number
  abschnitt: 1 | 2
  bezeichnung: string
  istAktuell: boolean
}

export interface Klasse {
  id: number
  kuerzel: string
  jahrgang: string
  schuljahresabschnittId: number
}
