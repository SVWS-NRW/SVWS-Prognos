<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>SVWS Prognos</h1>
      <div class="header-actions">
        <ThemeToggle />
        <Button
          label="Abmelden"
          icon="pi pi-sign-out"
          severity="secondary"
          text
          @click="handleLogout"
        />
      </div>
    </header>

    <Message
      v-if="!auth.schulformUnterstuetzt"
      severity="warn"
      :closable="false"
      class="schulform-warnung"
    >
      <strong>Nicht unterstützte Schulform ({{ auth.schulformKuerzel }})</strong><br>
      SVWS-Prognos ist ausschließlich für Gesamtschulen, Sekundarschulen und Primusschulen vorgesehen.
      Eine Prognoseberechnung ist für diese Schule nicht möglich.
    </Message>

    <div class="tile-grid">
      <!-- Jahrgang 8 -->
      <div
        class="tile"
        :class="auth.schulformUnterstuetzt ? 'tile--nav' : 'tile--gesperrt'"
        @click="auth.schulformUnterstuetzt && router.push({ name: 'jahrgang', params: { jg: '8' } })"
      >
        <div class="tile-icon tile-icon--jg">8</div>
        <div class="tile-body">
          <span class="tile-title">Jahrgang 8</span>
          <span class="tile-sub">Schülerprognosen erstellen</span>
        </div>
        <i class="pi pi-chevron-right tile-arrow" />
      </div>

      <!-- Jahrgang 9 -->
      <div
        class="tile"
        :class="auth.schulformUnterstuetzt ? 'tile--nav' : 'tile--gesperrt'"
        @click="auth.schulformUnterstuetzt && router.push({ name: 'jahrgang', params: { jg: '9' } })"
      >
        <div class="tile-icon tile-icon--jg">9</div>
        <div class="tile-body">
          <span class="tile-title">Jahrgang 9</span>
          <span class="tile-sub">Schülerprognosen erstellen</span>
        </div>
        <i class="pi pi-chevron-right tile-arrow" />
      </div>

      <!-- Jahrgang 10 -->
      <div
        class="tile"
        :class="auth.schulformUnterstuetzt ? 'tile--nav' : 'tile--gesperrt'"
        @click="auth.schulformUnterstuetzt && router.push({ name: 'jahrgang', params: { jg: '10' } })"
      >
        <div class="tile-icon tile-icon--jg">10</div>
        <div class="tile-body">
          <span class="tile-title">Jahrgang 10</span>
          <span class="tile-sub">Schülerprognosen erstellen</span>
        </div>
        <i class="pi pi-chevron-right tile-arrow" />
      </div>

      <!-- Manuelle Prognose -->
      <div
        class="tile"
        :class="auth.schulformUnterstuetzt ? 'tile--nav tile--accent' : 'tile--gesperrt'"
        @click="auth.schulformUnterstuetzt && router.push({ name: 'manuell' })"
      >
        <div class="tile-icon"><i class="pi pi-pencil" /></div>
        <div class="tile-body">
          <span class="tile-title">Manuelle Prognose</span>
          <span class="tile-sub">Noten eingeben oder JSON importieren</span>
        </div>
        <i class="pi pi-chevron-right tile-arrow" />
      </div>

      <!-- Auswertungen -->
      <div
        class="tile"
        :class="auth.schulformUnterstuetzt ? 'tile--nav' : 'tile--gesperrt'"
        @click="auth.schulformUnterstuetzt && router.push({ name: 'auswertungen' })"
      >
        <div class="tile-icon"><i class="pi pi-chart-bar" /></div>
        <div class="tile-body">
          <span class="tile-title">Auswertungen</span>
          <span class="tile-sub">Statistiken und Übersichten</span>
        </div>
        <i class="pi pi-chevron-right tile-arrow" />
      </div>

      <!-- Schuldaten (Info-Kachel, nicht navigierbar) -->
      <div class="tile tile--info">
        <div class="tile-icon"><i class="pi pi-building" /></div>
        <div class="tile-body">
          <span class="tile-title">Schuldaten</span>
          <dl class="info-list">
            <dt>Schulform</dt>
            <dd>{{ auth.schulformKuerzel || '–' }}</dd>
            <dt>Schema</dt>
            <dd>{{ auth.schema }}</dd>
            <dt>Server</dt>
            <dd class="url">{{ auth.baseUrl }}</dd>
            <dt>Benutzer</dt>
            <dd>{{ auth.username }}</dd>
            <dt>Abschnitt</dt>
            <dd>{{ abschnittStore.ausgewaehlt?.bezeichnung ?? '–' }}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '@/stores/auth'
import { useSchuljahresabschnittStore } from '@/stores/schuljahresabschnitt'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const auth = useAuthStore()
const abschnittStore = useSchuljahresabschnittStore()

function handleLogout() {
  auth.disconnect()
  router.push({ name: 'connect' })
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.schulform-warnung {
  max-width: 680px;
}

.tile-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 900px) {
  .tile-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 560px) {
  .tile-grid { grid-template-columns: 1fr; }
}

.tile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--p-content-border-color);
  background: var(--p-content-background);
}

.tile--nav {
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.tile--nav:hover {
  background: var(--p-highlight-background);
  border-color: var(--p-primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tile--accent .tile-icon {
  background: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
}

.tile--gesperrt {
  cursor: not-allowed;
  opacity: 0.45;
}

.tile--info {
  align-items: flex-start;
}

.tile-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background: var(--p-primary-50, #eff6ff);
  color: var(--p-primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.tile-icon--jg {
  font-size: 1.4rem;
  font-weight: 700;
}

.tile-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.tile-title {
  font-weight: 600;
  font-size: 1rem;
}

.tile-sub {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

.tile-arrow {
  flex-shrink: 0;
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
}

.info-list {
  margin: 0.35rem 0 0 0;
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 0.75rem;
  row-gap: 0.2rem;
  font-size: 0.8rem;
}

.info-list dt {
  color: var(--p-text-muted-color);
  font-weight: 500;
}

.info-list dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-list .url {
  font-size: 0.72rem;
}
</style>
