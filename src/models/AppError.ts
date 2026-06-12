export type AppErrorType = 'network' | 'auth' | 'api' | 'validation' | 'berechnung' | 'unexpected'
export type AppErrorSeverity = 'error' | 'warn' | 'info'

export interface AppError {
  id: string
  type: AppErrorType
  severity: AppErrorSeverity
  messageUser: string
  messageTechnical: string
  timestamp: string
  context?: Record<string, unknown>
}
