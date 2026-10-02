import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Schuljahresabschnitt } from '@/models/Schueler'
import type { Schulstammdaten } from '@/models/Schueler'

export const useSchuljahresabschnittStore = defineStore('schuljahresabschnitt', () => {
  const abschnitte = ref<Schuljahresabschnitt[]>([])
  // Immer der aktuelle Abschnitt aus den Schulstammdaten. Listen und Auswertungen zeigen nur
  // ihn; ein anderer Abschnitt wird nur in der PrognoseView lokal für einen Schüler gewählt.
  const ausgewaehltId = ref<number | null>(null)

  const ausgewaehlt = computed(() =>
    abschnitte.value.find(a => a.id === ausgewaehltId.value) ?? null
  )

  function setFromStammdaten(stammdaten: Schulstammdaten): void {
    abschnitte.value = stammdaten.abschnitte.map(a => ({
      id: a.id,
      schuljahr: a.schuljahr,
      abschnitt: a.abschnitt as 1 | 2,
      bezeichnung: `${a.schuljahr}/${a.schuljahr + 1} · ${a.abschnitt === 1 ? '1. Halbjahr' : '2. Halbjahr'}`,
      istAktuell: a.id === stammdaten.idSchuljahresabschnitt,
    }))
    ausgewaehltId.value = stammdaten.idSchuljahresabschnitt
  }

  function setAbschnitte(liste: Schuljahresabschnitt[]): void {
    abschnitte.value = liste
    const aktuell = liste.find(a => a.istAktuell)
    if (aktuell) ausgewaehltId.value = aktuell.id
  }

  function clear(): void {
    abschnitte.value = []
    ausgewaehltId.value = null
  }

  return { abschnitte, ausgewaehltId, ausgewaehlt, setFromStammdaten, setAbschnitte, clear }
})
