import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Schueler, Klasse } from '@/models/Schueler'
import type { SvwsSchuelerListeEintrag, SvwsKlasse } from '@/models/Schueler'
import { loadSchuelerAuswahlliste, loadSvwsLernabschnittsdatenOderNull } from '@/services/svwsService'
import type { SchuelerAuswahlliste } from '@/services/svwsService'
import type { SvwsLernabschnittsdaten } from '@/models/Lernabschnitt'

// Gleichzeitige Anfragen beim Nachladen der Lernabschnittsdaten (eine pro Schüler, die API hat
// keinen Sammel-Endpunkt)
const PARALLEL = 10

type AbschlussInfo = Pick<Schueler, 'svwsAbschluss' | 'svwsIstAbschlussPrognose' | 'svwsPruefungsOrdnung'>

export const useSchuelerStore = defineStore('schueler', () => {
  const klassen = ref<Klasse[]>([])
  const schueler = ref<Schueler[]>([])
  const ausgewaehltId = ref<number | null>(null)
  const laedt = ref(false)
  const fehler = ref<string | null>(null)
  const abschlussLaedt = ref(false)

  // Zwischenspeicher je Schuljahresabschnitt, damit die Listen beim Zurückkehren nicht alles
  // neu laden. Aktualisiert durch aktualisiereAbschluss(), verworfen durch neu = true oder clear().
  const auswahllisteCache = new Map<number, SchuelerAuswahlliste>()
  const abschlussCache = new Map<number, Map<number, AbschlussInfo>>()
  let listenAbschnitt: number | null = null
  // Jeder Aufruf von ladeAbschlussDaten() erhöht den Zähler; ältere Läufe brechen dann ab
  let ladeLauf = 0

  const ausgewaehlt = computed(() =>
    schueler.value.find(s => s.id === ausgewaehltId.value) ?? null
  )

  async function loadFuerAbschnitt(
    abschnittId: number,
    jahrgangFilter: string | null,
    neu = false,
  ): Promise<void> {
    // Die Liste wird ersetzt: laufendes Nachladen abbrechen, der Aufrufer startet es neu
    ladeLauf++
    abschlussLaedt.value = false
    laedt.value = true
    fehler.value = null
    try {
      let liste = neu ? undefined : auswahllisteCache.get(abschnittId)
      if (!liste) {
        liste = await loadSchuelerAuswahlliste(abschnittId)
        auswahllisteCache.set(abschnittId, liste)
      }
      if (neu) abschlussCache.delete(abschnittId)

      const gefilterteSchueler = jahrgangFilter
        ? liste.schueler.filter(s => normalisiereJahrgang(s.jahrgang) === jahrgangFilter)
        : liste.schueler

      const relevanteKlassenIds = new Set(gefilterteSchueler.map(s => s.idKlasse))
      const relevanteKlassen = liste.klassen.filter(k => relevanteKlassenIds.has(k.id))

      const abschluesse = abschlussCache.get(abschnittId)
      klassen.value = relevanteKlassen.map(mapKlasse(abschnittId))
      schueler.value = gefilterteSchueler.map(mapSchueler(relevanteKlassen))
        .map(sch => ({ ...sch, ...abschluesse?.get(sch.id) }))
      listenAbschnitt = abschnittId
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

  function cacheFuer(abschnittId: number): Map<number, AbschlussInfo> {
    let cache = abschlussCache.get(abschnittId)
    if (!cache) abschlussCache.set(abschnittId, cache = new Map())
    return cache
  }

  // Übernimmt Einträge in einem Schritt in die Liste; einzeln je Antwort würde bei großen
  // Listen (z.B. 1500 Schüler inkl. Ehemaliger) die Tabelle tausendfach neu zeichnen
  function uebernehme(abschnittId: number, infos: Map<number, AbschlussInfo>): void {
    if (infos.size === 0 || listenAbschnitt !== abschnittId) return
    schueler.value = schueler.value.map(sch => {
      const info = infos.get(sch.id)
      return info ? { ...sch, ...info } : sch
    })
  }

  // Lädt für die übergebenen Schüler (Standard: alle der Liste) nach, was für den Abschnitt
  // noch nicht im Zwischenspeicher ist
  async function ladeAbschlussDaten(abschnittId: number, schuelerIds?: number[]): Promise<void> {
    const lauf = ++ladeLauf
    const cache = cacheFuer(abschnittId)
    const offen = (schuelerIds ?? schueler.value.map(sch => sch.id)).filter(id => !cache.has(id))
    abschlussLaedt.value = offen.length > 0
    if (offen.length === 0) return
    let neu = new Map<number, AbschlussInfo>()
    const flush = () => { uebernehme(abschnittId, neu); neu = new Map() }
    const timer = setInterval(() => { if (lauf === ladeLauf) flush() }, 300)
    let naechster = 0
    const arbeiter = async () => {
      while (lauf === ladeLauf && naechster < offen.length) {
        const id = offen[naechster++]
        try {
          const la = await loadSvwsLernabschnittsdatenOderNull(id, abschnittId)
          const info = la ? abschlussInfo(la) : KEIN_LERNABSCHNITT
          if (lauf !== ladeLauf) return
          cache.set(id, info)
          neu.set(id, info)
        } catch {
          // Einzelfehler ignorieren; nicht zwischenspeichern, damit ein neuer Lauf es erneut versucht
        }
      }
    }
    try {
      await Promise.all(Array.from({ length: PARALLEL }, arbeiter))
    } finally {
      clearInterval(timer)
    }
    if (lauf !== ladeLauf) return
    flush()
    abschlussLaedt.value = false
  }

  // Nach Laden/Speichern in der PrognoseView: hält Liste und Zwischenspeicher aktuell
  function aktualisiereAbschluss(abschnittId: number, la: SvwsLernabschnittsdaten): void {
    const info = abschlussInfo(la)
    cacheFuer(abschnittId).set(la.schuelerID, info)
    uebernehme(abschnittId, new Map([[la.schuelerID, info]]))
  }

  function clear(): void {
    ladeLauf++
    auswahllisteCache.clear()
    abschlussCache.clear()
    listenAbschnitt = null
    klassen.value = []
    schueler.value = []
    ausgewaehltId.value = null
    fehler.value = null
    abschlussLaedt.value = false
  }

  return {
    klassen, schueler, ausgewaehltId, ausgewaehlt, laedt, fehler, abschlussLaedt,
    loadFuerAbschnitt, ladeAbschlussDaten, aktualisiereAbschluss, setKlassen, setSchueler, waehleSchueler, clear,
  }
})

const KEIN_LERNABSCHNITT: AbschlussInfo = { svwsAbschluss: null, svwsIstAbschlussPrognose: null, svwsPruefungsOrdnung: null }

function abschlussInfo(la: SvwsLernabschnittsdaten): AbschlussInfo {
  return {
    svwsAbschluss: la.abschluss,
    svwsIstAbschlussPrognose: la.istAbschlussPrognose,
    svwsPruefungsOrdnung: la.pruefungsOrdnung,
  }
}

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
    status: s.status,
  })
}
