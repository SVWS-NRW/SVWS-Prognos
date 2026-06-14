<template>
  <div class="page">
    <div class="toolbar">
      <Button icon="pi pi-arrow-left" text size="small" @click="router.back()" />
      <span class="toolbar-title">Auswertungen</span>
      <div class="toolbar-sep" />
      <Select
        v-model="selectedAbschnittId"
        :options="abschnittOptionen"
        option-label="label"
        option-value="value"
        size="small"
        class="abschnitt-select"
        @update:model-value="wechsleAbschnitt"
      />
      <ThemeToggle />
    </div>

    <div v-if="laedt" class="status-hint">
      <i class="pi pi-spin pi-spinner" />
      Lade Schülerdaten…
    </div>

    <Message v-else-if="fehler" severity="error">{{ fehler }}</Message>

    <template v-else>
      <Tabs v-model:value="aktiverTab" class="auswertungen-tabs">
        <TabList>
          <Tab value="verteilung">Abschlussverteilung</Tab>
          <Tab value="risiko">Risikofälle ({{ risikofaelle.length }})</Tab>
          <Tab value="offen">Offene Prognosen ({{ offenePrognosen.length }})</Tab>
        </TabList>

        <TabPanels class="tab-panels">

          <!-- Tab 1: Abschlussverteilung -->
          <TabPanel value="verteilung" class="tab-panel-body">
            <div v-if="schuelerStore.abschlussLaedt" class="status-hint">
              <i class="pi pi-spin pi-spinner" />
              Lade Abschlussdaten…
            </div>
            <div v-else class="table-wrapper">
              <table class="auswertung-table">
                <thead>
                  <tr>
                    <th>Klasse</th>
                    <th class="th-num">OA</th>
                    <th class="th-num">ESA</th>
                    <th class="th-num">EESA</th>
                    <th class="th-num">MSA</th>
                    <th class="th-num">MSA/Q</th>
                    <th class="th-num">Offen</th>
                    <th class="th-num">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="gruppe in verteilungNachJahrgang" :key="gruppe.jahrgang">
                    <tr class="tr-jahrgang">
                      <td colspan="8">Jahrgang {{ gruppe.jahrgang }}</td>
                    </tr>
                    <tr v-for="zeile in gruppe.zeilen" :key="zeile.klasseKuerzel" class="tr-klasse">
                      <td class="td-klasse">{{ zeile.klasseKuerzel }}</td>
                      <td class="td-num" :class="{ 'num-kritisch': zeile.oa > 0 }">{{ zeile.oa || '–' }}</td>
                      <td class="td-num" :class="{ 'num-warn': zeile.esa > 0 }">{{ zeile.esa || '–' }}</td>
                      <td class="td-num" :class="{ 'num-warn': zeile.eesa > 0 }">{{ zeile.eesa || '–' }}</td>
                      <td class="td-num">{{ zeile.msa || '–' }}</td>
                      <td class="td-num">{{ zeile.msaQ || '–' }}</td>
                      <td class="td-num td-offen">{{ zeile.offen || '–' }}</td>
                      <td class="td-num td-gesamt">{{ zeile.gesamt }}</td>
                    </tr>
                    <tr class="tr-summe">
                      <td>Summe Jg. {{ gruppe.jahrgang }}</td>
                      <td class="td-num" :class="{ 'num-kritisch': gruppe.summe.oa > 0 }">{{ gruppe.summe.oa || '–' }}</td>
                      <td class="td-num" :class="{ 'num-warn': gruppe.summe.esa > 0 }">{{ gruppe.summe.esa || '–' }}</td>
                      <td class="td-num" :class="{ 'num-warn': gruppe.summe.eesa > 0 }">{{ gruppe.summe.eesa || '–' }}</td>
                      <td class="td-num">{{ gruppe.summe.msa || '–' }}</td>
                      <td class="td-num">{{ gruppe.summe.msaQ || '–' }}</td>
                      <td class="td-num td-offen">{{ gruppe.summe.offen || '–' }}</td>
                      <td class="td-num td-gesamt">{{ gruppe.summe.gesamt }}</td>
                    </tr>
                  </template>
                  <tr v-if="verteilungNachJahrgang.length === 0">
                    <td colspan="8" class="td-empty">Keine Schüler geladen.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabPanel>

          <!-- Tab 2: Risikofälle (OA / ESA / EESA) -->
          <TabPanel value="risiko" class="tab-panel-body">
            <div v-if="schuelerStore.abschlussLaedt" class="status-hint">
              <i class="pi pi-spin pi-spinner" />
              Lade Abschlussdaten…
            </div>
            <div v-else-if="risikofaelle.length === 0" class="status-hint">
              <i class="pi pi-check-circle status-ok" />
              Keine Risikofälle gefunden.
            </div>
            <div v-else class="table-wrapper">
              <table class="auswertung-table table-fixed">
                <colgroup>
                  <col :style="{ width: spaltenBreitenRisiko[0] + 'px' }" />
                  <col :style="{ width: spaltenBreitenRisiko[1] + 'px' }" />
                  <col :style="{ width: spaltenBreitenRisiko[2] + 'px' }" />
                  <col :style="{ width: spaltenBreitenRisiko[3] + 'px' }" />
                  <col :style="{ width: spaltenBreitenRisiko[4] + 'px' }" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>Nachname<div class="col-resize-handle" @mousedown.prevent="startResize($event, 'risiko', 0)" /></th>
                    <th>Vorname<div class="col-resize-handle" @mousedown.prevent="startResize($event, 'risiko', 1)" /></th>
                    <th>Klasse<div class="col-resize-handle" @mousedown.prevent="startResize($event, 'risiko', 2)" /></th>
                    <th>Jg.<div class="col-resize-handle" @mousedown.prevent="startResize($event, 'risiko', 3)" /></th>
                    <th>Abschluss<div class="col-resize-handle" @mousedown.prevent="startResize($event, 'risiko', 4)" /></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="s in risikofaelle"
                    :key="s.id"
                    class="schueler-row"
                    @click="navigiereZurPrognose(s.id)"
                  >
                    <td class="td-name">{{ s.nachname }}</td>
                    <td>{{ s.vorname }}</td>
                    <td class="td-muted">{{ s.klasseKuerzel }}</td>
                    <td class="td-muted">{{ s.jahrgang }}</td>
                    <td>
                      <Tag
                        :value="formatAbschluss(s.svwsAbschluss)"
                        :severity="abschlussZuSeverity(s.svwsAbschluss)"
                        size="small"
                      />
                    </td>
                    <td class="td-action"><i class="pi pi-chevron-right action-icon" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabPanel>

          <!-- Tab 3: Offene Prognosen -->
          <TabPanel value="offen" class="tab-panel-body">
            <div v-if="schuelerStore.abschlussLaedt" class="status-hint">
              <i class="pi pi-spin pi-spinner" />
              Lade Abschlussdaten…
            </div>
            <div v-else-if="offenePrognosen.length === 0" class="status-hint">
              <i class="pi pi-check-circle status-ok" />
              Für alle Schüler sind Prognosen gespeichert.
            </div>
            <div v-else class="table-wrapper">
              <table class="auswertung-table table-fixed">
                <colgroup>
                  <col :style="{ width: spaltenBreitenOffen[0] + 'px' }" />
                  <col :style="{ width: spaltenBreitenOffen[1] + 'px' }" />
                  <col :style="{ width: spaltenBreitenOffen[2] + 'px' }" />
                  <col :style="{ width: spaltenBreitenOffen[3] + 'px' }" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>Nachname<div class="col-resize-handle" @mousedown.prevent="startResize($event, 'offen', 0)" /></th>
                    <th>Vorname<div class="col-resize-handle" @mousedown.prevent="startResize($event, 'offen', 1)" /></th>
                    <th>Klasse<div class="col-resize-handle" @mousedown.prevent="startResize($event, 'offen', 2)" /></th>
                    <th>Jg.<div class="col-resize-handle" @mousedown.prevent="startResize($event, 'offen', 3)" /></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="s in offenePrognosen"
                    :key="s.id"
                    class="schueler-row"
                    @click="navigiereZurPrognose(s.id)"
                  >
                    <td class="td-name">{{ s.nachname }}</td>
                    <td>{{ s.vorname }}</td>
                    <td class="td-muted">{{ s.klasseKuerzel }}</td>
                    <td class="td-muted">{{ s.jahrgang }}</td>
                    <td class="td-action"><i class="pi pi-chevron-right action-icon" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabPanel>

        </TabPanels>
      </Tabs>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useSchuelerStore } from '@/stores/schueler'
