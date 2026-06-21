import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { createApiClient, destroyApiClient } from '@/services/apiClient'
import { loadSchulstammdaten } from '@/services/svwsService'
import { useSchuljahresabschnittStore } from './schuljahresabschnitt'
import type { Schulform } from '@/rules/types'

export interface AuthConfig {
  baseUrl: string
  schema: string
  username: string
  password: string
}

const SVWS_SCHULFORM: Record<string, Schulform> = {
  GE: 'GESAMTSCHULE',
  SK: 'SEKUNDARSCHULE',
  PR: 'PRIMUSSCHULE',
}

export const useAuthStore = defineStore('auth', () => {
  const baseUrl = ref('')
  const schema = ref('')
  const username = ref('')
  const schulformKuerzel = ref('')
  const schulform = ref<Schulform>('GESAMTSCHULE')
  const _connected = ref(false)

  const isConnected = computed(() => _connected.value)
  const schulformUnterstuetzt = computed(() => schulformKuerzel.value in SVWS_SCHULFORM)

  async function connect(config: AuthConfig): Promise<void> {
    createApiClient(config.baseUrl, config.schema, config.username, config.password)
    const stammdaten = await loadSchulstammdaten()
    const abschnittStore = useSchuljahresabschnittStore()
    abschnittStore.setFromStammdaten(stammdaten)
    baseUrl.value = config.baseUrl
    schema.value = config.schema
    username.value = config.username
    schulformKuerzel.value = stammdaten.schulform
    schulform.value = SVWS_SCHULFORM[stammdaten.schulform] ?? 'GESAMTSCHULE'
    _connected.value = true
  }

  function disconnect(): void {
    destroyApiClient()
    const abschnittStore = useSchuljahresabschnittStore()
    abschnittStore.clear()
    baseUrl.value = ''
    schema.value = ''
    username.value = ''
    schulformKuerzel.value = ''
    schulform.value = 'GESAMTSCHULE'
    _connected.value = false
  }

  return { baseUrl, schema, username, schulform, schulformKuerzel, schulformUnterstuetzt, isConnected, connect, disconnect }
})
