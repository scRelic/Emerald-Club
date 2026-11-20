<script setup>
import { computed } from "vue";
import { usePlayerStore } from "@/stores/playerStore";
import { useBlackjack } from "@/composables/useBlackjack";
import { formatNumber } from "@/utils";
import DealerHand from "@/components/blackjack/DealerHand.vue";
import PlayerHand from "@/components/blackjack/PlayerHand.vue";
import { chipOptions, getTableTheme } from "@/utils/data";

const playerStore = usePlayerStore();
const tableTheme = computed(() => getTableTheme(playerStore.activeTableTheme));

const {
  playerCards,
  dealerCards,
  gameStatus,
  currentBet,
  resultMessage,
  resultType,
  errorMessage,
  isSubmitting,
  playerScore,
  visibleDealerScore,
  canDouble,
  setBet,
  startNewGame,
  hit,
  doubleDown,
  stand,
} = useBlackjack();

const getResultBannerStyle = () => {
  if (resultType.value === "blackjack") {
    return "bg-amber-400/20 border-amber-400/50 text-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.25)]";
  }
  if (resultType.value === "win") {
    return "bg-emerald-500/20 border-emerald-400/50 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.2)]";
  }
  if (resultType.value === "loss") {
    return "bg-rose-500/20 border-rose-400/50 text-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.2)]";
  }
  return "bg-white/10 border-white/25 text-gray-200";
};
</script>

