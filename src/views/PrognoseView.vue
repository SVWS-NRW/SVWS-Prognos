<template>
  <div class="page">

    <!-- Toolbar -->
    <div class="toolbar">
      <Button
        icon="pi pi-list"
        text
        size="small"
        title="Zurück zur Schülertabelle"
        @click="router.push({ name: 'jahrgang', params: { jg: jahrgang ?? '' } })"
      />
      <Button icon="pi pi-arrow-left" text size="small" @click="router.back()" />
      <span class="toolbar-title">{{ schuelerName }}<span v-if="schuelerKlasse" class="toolbar-klasse"> · {{ schuelerKlasse }}</span></span>
      <Button
        v-if="naechsterSchueler"
        icon="pi pi-arrow-right"
        text
        size="small"
        class="btn-naechster"
        :title="`Nächster: ${naechsterSchueler.nachname}, ${naechsterSchueler.vorname}`"
        @click="navigiereZuNaechstem"
      />
      <div class="toolbar-sep" />
      <Select
        v-model="selectedAbschnittId"
        :options="abschnittOptionen"
        option-label="label"
        option-value="value"
        size="small"
        class="abschnitt-select"
        @update:model-value="laden"
      />
      <SelectButton
        v-model="notenModus"
        :options="notenModusOptionen"
        option-label="label"
        option-value="value"
        size="small"
        class="noten-toggle"
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

    <!-- Ladeindikator -->
    <div v-if="laedt" class="status-hint">
      <i class="pi pi-spin pi-spinner" />
      Lade Prognosedaten…
    </div>

    <Message v-else-if="fehler" severity="error">{{ fehler }}</Message>

    <!-- Hauptbereich -->
    <div v-else class="main-layout">

      <!-- Fächerkarte -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Fächer · Jg. {{ jahrgang ?? '–' }}</span>
          <div class="btn-group">
            <Button icon="pi pi-plus" label="Fach hinzufügen" outlined size="small" @click="addFach" />
            <Button icon="pi pi-refresh" label="Neu laden" outlined size="small" severity="secondary" @click="() => laden()" />
            <Button icon="pi pi-save" label="Speichern" outlined size="small" severity="success" :loading="speichert" :disabled="!hasChanges" @click="speichern" />
          </div>
        </div>

        <!-- Abschluss-Leiste -->
        <div class="abschluss-bar">
          <div class="abschluss-field">
            <label class="abschluss-label">Prüfungsordnung</label>
            <Select
              v-model="selectedPO"
              :options="poOptionen"
              option-label="label"
              option-value="value"
              size="small"
              show-clear
              placeholder="–"
              class="po-select"
            />
          </div>
          <div class="abschluss-field">
            <label class="abschluss-label">Abschluss (berechnet)</label>
            <span class="abschluss-wert">{{ berechneterAbschlussAnzeige }}</span>
          </div>
          <div class="abschluss-field abschluss-field--check">
            <Checkbox v-model="istAbschlussPrognose" :binary="true" input-id="ist-prog-chk" />
            <label for="ist-prog-chk" class="abschluss-label">Ist Prognose</label>
          </div>
          <div v-if="speichernFehler" class="speichern-fehler">{{ speichernFehler }}</div>
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
              <tr v-if="lbnwNote !== null">
                <td>
                  <InputText model-value="LBNW" size="small" class="w-kuerzel" readonly />
                </td>
                <td>
                  <InputText model-value="Lernbereich Naturwissenschaften" size="small" class="w-bez" readonly />
                </td>
                <td :class="{ 'note--rot': lbnwNote >= 5 }">
                  <Select
                    :model-value="lbnwNote"
                    :options="noteOptionen"
                    option-label="label"
                    option-value="value"
                    size="small"
                    class="w-note"
                    @update:model-value="v => lbnwNote = v ?? null"
                  />
                </td>
                <td>
                  <Select model-value="Sonstige" :options="kursartOptionen" size="small" class="w-kursart" disabled />
                </td>
                <td class="col-center">
                  <Checkbox :model-value="false" :binary="true" disabled />
                </td>
                <td></td>
              </tr>
              <tr v-for="(fach, idx) in faecher" :key="idx">
                <td>
                  <InputText
                    :model-value="fach.kuerzel"
                    size="small"
                    class="w-kuerzel"
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
                <td :class="{ 'note--rot': fach.note != null && fach.note >= 5 }">
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
          Keine Fächer gefunden
        </p>
      </div>

      <!-- Prognosepanel -->
      <div
        class="result-panel"
        :class="ergebnis ? `result--${ergebnis.empfehlung.toLowerCase().replace('_', '-')}` : 'result--leer'"
      >
        <template v-if="ergebnis">
          <div class="result-header">
            <div class="result-badge">{{ ergebnis.empfehlung }}</div>
            <div class="result-name">{{ abschlussName(ergebnis.empfehlung) }}</div>
            <div class="result-sub">
              APO-SI20 · Jg. {{ jahrgang ?? '–' }} · {{ notenModus === 'quartal' ? 'Quartalsnoten' : 'Halbjahresnoten' }}
            </div>
          </div>
          <div class="result-protokoll">
            <div
              v-for="(line, i) in ergebnis.protokoll"
              :key="i"
              :class="protokollClass(line)"
            >{{ line || ' ' }}</div>
          </div>
        </template>
        <template v-else>
          <i class="pi pi-calculator result-icon-leer" />
          <div class="result-leer-text">Prognose erscheint hier</div>
        </template>
      </div>

    </div>

    <!-- Warndialog: Noten geändert -->
    <Dialog
      v-model:visible="showNotenWarnung"
      modal
      :header="faecherGeloescht && !notenGeaendert ? 'Fach wird gelöscht' : 'Änderungen speichern'"
      :style="{ width: '26rem' }"
      :draggable="false"
    >
      <p class="noten-warn-text">
        <template v-if="faecherGeloescht">Gelöschte Fächer werden dauerhaft aus dem SVWS-Server entfernt.<br></template>
        <template v-if="notenGeaendert">Geänderte Noten werden dauerhaft in den SVWS-Server übernommen.<br></template>
        <template v-if="neueFaecherVorhanden">
          <br><i class="pi pi-info-circle" style="color: var(--p-blue-500)" /> Neu hinzugefügte Fächer können hier nicht gespeichert werden und werden ignoriert. Fächer können nur in der Hauptanwendung (SVWS) angelegt werden.<br>
        </template>
        <template v-if="faecherGeloescht || notenGeaendert">Möchten Sie die Änderungen speichern oder verwerfen?</template>
        <template v-else>Möchten Sie trotzdem fortfahren?</template>
      </p>
      <template #footer>
        <Button label="Abbrechen" text size="small" @click="showNotenWarnung = false" />
        <Button label="Verwerfen" outlined size="small" severity="danger" @click="verwerfenNoten" />
        <Button label="Speichern" size="small" severity="success" :loading="speichert" @click="bestaetigenUndSpeichern" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { berechnePrognose } from '@/rules'