import { useSchuljahresabschnittStore } from '@/stores/schuljahresabschnitt'

const router = useRouter()
const schuelerStore = useSchuelerStore()
const abschnittStore = useSchuljahresabschnittStore()

const laedt = ref(false)
const fehler = ref<string | null>(null)
const aktiverTab = ref('verteilung')
const selectedAbschnittId = ref<number | null>(abschnittStore.ausgewaehltId)

// Spaltenbreiten: Nachname, Vorname, Klasse, Jg., [Abschluss]
const spaltenBreitenRisiko = ref([150, 130, 85, 50, 110])
const spaltenBreitenOffen = ref([150, 130, 85, 50])

type TabelleId = 'risiko' | 'offen'
interface ResizeState { tabelle: TabelleId; colIdx: number; startX: number; startWidth: number }
const resizing = ref<ResizeState | null>(null)

function getSpalten(t: TabelleId) {
  return t === 'risiko' ? spaltenBreitenRisiko.value : spaltenBreitenOffen.value
}
function startResize(event: MouseEvent, tabelle: TabelleId, colIdx: number) {
  resizing.value = { tabelle, colIdx, startX: event.clientX, startWidth: getSpalten(tabelle)[colIdx] }
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
}
function onMouseMove(event: MouseEvent) {
  if (!resizing.value) return
  const delta = event.clientX - resizing.value.startX
  getSpalten(resizing.value.tabelle)[resizing.value.colIdx] = Math.max(30, resizing.value.startWidth + delta)
}
function onMouseUp() {
  if (!resizing.value) return
  resizing.value = null
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

const abschnittOptionen = computed(() =>
  abschnittStore.abschnitte.map(a => ({ label: a.bezeichnung, value: a.id }))
)

// ---------------------------------------------------------------------------
// Abschluss-Hilfsfunktionen
// ---------------------------------------------------------------------------

type AbschlussKat = 'OA' | 'ESA' | 'EESA' | 'MSA' | 'MSA_Q' | 'offen'

function svwsZuKat(svwsAbschluss: string | null | undefined): AbschlussKat {
  if (!svwsAbschluss) return 'offen'
  const kuerzel = svwsAbschluss.split('/').slice(-1)[0] ?? ''
  if (kuerzel === 'OA') return 'OA'
  if (kuerzel === 'HA' || kuerzel === 'ESA') return 'ESA'
  if (kuerzel === 'HA10' || kuerzel === 'EESA') return 'EESA'
  if (kuerzel === 'FOR') return 'MSA'
  if (kuerzel === 'FORQ-E' || kuerzel === 'FORQ') return 'MSA_Q'
  return 'offen'
}

const ABSCHLUSS_LABEL: Record<string, string> = {
  FOR: 'MSA', 'FORQ-E': 'MSA/Q', FORQ: 'MSA/Q', HA10: 'EESA', HA: 'ESA', OA: 'OA', ESA: 'ESA', EESA: 'EESA',
}

function formatAbschluss(svwsAbschluss: string | null | undefined): string {
  if (!svwsAbschluss) return '–'
  const kuerzel = svwsAbschluss.split('/').slice(-1)[0] ?? svwsAbschluss
  return ABSCHLUSS_LABEL[kuerzel] ?? kuerzel
}

function abschlussZuSeverity(svwsAbschluss: string | null | undefined): 'danger' | 'warn' | 'secondary' {
  const kat = svwsZuKat(svwsAbschluss)
  if (kat === 'OA') return 'danger'
  if (kat === 'ESA' || kat === 'EESA') return 'warn'
  return 'secondary'
}

// ---------------------------------------------------------------------------
// Tab 1: Abschlussverteilung nach Jahrgang / Klasse
// ---------------------------------------------------------------------------

interface KlassenZeile {
  klasseKuerzel: string
  oa: number; esa: number; eesa: number; msa: number; msaQ: number; offen: number; gesamt: number
}

interface JahrgangGruppe {
  jahrgang: string
  zeilen: KlassenZeile[]
  summe: KlassenZeile
}

function zaehleKategorien(liste: typeof schuelerStore.schueler): Omit<KlassenZeile, 'klasseKuerzel'> {
  let oa = 0, esa = 0, eesa = 0, msa = 0, msaQ = 0, offen = 0
  for (const s of liste) {
    const kat = svwsZuKat(s.svwsAbschluss)
    if (kat === 'OA') oa++
    else if (kat === 'ESA') esa++
    else if (kat === 'EESA') eesa++
    else if (kat === 'MSA') msa++
    else if (kat === 'MSA_Q') msaQ++
    else offen++
  }
  return { oa, esa, eesa, msa, msaQ, offen, gesamt: liste.length }
}

const verteilungNachJahrgang = computed((): JahrgangGruppe[] => {
  // Nur Schüler einbeziehen, deren Abschlussdaten geladen sind
  const geladen = schuelerStore.schueler.filter(s => s.svwsAbschluss !== undefined)
  const jahrgaenge = [...new Set(geladen.map(s => s.jahrgang))].sort((a, b) => Number(a) - Number(b))

  return jahrgaenge.map(jg => {
    const imJg = geladen.filter(s => s.jahrgang === jg)
    const klassen = [...new Set(imJg.map(s => s.klasseKuerzel))].sort()
    const zeilen: KlassenZeile[] = klassen.map(kl => ({
      klasseKuerzel: kl,
      ...zaehleKategorien(imJg.filter(s => s.klasseKuerzel === kl)),
    }))
    return { jahrgang: jg, zeilen, summe: { klasseKuerzel: '', ...zaehleKategorien(imJg) } }
  })
})

// ---------------------------------------------------------------------------
// Tab 2: Risikofälle — OA, ESA, EESA
// ---------------------------------------------------------------------------

const RISIKO_REIHENFOLGE: AbschlussKat[] = ['OA', 'ESA', 'EESA']

const risikofaelle = computed(() =>
  schuelerStore.schueler
    .filter(s => {
      const kat = svwsZuKat(s.svwsAbschluss)
      return s.svwsAbschluss !== undefined && RISIKO_REIHENFOLGE.includes(kat)
    })
    .sort((a, b) =>
      RISIKO_REIHENFOLGE.indexOf(svwsZuKat(a.svwsAbschluss)) -
      RISIKO_REIHENFOLGE.indexOf(svwsZuKat(b.svwsAbschluss)) ||
      Number(a.jahrgang) - Number(b.jahrgang) ||
      a.klasseKuerzel.localeCompare(b.klasseKuerzel) ||
      a.nachname.localeCompare(b.nachname)
    )
)

// ---------------------------------------------------------------------------
// Tab 3: Offene Prognosen — kein Abschluss-Prognose-Flag in SVWS gesetzt
// ---------------------------------------------------------------------------

const offenePrognosen = computed(() =>
  schuelerStore.schueler
    .filter(s => s.svwsIstAbschlussPrognose !== undefined && s.svwsIstAbschlussPrognose !== true)
    .sort((a, b) =>
      Number(a.jahrgang) - Number(b.jahrgang) ||
      a.klasseKuerzel.localeCompare(b.klasseKuerzel) ||
      a.nachname.localeCompare(b.nachname)
    )
)

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

function navigiereZurPrognose(schuelerId: number) {
  schuelerStore.waehleSchueler(schuelerId)
  router.push({ name: 'prognose', params: { id: String(schuelerId) } })
}

// ---------------------------------------------------------------------------
// Laden
// ---------------------------------------------------------------------------

async function laden(abschnittId: number) {
  laedt.value = true
  fehler.value = null
  try {
    await schuelerStore.loadFuerAbschnitt(abschnittId, null)
    schuelerStore.ladeAbschlussDaten(abschnittId)
  } catch (e: any) {
    fehler.value = e?.message ?? 'Schülerdaten konnten nicht geladen werden.'
  } finally {
    laedt.value = false
  }
}

async function wechsleAbschnitt(id: number) {
  abschnittStore.waehleAbschnitt(id)
  await laden(id)
}

onMounted(async () => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  const abschnittId = abschnittStore.ausgewaehltId
  if (!abschnittId) {
    fehler.value = 'Kein Schuljahresabschnitt verfügbar.'
    return
  }
  selectedAbschnittId.value = abschnittId
  await laden(abschnittId)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
.page {
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.toolbar-title { font-size: 0.9rem; font-weight: 600; }
.toolbar-sep { flex: 1; }
.abschnitt-select { width: 16rem; }

.status-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
  padding: 1rem 0;
}
.status-ok { color: var(--p-green-500); }

/* Tabs: flex-Kette damit table-wrapper scrollen kann */
.auswertungen-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

:deep(.p-tabpanels) {
  flex: 1;
  min-height: 0;
  padding: 0.75rem 0 0;
}

.tab-panel-body {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Scrollbare Tabellen-Wrapper */
.table-wrapper {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.4rem;
}

/* Tabellen-Grundstil */
.auswertung-table {
  border-collapse: collapse;
  font-size: 0.8rem;
  width: 100%;
}

.auswertung-table th {
  text-align: left;
  padding: 0.3rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
  border-bottom: 1px solid var(--p-content-border-color);
  position: sticky;
  top: 0;
  background: var(--p-content-background);
  z-index: 1;
  white-space: nowrap;
}

.auswertung-table td {
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid var(--p-content-border-color);
  vertical-align: middle;
}

.th-num { text-align: right; }
.td-num { text-align: right; font-variant-numeric: tabular-nums; }
.td-gesamt { font-weight: 600; }
.td-offen { color: var(--p-text-muted-color); }
.num-warn { color: var(--p-orange-500); font-weight: 600; }
.num-kritisch { color: var(--p-red-500); font-weight: 600; }

/* Jahrgangs-Trenner */
.tr-jahrgang td {
  font-weight: 600;
  font-size: 0.72rem;
  color: var(--p-text-muted-color);
  background: var(--p-highlight-background);
  padding: 0.25rem 0.75rem;
}

/* Summenzeil */
.tr-summe td {
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  border-top: 2px solid var(--p-content-border-color);
  background: var(--p-highlight-background);
}

.tr-klasse:hover { background: var(--p-highlight-background); }
.tr-klasse:last-child td { border-bottom: none; }

/* Schüler-Zeilen (Risiko / Offen) */
.schueler-row { cursor: pointer; }
.schueler-row:hover { background: var(--p-highlight-background); }
.schueler-row:last-child td { border-bottom: none; }

.td-name { font-weight: 500; }
.td-klasse { color: var(--p-text-muted-color); }
.td-muted { color: var(--p-text-muted-color); }
.td-action { text-align: right; }
.action-icon { font-size: 0.7rem; color: var(--p-text-muted-color); }

.td-empty {
  text-align: center;
  padding: 1.5rem;
  color: var(--p-text-muted-color);
  font-style: italic;
}

/* Verstellbare Spalten */
.table-fixed {
  table-layout: fixed;
}
.table-fixed th {
  user-select: none;
  overflow: hidden;
}
.table-fixed td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-resize-handle {
  position: absolute;
  right: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 2px;
  cursor: col-resize;
  background: var(--p-content-border-color);
  opacity: 0.6;
  transition: opacity 0.15s, background 0.15s;
}
.col-resize-handle:hover {
  background: var(--p-primary-color);
  opacity: 1;
}
</style>
