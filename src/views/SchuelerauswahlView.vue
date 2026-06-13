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
          <thead>
            <tr>
              <th>Nachname</th>
              <th>Vorname</th>
              <th>Klasse</th>
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
              <td class="td-action">
                <i class="pi pi-chevron-right action-icon" />
              </td>
            </tr>
            <tr v-if="gefiltert.length === 0">
              <td colspan="4" class="td-empty">Keine Schüler für diesen Filter gefunden.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Message from 'primevue/message'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useSchuelerStore } from '@/stores/schueler'
import { useSchuljahresabschnittStore } from '@/stores/schuljahresabschnitt'

const route = useRoute()
const router = useRouter()
const jg = route.params.jg as string

const schuelerStore = useSchuelerStore()
const abschnittStore = useSchuljahresabschnittStore()

const laedt = ref(false)
const fehler = ref<string | null>(null)
const selectedKlasseId = ref<number | null>(null)
const selectedAbschnittId = ref<number | null>(abschnittStore.ausgewaehltId)

const abschnittOptionen = computed(() =>
  abschnittStore.abschnitte.map(a => ({ label: a.bezeichnung, value: a.id }))
)

const klassenOptionen = computed(() =>
  schuelerStore.klassen
    .filter(k => k.kuerzel)
    .map(k => ({ label: k.kuerzel, value: k.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

const gefiltert = computed(() => {
  const liste = schuelerStore.schueler
  if (!selectedKlasseId.value) return liste
  return liste.filter(s => s.klasseId === selectedKlasseId.value)
})

onMounted(async () => {
  laedt.value = true
  fehler.value = null
  try {
    const abschnittId = abschnittStore.ausgewaehltId
    if (!abschnittId) throw new Error('Kein Schuljahresabschnitt verfügbar.')
    await schuelerStore.loadFuerAbschnitt(abschnittId, jg)
  } catch (e: any) {
    fehler.value = e?.message ?? 'Schülerdaten konnten nicht geladen werden.'
  } finally {
    laedt.value = false
  }
})

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
  overflow-y: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.4rem;
}

.schueler-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
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
}

.schueler-table td {
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid var(--p-content-border-color);
  vertical-align: middle;
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

.td-name { font-weight: 500; }
.td-klasse { color: var(--p-text-muted-color); }
.td-action { text-align: right; width: 2rem; }
.action-icon { font-size: 0.7rem; color: var(--p-text-muted-color); }

.td-empty {
  text-align: center;
  padding: 1.5rem;
  color: var(--p-text-muted-color);
  font-style: italic;
}
</style>
