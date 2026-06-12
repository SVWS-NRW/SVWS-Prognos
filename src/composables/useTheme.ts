import { ref, watchEffect } from 'vue'

type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'dark-mode'
const preference = ref<ThemePreference>('system')

function applyTheme(pref: ThemePreference): void {
  const isDark =
    pref === 'dark' ||
    (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

export function initTheme(): void {
  const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null
  preference.value = stored ?? 'system'
  applyTheme(preference.value)

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (preference.value === 'system') applyTheme('system')
  })

  watchEffect(() => {
    localStorage.setItem(STORAGE_KEY, preference.value)
    applyTheme(preference.value)
  })
}

export function useTheme() {
  return {
    preference,
    setTheme(pref: ThemePreference) {
      preference.value = pref
    },
  }
}
