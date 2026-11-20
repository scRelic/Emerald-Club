<script setup>
import { ref, computed, watch } from "vue";
import { usePlayerStore } from "../stores/playerStore";
import { formatNumber } from "@/utils";

const playerStore = usePlayerStore();
const gameFilter = ref("all");
const currentPage = ref(1);
const pageSize = 5;

const filters = [
  { id: "all", label: "Все игры" },
  { id: "Блэкджек", label: "♠ Блэкджек" },
  { id: "Покер", label: "♥ Покер" },
  { id: "Рулетка", label: "♦ Рулетка" },
  { id: "Кости", label: "⚄ Кости" },
  { id: "Колесо фортуны", label: "🎡 Колесо" },
];

const filteredHistory = computed(() => {
  const list = playerStore.gameHistory || [];
  if (gameFilter.value === "all") return list;
  return list.filter((item) => item.game === gameFilter.value);
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredHistory.value.length / pageSize)));
const pages = computed(() => Array.from({ length: pageCount.value }, (_, index) => index + 1));
const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredHistory.value.slice(start, start + pageSize);
});

watch(gameFilter, () => {
  currentPage.value = 1;
});

const goToPage = (page) => {
  if (page >= 1 && page <= pageCount.value) currentPage.value = page;
};

const getSymbolColor = (game) => {
  if (game === "Блэкджек") return "text-amber-400 bg-emerald-500/10 border-emerald-400/20";
  if (game === "Покер") return "text-rose-500 bg-rose-500/10 border-rose-400/20";
  if (game === "Кости") return "text-violet-300 bg-violet-500/10 border-violet-400/20";
  if (game === "Колесо фортуны") return "text-amber-300 bg-amber-500/10 border-amber-400/20";
  return "text-sky-400 bg-sky-500/10 border-sky-400/20";
};
</script>

<template>
  <div class="rounded-3xl p-6 sm:p-7 bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 backdrop-blur-xl border border-amber-400/20">
    
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h3 class="font-casino text-xl font-bold text-amber-100">История последних партий</h3>
        <p class="text-xs text-gray-400 mt-0.5">Лог сыгранных раздач и изменений вашего банкролла</p>
      </div>

      <div class="flex flex-wrap gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
        <button
          v-for="f in filters"
          :key="f.id"
          @click="gameFilter = f.id"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer',
            gameFilter === f.id ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-gray-400 hover:text-white',
          ]">
          {{ f.label }}
        </button>
      </div>
    </div>

    
    <div v-if="filteredHistory.length" class="space-y-3">
      <div
        v-for="item in paginatedHistory"
        :key="item.id"
        class="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3.5">
          <div :class="['w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0', getSymbolColor(item.game)]">
            {{ item.symbol }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">{{ item.game }}</span>
              <span class="text-xs text-gray-400">• {{ item.label }}</span>
            </div>
            <div class="text-xs text-gray-500 mt-0.5">
              Ставка: <span class="text-gray-300 font-medium tabular-nums">{{ formatNumber(item.bet) }}</span> • {{ item.time }}
            </div>
          </div>
        </div>

        
        <div class="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
          <span
            v-if="item.netChange > 0"
            class="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-400/25 tabular-nums">
            +{{ formatNumber(item.netChange) }} фишек
          </span>
          <span
            v-else-if="item.netChange < 0"
            class="px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-400/25 tabular-nums">
            -{{ formatNumber(Math.abs(item.netChange)) }} фишек
          </span>
          <span v-else class="px-3 py-1 rounded-xl text-xs font-bold bg-white/10 text-gray-300 border border-white/15 tabular-nums">
            Возврат ({{ formatNumber(item.bet) }})
          </span>
        </div>
      </div>
    </div>

    <nav v-if="filteredHistory.length > pageSize" aria-label="Страницы истории игр" class="flex flex-wrap items-center justify-center gap-2 mt-6">
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

    
    <div v-else class="py-12 text-center text-gray-400 text-sm">В этой категории пока нет сыгранных партий.</div>
  </div>
</template>
