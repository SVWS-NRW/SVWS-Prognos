import type { FachDaten } from '@/models/Fach'

// Fächer, deren Rolle die APO-SI20-Engine am Kürzel erkennt. Schulen vergeben eigene
// Kürzel (z.B. 'E5' für Englisch), daher wird hier das Statistik-Kürzel verwendet.
const ROLLEN_KUERZEL = new Set(['D', 'E', 'M', 'BI', 'CH', 'PH', 'GL', 'EK', 'GE', 'PK', 'AT', 'AH', 'AW'])

// Wie PM2 (mPM2Main.pas): WP- und EGSN-Fach werden über die Kursart zugeordnet, nicht über das Fach
export function rechenKuerzel(fach: FachDaten, kursart: string | null): string {
  if (kursart === 'WPI') return 'WPU'
  if (kursart === 'EGSN') return 'EGSN'
  const statistik = fach.kuerzelStatistik
  if (statistik && ROLLEN_KUERZEL.has(statistik)) return statistik
  return fach.kuerzel
}

// Belegen mehrere Einträge dieselbe Rolle (z.B. 'E BILI' neben 'E'), bekommt sie der Eintrag,
// dessen Schulkürzel bereits passt; die übrigen behalten ihr Schulkürzel — sonst würden sie
// das Fach in der Berechnung überschreiben.
export function ordneRechenKuerzelZu(eintraege: { fach: FachDaten; kursart: string | null }[]): string[] {
  const kuerzel = eintraege.map(({ fach, kursart }) => rechenKuerzel(fach, kursart))
  const vergeben = new Set(kuerzel.filter((kz, i) => kz === eintraege[i].fach.kuerzel))
  return kuerzel.map((kz, i) => {
    const schulKuerzel = eintraege[i].fach.kuerzel
    if (kz === schulKuerzel) return kz
    if (vergeben.has(kz)) return schulKuerzel
    vergeben.add(kz)
    return kz
  })
}
