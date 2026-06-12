import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PrognoseErgebnis } from '@/models/PrognoseErgebnis'
import type { NotenbildSchueler } from '@/models/Lernabschnitt'

export const usePrognoseStore = defineStore('prognose', () => {
  const notenbilder = ref<Map<number, NotenbildSchueler>>(new Map())
  const ergebnisse = ref<Map<number, PrognoseErgebnis>>(new Map())
  const laedt = ref(false)
  const schreibt = ref(false)

  function setNotenbild(schuelerId: number, daten: NotenbildSchueler): void {
    notenbilder.value.set(schuelerId, daten)
  }

  function setErgebnis(ergebnis: PrognoseErgebnis): void {
    ergebnisse.value.set(ergebnis.schuelerId, ergebnis)
  }

  function getErgebnis(schuelerId: number): PrognoseErgebnis | undefined {
    return ergebnisse.value.get(schuelerId)
  }

  function getNotenbild(schuelerId: number): NotenbildSchueler | undefined {
    return notenbilder.value.get(schuelerId)
  }

  function clear(): void {
    notenbilder.value.clear()
    ergebnisse.value.clear()
  }

  return { laedt, schreibt, setNotenbild, setErgebnis, getErgebnis, getNotenbild, clear }
})