import type { AbschlussTyp } from '@/models/PrognoseErgebnis'
import type { Schulform } from '@/rules/types'
import { useAuthStore } from '@/stores/auth'
import { useSchuelerStore } from '@/stores/schueler'
import { useSchuljahresabschnittStore } from '@/stores/schuljahresabschnitt'
import { useFaecherStore } from '@/stores/faecher'
import {
  loadSvwsLernabschnittsdaten,
  loadPruefungsordnungen,
  patchLernabschnittsdaten,
  patchLeistungsdaten,
  deleteLeistungsdaten,
  parseNoteString,
} from '@/services/svwsService'
import type { SvwsPruefungsordnung } from '@/services/svwsService'
import type { SvwsLernabschnittsdaten } from '@/models/Lernabschnitt'

const route = useRoute()
const router = useRouter()
const schuelerId = computed(() => Number(route.params.id))

const authStore = useAuthStore()
const schuelerStore = useSchuelerStore()
const abschnittStore = useSchuljahresabschnittStore()
const faecherStore = useFaecherStore()

interface FormFach {
  kuerzel: string
  bezeichnung: string
  note: number | null
  kursart: 'E' | 'G' | 'Sonstige'
  istFremdsprache: boolean
  svwsId: number | null
}

interface RohFach extends FormFach {
  noteHalbjahr: number | null
  noteQuartal: number | null
  svwsId: number
}

