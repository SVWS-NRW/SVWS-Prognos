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

// IDs aus dem ASD-Katalog SchulabschlussAllgemeinbildend (data/openAPI/allinone.json), gültig ab
// Schuljahr 2022. Ältere Einträge (HA9 = 2000, HA10 = 5000) entfallen: Jg. 8 nach APO-SI20 gibt es
// erst ab 2023/24. Der Server setzt eine im Schuljahr ungültige ID beim PATCH stillschweigend auf null.
const KATALOG_ID: Record<AbschlussTyp, number> = {
  OA: 0,
  ESA: 2001,
  EESA: 5001,
  MSA: 10000,
  MSA_Q: 11000,
}

export function istApoSI20(pruefungsOrdnung: string | null | undefined): boolean {
  return !!pruefungsOrdnung && pruefungsOrdnung.includes('/APO-SI20/')
}

// Sonderpädagogische Förderung (z.B. S/AOSF-SI05/5-10): wird von Prognos nicht überschrieben
export function istAOSF(pruefungsOrdnung: string | null | undefined): boolean {
  return !!pruefungsOrdnung && pruefungsOrdnung.includes('/AOSF')
}

// Wert, den der Server aus idAbschluss in das Feld 'abschluss' der Lernabschnittsdaten schreibt
// (PM2: PMAbschlusstoSchILDAbschluss)
export function abschlussZuSchild(abschluss: AbschlussTyp): string {
  return APO_SI20_PRAEFIX + SCHILD_KUERZEL[abschluss]
}

// Wert für 'idAbschluss' bzw. 'idAbschlussQuartalsprognose' (PATCH /abschluesse/schueler/lernabschnittsdaten)
export function abschlussZuKatalogId(abschluss: AbschlussTyp): number {
  return KATALOG_ID[abschluss]
}

// Wert für 'idAbschlussart': 1 = Abschluss erreicht, 2 = ohne Abschluss
// (0 = Jahrgang ohne Abschluss und 3 = ohne Abschluss mit Nachprüfung vergibt Prognos nicht)
export function abschlussartZuSchild(abschluss: AbschlussTyp): 1 | 2 {
  return abschluss === 'OA' ? 2 : 1
}

export function schildZuAbschluss(schildAbschluss: string | null | undefined): AbschlussTyp | null {
  if (!schildAbschluss) return null
  const kuerzel = schildAbschluss.split('/').pop() ?? ''
  return KUERZEL_ZU_ABSCHLUSS[kuerzel] ?? null
}
