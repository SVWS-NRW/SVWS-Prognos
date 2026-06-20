import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/connect',
      name: 'connect',
      component: () => import('@/views/ConnectView.vue'),
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/jahrgang/:jg',
      name: 'jahrgang',
      component: () => import('@/views/SchuelerauswahlView.vue'),
      meta: { requiresAuth: true, requiresSchulform: true },
    },
    {
      path: '/manuell',
      name: 'manuell',
      component: () => import('@/views/ManuellePrognoseView.vue'),
      meta: { requiresAuth: true, requiresSchulform: true },
    },
    {
      path: '/auswertungen',
      name: 'auswertungen',
      component: () => import('@/views/AuswertungenView.vue'),
      meta: { requiresAuth: true, requiresSchulform: true },
    },
    {
      path: '/schueler/:id/notenbilder',
      name: 'notenbilder',
      component: () => import('@/views/NotenbildView.vue'),
      meta: { requiresAuth: true, requiresSchulform: true },
    },
    {
      path: '/schueler/:id/prognose',
      name: 'prognose',
      component: () => import('@/views/PrognoseView.vue'),
      meta: { requiresAuth: true, requiresSchulform: true },
    },
    {
      path: '/einstellungen',
      name: 'einstellungen',
      component: () => import('@/views/EinstellungenView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/connect',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isConnected) {
    return { name: 'connect' }
  }
  if (to.meta.requiresSchulform && auth.isConnected && !auth.schulformUnterstuetzt) {
    return { name: 'dashboard' }
  }
})

export default router
