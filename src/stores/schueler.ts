import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Schueler, Klasse } from '@/models/Schueler'

export const useSchuelerStore = defineStore('schueler', () => {
  const klassen = ref<Klasse[]>([])
  const schueler = ref<Schueler[]>([])
  const ausgewaehltId = ref<number | null>(null)

  const ausgewaehlt = computed(() =>
    schueler.value.find(s => s.id === ausgewaehltId.value) ?? null
  )

  function setKlassen(liste: Klasse[]): void {
    klassen.value = liste
  }

  function setSchueler(liste: Schueler[]): void {
    schueler.value = liste
    ausgewaehltId.value = null
  }

  function waehleSchueler(id: number): void {
    ausgewaehltId.value = id
  }

  function clear(): void {
    klassen.value = []
    schueler.value = []
    ausgewaehltId.value = null
  }

  return { klassen, schueler, ausgewaehltId, ausgewaehlt, setKlassen, setSchueler, waehleSchueler, clear }
})
