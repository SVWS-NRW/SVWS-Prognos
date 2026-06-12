<template>
  <div class="page">

    <!-- Kopfzeile mit Einstellungen -->
    <div class="toolbar">
      <Button icon="pi pi-arrow-left" text size="small" @click="router.back()" />
      <span class="toolbar-title">Manuelle Prognose</span>
      <div class="toolbar-sep" />
      <Select
        v-model="jahrgang"
        :options="jahrgangOptionen"
        option-label="label"
        option-value="value"
        size="small"
        style="width: 9rem"
      />
      <Select
        v-model="schulform"
        :options="schulformOptionen"
        option-label="label"
        option-value="value"
        size="small"
        style="width: 11rem"
      />
      <ThemeToggle />
    </div>

    <!-- Hauptbereich: Fächer links, Prognose rechts -->
    <div class="main-layout">

      <!-- Fächerkarte -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Fächer</span>
          <div class="btn-group">
            <Button icon="pi pi-plus" label="Fach hinzufügen" outlined size="small" @click="addFach" />
            <Button icon="pi pi-upload" label="JSON laden" outlined size="small" severity="secondary" @click="fileInput?.click()" />
            <Button v-if="ergebnis" icon="pi pi-download" label="Testfall exportieren" outlined size="small" severity="secondary" @click="exportJson" />
            <Button v-if="faecher.length > 0" icon="pi pi-trash" label="Entfernen" outlined size="small" severity="danger" @click="faecher = STANDARD_FAECHER.map(f => ({ ...f }))" />
            <input ref="fileInput" type="file" accept=".json,.JSON" hidden @change="handleImport" />
          </div>
        </div>

        <div v-if="faecher.length > 0" class="table-wrapper">
          <table class="faecher-table">
            <thead>
              <tr>
                <th>Kürzel</th>
                <th>Bezeichnung</th>
                <th>Note</th>
                <th>Kursart</th>
                <th title="Fremdsprache">FS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(fach, idx) in faecher" :key="idx">
                <td>
                  <InputText
                    :model-value="fach.kuerzel"
                    size="small"
                    class="w-kuerzel"
                    placeholder="D"
                    @update:model-value="v => faecher[idx].kuerzel = String(v ?? '').trim().toUpperCase()"
                  />
                </td>
                <td>
                  <InputText
                    :model-value="fach.bezeichnung"
                    size="small"
                    class="w-bez"
                    placeholder="optional"
                    @update:model-value="v => faecher[idx].bezeichnung = String(v ?? '')"
                  />
                </td>
                <td>
                  <Select
                    :model-value="fach.note"
                    :options="noteOptionen"
                    option-label="label"
                    option-value="value"
                    size="small"
                    class="w-note"
                    @update:model-value="v => faecher[idx].note = v ?? null"
                  />
                </td>
                <td>
                  <Select
                    :model-value="fach.kursart"
                    :options="kursartOptionen"
                    size="small"
                    class="w-kursart"
                    @update:model-value="v => faecher[idx].kursart = v"
                  />
                </td>
                <td class="col-center">
                  <Checkbox
                    :model-value="fach.istFremdsprache"
                    :binary="true"
                    @update:model-value="v => faecher[idx].istFremdsprache = Boolean(v)"
                  />
                </td>
                <td class="col-center">
                  <Button icon="pi pi-times" text rounded severity="secondary" size="small" @click="faecher.splice(idx, 1)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-else class="empty-hint">
          <i class="pi pi-info-circle" />
          Fach hinzufügen oder JSON importieren
        </p>
      </div>

      <!-- Prognosepanel -->
      <div class="result-panel" :class="ergebnis ? `result--${ergebnis.empfehlung.toLowerCase().replace('_', '-')}` : 'result--leer'">
        <template v-if="ergebnis">
          <div class="result-header">
            <div class="result-badge">{{ ergebnis.empfehlung }}</div>
            <div class="result-name">{{ abschlussName(ergebnis.empfehlung) }}</div>
            <div class="result-sub">APO-SI20 · Jg. {{ jahrgang ?? '–' }}</div>
          </div>
          <div class="result-protokoll">
            <div
              v-for="(line, i) in ergebnis.protokoll"
              :key="i"
              :class="protokollClass(line)"
            >{{ line || ' ' }}</div>
          </div>
        </template>
        <template v-else>
          <i class="pi pi-calculator result-icon-leer" />
          <div class="result-leer-text">Prognose erscheint hier</div>
        </template>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { berechnePrognose } from '@/rules'
import type { AbschlussTyp } from '@/models/PrognoseErgebnis'
import type { Schulform } from '@/rules/types'

