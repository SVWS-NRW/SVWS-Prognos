import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { createApiClient, destroyApiClient } from '@/services/apiClient'

export interface AuthConfig {
  baseUrl: string
  schema: string
  username: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const baseUrl = ref('')
  const schema = ref('')
  const username = ref('')
  const _connected = ref(false)

  const isConnected = computed(() => _connected.value)

  async function connect(config: AuthConfig): Promise<void> {
    createApiClient(config.baseUrl, config.schema, config.username, config.password)
    baseUrl.value = config.baseUrl
    schema.value = config.schema
    username.value = config.username
    _connected.value = true
  }

  function disconnect(): void {
    destroyApiClient()
    baseUrl.value = ''
    schema.value = ''
    username.value = ''
    _connected.value = false
  }

  return { baseUrl, schema, username, isConnected, connect, disconnect }
})
