<template>
  <div class="connect-wrapper">
    <ThemeToggle class="connect-theme" />
    <div class="connect-card">
      <h1>SVWS Prognos</h1>
      <p class="version">v{{ version }}</p>
      <p class="subtitle">Verbindung zum SVWS-Server</p>

      <form @submit.prevent="handleConnect">
        <div class="field">
          <label for="url">Server-URL</label>
          <InputText
            id="url"
            v-model="form.baseUrl"
            placeholder="https://svws-server.example.de"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label for="schema">Schema</label>
          <InputText
            id="schema"
            v-model="form.schema"
            placeholder="schulname"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label for="user">Benutzername</label>
          <InputText
            id="user"
            v-model="form.username"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label for="pass">Passwort</label>
          <Password
            id="pass"
            v-model="form.password"
            :feedback="false"
            toggleMask
            :disabled="loading"
          />
        </div>

        <Message v-if="fehler" severity="error">{{ fehler }}</Message>

        <Button
          type="submit"
          label="Verbinden"
          :loading="loading"
          class="w-full"
        />
      </form>
    </div>
    <LegalFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { version } from '../../package.json'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '@/stores/auth'
import LegalFooter from '@/components/LegalFooter.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const auth = useAuthStore()

const form = ref({
  baseUrl: import.meta.env.VITE_SVWS_URL ?? '',
  schema: import.meta.env.VITE_SVWS_SCHEMA ?? '',
  username: import.meta.env.VITE_SVWS_USERNAME ?? '',
  password: import.meta.env.VITE_SVWS_PASSWORD ?? '',
})

const loading = ref(false)
const fehler = ref('')

async function handleConnect() {
  fehler.value = ''
  loading.value = true
  try {
    await auth.connect(form.value)
    router.push({ name: 'dashboard' })
  } catch (e) {
    fehler.value = 'Verbindung fehlgeschlagen. Bitte URL, Schema und Zugangsdaten prüfen.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.connect-wrapper {
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.connect-theme {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.connect-card {
  background: var(--surface);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

h1 {
  margin: 0 0 0.1rem;
  font-size: 1.75rem;
  color: var(--accent);
  text-align: center;
}

.version {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  color: var(--app-ink);
  opacity: 0.5;
  text-align: center;
}

.subtitle {
  margin: 0 0 2rem;
  color: var(--app-ink);
  opacity: 0.7;
  text-align: center;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1.25rem;
}

.field label {
  font-size: 0.875rem;
  font-weight: 500;
}

.field :deep(input),
.field :deep(.p-password) {
  width: 100%;
}
</style>
