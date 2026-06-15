export interface GEAbschlussFach {
  kuerzel: string
  bezeichnung: string | null
  note: number | null
  istFremdsprache: boolean | null
  kursart: string | null
}

export interface GEAbschlussFaecher {
  schuljahr: number
  abschnitt: number
  jahrgang: string | null
  faecher: (GEAbschlussFach | null)[]
}
