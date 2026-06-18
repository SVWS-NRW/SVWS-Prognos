<template>
  <div class="page">
    <div class="toolbar">
      <Button icon="pi pi-arrow-left" text size="small" @click="router.push({ name: 'dashboard' })" />
      <span class="toolbar-title">Jahrgang {{ jg }}</span>
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
      <Select
        v-model="selectedStatus"
        :options="statusOptionen"
        option-label="label"
        option-value="value"
        size="small"
        class="status-select"
      />
      <Select
        v-model="selectedKlasseId"
        :options="klassenOptionen"
        option-label="label"
        option-value="value"
        placeholder="Alle Klassen"
        show-clear
        size="small"
        class="klassen-select"
      />
      <ThemeToggle />
    </div>

    <div v-if="laedt" class="status-hint">
      <i class="pi pi-spin pi-spinner" />
      Lade Schülerdaten…
    </div>

    <Message v-else-if="fehler" severity="error">{{ fehler }}</Message>

    <template v-else>
      <div class="tabelle-header">
        <span class="tabelle-info">{{ gefiltert.length }} Schüler</span>
      </div>

      <div class="table-wrapper">
        <table class="schueler-table">
          <colgroup>
            <col :style="{ width: spaltenBreiten[0] + 'px' }" />
            <col :style="{ width: spaltenBreiten[1] + 'px' }" />
            <col :style="{ width: spaltenBreiten[2] + 'px' }" />
            <col :style="{ width: spaltenBreiten[3] + 'px' }" />
            <col :style="{ width: spaltenBreiten[4] + 'px' }" />
            <col :style="{ width: spaltenBreiten[5] + 'px' }" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>
                Nachname
                <div class="col-resize-handle" @mousedown.prevent="startResize($event, 0)" />
              </th>
              <th>
                Vorname
                <div class="col-resize-handle" @mousedown.prevent="startResize($event, 1)" />
              </th>
              <th>
                Klasse
                <div class="col-resize-handle" @mousedown.prevent="startResize($event, 2)" />
              </th>
              <th>
                Abschluss
                <div class="col-resize-handle" @mousedown.prevent="startResize($event, 3)" />
              </th>
              <th>
                Prüfungsordnung
                <div class="col-resize-handle" @mousedown.prevent="startResize($event, 4)" />
              </th>
              <th>
                ist Prognose
                <div class="col-resize-handle" @mousedown.prevent="startResize($event, 5)" />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in gefiltert"
              :key="s.id"
              class="schueler-row"
              @click="navigiereZurPrognose(s.id)"
            >
              <td class="td-name">{{ s.nachname }}</td>
              <td>{{ s.vorname }}</td>
              <td class="td-klasse">{{ s.klasseKuerzel }}</td>
              <td class="td-abschluss">{{ formatAbschluss(s) }}</td>
              <td class="td-po">{{ formatPruefungsordnung(s) }}</td>
              <td class="td-prognose">{{ formatPrognose(s) }}</td>
              <td class="td-action">
                <i class="pi pi-chevron-right action-icon" />
              </td>
            </tr>
            <tr v-if="gefiltert.length === 0">
              <td colspan="7" class="td-empty">Keine Schüler für diesen Filter gefunden.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Message from 'primevue/message'
import { useSchuelerStore } from '@/stores/schueler'
import { useSchuljahresabschnittStore } from '@/stores/schuljahresabschnitt'
import ThemeToggle from '@/components/ThemeToggle.vue'

const route = useRoute()
const router = useRouter()
const jg = route.params.jg as string

const schuelerStore = useSchuelerStore()
const abschnittStore = useSchuljahresabschnittStore()

const laedt = ref(false)
const fehler = ref<string | null>(null)
const selectedKlasseId = ref<number | null>(null)
const selectedAbschnittId = ref<number | null>(abschnittStore.ausgewaehltId)
const selectedStatus = ref<number | null>(2)

// Spaltenbreiten in px: Nachname, Vorname, Klasse, Abschluss, Prüfungsordnung, ist Prognose
const spaltenBreiten = ref([150, 130, 85, 100, 140, 110])

const abschnittOptionen = computed(() =>
  abschnittStore.abschnitte.map(a => ({ label: a.bezeichnung, value: a.id }))
)

const statusOptionen = [
  { label: 'Alle',                   value: null },
  { label: 'Aufnahme',               value: 0 },
  { label: 'Warteliste',             value: 1 },
  { label: 'Aktiv',                  value: 2 },
  { label: 'Beurlaubt',              value: 3 },
  { label: 'Extern',                 value: 6 },
  { label: 'Abschluss',              value: 8 },
  { label: 'Abgang (ohne Abschluss)', value: 9 },
  { label: 'Ehemalige',              value: 10 },
]

