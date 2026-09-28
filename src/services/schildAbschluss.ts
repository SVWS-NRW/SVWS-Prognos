import type { AbschlussTyp } from '@/models/PrognoseErgebnis'

// Abschluss-Kürzel aus /schild3/pruefungsordnungen/optionen (OP_Krz). GE, SK und PS
// verwenden alle die Prüfungsordnung GE/APO-SI20/5-10 und damit das Präfix GE/APO-SI20/.
// Die Schulform steht dort nur in PO_Schulform bzw. OP_Schulformen, nicht im Kürzel.
const APO_SI20_PRAEFIX = 'GE/APO-SI20/'
export const APO_SI20_PO = APO_SI20_PRAEFIX + '5-10'

const SCHILD_KUERZEL: Record<AbschlussTyp, string> = {
  OA: 'OA',
  ESA: 'ESA',
  EESA: 'EESA',
  MSA: 'MSA',
  MSA_Q: 'MSAQ-E',
}

// Kürzel (letzter Teil nach '/') bereits gespeicherter Abschlüsse, auch aus APO-SI05
const KUERZEL_ZU_ABSCHLUSS: Record<string, AbschlussTyp> = {
  OA: 'OA',
  ESA: 'ESA', HA: 'ESA', HA9: 'ESA',
  EESA: 'EESA', HA10: 'EESA',
  MSA: 'MSA', FOR: 'MSA',
  'MSAQ-E': 'MSA_Q', 'MSAQ-Q': 'MSA_Q', 'FORQ-E': 'MSA_Q', 'FORQ-Q': 'MSA_Q', FORQ: 'MSA_Q',
}

export const ABSCHLUSS_KURZ: Record<AbschlussTyp, string> = {
  OA: 'OA', ESA: 'ESA', EESA: 'EESA', MSA: 'MSA', MSA_Q: 'MSA-Q',
}

// Vorübergehend aus: Der SVWS-Server prüft 'abschluss' beim PATCH gegen den ASD-Katalog
// SchulabschlussAllgemeinbildend und lehnt Schild-Kürzel wie GE/APO-SI20/ESA mit 409 ab.
// Wieder einschalten, sobald der Server die Kürzel aus Prueford_Optionen akzeptiert.
export const ABSCHLUSS_SPEICHERN = false

export function istApoSI20(pruefungsOrdnung: string | null | undefined): boolean {
  return !!pruefungsOrdnung && pruefungsOrdnung.includes('/APO-SI20/')
}

// Sonderpädagogische Förderung (z.B. S/AOSF-SI05/5-10): wird von Prognos nicht überschrieben
export function istAOSF(pruefungsOrdnung: string | null | undefined): boolean {
  return !!pruefungsOrdnung && pruefungsOrdnung.includes('/AOSF')
}

// Wert für das Feld 'abschluss' der Lernabschnittsdaten (PM2: PMAbschlusstoSchILDAbschluss)
export function abschlussZuSchild(abschluss: AbschlussTyp): string {
  return APO_SI20_PRAEFIX + SCHILD_KUERZEL[abschluss]
}

// Wert für das Feld 'abschlussart': 1 = mit Abschluss, 0 = ohne Abschluss
export function abschlussartZuSchild(abschluss: AbschlussTyp): 0 | 1 {
  return abschluss === 'OA' ? 0 : 1
}

export function schildZuAbschluss(schildAbschluss: string | null | undefined): AbschlussTyp | null {
  if (!schildAbschluss) return null
  const kuerzel = schildAbschluss.split('/').pop() ?? ''
  return KUERZEL_ZU_ABSCHLUSS[kuerzel] ?? null
}
