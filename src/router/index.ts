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
      path: '/auswahl',
      name: 'auswahl',
      component: () => import('@/views/SchuelerauswahlView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/schueler/:id/notenbilder',
      name: 'notenbilder',
      component: () => import('@/views/NotenbidView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/schueler/:id/prognose',
      name: 'prognose',
      component: () => import('@/views/PrognoseView.vue'),
      meta: { requiresAuth: true },
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
})

export default router
