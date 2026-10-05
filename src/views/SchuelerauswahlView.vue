<template>
  <div class="page">
    <div class="toolbar">
      <Button icon="pi pi-arrow-left" text @click="router.push({ name: 'dashboard' })" />
      <span class="toolbar-title">Jahrgang {{ jg }}</span>
      <div class="toolbar-sep" />
      <Button
        v-if="gruppenModus"
        icon="pi pi-users"
        label="Gruppenprognose"
        outlined
        :disabled="markiert.size === 0 || !abschnittStore.ausgewaehltId"
        :title="markiert.size === 0 ? 'Zuerst Schüler markieren' : `Prognose für ${markiert.size} markierte Schüler berechnen`"
        @click="zeigeGruppenprognose = true"
      />
      <span class="abschnitt-anzeige" title="Listen und Auswertungen zeigen immer den aktuellen Schuljahresabschnitt">{{ abschnittStore.ausgewaehlt?.bezeichnung ?? '–' }}</span>
      <Button icon="pi pi-refresh" text title="Neu laden" :loading="schuelerStore.abschlussLaedt" @click="neuLaden" />
      <Select
        v-model="selectedStatus"
        :options="statusOptionen"
        option-label="label"
        option-value="value"
        class="status-select"
      />
      <Select
        v-model="selectedKlasseId"
        :options="klassenOptionen"
        option-label="label"
        option-value="value"
        placeholder="Alle Klassen"
        show-clear
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
        <span class="tabelle-info">{{ gefiltert.length }} Schüler<template v-if="markiert.size > 0"> · {{ markiert.size }} markiert</template></span>
      </div>

      <div class="table-wrapper">
        <table class="schueler-table">
          <colgroup>
            <col v-if="gruppenModus" class="col-markierung" />
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
              <th v-if="gruppenModus" class="th-markierung">
                <Checkbox
                  :model-value="alleMarkiert"
                  :indeterminate="markiert.size > 0 && !alleMarkiert"
                  :binary="true"
                  :disabled="gefiltert.length === 0"
                  title="Alle markieren"
                  @update:model-value="alleMarkieren"
                />
              </th>
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
              <td v-if="gruppenModus" class="td-markierung" @click.stop="umschalten(s.id)">
                <Checkbox :model-value="markiert.has(s.id)" :binary="true" @click.stop @update:model-value="umschalten(s.id)" />
              </td>
              <td class="td-name">{{ s.nachname }}</td>
              <td>{{ s.vorname }}</td>
              <td class="td-klasse">{{ s.klasseKuerzel }}</td>
              <td class="td-abschluss">{{ formatAbschluss(s) }}</td>
              <td class="td-po">{{ formatPruefungsordnung(s) }}</td>
              <td class="td-prognose">
                <template v-if="s.svwsIstAbschlussPrognose === undefined">…</template>
                <template v-else-if="s.svwsIstAbschlussPrognose === null">–</template>
                <i v-else-if="!s.svwsAbschluss" class="pi pi-times prognose-fehlt" title="Noch kein Abschluss berechnet" />
                <span v-else-if="s.svwsIstAbschlussPrognose" class="prognose-p" title="Prognose">P</span>
                <span v-else class="prognose-a" title="Endgültiger Abschluss">A</span>
              </td>
              <td class="td-action">
                <i class="pi pi-chevron-right action-icon" />
              </td>
            </tr>
            <tr v-if="gefiltert.length === 0">
              <td :colspan="gruppenModus ? 8 : 7" class="td-empty">Keine Schüler für diesen Filter gefunden.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <GruppenprognoseDialog
      v-if="abschnittStore.ausgewaehltId"
      v-model:visible="zeigeGruppenprognose"
      :schueler="markierteSchueler"
      :abschnitt-id="abschnittStore.ausgewaehltId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Checkbox from 'primevue/checkbox'
import { useSchuelerStore } from '@/stores/schueler'
import { useSchuljahresabschnittStore } from '@/stores/schuljahresabschnitt'
import ThemeToggle from '@/components/ThemeToggle.vue'
import GruppenprognoseDialog from '@/components/prognose/GruppenprognoseDialog.vue'
import { ABSCHLUSS_KURZ, schildZuAbschluss } from '@/services/schildAbschluss'

const route = useRoute()
const router = useRouter()
const jg = route.params.jg as string

const schuelerStore = useSchuelerStore()
const abschnittStore = useSchuljahresabschnittStore()

const laedt = ref(false)
const fehler = ref<string | null>(null)
// Vorbelegung per Query, z.B. beim Sprung aus den Auswertungen: ?klasse=<id>&status=alle
const selectedKlasseId = ref<number | null>(route.query.klasse ? Number(route.query.klasse) : null)
// PrimeVue-Select zeigt bei value null kein Label an, daher eigener Wert für 'Alle'
const STATUS_ALLE = -1
const selectedStatus = ref<number>(route.query.status === 'alle' ? STATUS_ALLE : 2)

// Spaltenbreiten in px: Nachname, Vorname, Klasse, Abschluss, Prüfungsordnung, ist Prognose
const spaltenBreiten = ref([240, 200, 110, 140, 180, 130])

const statusOptionen = [
  { label: 'Alle',                   value: STATUS_ALLE },
  { label: 'Aufnahme',               value: 0 },
  { label: 'Warteliste',             value: 1 },
  { label: 'Aktiv',                  value: 2 },
  { label: 'Beurlaubt',              value: 3 },
  { label: 'Extern',                 value: 6 },
]

