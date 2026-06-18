<template>
  <div class="page">
    <div class="toolbar">
      <Button icon="pi pi-arrow-left" text size="small" @click="router.push({ name: 'dashboard' })" />
      <span class="toolbar-title">Einstellungen</span>
      <div class="toolbar-sep" />
      <ThemeToggle />
    </div>
    <p class="placeholder">Implementierung folgt.</p>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
</script>

<style scoped>
.page {
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
.placeholder {
  padding: 2rem;
  color: var(--p-text-muted-color);
  font-style: italic;
}
</style>
