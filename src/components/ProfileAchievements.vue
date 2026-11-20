<script setup>
import { computed, ref } from "vue";
import { usePlayerStore } from "../stores/playerStore";

const playerStore = usePlayerStore();
const achievements = computed(() => playerStore.achievements);
const unlockedCount = computed(() => achievements.value.filter((achievement) => achievement.unlocked).length);
const currentPage = ref(1);
const pageSize = 4;
const pageCount = computed(() => Math.max(1, Math.ceil(achievements.value.length / pageSize)));
const pages = computed(() => Array.from({ length: pageCount.value }, (_, index) => index + 1));
const paginatedAchievements = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return achievements.value.slice(start, start + pageSize);
});

const goToPage = (page) => {
  if (page >= 1 && page <= pageCount.value) currentPage.value = page;
};
</script>

<template>
  <div class="rounded-3xl p-6 bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 backdrop-blur-xl border border-amber-400/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="font-casino text-lg font-bold text-amber-100">Достижения клуба</h3>
      <span class="text-xs text-gray-400">Открыто: {{ unlockedCount }} из {{ achievements.length }}</span>
    </div>
    <p class="text-xs text-gray-500 mb-4">Награда за новое достижение автоматически начисляется на баланс.</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div
        v-for="item in paginatedAchievements"
        :key="item.id"
        :class="[
          'p-4 rounded-2xl border flex items-start gap-3.5 transition',
          item.unlocked ? 'bg-amber-400/[0.06] border-amber-400/30' : 'bg-black/40 border-white/5 opacity-65',
        ]">
        <div class="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-lg shrink-0">
          {{ item.icon }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h4 class="font-bold text-sm text-white truncate">{{ item.title }}</h4>
            <span class="text-[11px] font-bold text-amber-400 shrink-0">+{{ item.reward }} ♠</span>
          </div>
          <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">{{ item.description }}</p>
          <div class="flex items-center justify-between gap-2 mt-2">
            <span class="text-[10px] text-gray-500">{{ item.progress }} / {{ item.target }}</span>
            <span v-if="item.rewarded" class="text-[10px] font-semibold text-emerald-300">✓ Награда получена</span>
            <span v-else-if="item.unlocked" class="text-[10px] font-semibold text-amber-300">Открыто</span>
          </div>
          <div class="h-1.5 mt-1.5 rounded-full bg-black/60 overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-500"
              :style="{ width: `${Math.min(100, (item.progress / item.target) * 100)}%` }" />
          </div>
        </div>
      </div>
    </div>

    <nav v-if="pageCount > 1" aria-label="Страницы достижений" class="flex items-center justify-center gap-2 mt-5">
      <button
        type="button"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        class="px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:border-amber-400/40 disabled:opacity-40 disabled:cursor-not-allowed">
        Назад
      </button>
      <button
        v-for="page in pages"
        :key="page"
        type="button"
        :aria-current="currentPage === page ? 'page' : undefined"
        @click="goToPage(page)"
        :class="[
          'w-9 h-9 rounded-xl border text-xs font-bold transition',
          currentPage === page
            ? 'bg-amber-400/20 border-amber-400/40 text-amber-200'
            : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:border-white/25',
        ]">
        {{ page }}
      </button>
      <button
        type="button"
        :disabled="currentPage === pageCount"
        @click="goToPage(currentPage + 1)"
        class="px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:border-amber-400/40 disabled:opacity-40 disabled:cursor-not-allowed">
        Вперёд
      </button>
    </nav>
  </div>
</template>