const klassenOptionen = computed(() =>
  schuelerStore.klassen
    .filter(k => k.kuerzel)
    .map(k => ({ label: k.kuerzel, value: k.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

const gefiltert = computed(() => {
  let liste = schuelerStore.schueler
  if (selectedStatus.value !== null)
    liste = liste.filter(s => s.status === selectedStatus.value)
  if (selectedKlasseId.value !== null)
    liste = liste.filter(s => s.klasseId === selectedKlasseId.value)
  return liste
})

// ---------------------------------------------------------------------------
// Spalten-Resize
// ---------------------------------------------------------------------------
interface ResizeState {
  colIdx: number
  startX: number
  startWidth: number
}

const resizing = ref<ResizeState | null>(null)

function startResize(event: MouseEvent, colIdx: number) {
  resizing.value = { colIdx, startX: event.clientX, startWidth: spaltenBreiten.value[colIdx] }
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
}

function onMouseMove(event: MouseEvent) {
  if (!resizing.value) return
  const delta = event.clientX - resizing.value.startX
  spaltenBreiten.value[resizing.value.colIdx] = Math.max(30, resizing.value.startWidth + delta)
}

function onMouseUp() {
  if (!resizing.value) return
  resizing.value = null
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

onMounted(async () => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  laedt.value = true
  fehler.value = null
  try {
    const abschnittId = abschnittStore.ausgewaehltId
    if (!abschnittId) throw new Error('Kein Schuljahresabschnitt verfügbar.')
    await schuelerStore.loadFuerAbschnitt(abschnittId, jg)
    // Abschlussdaten im Hintergrund nachladen
    schuelerStore.ladeAbschlussDaten(abschnittId)
  } catch (e: any) {
    fehler.value = e?.message ?? 'Schülerdaten konnten nicht geladen werden.'
  } finally {
    laedt.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

const ABSCHLUSS_LABEL: Record<string, string> = {
  'FOR':    'MSA',
  'FORQ-E': 'MSA/Q',
  'HA10':   'HA10',
  'HA':     'HA9',
  'OA':     'OA',
  'ESA':    'ESA',
}

function formatAbschluss(s: { svwsAbschluss?: string | null }): string {
  if (s.svwsAbschluss === undefined) return '…'
  if (!s.svwsAbschluss) return '–'
  const parts = s.svwsAbschluss.split('/')
  const kuerzel = parts[parts.length - 1] ?? s.svwsAbschluss
  return ABSCHLUSS_LABEL[kuerzel] ?? kuerzel
}

function formatPruefungsordnung(s: { svwsPruefungsOrdnung?: string | null; svwsAbschluss?: string | null }): string {
  if (s.svwsPruefungsOrdnung === undefined && s.svwsAbschluss === undefined) return '…'
  if (s.svwsPruefungsOrdnung) {
    const parts = s.svwsPruefungsOrdnung.split('/')
    return parts.length >= 2 ? parts[1] : s.svwsPruefungsOrdnung
  }
  if (s.svwsAbschluss) {
    const parts = s.svwsAbschluss.split('/')
    return parts.length >= 2 ? parts[1] : '–'
  }
  return '–'
}

function formatPrognose(s: { svwsIstAbschlussPrognose?: boolean | null }): string {
  if (s.svwsIstAbschlussPrognose === undefined) return '…'
  return s.svwsIstAbschlussPrognose ? 'P' : '✓'
}

async function wechsleAbschnitt(id: number) {
  abschnittStore.waehleAbschnitt(id)
  selectedKlasseId.value = null
  laedt.value = true
  fehler.value = null
  try {
    await schuelerStore.loadFuerAbschnitt(id, jg)
  } catch (e: any) {
    fehler.value = e?.message ?? 'Schülerdaten konnten nicht geladen werden.'
  } finally {
    laedt.value = false
  }
}

function navigiereZurPrognose(schuelerId: number) {
  schuelerStore.waehleSchueler(schuelerId)
  router.push({ name: 'prognose', params: { id: String(schuelerId) } })
}
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
.toolbar-title {
  font-size: 0.9rem;
  font-weight: 600;
}
.toolbar-sep { flex: 1; }
.abschnitt-select { width: 16rem; }
.status-select { width: 14rem; }
.klassen-select { width: 14rem; }

.status-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
  padding: 0.5rem 0;
}

.tabelle-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.tabelle-info {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.4rem;
}

.schueler-table {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8rem;
  table-layout: fixed;
  width: 100%;
}

.schueler-table th {
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
  overflow: hidden;
  user-select: none;
}

.schueler-table td {
  text-align: left;
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid var(--p-content-border-color);
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schueler-row {
  cursor: pointer;
}
.schueler-row:hover {
  background: var(--p-highlight-background);
}
.schueler-row:last-child td {
  border-bottom: none;
}

.td-name      { font-weight: 500; }
.td-klasse    { color: var(--p-text-muted-color); }
.td-abschluss { font-weight: 500; }
.td-prognose  { color: var(--p-text-muted-color); text-align: center; }
.td-action    { text-align: right; }
.action-icon { font-size: 0.7rem; color: var(--p-text-muted-color); }

.td-empty {
  text-align: center;
  padding: 1.5rem;
  color: var(--p-text-muted-color);
  font-style: italic;
}

/* Resize-Handle am rechten Rand der th-Zelle */
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
