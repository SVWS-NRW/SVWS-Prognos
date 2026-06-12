import type { Regelwerk, RegelwerkInput, RegelwerkErgebnis, Schulform } from './types'
import { apoSI20Regelwerk } from './apoSI20'

const regelwerke: Record<Schulform, Regelwerk> = {
  GESAMTSCHULE:  apoSI20Regelwerk,
  SEKUNDARSCHULE: apoSI20Regelwerk,
  PRIMUSSCHULE:   apoSI20Regelwerk,
}

export function berechnePrognose(input: RegelwerkInput): RegelwerkErgebnis {
  const regelwerk = regelwerke[input.schulform]
  return regelwerk(input)
}
