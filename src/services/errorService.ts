import { useToast } from 'primevue/usetoast'
import { isAxiosError } from 'axios'
import type { AppError, AppErrorType } from '@/models/AppError'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function toAppError(input: unknown, source?: string): AppError {
  if (isAxiosError(input)) {
    const status = input.response?.status
    const type: AppErrorType = status === 401 || status === 403 ? 'auth' : 'api'
    return {
      id: generateId(),
      type,
      severity: 'error',
      messageUser: type === 'auth'
        ? 'Ungültige Zugangsdaten oder fehlende Berechtigung.'
        : `Server-Fehler (${status ?? 'unbekannt'}). Bitte SVWS-Server prüfen.`,
      messageTechnical: input.message,
      timestamp: new Date().toISOString(),
      context: { source, status },
    }
  }

  if (input instanceof Error) {
    return {
      id: generateId(),
      type: 'unexpected',
      severity: 'error',
      messageUser: 'Ein unerwarteter Fehler ist aufgetreten.',
      messageTechnical: input.message,
      timestamp: new Date().toISOString(),
      context: { source },
    }
  }

  return {
    id: generateId(),
    type: 'unexpected',
    severity: 'error',
    messageUser: 'Ein unbekannter Fehler ist aufgetreten.',
    messageTechnical: String(input),
    timestamp: new Date().toISOString(),
    context: { source },
  }
}

export function useErrorService() {
  const toast = useToast()

  function reportError(input: unknown, source?: string): AppError {
    const err = toAppError(input, source)
    console.error(`[${err.type}]`, err.messageTechnical, err.context)
    toast.add({ severity: 'error', summary: 'Fehler', detail: err.messageUser, life: 6000 })
    return err
  }

  function reportWarning(message: string): void {
    toast.add({ severity: 'warn', summary: 'Hinweis', detail: message, life: 5000 })
  }

  function reportInfo(message: string): void {
    toast.add({ severity: 'info', summary: 'Info', detail: message, life: 3000 })
  }

  return { reportError, reportWarning, reportInfo }
}
