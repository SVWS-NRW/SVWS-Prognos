import axios, { type AxiosInstance } from 'axios'

let _client: AxiosInstance | null = null
let _rootClient: AxiosInstance | null = null

function buildAuthHeader(username: string, password: string): string {
  return 'Basic ' + btoa(`${username}:${password}`)
}

export function createApiClient(
  baseUrl: string,
  schema: string,
  username: string,
  password: string
): void {
  const auth = buildAuthHeader(username, password)
  const isElectron = typeof window !== 'undefined' && 'process' in window

  const resolvedBase = isElectron
    ? `${baseUrl}/db/${schema}`
    : `/svws-proxy/db/${schema}`

  const resolvedRoot = isElectron
    ? baseUrl
    : '/svws-proxy'

  const headers: Record<string, string> = {
    Authorization: auth,
    'Content-Type': 'application/json',
  }

  if (!isElectron) {
    headers['X-Proxy-Target'] = baseUrl
  }

  _client = axios.create({
    baseURL: resolvedBase,
    timeout: 30_000,
    headers,
  })

  _rootClient = axios.create({
    baseURL: resolvedRoot,
    timeout: 30_000,
    headers,
  })
}

export function getApiClient(): AxiosInstance {
  if (!_client) throw new Error('API-Client nicht initialisiert. Bitte zuerst verbinden.')
  return _client
}

export function getRootClient(): AxiosInstance {
  if (!_rootClient) throw new Error('API-Client nicht initialisiert. Bitte zuerst verbinden.')
  return _rootClient
}

export function destroyApiClient(): void {
  _client = null
  _rootClient = null
}
