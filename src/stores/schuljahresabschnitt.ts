import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Schuljahresabschnitt } from '@/models/Schueler'

export const useSchuljahresabschnittStore = defineStore('schuljahresabschnitt', () => {
  const abschnitte = ref<Schuljahresabschnitt[]>([])
  const ausgewaehltId = ref<number | null>(null)

  const ausgewaehlt = computed(() =>
    abschnitte.value.find(a => a.id === ausgewaehltId.value) ?? null
  )

  function setAbschnitte(liste: Schuljahresabschnitt[]): void {
    abschnitte.value = liste
    const aktuell = liste.find(a => a.istAktuell)
    if (aktuell) ausgewaehltId.value = aktuell.id
  }

  function waehleAbschnitt(id: number): void {
    ausgewaehltId.value = id
  }

  function clear(): void {
    abschnitte.value = []
    ausgewaehltId.value = null
  }

  return { abschnitte, ausgewaehltId, ausgewaehlt, setAbschnitte, waehleAbschnitt, clear }
})
