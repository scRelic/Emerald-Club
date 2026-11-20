<script setup>
import { ref, computed } from "vue";
import { POKER_TABLES } from "@/config/pokerTables";
import { formatNumber } from "@/utils";
import { otherGames } from "@/utils/data";

const activeCategory = ref("all");

const categories = [
  { id: "all", label: "Все столы" },
  { id: "cards", label: "Карточные" },
  { id: "board", label: "Настольные" },
  { id: "casino", label: "Казино" },
];

const selectedPokerRoom = ref("classic");

const pokerRoomsList = [
  { id: "classic", label: "500 — 1 000", online: 98 },
  { id: "vip", label: "1 000 — 5 000", online: 42 },
  { id: "highroller", label: "5 000 — 25 000", online: 14 },
];

const showPoker = computed(() => activeCategory.value === "all" || activeCategory.value === "cards");
const filteredOtherGames = computed(() => {
  if (activeCategory.value === "all") return otherGames;
  return otherGames.filter((g) => g.category === activeCategory.value);
});
</script>

<template>
  <div class="w-full max-w-[1250px] mx-auto px-4 sm:px-6 py-8 sm:py-10 text-white">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10 z-10 relative">
      <div>
        <span class="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-400/80 block mb-1.5"> Игровой зал </span>
        <h1 class="font-casino text-4xl sm:text-5xl font-bold text-[#F3D58D] tracking-wide flex items-center gap-3">
          Игры клуба <span class="text-2xl sm:text-3xl text-amber-400">♠</span>
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-2 bg-black/35 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md self-start md:self-auto">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="activeCategory = cat.id"
          :class="[
            'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeCategory === cat.id
              ? 'bg-gradient-to-b from-[#F9D876] to-[#D49824] text-[#1c1304] shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5',
          ]">
          {{ cat.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <template v-for="game in filteredOtherGames" :key="game.id">
        <div
          v-if="game.id === 'blackjack'"
          :class="[
            'lg:col-span-7 relative overflow-hidden rounded-3xl border p-6 sm:p-7 flex flex-col justify-between shadow-xl transition duration-300 hover:-translate-y-0.5',
            game.cardBg,
          ]">
          <div :class="['pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-[150px] select-none leading-none', game.watermarkColor]">
            {{ game.watermark }}
          </div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <span class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/40 text-gray-300 border border-white/10">
                {{ game.categoryLabel }}
              </span>
              <span :class="['px-3 py-1 rounded-full text-xs font-bold shadow-sm', game.badgeStyle]">
                {{ game.badge }}
              </span>
            </div>

            <p class="text-xs font-semibold text-amber-400 mb-1">
              {{ game.subtitle }}
            </p>
            <h3 class="font-casino text-3xl sm:text-4xl text-white tracking-wide mb-2.5">
              {{ game.title }}
            </h3>
            <p class="text-xs sm:text-sm text-gray-300/85 leading-relaxed mb-6 max-w-md">
              {{ game.description }}
            </p>
          </div>

          <div class="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-6">
              <div>
                <span class="block text-[10px] uppercase tracking-wider text-gray-400">Лимиты стола</span>
                <span class="text-sm font-extrabold text-white tabular-nums">
                  <span :class="game.symbolColor">{{ game.symbol }}</span> {{ game.limits }}
                </span>
              </div>

              <div v-if="game.online">
                <span class="block text-[10px] uppercase tracking-wider text-gray-400">Онлайн</span>
                <span class="text-sm font-bold text-emerald-400 flex items-center gap-1.5 tabular-nums">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {{ game.online }} игроков
                </span>
              </div>
            </div>

            <router-link
              :to="game.route"
              class="px-6 py-3 rounded-2xl font-bold text-sm text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] shadow-[0_6px_20px_rgba(230,168,46,0.3)] hover:brightness-110 active:scale-95 transition flex items-center gap-2">
              <span>Сесть за стол</span>
              <span class="text-xs">▶</span>
            </router-link>
          </div>
        </div>
      </template>

      <div
        v-if="showPoker"
        class="lg:col-span-5 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2d0d16] via-[#1f0910] to-[#140509] border border-rose-500/20 p-6 sm:p-7 flex flex-col justify-between shadow-xl transition duration-300 hover:-translate-y-0.5">
        <div class="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-[150px] text-rose-500/[0.05] select-none leading-none">♥</div>

        <div>
          <div class="flex items-center justify-between gap-2 mb-4">
            <span class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/40 text-gray-300 border border-white/10"> Покер </span>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm"> 3 зала </span>
          </div>

          <p class="text-xs font-semibold text-amber-400 mb-1">Безлимитный холдем • 1–4 соперника</p>
          <h3 class="font-casino text-3xl sm:text-4xl text-white tracking-wide mb-2.5">TEXAS HOLD'EM</h3>
          <p class="text-xs sm:text-sm text-gray-300/85 leading-relaxed mb-5 max-w-md">
            Собирай комбинации, читай соперников и блефуй за столами разных лимитов.
          </p>

          <div class="flex flex-wrap items-center gap-2 mb-6">
            <button
              v-for="room in pokerRoomsList"
              :key="room.id"
              type="button"
              @click="selectedPokerRoom = room.id"
              :class="[
                'px-3 py-1.5 rounded-xl text-xs font-bold tabular-nums border transition cursor-pointer',
                selectedPokerRoom === room.id
                  ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                  : 'bg-black/35 border-white/10 text-gray-400 hover:border-white/25 hover:text-gray-200',
              ]">
              ♠ {{ room.label }}
            </button>
          </div>
        </div>

        <div class="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-6">
            <div>
              <span class="block text-[10px] uppercase tracking-wider text-gray-400">Лимиты стола</span>
              <span class="text-sm font-extrabold text-white tabular-nums">
                <span class="text-rose-500">♠</span>
                {{ formatNumber(POKER_TABLES[selectedPokerRoom].minBuyIn) }} — {{ formatNumber(POKER_TABLES[selectedPokerRoom].maxBuyIn) }}
              </span>
            </div>

            <div>
              <span class="block text-[10px] uppercase tracking-wider text-gray-400">Онлайн</span>
              <span class="text-sm font-bold text-emerald-400 flex items-center gap-1.5 tabular-nums">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {{ pokerRoomsList.find((r) => r.id === selectedPokerRoom)?.online }} игроков
              </span>
            </div>
          </div>

          <router-link
            :to="{ path: '/games/poker', query: { table: selectedPokerRoom } }"
            class="px-6 py-3 rounded-2xl font-bold text-sm text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] shadow-[0_6px_20px_rgba(230,168,46,0.3)] hover:brightness-110 active:scale-95 transition flex items-center gap-2">
            <span>Сесть за стол</span>
            <span class="text-xs">▶</span>
          </router-link>
        </div>
      </div>

      <template v-for="game in filteredOtherGames" :key="game.id">
        <div
          v-if="game.id !== 'blackjack'"
          :class="[
            game.category === 'casino' ? 'lg:col-span-4' : 'lg:col-span-5',
            game.id === 'chess' ? 'lg:order-last' : '',
            'relative overflow-hidden rounded-3xl border p-6 sm:p-7 flex flex-col justify-between shadow-xl transition duration-300',
            game.available ? 'hover:-translate-y-0.5' : '',
            game.cardBg,
          ]">
          <div :class="['pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-[150px] select-none leading-none', game.watermarkColor]">
            {{ game.watermark }}
          </div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <span class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/40 text-gray-300 border border-white/10">
                {{ game.categoryLabel }}
              </span>
              <span :class="['px-3 py-1 rounded-full text-xs font-bold shadow-sm', game.badgeStyle]">
                {{ game.badge }}
              </span>
            </div>

            <p class="text-xs font-semibold text-amber-400 mb-1">
              {{ game.subtitle }}
            </p>
            <h3 :class="['font-casino text-white tracking-wide mb-2.5', game.category === 'casino' ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl']">
              {{ game.title }}
            </h3>
            <p class="text-xs sm:text-sm text-gray-300/85 leading-relaxed mb-6 max-w-md">
              {{ game.description }}
            </p>
          </div>

          <div class="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-6">
              <div>
                <span class="block text-[10px] uppercase tracking-wider text-gray-400">Лимиты стола</span>
                <span class="text-sm font-extrabold text-white tabular-nums">
                  <span :class="game.symbolColor">{{ game.symbol }}</span> {{ game.limits }}
                </span>
              </div>

              <div v-if="game.online">
                <span class="block text-[10px] uppercase tracking-wider text-gray-400">Онлайн</span>
                <span class="text-sm font-bold text-emerald-400 flex items-center gap-1.5 tabular-nums">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {{ game.online }} игроков
                </span>
              </div>
            </div>

            <router-link
              v-if="game.available"
              :to="game.route"
              class="px-6 py-3 rounded-2xl font-bold text-sm text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] shadow-[0_6px_20px_rgba(230,168,46,0.3)] hover:brightness-110 active:scale-95 transition flex items-center gap-2">
              <span>Сесть за стол</span>
              <span class="text-xs">▶</span>
            </router-link>

            <button v-else disabled class="px-6 py-3 rounded-2xl font-bold text-sm text-gray-400 bg-white/5 border border-white/10 cursor-not-allowed">
              Скоро
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
