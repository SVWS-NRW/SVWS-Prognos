<template>
  <section class="impressum-section">
    <a
      class="impressum-link"
      href="https://svws-nrw.github.io/SVWS-Prognos/"
      target="_blank"
      rel="noopener noreferrer"
    >Hilfe</a>
    <button class="impressum-link" type="button" @click="openImpressumModal">Impressum</button>
    <button class="impressum-link" type="button" @click="datenschutzOpen = true">Datenschutzhinweise</button>
  </section>

  <div
    v-if="datenschutzOpen"
    class="impressum-modal-bg"
    role="presentation"
    @click.self="datenschutzOpen = false"
  >
    <section
      class="impressum-modal datenschutz-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="datenschutz-modal-title"
    >
      <div class="impressum-modal-head">
        <h2 id="datenschutz-modal-title" class="impressum-modal-title">Datenschutzhinweise</h2>
        <button
          class="impressum-modal-close"
          type="button"
          aria-label="Datenschutzhinweise schließen"
          @click="datenschutzOpen = false"
        >Schließen</button>
      </div>
      <div class="impressum-modal-content" v-html="datenschutzHtml" />
    </section>
  </div>

  <div
    v-if="impressumOpen"
    class="impressum-modal-bg"
    role="presentation"
    @click.self="closeImpressumModal"
  >
    <section
      class="impressum-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="impressum-modal-title"
    >
      <div class="impressum-modal-head">
        <h2 id="impressum-modal-title" class="impressum-modal-title">Impressum</h2>
        <button
          class="impressum-modal-close"
          type="button"
          aria-label="Impressum schließen"
          @click="closeImpressumModal"
        >Schließen</button>
      </div>
      <p v-if="impressumLoading" class="impressum-modal-status">Impressum wird geladen…</p>
      <p v-else-if="impressumError" class="impressum-modal-error">{{ impressumError }}</p>
      <div v-else class="impressum-modal-content" v-html="impressumHtml" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import datenschutzRawMd from '../../docs/datenschutz.md?raw'

const datenschutzHtml = DOMPurify.sanitize(marked.parse(datenschutzRawMd, { async: false }))

const datenschutzOpen = ref(false)
const impressumOpen = ref(false)
const impressumLoading = ref(false)
const impressumHtml = ref('')
const impressumError = ref('')

type ImpressumWindow = Window & { __IMPRESSUM_MARKDOWN__?: string }

async function loadImpressumScript(): Promise<string> {
  const existing = (window as ImpressumWindow).__IMPRESSUM_MARKDOWN__
  if (existing != null) return existing

  await new Promise<void>((resolve, reject) => {
    function loadScript(src: string, onError: () => void) {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = onError
      document.head.appendChild(script)
    }

    const primary = new URL('impressum.js', window.location.href).toString()
    const fallback = new URL('impressum.example.js', window.location.href).toString()

    loadScript(primary, () => {
      loadScript(fallback, () => {
        reject(new Error(
          'Weder "impressum.js" noch "impressum.example.js" wurden gefunden. ' +
          'Bitte benennen Sie "impressum.example.js" in "impressum.js" um und tragen Sie Ihre Schuldaten ein.'
        ))
      })
    })
  })

  const loaded = (window as ImpressumWindow).__IMPRESSUM_MARKDOWN__
  if (loaded == null) throw new Error('Die Datei "impressum.js" enthält keinen Impressumstext.')
  return loaded
}

async function openImpressumModal() {
  impressumOpen.value = true
  if (impressumLoading.value || impressumHtml.value) return

  impressumLoading.value = true
  impressumError.value = ''

  try {
    let content: string
    if (import.meta.env.DEV) {
      const url = new URL('impressum.md', window.location.href).toString()
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Datei konnte nicht geladen werden (${response.status}).`)
      content = await response.text()
    } else {
      content = await loadImpressumScript()
    }
    const rawHtml = marked.parse(content, { async: false })
    impressumHtml.value = DOMPurify.sanitize(rawHtml)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    impressumError.value = `Impressum konnte nicht geladen werden: ${message}`
  } finally {
    impressumLoading.value = false
  }
}

function closeImpressumModal() {
  impressumOpen.value = false
}
</script>