const klassenOptionen = computed(() =>
  schuelerStore.klassen
    .filter(k => k.kuerzel)
    .map(k => ({ label: k.kuerzel, value: k.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

const gefiltert = computed(() => {
  // Schüler ohne Lernabschnitt im gewählten Abschnitt ausblenden, sobald das bekannt ist
  let liste = schuelerStore.schueler.filter(s => !s.svwsKeinLernabschnitt)
  if (selectedStatus.value !== STATUS_ALLE)
    liste = liste.filter(s => s.status === selectedStatus.value)
  if (selectedKlasseId.value !== null)
    liste = liste.filter(s => s.klasseId === selectedKlasseId.value)
  return liste
})

// ---------------------------------------------------------------------------
// Markierung (Vorbereitung für Gruppenprognosen)
// ---------------------------------------------------------------------------
// Es bleiben nur sichtbare Schüler markiert, damit nach einem Filterwechsel keine
// ausgeblendeten Schüler mitverarbeitet werden; ohne Klassenfilter wird alles abgewählt
const markiert = ref(new Set<number>())

// Gruppenprognosen gibt es nur für eine Klasse
const gruppenModus = computed(() => selectedKlasseId.value !== null)
const zeigeGruppenprognose = ref(false)
// In der Reihenfolge der Liste; beim Öffnen des Dialogs festgehalten
const markierteSchueler = computed(() => gefiltert.value.filter(s => markiert.value.has(s.id)))

const alleMarkiert = computed(() =>
  gefiltert.value.length > 0 && gefiltert.value.every(s => markiert.value.has(s.id))
)

function umschalten(id: number) {
  const neu = new Set(markiert.value)
  if (!neu.delete(id)) neu.add(id)
  markiert.value = neu
}

function alleMarkieren(wert: boolean) {
  markiert.value = wert ? new Set(gefiltert.value.map(s => s.id)) : new Set()
}

watch(gefiltert, liste => {
  const sichtbar = new Set(gruppenModus.value ? liste.map(s => s.id) : [])
  if ([...markiert.value].some(id => !sichtbar.has(id))) {
    markiert.value = new Set([...markiert.value].filter(id => sichtbar.has(id)))
  }
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

  const abschnittId = abschnittStore.ausgewaehltId
  if (!abschnittId) {
    fehler.value = 'Kein Schuljahresabschnitt verfügbar.'
    return
  }
  await laden(abschnittId, false)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

function formatAbschluss(s: { svwsAbschluss?: string | null }): string {
  if (s.svwsAbschluss === undefined) return '…'
  if (!s.svwsAbschluss) return '–'
  const abschluss = schildZuAbschluss(s.svwsAbschluss)
  return abschluss ? ABSCHLUSS_KURZ[abschluss] : (s.svwsAbschluss.split('/').pop() ?? s.svwsAbschluss)
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

async function neuLaden() {
  const id = abschnittStore.ausgewaehltId
  if (id) await laden(id, true)
}

async function laden(id: number, neu: boolean) {
  laedt.value = true
  fehler.value = null
  try {
    await schuelerStore.loadFuerAbschnitt(id, jg, neu)
    ladeSichtbare()
  } catch (e: any) {
    fehler.value = e?.message ?? 'Schülerdaten konnten nicht geladen werden.'
  } finally {
    laedt.value = false
  }
}

// Abschlussdaten nur für die gefilterten Schüler im Hintergrund nachladen (nur, was noch nicht
// zwischengespeichert ist). Ohne Statusfilter enthält die Liste auch alle Ehemaligen.
function ladeSichtbare() {
  const id = abschnittStore.ausgewaehltId
  if (id) schuelerStore.ladeAbschlussDaten(id, gefiltert.value.map(s => s.id))
}

// Nur auf die Filter reagieren: gefiltert selbst ändert sich bei jedem übernommenen Ergebnis
watch([selectedStatus, selectedKlasseId], ladeSichtbare)

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
  font-size: 1.35rem;
  font-weight: 600;
}
.toolbar-sep { flex: 1; }
.abschnitt-anzeige { font-size: 1.05rem; color: var(--p-text-muted-color); white-space: nowrap; }
.status-select { width: 15rem; }
.klassen-select { width: 15rem; }
.toolbar :deep(.theme-btn) { width: 2.5rem; height: 2.5rem; font-size: 1rem; }

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
  font-size: 0.85rem;
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
  font-size: 1rem;
  table-layout: fixed;
  width: 100%;
}

.schueler-table th {
  text-align: left;
  padding: 0.5rem 1rem;
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
  padding: 0.6rem 1rem;
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

.col-markierung { width: 3rem; }
.schueler-table .th-markierung,
.schueler-table .td-markierung { padding: 0 0 0 1rem; text-overflow: clip; }
.td-markierung { cursor: default; }
.td-name      { font-weight: 500; }
.td-klasse    { color: var(--p-text-muted-color); }
.td-abschluss { font-weight: 500; }
.td-prognose  { color: var(--p-text-muted-color); text-align: center; }
.prognose-p  { color: var(--prog-prognose); font-weight: 700; }
.prognose-a  { color: var(--prog-abschluss); font-weight: 700; }
.prognose-fehlt { color: var(--abschluss-nicht); font-size: 0.85rem; font-weight: 700; }
.td-action    { text-align: right; }
.action-icon { font-size: 0.85rem; color: var(--p-text-muted-color); }

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