const router = useRouter()
const fileInput = ref<HTMLInputElement | null>(null)

interface FormFach {
  kuerzel: string
  bezeichnung: string
  note: number | null
  kursart: 'E' | 'G' | 'Sonstige'
  istFremdsprache: boolean
}

function sf(kuerzel: string, bezeichnung: string, kursart: FormFach['kursart'] = 'Sonstige', istFremdsprache = false): FormFach {
  return { kuerzel, bezeichnung, note: null, kursart, istFremdsprache }
}

const STANDARD_FAECHER: FormFach[] = [
  sf('D',    'Deutsch',                                        'G'),
  sf('M',    'Mathematik',                                     'G'),
  sf('E',    'Englisch',                                       'G', true),
  sf('WP1',  'Fach im Wahlpflichtbereich'),
  sf('LBNW', 'Lernbereich - Naturwissenschaften'),
  sf('CH',   'Chemie',                                         'G'),
  sf('GL',   'Gesellschaftslehre'),
  sf('AT',   'Arbeitslehre - Technik'),
  sf('AW',   'Arbeitslehre - Wirtschaft'),
  sf('AH',   'Arbeitslehre - Hauswirtschaft'),
  sf('REPP', 'Rel./Prak. Philo.'),
  sf('SP',   'Sport'),
  sf('EGSN', 'Fach im benoteten Ergänzungsstundenbereich', 'Sonstige', true),
]

const jahrgang = ref<string | null>('10')
const schulform = ref<Schulform>('GESAMTSCHULE')
const faecher = ref<FormFach[]>(STANDARD_FAECHER.map(f => ({ ...f })))

const jahrgangOptionen = [
  { label: 'Jahrgang 8',  value: '8'  },
  { label: 'Jahrgang 9',  value: '9'  },
  { label: 'Jahrgang 10', value: '10' },
  { label: 'Unbekannt',   value: null },
]

const schulformOptionen = [
  { label: 'Gesamtschule',   value: 'GESAMTSCHULE'   },
  { label: 'Sekundarschule', value: 'SEKUNDARSCHULE' },
  { label: 'Primusschule',   value: 'PRIMUSSCHULE'   },
]

const kursartOptionen: Array<'E' | 'G' | 'Sonstige'> = ['E', 'G', 'Sonstige']

const noteOptionen = [
  { label: '–', value: null },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
]

const ergebnis = computed(() => {
  const valid = faecher.value.filter(f => f.kuerzel.trim() !== '' && f.note !== null)
  if (valid.length === 0) return null
  return berechnePrognose({
    jahrgang: jahrgang.value,
    schulform: schulform.value,
    faecher: valid.map(f => ({
      kuerzel: f.kuerzel,
      note: f.note as number,
      kursart: f.kursart,
      bezeichnung: f.bezeichnung || undefined,
      istFremdsprache: f.istFremdsprache || undefined,
    })),
  })
})

function addFach() {
  faecher.value.push({ kuerzel: '', bezeichnung: '', note: null, kursart: 'Sonstige', istFremdsprache: false })
}

function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target!.result as string)
      const src = json.input ?? json
      const roh: unknown[] = Array.isArray(src) ? src : (src.faecher ?? [])
      faecher.value = roh.map((f: any) => ({
        kuerzel: String(f.kuerzel ?? '').toUpperCase(),
        bezeichnung: String(f.bezeichnung ?? ''),
        note: Number(f.note ?? 3),
        kursart: (['E', 'G', 'Sonstige'].includes(f.kursart) ? f.kursart : 'Sonstige') as 'E' | 'G' | 'Sonstige',
        istFremdsprache: Boolean(f.istFremdsprache ?? false),
      }))
      if (src.jahrgang !== undefined) jahrgang.value = src.jahrgang
    } catch { /* ungültige Datei */ }
    input.value = ''
  }
  reader.readAsText(file)
}

