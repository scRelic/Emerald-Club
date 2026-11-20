<script setup>
import { ref } from "vue";
import { formatNumber } from "@/utils";
import { usePlayerStore } from "../../stores/playerStore";
import { useAuthStore } from "../../stores/authStore";
import { sound } from "@/utils/sound";

const playerStore = usePlayerStore();
const authStore = useAuthStore();
const isMuted = ref(sound.muted);
const isMobileMenuOpen = ref(false);
const mobileNavLinks = [
  { to: "/", label: "Главная" },
  { to: "/games", label: "Играть" },
  { to: "/rules", label: "Правила" },
  { to: "/shop", label: "Магазин" },
  { to: "/profile", label: "Профиль" },
];

const toggleSound = () => {
  sound.muted = !sound.muted;
  isMuted.value = sound.muted;
  if (!sound.muted) {
    sound.playClick();
  }
};
</script>

<template>
  <header class="relative z-20 border-b border-white/[0.06] bg-black/50 backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
      <RouterLink to="/" class="flex items-center gap-2.5 text-left group cursor-pointer">
        <span class="text-2xl sm:text-3xl text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)] group-hover:scale-105 transition"> ♠ </span>
        <div class="leading-none">
          <div class="font-bold text-base sm:text-lg tracking-wide text-amber-100 font-cinzel">Emerald</div>
          <div class="text-[10px] uppercase tracking-[0.28em] text-amber-400/80 mt-0.5">Club</div>
        </div>
      </RouterLink>

      <nav class="hidden lg:flex items-center gap-1">
        <RouterLink
          to="/"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          active-class="!text-amber-300 !border-amber-400/30 !border-b-2 !border-b-amber-400 !bg-gradient-to-b !from-amber-400/5 !!from-amber-400/5 !to-amber-400/20 shadow-[0_4px_20px_rgba(245,184,46,0.15)]">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Главная
        </RouterLink>

        <RouterLink
          to="/games"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          active-class="!text-amber-300 !border-amber-400/30 !border-b-2 !border-b-amber-400 !bg-gradient-to-b !from-amber-400/5 !to-amber-400/20 shadow-[0_4px_20px_rgba(245,184,46,0.15)]">
          <span class="text-base leading-none">♣</span>
          Играть
        </RouterLink>

        <RouterLink
          to="/rules"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          active-class="!text-amber-300 !border-amber-400/30 !border-b-2 !border-b-amber-400 !bg-gradient-to-b !from-amber-400/5 !to-amber-400/20 shadow-[0_4px_20px_rgba(245,184,46,0.15)]">
          <svg class="w-4 h-4 text-base group-hover:scale-110 transition" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          Правила
        </RouterLink>

        <RouterLink
          to="/shop"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          active-class="!text-amber-300 !border-amber-400/30 !border-b-2 !border-b-amber-400 !bg-gradient-to-b !from-amber-400/5 !to-amber-400/20 shadow-[0_4px_20px_rgba(245,184,46,0.15)]">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Магазин
        </RouterLink>

      </nav>

      
      <div class="flex items-center gap-1 sm:gap-3">
        <button
          @click="toggleSound"
          class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/40 flex items-center justify-center text-gray-300 hover:text-white transition cursor-pointer"
          :title="isMuted ? 'Включить звук' : 'Выключить звук'">
          <span v-if="!isMuted">🔊</span>
          <span v-else class="opacity-40">🔇</span>
        </button>
        <div
          title="Демо-фишки сохраняются только в этом браузере"
          class="flex items-center gap-1 sm:gap-3 pl-1.5 sm:pl-2 pr-1 sm:pr-1.5 py-1 rounded-full bg-black/60 border border-white/10">
          <div
            class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-b from-red-500 to-red-700 border-2 border-dashed border-white/90 flex items-center justify-center text-[10px] font-bold shadow text-white">
            ♠
          </div>
          <span class="font-bold text-xs sm:text-sm tracking-wide tabular-nums">
            {{ formatNumber(authStore.isAuthenticated ? playerStore.chips : 0) }}
          </span>
          <button
            v-if="authStore.isAuthenticated"
            @click="$emit('addChips')"
            title="Пополнить фишки"
            class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center text-sm transition cursor-pointer">
            +
          </button>
        </div>

        <RouterLink
          to="/profile"
          class="hidden min-[360px]:block w-8 h-8 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-tr from-red-600 via-amber-500 to-amber-300 shadow-[0_0_15px_rgba(220,38,38,0.25)] cursor-pointer">
          <div class="w-full h-full rounded-full bg-[#121e1a] flex items-center justify-center text-amber-300">
            <svg class="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </RouterLink>

        <button
          type="button"
          class="lg:hidden w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/40 flex items-center justify-center text-gray-300 hover:text-white transition cursor-pointer"
          :aria-expanded="isMobileMenuOpen"
          aria-controls="mobile-navigation"
          :aria-label="isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'"
          @click="isMobileMenuOpen = !isMobileMenuOpen">
          <svg v-if="!isMobileMenuOpen" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>

    <nav
      v-if="isMobileMenuOpen"
      id="mobile-navigation"
      class="lg:hidden absolute top-full inset-x-0 px-3 sm:px-6 py-3 bg-[#07100d]/95 border-b border-white/10 backdrop-blur-xl shadow-xl">
      <div class="max-w-6xl mx-auto grid gap-1">
        <RouterLink
        v-for="link in mobileNavLinks"
          :key="link.to"
          :to="link.to"
          class="px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition"
          active-class="!text-amber-300 !bg-amber-400/10"
          @click="isMobileMenuOpen = false">
          {{ link.label }}
        </RouterLink>
      </div>
    </nav>
  </header>
</template>
