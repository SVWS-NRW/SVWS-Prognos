import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Schueler, Klasse } from '@/models/Schueler'
import type { SvwsSchuelerListeEintrag, SvwsKlasse } from '@/models/Schueler'
import { loadSchuelerAuswahlliste } from '@/services/svwsService'

export const useSchuelerStore = defineStore('schueler', () => {
  const klassen = ref<Klasse[]>([])
  const schueler = ref<Schueler[]>([])
  const ausgewaehltId = ref<number | null>(null)
  const laedt = ref(false)
  const fehler = ref<string | null>(null)

  const ausgewaehlt = computed(() =>
    schueler.value.find(s => s.id === ausgewaehltId.value) ?? null
  )

  async function loadFuerAbschnitt(
    abschnittId: number,
    jahrgangFilter: string | null,
  ): Promise<void> {
    laedt.value = true
    fehler.value = null
    try {
      const { schueler: svwsSchueler, klassen: svwsKlassen } =
        await loadSchuelerAuswahlliste(abschnittId)

      const gefilterteSchueler = jahrgangFilter
        ? svwsSchueler.filter(s => normalisiereJahrgang(s.jahrgang) === jahrgangFilter)
        : svwsSchueler

      const relevanteKlassenIds = new Set(gefilterteSchueler.map(s => s.idKlasse))
      const relevanteKlassen = svwsKlassen.filter(k => relevanteKlassenIds.has(k.id))

      klassen.value = relevanteKlassen.map(mapKlasse(abschnittId))
      schueler.value = gefilterteSchueler.map(mapSchueler(relevanteKlassen))
      ausgewaehltId.value = null
    } finally {
      laedt.value = false
    }
  }

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
    fehler.value = null
  }

  return {
    klassen, schueler, ausgewaehltId, ausgewaehlt, laedt, fehler,
    loadFuerAbschnitt, setKlassen, setSchueler, waehleSchueler, clear,
  }
})

function normalisiereJahrgang(jg: string): string {
  return String(parseInt(jg, 10))
}

function mapKlasse(abschnittId: number) {
  return (k: SvwsKlasse): Klasse => ({
    id: k.id,
    kuerzel: k.kuerzel ?? `Klasse ${k.id}`,
    jahrgang: '',
    schuljahresabschnittId: abschnittId,
  })
}

function mapSchueler(klassen: SvwsKlasse[]) {
  const klassenMap = new Map(klassen.map(k => [k.id, k]))
  return (s: SvwsSchuelerListeEintrag): Schueler => ({
    id: s.id,
    vorname: s.vorname,
    nachname: s.nachname,
    jahrgang: normalisiereJahrgang(s.jahrgang),
    klasseId: s.idKlasse,
    klasseKuerzel: klassenMap.get(s.idKlasse)?.kuerzel ?? '',
    schuljahresabschnittId: 0,
  })
}