<template>
  <div class="flex-1 flex flex-col justify-between text-white selection:bg-amber-400/30 overflow-x-hidden">
    <div class="relative z-10 w-full max-w-[1150px] mx-auto px-4 py-4 sm:py-6 flex-1 flex flex-col items-center justify-center gap-6">
      <div
        :class="[
          'w-full rounded-[44px] p-3.5 sm:p-4 shadow-[0_30px_90px_rgba(0,0,0,0.85)] border transition-colors duration-500',
          tableTheme.id === 'table-emerald'
            ? 'bg-gradient-to-b from-[#8a5530] via-[#4e2e19] to-[#9e6d42] border-amber-900/40'
            : tableTheme.id === 'table-midnight'
              ? 'bg-gradient-to-b from-[#1a365d] via-[#0f1f38] to-[#2a4a7f] border-blue-900/40'
              : tableTheme.id === 'table-sapphire'
                ? 'bg-gradient-to-b from-[#155e75] via-[#083344] to-[#0e7490] border-cyan-900/50'
                : tableTheme.id === 'table-royal-purple'
                  ? 'bg-gradient-to-b from-[#5b21b6] via-[#3b0764] to-[#6b21a8] border-violet-900/50'
                  : 'bg-gradient-to-b from-[#6b1d28] via-[#2b090e] to-[#8a2633] border-rose-900/40',
        ]">
        <div
          :style="{ background: tableTheme.tableGradient }"
          class="relative w-full min-h-[460px] sm:min-h-[520px] overflow-hidden rounded-[34px] border-[5px] border-[#22170f] shadow-[inset_0_0_70px_rgba(0,0,0,0.8)] flex flex-col justify-between py-6 px-4">
          <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none">
            <h1 class="font-casino text-3xl sm:text-5xl font-bold tracking-[0.35em] text-amber-300/10 text-center">EMERALD CLUB</h1>
            <p class="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-200/15 mt-2">Blackjack Pays 3 to 2</p>
          </div>

          <div class="relative z-10 w-full flex justify-center">
            <DealerHand v-if="gameStatus !== 'idle'" :cards="dealerCards" :score="visibleDealerScore" :hide-second-card="gameStatus === 'playing'" />
          </div>

          <div class="relative z-10 flex flex-col items-center justify-center gap-3 my-2">
            <div
              v-if="gameStatus !== 'idle'"
              class="px-4 py-1.5 rounded-full bg-black/40 border border-amber-400/25 backdrop-blur-md flex items-center gap-2 text-xs sm:text-sm">
              <span class="text-gray-300">Ставка в игре:</span>
              <span class="font-bold text-amber-300 tabular-nums">{{ formatNumber(currentBet) }}</span>
            </div>

            <transition
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="opacity-0 scale-90 translate-y-2"
              enter-to-class="opacity-100 scale-100 translate-y-0">
              <div
                v-if="gameStatus === 'finished' && resultMessage"
                :class="['px-6 py-2.5 rounded-2xl border backdrop-blur-md font-bold text-sm sm:text-base tracking-wide text-center', getResultBannerStyle()]">
                {{ resultMessage }}
              </div>
            </transition>
          </div>

          <div class="relative z-10 w-full flex justify-center">
            <PlayerHand v-if="gameStatus !== 'idle'" :cards="playerCards" :score="playerScore" />
          </div>

          <div
            v-if="gameStatus === 'idle'"
            class="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-sm z-20 p-4 text-center">
            <p class="font-casino text-2xl sm:text-3xl text-amber-200 mb-2">Стол готов к игре</p>
            <p class="text-xs sm:text-sm text-gray-300 mb-6">Выберите номинал фишек ниже и начните раздачу</p>
            <button
              @click="startNewGame"
              :disabled="isSubmitting || playerStore.chips < currentBet"
              class="px-8 py-3.5 rounded-2xl font-bold text-base sm:text-lg text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] shadow-[0_10px_30px_rgba(230,168,46,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer">
              Сделать ставку ({{ formatNumber(currentBet) }})
            </button>
          </div>
        </div>
      </div>

      <div
        class="w-full max-w-3xl rounded-3xl bg-[#0c1914]/90 border border-amber-400/20 backdrop-blur-xl px-5 py-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex flex-col items-center md:items-start gap-2">
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span>Ставка:</span>
            <span class="font-bold text-amber-300 tabular-nums">{{ formatNumber(currentBet) }} фишек</span>
            <span class="text-gray-600">•</span>
            <span
              >Баланс: <strong class="text-white tabular-nums">{{ formatNumber(playerStore.chips) }}</strong></span
            >
          </div>

          <div class="flex items-center gap-3 mt-1">
            <button
              v-for="chip in chipOptions"
              :key="chip.amount"
              @click="setBet(chip.amount)"
              :disabled="isSubmitting || gameStatus === 'playing' || gameStatus === 'dealerTurn' || playerStore.chips < chip.amount"
              :class="[
                'relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-dashed bg-gradient-to-b flex items-center justify-center font-bold text-xs tabular-nums transition-all duration-200 cursor-pointer',
                chip.style,
                currentBet === chip.amount
                  ? 'ring-2 ring-amber-300 scale-105 shadow-[0_0_16px_rgba(251,191,36,0.45)] z-10'
                  : 'opacity-75 hover:opacity-100 hover:scale-105 shadow-md',
                'disabled:opacity-30 disabled:pointer-events-none',
              ]">
              {{ chip.amount }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2.5 w-full md:w-auto justify-center">
          <template v-if="gameStatus === 'playing'">
            <button
              @click="hit"
              :disabled="isSubmitting"
              class="flex-1 md:flex-initial px-5 py-3 rounded-xl font-bold text-sm text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg">
              + Взять карту
            </button>

            <button
              @click="stand"
              :disabled="isSubmitting"
              class="flex-1 md:flex-initial px-5 py-3 rounded-xl font-bold text-sm text-white bg-rose-600/85 hover:bg-rose-500 border border-rose-400/30 active:scale-95 transition cursor-pointer shadow-lg">
              Хватит
            </button>

            <button
              v-if="canDouble"
              @click="doubleDown"
              :disabled="isSubmitting"
              class="px-4 py-3 rounded-xl font-bold text-sm text-amber-300 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 active:scale-95 transition cursor-pointer"
              title="Удвоить ставку и взять ровно одну карту">
              x2 Удвоить
            </button>
          </template>

          <template v-else-if="gameStatus === 'finished'">
            <button
              @click="startNewGame"
              :disabled="isSubmitting || playerStore.chips < currentBet"
              class="w-full md:w-auto px-7 py-3 rounded-xl font-bold text-sm text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] hover:brightness-110 active:scale-95 disabled:opacity-40 transition cursor-pointer shadow-lg">
              Новая раздача ({{ formatNumber(currentBet) }})
            </button>
          </template>
        </div>
        <p v-if="errorMessage" class="text-sm text-rose-300 text-center">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>
