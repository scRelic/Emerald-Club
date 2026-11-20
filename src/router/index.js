import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/LobbyView.vue')
    },
    {
      path: '/games',
      name: 'games',
      component: () => import('../views/GamesView.vue')
    },
    {
      path: '/games/blackjack',
      name: 'blackjack',
      meta: { requiresAuth: true },
      component: () => import('../views/BlackjackView.vue')
    },
    {
      path: '/games/poker',
      name: 'poker',
      meta: { requiresAuth: true },
      component: () => import('../views/PokerView.vue')
    },
    {
      path: '/games/roulette',
      name: 'roulette',
      meta: { requiresAuth: true },
      component: () => import('../views/RouletteView.vue')
    },
    {
      path: '/games/dice',
      name: 'dice',
      meta: { requiresAuth: true },
      component: () => import('../views/DiceView.vue')
    },
    {
      path: '/games/fortune',
      name: 'fortune',
      meta: { requiresAuth: true },
      component: () => import('../views/FortuneWheelView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      meta: { requiresAuth: true },
      component: () => import('../views/ProfileView.vue')
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue')
    },
    {
      path: '/shop',
      name: 'shop',
      component: () => import('../views/ShopView.vue')
    },
    {
      path: '/rules',
      name: 'rules',
      component: () => import('../views/RulesView.vue')
    }
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (!to.meta.requiresAuth || authStore.isAuthenticated) return true

  await authStore.restoreSession()

  if (authStore.isAuthenticated) return true
  return { name: 'auth', query: { redirect: to.fullPath } }
})

export default router
