<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Gruppenprognose · ${klasse} · ${schueler.length} Schüler`"
    :style="{ width: phase === 'optionen' ? '36rem' : '60rem' }"
    :draggable="false"
    :closable="!laeuft"
    :close-on-escape="!laeuft"
    @update:visible="v => emit('update:visible', v)"
  >
    <!-- Optionen -->
    <div v-if="phase === 'optionen'" class="optionen">
      <div class="option">
        <span class="option-label">Noten</span>
        <SelectButton
          v-model="optionen.notenModus"
          :options="notenModusOptionen"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
      </div>

      <div class="option">
        <span class="option-label">Ablauf</span>
        <div class="option-werte">
          <div class="radio">
            <RadioButton v-model="optionen.sofortSpeichern" :value="false" input-id="gp-vorschau" />
            <label for="gp-vorschau">Erst berechnen und anzeigen, dann speichern</label>
          </div>
          <div class="radio">
            <RadioButton v-model="optionen.sofortSpeichern" :value="true" input-id="gp-sofort" />
            <label for="gp-sofort">Sofort berechnen und speichern</label>
          </div>
        </div>
      </div>

      <div class="option">
        <span class="option-label">Endgültige Abschlüsse</span>
        <div class="radio">
          <Checkbox v-model="optionen.endgueltigeUeberschreiben" :binary="true" input-id="gp-endgueltig" />
          <label for="gp-endgueltig">Auch Schüler mit endgültigem Abschluss („Ist Prognose“: nein) überschreiben</label>
        </div>
      </div>

      <ul class="hinweise">
        <li>„Ist Prognose“ wird {{ istPrognoseStandard ? 'gesetzt' : 'nicht gesetzt (Jg. 10 im 2. Halbjahr: tatsächlicher Abschluss)' }}, Prüfungsordnung APO-SI20.</li>
        <li>Noten werden nicht verändert. Kursarten und ausgeschlossene Fächer aus dem gespeicherten Prognosetext werden übernommen.</li>
        <li>Gespeichert wird nur, wo sich etwas ändert. Schüler mit AOSF oder ohne Noten werden übersprungen und in der Ergebnisliste gemeldet.</li>
      </ul>
    </div>

    <!-- Fortschritt und Ergebnis -->
    <template v-else>
      <div v-if="laeuft" class="fortschritt">
        <ProgressBar :value="Math.round((fertig / Math.max(eintraege.length, 1)) * 100)" :show-value="false" class="fortschritt-balken" />
        <span>{{ phase === 'speichern' ? 'Speichere' : 'Berechne' }} {{ fertig }} von {{ eintraege.length }}…</span>
      </div>

      <div class="zusammenfassung">
        <span v-for="z in zusammenfassung" :key="z.status" class="zahl" :class="`zahl--${z.status}`">{{ z.anzahl }} {{ z.label }}</span>
      </div>

      <div class="table-wrapper">
        <table class="ergebnis-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Gespeichert</th>
              <th>Neu</th>
              <th>Status</th>
              <th>Hinweis</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in eintraege" :key="e.schuelerId">
              <td class="td-name">{{ e.name }}</td>
              <td>{{ kurz(e.alt) }}</td>
              <td :class="{ 'abschluss--anders': e.neu !== null && e.neu !== e.alt }">{{ kurz(e.neu) }}</td>
              <td><span class="status" :class="`status--${e.status}`">{{ statusText(e.status) }}</span></td>
              <td class="td-hinweis" :title="e.hinweis ?? ''">{{ e.hinweis ?? '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template #footer>
      <template v-if="phase === 'optionen'">
        <Button label="Abbrechen" text size="small" @click="emit('update:visible', false)" />
        <Button
          :label="optionen.sofortSpeichern ? 'Berechnen und speichern' : 'Berechnen'"
          icon="pi pi-calculator"
          size="small"
          @click="berechnen"
        />
      </template>
      <template v-else-if="laeuft">
        <Button label="Abbrechen" severity="danger" outlined size="small" :disabled="abbrechen" @click="abbrechen = true" />
      </template>
      <template v-else>
        <Button label="Schließen" text size="small" @click="emit('update:visible', false)" />
        <Button
          v-if="anzahl('aenderung') > 0"
          :label="`${anzahl('aenderung')} Änderungen speichern`"
          icon="pi pi-save"
          severity="success"
          size="small"
          @click="speichern"
        />
      </template>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
import SelectButton from 'primevue/selectbutton'
import ProgressBar from 'primevue/progressbar'
import { isAxiosError } from 'axios'
import type { AbschlussTyp } from '@/models/PrognoseErgebnis'
import type { Schueler } from '@/models/Schueler'
import { useAuthStore } from '@/stores/auth'
import { useFaecherStore } from '@/stores/faecher'
import { useSchuelerStore } from '@/stores/schueler'
import { useSchuljahresabschnittStore } from '@/stores/schuljahresabschnitt'
import { loadPruefungsordnungen, loadSvwsLernabschnittsdaten } from '@/services/svwsService'
import { toAppError } from '@/services/errorService'
import { ABSCHLUSS_KURZ, APO_SI20_PO, istApoSI20 } from '@/services/schildAbschluss'
import { erzeugeKursKuerzelLader, ladePrognoseKontext, speicherePrognose, standardIstPrognose } from '@/services/prognoseBerechnung'
import type { SpeicherAuftrag } from '@/services/prognoseBerechnung'
import { bewerteGruppenEintrag, fuerAlle } from '@/services/gruppenprognose'
import type { GruppenOptionen, GruppenStatus } from '@/services/gruppenprognose'

const props = defineProps<{
  visible: boolean
  // Markierte Schüler einer Klasse, in der Reihenfolge der Liste
  schueler: Schueler[]
  abschnittId: number
}>()

const emit = defineEmits<{ 'update:visible': [boolean] }>()

const authStore = useAuthStore()
const faecherStore = useFaecherStore()
const schuelerStore = useSchuelerStore()
const abschnittStore = useSchuljahresabschnittStore()

// Wie beim Nachladen der Abschlussdaten in der Schülerliste
const PARALLEL = 10

interface Eintrag {
  schuelerId: number
  name: string
  jahrgang: string
  status: GruppenStatus
  hinweis: string | null
  alt: AbschlussTyp | null
  neu: AbschlussTyp | null
  auftrag: SpeicherAuftrag | null
}

const phase = ref<'optionen' | 'berechnen' | 'speichern' | 'ergebnis'>('optionen')
const optionen = reactive<GruppenOptionen>({ notenModus: 'halbjahr', sofortSpeichern: false, endgueltigeUeberschreiben: false })
const eintraege = ref<Eintrag[]>([])
const fertig = ref(0)
const abbrechen = ref(false)

const laeuft = computed(() => phase.value === 'berechnen' || phase.value === 'speichern')
const klasse = computed(() => props.schueler[0]?.klasseKuerzel ?? '')
const halbjahr = computed(() => abschnittStore.abschnitte.find(a => a.id === props.abschnittId)?.abschnitt ?? null)
const istPrognoseStandard = computed(() => standardIstPrognose(props.schueler[0]?.jahrgang ?? null, halbjahr.value))

const notenModusOptionen = [
  { label: 'Halbjahr', value: 'halbjahr' },
  { label: 'Quartal', value: 'quartal' },
]

const STATUS_TEXT: Record<GruppenStatus, string> = {
  wartet: 'nicht berechnet',
  aenderung: 'wird geändert',
  unveraendert: 'unverändert',
  uebersprungen: 'übersprungen',
  fehler: 'Fehler',
  gespeichert: 'gespeichert',
}

function statusText(s: GruppenStatus): string {
  return s === 'wartet' && laeuft.value ? '…' : STATUS_TEXT[s]
}

function kurz(a: AbschlussTyp | null): string {
  return a ? ABSCHLUSS_KURZ[a] : '–'
}

function anzahl(s: GruppenStatus): number {
  return eintraege.value.filter(e => e.status === s).length
}

const zusammenfassung = computed(() =>
  (['gespeichert', 'aenderung', 'unveraendert', 'uebersprungen', 'fehler', 'wartet'] as GruppenStatus[])
    .map(status => ({ status, anzahl: anzahl(status), label: STATUS_TEXT[status] }))
    .filter(z => z.anzahl > 0 && !(z.status === 'wartet' && laeuft.value))
)

// Beim Öffnen immer mit den Optionen und den aktuell markierten Schülern beginnen
watch(() => props.visible, offen => {
  if (!offen) return
  phase.value = 'optionen'
  abbrechen.value = false
  eintraege.value = props.schueler.map(s => ({
    schuelerId: s.id,
    name: `${s.nachname}, ${s.vorname}`,
    jahrgang: s.jahrgang,
    status: 'wartet',
    hinweis: null,
    alt: null,
    neu: null,
    auftrag: null,
  }))
})

function fehlertext(e: unknown, kontext: string): string {
  if (isAxiosError(e)) return toAppError(e, kontext).messageUser
  return e instanceof Error ? e.message : 'Unbekannter Fehler'
}

async function speichereEintrag(e: Eintrag) {
  await speicherePrognose(e.auftrag!)
  e.status = 'gespeichert'
  e.auftrag = null
  // Liste mit dem gespeicherten Stand aktualisieren; ein Fehler hier betrifft nur die Anzeige
  try {
    schuelerStore.aktualisiereAbschluss(props.abschnittId, await loadSvwsLernabschnittsdaten(e.schuelerId, props.abschnittId))
  } catch { /* Anzeige wird beim nächsten Neuladen der Liste korrigiert */ }
}

async function berechnen() {
  phase.value = 'berechnen'
  fertig.value = 0
  try {
    await faecherStore.ensureLoaded()
    const pos = await loadPruefungsordnungen(authStore.schulformKuerzel)
    const apoSI20Po = pos.find(p => istApoSI20(p.pruefungsOrdnung))?.pruefungsOrdnung ?? APO_SI20_PO
    const ladeKursKuerzel = erzeugeKursKuerzelLader()

    await fuerAlle(eintraege.value, PARALLEL, async e => {
      try {
        const k = await ladePrognoseKontext(e.schuelerId, props.abschnittId, faecherStore.faecherMap, ladeKursKuerzel)
        Object.assign(e, bewerteGruppenEintrag(k, {
          jahrgang: e.jahrgang || null,
          halbjahr: halbjahr.value,
          schulform: authStore.schulform,
          apoSI20Po,
        }, optionen))
        if (optionen.sofortSpeichern && e.status === 'aenderung') await speichereEintrag(e)
      } catch (err) {
        e.status = 'fehler'
        e.hinweis = fehlertext(err, 'Gruppenprognose.berechnen')
      }
      fertig.value++
    }, () => abbrechen.value)
  } catch (err) {
    for (const e of eintraege.value) {
      if (e.status === 'wartet') { e.status = 'fehler'; e.hinweis = fehlertext(err, 'Gruppenprognose.vorbereiten') }
    }
  }
  phase.value = 'ergebnis'
}

async function speichern() {
  const offen = eintraege.value.filter(e => e.status === 'aenderung')
  phase.value = 'speichern'
  abbrechen.value = false
  fertig.value = eintraege.value.length - offen.length
  await fuerAlle(offen, PARALLEL, async e => {
    try {
      await speichereEintrag(e)
    } catch (err) {
      e.status = 'fehler'
      e.hinweis = fehlertext(err, 'Gruppenprognose.speichern')
    }
    fertig.value++
  }, () => abbrechen.value)
  phase.value = 'ergebnis'
}
</script>

<style scoped>
.optionen { display: flex; flex-direction: column; gap: 1rem; font-size: 0.9rem; }
.option { display: grid; grid-template-columns: 10rem 1fr; gap: 0.75rem; align-items: start; }
.option-label { font-weight: 600; padding-top: 0.35rem; }
.option-werte { display: flex; flex-direction: column; gap: 0.5rem; }
.radio { display: flex; align-items: center; gap: 0.5rem; padding-top: 0.25rem; }
.hinweise { margin: 0; padding-left: 1.25rem; color: var(--p-text-muted-color); font-size: 0.85rem; line-height: 1.5; }

.fortschritt { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-size: 0.9rem; }
.fortschritt-balken { flex: 1; height: 0.5rem; }

.zusammenfassung { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.85rem; }
.zahl { padding: 0.15rem 0.6rem; border-radius: 1rem; border: 1px solid var(--p-content-border-color); }
.zahl--gespeichert, .zahl--aenderung { color: var(--abschluss-sicher); border-color: currentColor; }
.zahl--uebersprungen, .zahl--wartet { color: var(--abschluss-unsicher); border-color: currentColor; }
.zahl--fehler { color: var(--abschluss-nicht); border-color: currentColor; }

.table-wrapper { max-height: 55vh; overflow: auto; border: 1px solid var(--p-content-border-color); border-radius: 0.4rem; }
.ergebnis-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.ergebnis-table th {
  text-align: left; padding: 0.4rem 0.6rem; font-weight: 500; color: var(--p-text-muted-color);
  border-bottom: 1px solid var(--p-content-border-color); position: sticky; top: 0; background: var(--p-content-background);
}
.ergebnis-table td { padding: 0.35rem 0.6rem; border-bottom: 1px solid var(--p-content-border-color); white-space: nowrap; }
.ergebnis-table tbody tr:last-child td { border-bottom: none; }
.td-name { font-weight: 500; }
.td-hinweis { white-space: normal; color: var(--p-text-muted-color); font-size: 0.8rem; }
.abschluss--anders { font-weight: 700; }

.status { font-weight: 500; }
.status--gespeichert, .status--aenderung { color: var(--abschluss-sicher); }
.status--uebersprungen, .status--wartet { color: var(--abschluss-unsicher); }
.status--fehler { color: var(--abschluss-nicht); }
.status--unveraendert { color: var(--p-text-muted-color); }
</style>
