<template>
  <div class="page">
    <div class="page-header">
      <Button icon="pi pi-arrow-left" text @click="router.push({ name: 'dashboard' })" />
      <h1>Jahrgang {{ jg }}</h1>
      <ThemeToggle style="margin-left: auto" />
    </div>

    <div class="toolbar">
      <Select
        v-model="selectedKlasse"
        :options="klassen"
        option-label="kuerzel"
        option-value="id"
        placeholder="Alle Klassen"
        show-clear
        class="klassen-select"
      />
    </div>

    <p class="placeholder">Schülerliste wird nach SVWS-Anbindung geladen.</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import ThemeToggle from '@/components/ThemeToggle.vue'

const route = useRoute()
const router = useRouter()

const jg = route.params.jg as string

const selectedKlasse = ref<number | null>(null)
// Wird später per loadKlassen() aus der SVWS-API befüllt
const klassen = ref<Array<{ id: number; kuerzel: string }>>([])
</script>

<style scoped>
.page { padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem; }
.page-header { display: flex; align-items: center; gap: 0.5rem; }
.page-header h1 { margin: 0; }
.toolbar { display: flex; gap: 0.75rem; align-items: center; }
.klassen-select { width: 14rem; }
.placeholder { color: var(--p-text-muted-color); }
</style>
