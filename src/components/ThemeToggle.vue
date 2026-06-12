<template>
  <button class="theme-btn" :title="title" @click="cycle">
    <i :class="icon" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { preference, setTheme } = useTheme()
const order = ['system', 'light', 'dark'] as const

function cycle() {
  setTheme(order[(order.indexOf(preference.value) + 1) % order.length])
}

const icon = computed(() => ({
  system: 'pi pi-desktop',
  light:  'pi pi-sun',
  dark:   'pi pi-moon',
}[preference.value]))

const title = computed(() => ({
  system: 'System-Theme',
  light:  'Hell',
  dark:   'Dunkel',
}[preference.value]))
</script>

<style scoped>
.theme-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1px solid var(--p-content-border-color);
  background: transparent;
  color: var(--p-text-muted-color);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;
}
.theme-btn:hover {
  color: var(--p-primary-color);
  border-color: var(--p-primary-color);
}
</style>