function exportJson() {
  const res = ergebnis.value
  if (!res) return

  const valid = faecher.value.filter(f => f.kuerzel.trim() !== '' && f.note !== null)

  const testfall = {
    input: {
      schuljahr: null,
      abschnitt: null,
      jahrgang: jahrgang.value,
      'apo-s1': 'APO-SI20',
      faecher: valid.map(f => {
        const obj: Record<string, unknown> = {
          kuerzel: f.kuerzel,
          note: f.note,
          kursart: f.kursart,
          bezeichnung: f.bezeichnung || f.kuerzel,
        }
        if (f.istFremdsprache) obj.istFremdsprache = true
        return obj
      }),
    },
    Prognose: {
      abschluss: res.empfehlung,
      npFaecher: null,
      log: res.protokoll,
    },
    ESA:   null,
    EESA:  null,
    MSA:   null,
    MSA_Q: null,
  }

  const json = JSON.stringify(testfall, null, 4)
  const blob = new Blob([new TextEncoder().encode(json)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `testfall_${new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function protokollClass(line: string): string {
  if (line.startsWith('✓')) return 'plog plog--ok'
  if (line.startsWith('✗')) return 'plog plog--fail'
  if (line.startsWith('⚠')) return 'plog plog--warn'
  if (line.startsWith('══')) return 'plog plog--result'
  if (line.startsWith('Prüfe') || line.startsWith('──')) return 'plog plog--head'
  return 'plog'
}

function abschlussName(a: AbschlussTyp): string {
  const n: Record<AbschlussTyp, string> = {
    OA:    'Ohne Abschluss',
    ESA:   'Erster Schulabschluss',
    EESA:  'Erw. Erster Schulabschluss',
    MSA:   'Mittlerer Schulabschluss',
    MSA_Q: 'MSA mit Qualifikationsvermerk',
  }
  return n[a]
}
</script>

<style scoped>
.page {
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
  font-size: 0.8rem;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.toolbar-title {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}
.toolbar-sep {
  flex: 1;
}

/* Hauptlayout */
.main-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.5rem;
  align-items: stretch;
  min-height: 0;
}

/* Fächerkarte */
.card {
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.4rem;
  background: var(--p-content-background);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid var(--p-content-border-color);
}
.card-title {
  font-size: 0.75rem;
  font-weight: 600;
}
.btn-group { display: flex; gap: 0.25rem; }

/* Tabelle */
.table-wrapper { overflow-x: auto; }

.faecher-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.faecher-table th {
  text-align: left;
  padding: 0.2rem 0.4rem;
  font-size: 0.68rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
  border-bottom: 1px solid var(--p-content-border-color);
}

.faecher-table td {
  padding: 0.1rem 0.4rem;
  border-bottom: 1px solid var(--p-content-border-color);
  vertical-align: middle;
}

.faecher-table tbody tr:last-child td { border-bottom: none; }
.faecher-table tbody tr:hover { background: var(--p-highlight-background); }

.col-center { text-align: center; }

.w-kuerzel { width: 5rem; }
.w-bez     { width: 100%; min-width: 6rem; }
.w-note    { width: 4rem; }
.w-kursart { width: 7rem; }

.empty-hint {
  padding: 0.75rem 0.5rem;
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.75rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

/* Prognosepanel */
.result-panel {
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.4rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: border-color 0.2s;
}

.result--leer {
  background: var(--p-content-background);
  color: var(--p-text-muted-color);
  align-items: center;
  justify-content: center;
  padding: 1rem 0.6rem;
  gap: 0.4rem;
}
.result--oa    { border-color: #ef4444; }
.result--esa   { border-color: #94a3b8; }
.result--eesa  { border-color: #f59e0b; }
.result--msa   { border-color: #3b82f6; }
.result--msa-q { border-color: #22c55e; }

/* Ergebnis-Header */
.result-header {
  padding: 0.55rem 0.65rem 0.45rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.15rem;
  border-bottom: 1px solid var(--p-content-border-color);
}
.result--oa    .result-header { background: #fef2f2; color: #991b1b; }
.result--esa   .result-header { background: #f8fafc; color: #334155; }
.result--eesa  .result-header { background: #fffbeb; color: #92400e; }
.result--msa   .result-header { background: #eff6ff; color: #1e40af; }
.result--msa-q .result-header { background: #f0fdf4; color: #166534; }

.result-badge {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
}
.result-name {
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.3;
}
.result-sub {
  font-size: 0.62rem;
  opacity: 0.65;
}

/* Protokoll */
.result-protokoll {
  flex: 1;
  min-height: 0;
  padding: 0.4rem 0.5rem;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.68rem;
  line-height: 1.45;
  background: var(--p-content-background);
}

.plog {
  white-space: pre;
  color: var(--p-text-color);
}
.plog--head  { font-weight: 600; color: var(--p-text-color); margin-top: 0.2rem; }
.plog--ok    { color: #15803d; font-weight: 600; }
.plog--fail  { color: #b91c1c; }
.plog--warn  { color: #b45309; }
.plog--result {
  font-weight: 700;
  font-size: 0.72rem;
  color: var(--p-primary-color);
  margin-top: 0.2rem;
}

.result-icon-leer {
  font-size: 1.4rem;
  opacity: 0.3;
}
.result-leer-text {
  font-size: 0.68rem;
  line-height: 1.3;
}
</style>
