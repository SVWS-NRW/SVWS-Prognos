import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadFaecher as apiFetchFaecher } from '@/services/svwsService'
import type { FachDaten } from '@/models/Fach'

export const useFaecherStore = defineStore('faecher', () => {
  const faecher = ref<FachDaten[]>([])
  const faecherMap = ref(new Map<number, FachDaten>())
  const loaded = ref(false)

  async function ensureLoaded(): Promise<void> {
    if (loaded.value) return
    const liste = await apiFetchFaecher()
    faecher.value = liste
    faecherMap.value = new Map(liste.map(f => [f.id, f]))
    loaded.value = true
  }

  function clear(): void {
    faecher.value = []
    faecherMap.value = new Map()
    loaded.value = false
  }

  return { faecher, faecherMap, loaded, ensureLoaded, clear }
})