const laedt = ref(false)
const fehler = ref<string | null>(null)
const faecher = ref<FormFach[]>([])
const rohFaecher = ref<RohFach[]>([])
const jahrgang = ref<string | null>(null)
const schulform = ref<Schulform>(authStore.schulform)
const notenModus = ref<'halbjahr' | 'quartal'>('halbjahr')
const selectedAbschnittId = ref<number | null>(abschnittStore.ausgewaehltId)

const rawLernabschnitt = ref<SvwsLernabschnittsdaten | null>(null)
const pruefungsordnungen = ref<SvwsPruefungsordnung[]>([])
const selectedPO = ref<string | null>('APO-SI20')
const istAbschlussPrognose = ref(true)
const speichert = ref(false)
const speichernFehler = ref<string | null>(null)
const showNotenWarnung = ref(false)

const SCHULFORM_KUERZEL: Record<string, string> = {
  GESAMTSCHULE: 'GE', SEKUNDARSCHULE: 'SK', PRIMUSSCHULE: 'PR',
}

// Mapping: Prognose-Empfehlung → SVWS-Abschluss-Code (APO-SI20-Nomenklatur)
const EMPFEHLUNG_ZU_SVWS: Record<string, string> = {
  OA: 'OA', ESA: 'ESA', EESA: 'HA10', MSA: 'MSA', MSA_Q: 'MSA-Q',
}

const ABSCHLUSS_LABEL: Record<string, string> = {
  OA: 'Ohne Abschluss', ESA: 'ESA', HA: 'HA9', HA10: 'HA10',
  FOR: 'MSA', 'FORQ-E': 'MSA/Q', MSA: 'MSA', 'MSA-Q': 'MSA/Q',
}

const berechneterAbschlussCode = computed(() =>
  ergebnis.value ? (EMPFEHLUNG_ZU_SVWS[ergebnis.value.empfehlung] ?? null) : null
)

const berechneterAbschlussAnzeige = computed(() => {
  const code = berechneterAbschlussCode.value
  if (!code) return '–'
  return ABSCHLUSS_LABEL[code] ? `${code} – ${ABSCHLUSS_LABEL[code]}` : code
})

// Eindeutige PO-Namen aus der API (z.B. "APO-SI20" aus "GE/APO-SI20/5-10")
const poOptionen = computed(() => {
  const seen = new Set<string>()
  const opts: { value: string; label: string }[] = []
  for (const po of pruefungsordnungen.value) {
    const parts = po.pruefungsOrdnung.split('/')
    const poName = parts[1] ?? po.pruefungsOrdnung
    if (!seen.has(po.pruefungsOrdnung)) {
      seen.add(po.pruefungsOrdnung)
      const label = po.bezeichnung ? `${poName} – ${po.bezeichnung}` : poName
      opts.push({ value: po.pruefungsOrdnung, label })
    }
  }
  if (!opts.find(o => o.value.includes('APO-SI20'))) {
    const sfKuerzel = SCHULFORM_KUERZEL[schulform.value] ?? 'GE'
    opts.unshift({ value: `${sfKuerzel}/APO-SI20/5-10`, label: 'APO-SI20' })
  }
  return opts
})


const lbnwNote = ref<number | null>(null)

const notenGeaendert = computed(() => {
  if (lbnwNote.value !== (rawLernabschnitt.value?.noteLernbereichNW ?? null)) return true
  for (const rohF of rohFaecher.value) {
    const currentFach = faecher.value.find(f => f.svwsId === rohF.svwsId)
    if (!currentFach) continue
    const orig = notenModus.value === 'quartal' ? rohF.noteQuartal : rohF.noteHalbjahr
    if (currentFach.note !== orig) return true
  }
  return false
})

const faecherGeloescht = computed(() => {
  const vorhandeneIds = new Set(faecher.value.map(f => f.svwsId).filter((id): id is number => id !== null))
  return rohFaecher.value.some(f => !vorhandeneIds.has(f.svwsId))
})

const neueFaecherVorhanden = computed(() => faecher.value.some(f => f.svwsId === null))

const hasChanges = computed(() => {
  const la = rawLernabschnitt.value
  if (!la) return false
  if (selectedPO.value !== la.pruefungsOrdnung) return true
  if (istAbschlussPrognose.value !== (la.istAbschlussPrognose ?? !istAbschlussPrognose.value)) return true
  if (faecherGeloescht.value) return true
  if (neueFaecherVorhanden.value) return true
  return notenGeaendert.value
})

