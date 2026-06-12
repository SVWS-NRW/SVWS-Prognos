<template>
  <div class="page">
    <div class="page-header">
      <Button icon="pi pi-arrow-left" text @click="router.back()" />
      <h1>Auswertungen</h1>
      <ThemeToggle style="margin-left: auto" />
    </div>
    <p class="placeholder">Statistiken und Auswertungen folgen.</p>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
</script>

<style scoped>
.page { padding: 2rem; display: flex; flex-direction: column; gap: 1rem; }
.page-header { display: flex; align-items: center; gap: 0.5rem; }
.page-header h1 { margin: 0; }
.placeholder { color: var(--p-text-muted-color); }
</style>
