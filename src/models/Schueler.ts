export interface Schueler {
  id: number
  vorname: string
  nachname: string
  klasseId: number
  klasseKuerzel: string
  schuljahresabschnittId: number
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