const abschnittOptionen = computed(() =>
  abschnittStore.abschnitte.map(a => ({ label: a.bezeichnung, value: a.id }))
)

const notenModusOptionen = [
  { label: 'Halbjahr', value: 'halbjahr' },
  { label: 'Quartal',  value: 'quartal'  },
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

const schuelerName = computed(() => {
  const s = schuelerStore.schueler.find(s => s.id === schuelerId.value)
  if (!s) return `Schüler #${schuelerId.value}`
  return `${s.nachname}, ${s.vorname}`
})

const schuelerKlasse = computed(() => {
  const s = schuelerStore.schueler.find(s => s.id === schuelerId.value)
  return s?.klasseKuerzel ?? null
})

const naechsterSchueler = computed(() => {
  const liste = schuelerStore.schueler
  const idx = liste.findIndex(s => s.id === schuelerId.value)
  return idx >= 0 && idx + 1 < liste.length ? liste[idx + 1] : null
})

function navigiereZuNaechstem() {
  if (!naechsterSchueler.value) return
  schuelerStore.waehleSchueler(naechsterSchueler.value.id)
  router.push({ name: 'prognose', params: { id: String(naechsterSchueler.value.id) } })
}

const ergebnis = computed(() => {
  const valid = faecher.value.filter(f => f.kuerzel.trim() !== '' && f.note !== null)
  if (valid.length === 0) return null
  const eingabe = valid.map(f => ({
    kuerzel: f.kuerzel,
    note: f.note as number,
    kursart: f.kursart,
    bezeichnung: f.bezeichnung || undefined,
    istFremdsprache: f.istFremdsprache || undefined,
  }))
  if (lbnwNote.value !== null) {
    eingabe.push({ kuerzel: 'LBNW', note: lbnwNote.value, kursart: 'Sonstige', bezeichnung: undefined, istFremdsprache: undefined })
  }
  return berechnePrognose({
    jahrgang: jahrgang.value,
    schulform: schulform.value,
    faecher: eingabe,
  })
})

watch(notenModus, () => {
  if (rohFaecher.value.length === 0) return
  faecher.value = kernfaecherNachOben(rohFaecher.value.map(f => ({
    ...f,
    note: notenModus.value === 'quartal' ? f.noteQuartal : f.noteHalbjahr,
  })))
})

watch(schuelerId, () => laden())

onMounted(() => {
  laden()
})

async function laden(abschnittIdParam?: number) {
  laedt.value = true
  fehler.value = null
  try {
    const abschnittId = abschnittIdParam ?? selectedAbschnittId.value
    if (!abschnittId) throw new Error('Kein Schuljahresabschnitt verfügbar.')
    selectedAbschnittId.value = abschnittId
    abschnittStore.waehleAbschnitt(abschnittId)

    await faecherStore.ensureLoaded()

    const [lernabschnitt] = await Promise.all([
      loadSvwsLernabschnittsdaten(schuelerId.value, abschnittId),
      pruefungsordnungen.value.length === 0
        ? loadPruefungsordnungen().then(pos => { pruefungsordnungen.value = pos })
        : Promise.resolve(),
    ])
    rawLernabschnitt.value = lernabschnitt
    lbnwNote.value = lernabschnitt.noteLernbereichNW

    const schueler = schuelerStore.schueler.find(s => s.id === schuelerId.value)
    jahrgang.value = schueler?.jahrgang ?? null

    // Prüfungsordnung: APO-SI20 als Default; gespeicherten Wert nur übernehmen wenn
    // er einer bekannten Option entspricht (verhindert leeres Dropdown bei alten Formaten)
    {
      const sfKuerzel = SCHULFORM_KUERZEL[schulform.value] ?? 'GE'
      const apoOption = pruefungsordnungen.value.find(po =>
        po.pruefungsOrdnung.startsWith(`${sfKuerzel}/APO-SI20/`)
      )?.pruefungsOrdnung ?? `${sfKuerzel}/APO-SI20/5-10`

      const gespeichertePO = lernabschnitt.pruefungsOrdnung
      const gespeicherteGueltig = !!gespeichertePO && (
        gespeichertePO === apoOption ||
        pruefungsordnungen.value.some(po => po.pruefungsOrdnung === gespeichertePO)
      )
      selectedPO.value = gespeicherteGueltig ? gespeichertePO : apoOption
    }

    // IstAbschlussPrognose: gespeicherten Wert nehmen oder Default berechnen
    if (lernabschnitt.istAbschlussPrognose !== null) {
      istAbschlussPrognose.value = lernabschnitt.istAbschlussPrognose
    } else {
      const jgNum = Number(jahrgang.value)
      const abschnittNr = abschnittStore.abschnitte.find(a => a.id === abschnittId)?.abschnitt
      istAbschlussPrognose.value = jgNum < 10 || (jgNum === 10 && abschnittNr === 1)
    }

    rohFaecher.value = lernabschnitt.leistungsdaten
      .map(ld => {
        const fach = faecherStore.faecherMap.get(ld.fachID)
        if (!fach) return null
        const noteHj = parseNoteString(ld.note)
        const noteQ = parseNoteString(ld.noteQuartal)
        return {
          kuerzel: normKuerzel(fach.kuerzel),
          bezeichnung: fach.bezeichnung ?? '',
          note: notenModus.value === 'quartal' ? noteQ : noteHj,
          kursart: mapKursart(ld.kursart),
          istFremdsprache: fach.istFremdsprache,
          noteHalbjahr: noteHj,
          noteQuartal: noteQ,
          svwsId: ld.id,
        } satisfies RohFach
      })
      .filter((f): f is RohFach => f !== null)

    faecher.value = kernfaecherNachOben(rohFaecher.value.map(f => ({
      kuerzel: f.kuerzel,
      bezeichnung: f.bezeichnung,
      note: notenModus.value === 'quartal' ? f.noteQuartal : f.noteHalbjahr,
      kursart: f.kursart,
      istFremdsprache: f.istFremdsprache,
      svwsId: f.svwsId,
    })))

  } catch (e: any) {
    fehler.value = e?.message ?? 'Prognosedaten konnten nicht geladen werden.'
  } finally {
    laedt.value = false
  }
}

async function speichern() {
  if (notenGeaendert.value || faecherGeloescht.value || neueFaecherVorhanden.value) {
    showNotenWarnung.value = true
    return
  }
  await doSpeichern()
}

async function bestaetigenUndSpeichern() {
  showNotenWarnung.value = false
  await doSpeichern()
}

function verwerfenNoten() {
  faecher.value = kernfaecherNachOben(rohFaecher.value.map(f => ({
    kuerzel: f.kuerzel,
    bezeichnung: f.bezeichnung,
    note: notenModus.value === 'quartal' ? f.noteQuartal : f.noteHalbjahr,
    kursart: f.kursart,
    istFremdsprache: f.istFremdsprache,
    svwsId: f.svwsId,
  })))
  lbnwNote.value = rawLernabschnitt.value?.noteLernbereichNW ?? null
  showNotenWarnung.value = false
}

async function doSpeichern() {
  if (!rawLernabschnitt.value) return
  speichert.value = true
  speichernFehler.value = null
  try {
    const body: Record<string, unknown> = {
      istAbschlussPrognose: istAbschlussPrognose.value,
    }
    if (selectedPO.value) body.pruefungsOrdnung = selectedPO.value
    if (lbnwNote.value !== rawLernabschnitt.value.noteLernbereichNW) {
      body.noteLernbereichNW = lbnwNote.value
    }
    await patchLernabschnittsdaten(rawLernabschnitt.value.id, body)

    // Gelöschte Fächer vom Server entfernen
    const vorhandeneIds = new Set(faecher.value.map(f => f.svwsId).filter((id): id is number => id !== null))
    for (const rohF of rohFaecher.value) {
      if (!vorhandeneIds.has(rohF.svwsId)) {
        await deleteLeistungsdaten(rohF.svwsId)
      }
    }

    // Geänderte Noten speichern (svwsId-basiert, kein Index-Versatz)
    for (const rohF of rohFaecher.value) {
      const currentFach = faecher.value.find(f => f.svwsId === rohF.svwsId)
      if (!currentFach) continue
      const originalNote = notenModus.value === 'quartal' ? rohF.noteQuartal : rohF.noteHalbjahr
      if (currentFach.note === originalNote) continue
      const rawLd = rawLernabschnitt.value.leistungsdaten.find(ld => ld.id === rohF.svwsId)
      if (!rawLd) continue
      const noteField = notenModus.value === 'quartal' ? 'noteQuartal' : 'note'
      const noteStr = currentFach.note !== null ? String(currentFach.note) : null
      const patchBody = Object.fromEntries(
        Object.entries({ ...rawLd, [noteField]: noteStr } as Record<string, unknown>)
          .filter(([, v]) => v !== null)
      )
      await patchLeistungsdaten(rawLd.id, patchBody)
    }

    await laden()
  } catch (e: any) {
    speichernFehler.value = e?.message ?? 'Fehler beim Speichern.'
  } finally {
    speichert.value = false
  }
}

function addFach() {
  faecher.value.push({ kuerzel: '', bezeichnung: '', note: null, kursart: 'Sonstige', istFremdsprache: false, svwsId: null })
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

const KERNFACH_REIHENFOLGE = ['D', 'M', 'E']

function kernfaecherNachOben<T extends { kuerzel: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const ia = KERNFACH_REIHENFOLGE.indexOf(a.kuerzel)
    const ib = KERNFACH_REIHENFOLGE.indexOf(b.kuerzel)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return 0
  })
}

