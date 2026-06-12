<template>
  <div class="page">
    <h1>Dashboard</h1>
    <Button label="Zur Schülerauswahl" @click="router.push({ name: 'auswahl' })" />
    <Button label="Abmelden" severity="secondary" @click="handleLogout" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

function handleLogout() {
  auth.disconnect()
  router.push({ name: 'connect' })
}
</script>

<style scoped>
.page { padding: 2rem; display: flex; flex-direction: column; gap: 1rem; }
</style>