function normKuerzel(kuerzel: string): string {
  return /^WP\d/.test(kuerzel) ? 'WPU' : kuerzel
}

function mapKursart(k: string | null): 'E' | 'G' | 'Sonstige' {
  if (k === 'E') return 'E'
  if (k === 'G') return 'G'
  return 'Sonstige'
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

.toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.toolbar-title {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}
.toolbar-klasse {
  font-weight: 400;
  color: var(--p-text-muted-color);
}
.toolbar-sep  { flex: 1; }
.btn-naechster :deep(.p-button-icon) { color: #16a34a; }
.abschnitt-select { width: 16rem; flex-shrink: 0; }
.noten-toggle { flex-shrink: 0; }

.status-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
  padding: 0.5rem 0;
}

.main-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.5rem;
  align-items: stretch;
  min-height: 0;
  flex: 1;
}

.card {
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.4rem;
  background: var(--p-content-background);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid var(--p-content-border-color);
  flex-shrink: 0;
}
.card-title { font-size: 0.75rem; font-weight: 600; }
.btn-group  { display: flex; gap: 0.25rem; }

.table-wrapper { overflow-y: auto; flex: 1; }

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
  position: sticky;
  top: 0;
  background: var(--p-content-background);
  z-index: 1;
}
.faecher-table td {
  padding: 0.1rem 0.4rem;
  border-bottom: 1px solid var(--p-content-border-color);
  vertical-align: middle;
}
.faecher-table tbody tr:last-child td { border-bottom: none; }
.faecher-table tbody tr:hover { background: var(--p-highlight-background); }

.note--rot :deep(.p-select-label) { color: #dc2626; font-weight: 600; }

.col-center { text-align: center; }
.w-kuerzel  { width: 5rem; }
.w-bez      { width: 100%; min-width: 6rem; }
.w-note     { width: 4rem; }
.w-kursart  { width: 7rem; }

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

.result-badge  { font-size: 1.3rem; font-weight: 700; letter-spacing: 0.02em; line-height: 1; }
.result-name   { font-size: 0.7rem; font-weight: 600; line-height: 1.3; }
.result-sub    { font-size: 0.62rem; opacity: 0.65; }

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

.plog         { white-space: pre; color: var(--p-text-color); }
.plog--head   { font-weight: 600; color: var(--p-text-color); margin-top: 0.2rem; }
.plog--ok     { color: #15803d; font-weight: 600; }
.plog--fail   { color: #b91c1c; }
.plog--warn   { color: #b45309; }
.plog--result { font-weight: 700; font-size: 0.72rem; color: var(--p-primary-color); margin-top: 0.2rem; }

.result-icon-leer { font-size: 1.4rem; opacity: 0.3; }
.result-leer-text { font-size: 0.68rem; line-height: 1.3; }

.abschluss-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid var(--p-content-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.abschluss-field {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.abschluss-field--check { gap: 0.4rem; }
.abschluss-label { font-size: 0.72rem; color: var(--p-text-muted-color); white-space: nowrap; }
.po-select      { width: 14rem; }
.abschluss-select { width: 8rem; }
.speichern-fehler { font-size: 0.72rem; color: #b91c1c; margin-left: auto; }

.noten-warn-text {
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.5;
  color: var(--p-text-color);
}
</style>
