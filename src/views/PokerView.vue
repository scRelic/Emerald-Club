<script setup>
import { computed } from "vue";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import { usePlayerStore } from "@/stores/playerStore";
import { usePoker } from "@/composables/usePoker";
import { formatNumber } from "@/utils";
import PlayingCard from "@/components/PlayingCard.vue";
import { getTableTheme } from "@/utils/data";

const playerStore = usePlayerStore();

const route = useRoute();
const tableTheme = computed(() => getTableTheme(playerStore.activeTableTheme));
const tableSurfaceStyle = computed(() => ({ background: tableTheme.value.tableGradient }));

const {
  currentTable,
  minBuyIn,
  maxBuyIn,
  isSeated,
  buyInAmount,
  tableChips,
  playerCards,
  bots,
  communityCards,
  stage,
  smallBlind,
  bigBlind,
  pot,
  betPresets,
  resultMessage,
  resultType,
  winnerIds,
  playerHandEval,
  turnTimeLeft,
  isBotsTurn,
  dealerSeatId,
  sbSeatId,
  bbSeatId,
  handHistory,
  currentBet,
  playerRoundBet,
  isPlayerTurn,
  playerFolded,
  showdownRevealed,
  errorMessage,
  sitAtTable,
  leaveTable,
  startNewHand,
  check,
  raise,
  fold,
} = usePoker(route.query.table);

onBeforeRouteLeave(async () => {
  if (!isSeated.value) return true;
  return leaveTable();
});

const stageLabels = {
  idle: "Ожидание",
  preflop: "Префлоп",
  flop: "Флоп",
  turn: "Тёрн",
  river: "Ривер",
  showdown: "Вскрытие",
};

const isPlaying = () => ["preflop", "flop", "turn", "river"].includes(stage.value);

const getSeatPosition = (index, total) => {
  if (total === 1) return "md:top-6 md:left-1/2 md:-translate-x-1/2";
  if (total === 2) {
    return ["md:top-8 md:left-[22%] md:-translate-x-1/2", "md:top-8 md:left-[78%] md:-translate-x-1/2"][index];
  }
  if (total === 3) {
    return ["md:top-1/2 md:left-6 md:-translate-y-1/2", "md:top-6 md:left-1/2 md:-translate-x-1/2", "md:top-1/2 md:right-6 md:-translate-y-1/2"][index];
  }
  return [
    "md:top-[52%] md:left-6 md:-translate-y-1/2",
    "md:top-6 md:left-[28%] md:-translate-x-1/2",
    "md:top-6 md:left-[72%] md:-translate-x-1/2",
    "md:top-[52%] md:right-6 md:-translate-y-1/2",
  ][index];
};
</script>

<template>
  <div class="flex-1 flex flex-col justify-between text-white selection:bg-amber-400/30 overflow-x-hidden">
    <div
      v-if="errorMessage"
      role="alert"
      class="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg rounded-xl border border-rose-400/40 bg-rose-950/90 px-4 py-3 text-center text-sm text-rose-100 shadow-xl">
      {{ errorMessage }}
    </div>

    <div
      v-if="isSeated && stage !== 'idle'"
      class="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col w-64 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md p-3 shadow-2xl">
      <div class="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 border-b border-white/10 pb-1">История раздачи</div>

      <div
        class="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 text-xs text-gray-300 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-amber-400/20 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div v-for="(log, idx) in handHistory" :key="idx" class="leading-tight">• {{ log }}</div>
      </div>
    </div>
    <div class="relative z-10 w-full max-w-[1150px] mx-auto px-4 py-4 sm:py-6 flex-1 flex flex-col items-center justify-center gap-5">
      <div
        :class="[
          'w-full rounded-[44px] md:rounded-[180px] p-3.5 sm:p-4 shadow-[0_30px_90px_rgba(0,0,0,0.85)] border transition-colors duration-500',
          tableTheme.id === 'table-emerald'
            ? 'bg-gradient-to-b from-[#1e4620] via-[#0f2811] to-[#275a29] border-emerald-900/40'
            : tableTheme.id === 'table-midnight'
              ? 'bg-gradient-to-b from-[#1a365d] via-[#0f1f38] to-[#2a4a7f] border-blue-900/40'
              : tableTheme.id === 'table-burgundy'
                ? 'bg-gradient-to-b from-[#6b1d28] via-[#2b090e] to-[#8a2633] border-rose-900/40'
                : tableTheme.id === 'table-sapphire'
                  ? 'bg-gradient-to-b from-[#155e75] via-[#083344] to-[#0e7490] border-cyan-900/50'
                  : tableTheme.id === 'table-royal-purple'
                    ? 'bg-gradient-to-b from-[#5b21b6] via-[#3b0764] to-[#6b21a8] border-violet-900/50'
                    : 'bg-gradient-to-b from-[#8a5530] via-[#4e2e19] to-[#9e6d42] border-amber-900/40',
        ]">
        <div
          style="min-height: 580px"
          :style="tableSurfaceStyle"
          class="relative w-full h-[580px] sm:h-[640px] overflow-hidden rounded-[34px] md:rounded-[168px] border-[5px] border-[#22170f] shadow-[inset_0_0_70px_rgba(0,0,0,0.85)] flex flex-col justify-between md:justify-center py-5 px-4">
          <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none">
            <h1 class="font-casino text-4xl sm:text-6xl font-bold tracking-[0.35em] text-amber-300/[0.04] text-center">TEXAS HOLD'EM</h1>
          </div>

          <div v-if="isSeated && stage !== 'idle'" class="relative z-20 flex flex-wrap items-center justify-center gap-3 md:contents">
            <div
              v-for="(bot, index) in bots"
              :key="bot.id"
              :class="[
                'md:absolute flex flex-col items-center gap-1.5 transition-all duration-300',
                getSeatPosition(index, bots.length),
                bot.folded ? 'opacity-45' : '',
                isBotsTurn && bot.lastAction === 'Думает...' ? 'scale-105 z-30' : '',
              ]">
              <div v-if="dealerSeatId === bot.id || sbSeatId === bot.id || bbSeatId === bot.id" class="flex gap-1 -mb-1 z-10">
                <span
                  v-if="dealerSeatId === bot.id"
                  class="px-2 py-0.5 bg-white text-black font-extrabold text-[10px] rounded-full shadow-lg border border-black/20"
                  >D</span
                >
                <span
                  v-if="sbSeatId === bot.id"
                  class="px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[10px] rounded-full shadow-lg border border-blue-400"
                  >SB</span
                >
                <span
                  v-if="bbSeatId === bot.id"
                  class="px-2 py-0.5 bg-purple-600 text-white font-extrabold text-[10px] rounded-full shadow-lg border border-purple-400"
                  >BB</span
                >
              </div>

              <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md shadow-md">
                <span class="text-[11px] font-bold uppercase tracking-wider text-gray-200">
                  {{ bot.name }}
                </span>
                <span
                  v-if="showdownRevealed && bot.handEval && !bot.folded"
                  class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/35">
                  {{ bot.handEval.name }}
                </span>
              </div>

              <div
                :class="[
                  'flex items-center justify-center rounded-xl transition-all duration-300 p-1',
                  winnerIds.includes(bot.id) ? 'ring-2 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.45)] scale-105' : '',
                  isBotsTurn && bot.lastAction === 'Думает...' ? 'ring-4 ring-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.6)] bg-amber-400/10' : '',
                ]">
                <div v-for="(card, idx) in bot.cards" :key="idx" :class="idx > 0 ? '-ml-5' : ''">
                  <PlayingCard :card="card" :hidden="!showdownRevealed || bot.folded" size="sm" />
                </div>
              </div>

              <span
                :class="[
                  'text-[10px] px-2.5 py-0.5 rounded-full font-medium backdrop-blur-md border',
                  bot.folded ? 'bg-rose-950/75 border-rose-500/30 text-rose-300' : 'bg-black/60 border-white/10 text-amber-200/90',
                ]">
                {{ bot.lastAction }}
              </span>
            </div>
          </div>

          <div v-if="isSeated" class="relative z-10 flex flex-col items-center justify-center gap-3 min-h-[155px] md:-mt-6">
            <div
              v-if="stage !== 'idle'"
              class="flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/55 border border-amber-400/30 backdrop-blur-md text-xs sm:text-sm">
              <span class="text-amber-400/90 uppercase font-semibold text-[11px] tracking-wider">
                {{ stageLabels[stage] }}
              </span>
              <span class="text-gray-600">|</span>
              <span class="text-gray-300">Банк:</span>
              <span class="font-bold text-amber-300 tabular-nums">{{ formatNumber(pot) }} фишек</span>

              <div v-if="stage !== 'idle' && stage !== 'showdown'" class="flex flex-col items-center my-3">
                <div v-if="playerFolded" class="text-gray-300 font-bold text-sm">Вы сбросили карты — соперники продолжают раздачу</div>

                <div v-else-if="isBotsTurn" class="text-amber-400 font-bold text-sm animate-pulse flex items-center gap-2">
                  <span>🤖 Соперники думают над ходом...</span>
                </div>

                <div v-else class="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
                  <span class="text-xs text-gray-300">Ваш ход:</span>
                  <div class="w-24 bg-gray-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000"
                      :style="{ width: `${(turnTimeLeft / 15) * 100}%` }"></div>
                  </div>
                  <span :class="['text-xs font-bold tabular-nums', turnTimeLeft <= 5 ? 'text-red-400 animate-bounce' : 'text-amber-300']">
                    {{ turnTimeLeft }}с
                  </span>
                </div>
              </div>
            </div>

            <transition
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="opacity-0 scale-95 translate-y-2"
              enter-to-class="opacity-100 scale-100 translate-y-0">
              <div v-if="communityCards.length > 0" class="flex items-center justify-center gap-1.5 sm:gap-2">
                <template v-for="slot in 5" :key="slot">
                  <PlayingCard v-if="communityCards[slot - 1]" :card="communityCards[slot - 1]" size="sm" />
                  <div
                    v-else
                    class="w-14 h-20 sm:w-16 sm:h-24 rounded-xl border border-amber-400/15 bg-[#1b070c]/90 shadow-inner flex items-center justify-center text-amber-400/15 text-xs">
                    ♠
                  </div>
                </template>
              </div>
            </transition>

            <div
              v-if="stage === 'showdown' && resultMessage"
              :class="[
                'px-6 py-2 rounded-2xl border backdrop-blur-md font-bold text-xs sm:text-sm tracking-wide text-center max-w-md',
                resultType === 'win'
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : resultType === 'loss'
                    ? 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                    : 'bg-white/10 border-white/25 text-gray-200',
              ]">
              {{ resultMessage }}
            </div>
          </div>

          <div
            v-if="isSeated && stage !== 'idle'"
            class="relative md:absolute md:bottom-5 md:left-1/2 md:-translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
            <div v-if="dealerSeatId === 'player' || sbSeatId === 'player' || bbSeatId === 'player'" class="flex gap-1 -mb-1">
              <span
                v-if="dealerSeatId === 'player'"
                class="px-2 py-0.5 bg-white text-black font-extrabold text-[10px] rounded-full shadow-lg border border-black/20"
                >D</span
              >
              <span
                v-if="sbSeatId === 'player'"
                class="px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[10px] rounded-full shadow-lg border border-blue-400"
                >SB</span
              >
              <span
                v-if="bbSeatId === 'player'"
                class="px-2 py-0.5 bg-purple-600 text-white font-extrabold text-[10px] rounded-full shadow-lg border border-purple-400"
                >BB</span
              >
            </div>

            <div
              :class="[
                'flex items-center justify-center gap-2.5 p-1.5 rounded-2xl transition-all duration-300',
                winnerIds.includes('player') ? 'ring-2 ring-amber-400/70 bg-amber-400/10' : '',
              ]">
              <PlayingCard v-for="(card, idx) in playerCards" :key="idx" :card="card" size="md" />
            </div>

            <div class="flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
              <span class="text-xs font-semibold uppercase tracking-wider text-gray-300">{{ playerFolded ? "Вы — фолд" : "Вы" }}</span>
              <span v-if="playerHandEval" class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {{ playerHandEval.name }}
              </span>
            </div>
          </div>

          <div v-if="!isSeated" class="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-sm z-30 p-4 sm:p-6 text-center">
            <div class="w-full max-w-lg rounded-3xl bg-[#16080c]/95 border border-amber-400/25 p-5 sm:p-7 shadow-2xl flex flex-col items-center">
              <span class="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-400/80 mb-1">
                Лимиты стола: {{ formatNumber(minBuyIn) }} — {{ formatNumber(currentTable.maxBuyIn) }}
              </span>
              <h2 class="font-casino text-2xl sm:text-3xl text-amber-200 mb-1.5">
                {{ currentTable.name }}
              </h2>
              <p class="text-xs sm:text-sm text-gray-300 mb-5">Выберите размер стека (Buy-in), с которым сядете за стол</p>

              <div class="w-full flex items-baseline justify-between mb-2">
                <span class="text-xs text-gray-400">Ваш стек за столом:</span>
                <span class="text-2xl font-extrabold text-amber-300 tabular-nums">
                  {{ formatNumber(buyInAmount) }} <span class="text-xs font-normal text-gray-400">фишек</span>
                </span>
              </div>

              <input
                v-model.number="buyInAmount"
                type="range"
                :min="minBuyIn"
                :max="Math.max(minBuyIn, maxBuyIn)"
                :step="currentTable.step"
                :disabled="maxBuyIn < minBuyIn"
                class="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400 mb-3" />

              <div class="w-full flex items-center justify-between text-[11px] text-gray-400 mb-5">
                <button
                  type="button"
                  @click="buyInAmount = minBuyIn"
                  :disabled="maxBuyIn < minBuyIn"
                  class="hover:text-amber-300 disabled:pointer-events-none transition cursor-pointer">
                  Мин: {{ formatNumber(minBuyIn) }}
                </button>

                <button
                  type="button"
                  @click="buyInAmount = Math.max(minBuyIn, Math.round(maxBuyIn / 2 / currentTable.step) * currentTable.step)"
                  :disabled="maxBuyIn < minBuyIn"
                  class="hover:text-amber-300 disabled:pointer-events-none transition cursor-pointer">
                  50% ({{ formatNumber(Math.max(minBuyIn, Math.round(maxBuyIn / 2 / currentTable.step) * currentTable.step)) }})
                </button>

                <button
                  type="button"
                  @click="buyInAmount = Math.max(minBuyIn, maxBuyIn)"
                  :disabled="maxBuyIn < minBuyIn"
                  class="hover:text-amber-300 disabled:pointer-events-none transition cursor-pointer">
                  Макс: {{ formatNumber(Math.max(minBuyIn, maxBuyIn)) }}
                </button>
              </div>

              <p v-if="maxBuyIn < minBuyIn" class="text-xs text-rose-300 bg-rose-500/10 border border-rose-400/25 rounded-xl px-3 py-2 mb-4 w-full">
                Для входа за этот стол нужно минимум {{ formatNumber(minBuyIn) }} фишек
              </p>

              <button
                @click="sitAtTable"
                :disabled="maxBuyIn < minBuyIn"
                class="w-full py-3.5 rounded-2xl font-bold text-base sm:text-lg text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] shadow-[0_10px_30px_rgba(230,168,46,0.4)] hover:brightness-110 active:scale-95 disabled:opacity-40 transition cursor-pointer">
                Сесть за стол ({{ formatNumber(buyInAmount) }})
              </button>

              <p class="text-[11px] text-gray-400 mt-3">
                Общий баланс: <strong class="text-white tabular-nums">{{ formatNumber(playerStore.chips) }}</strong> фишек
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="isSeated"
        class="w-full max-w-4xl rounded-3xl bg-[#0c1914]/90 border border-amber-400/20 backdrop-blur-xl px-5 py-4 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
        <div class="flex flex-col items-center lg:items-start gap-1.5">
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span class="uppercase tracking-wider font-bold text-amber-400/80">{{ currentTable.name }}</span>
            <span class="text-gray-600">•</span>
            <span
              >Блайнды: <strong class="text-amber-300 tabular-nums">{{ formatNumber(smallBlind) }}/{{ formatNumber(bigBlind) }}</strong></span
            >
          </div>

          <div class="flex items-center gap-3">
            <div class="text-sm sm:text-base text-gray-300">
              Стек за столом:
              <strong class="text-emerald-300 font-extrabold text-lg tabular-nums">
                {{ formatNumber(tableChips) }}
              </strong>
              <span class="text-xs text-gray-400"> фишек</span>
            </div>

            <button
              @click="leaveTable"
              class="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/25 transition cursor-pointer">
              Выйти со стеком
            </button>
          </div>
        </div>

        <div class="flex flex-col items-center lg:items-end gap-2.5 w-full lg:w-auto">
          <template v-if="isPlaying() && !playerFolded">
            <div class="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 w-full">
              <button
                @click="raise(betPresets.quarter)"
                :disabled="!isPlayerTurn || tableChips <= 0"
                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 border border-amber-400/25 active:scale-95 disabled:opacity-35 transition cursor-pointer tabular-nums">
                1/4 Банка ({{ formatNumber(betPresets.quarter) }})
              </button>

              <button
                @click="raise(betPresets.half)"
                :disabled="!isPlayerTurn || tableChips <= 0"
                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 border border-amber-400/35 active:scale-95 disabled:opacity-35 transition cursor-pointer tabular-nums">
                1/2 Банка ({{ formatNumber(betPresets.half) }})
              </button>

              <button
                @click="raise(betPresets.fullPot)"
                :disabled="!isPlayerTurn || tableChips <= 0"
                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/45 active:scale-95 disabled:opacity-35 transition cursor-pointer tabular-nums">
                Банк ({{ formatNumber(betPresets.fullPot) }})
              </button>

              <button
                @click="raise(betPresets.allIn)"
                :disabled="!isPlayerTurn || tableChips <= 0"
                class="px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:brightness-110 active:scale-95 disabled:opacity-35 transition cursor-pointer tabular-nums">
                Олл-ин ({{ formatNumber(betPresets.allIn) }})
              </button>
            </div>

            <div class="flex items-center gap-2.5 w-full sm:w-auto justify-center">
              <button
                @click="check"
                :disabled="!isPlayerTurn"
                class="flex-1 sm:flex-initial px-7 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600/85 hover:bg-emerald-500 border border-emerald-400/30 active:scale-95 transition cursor-pointer shadow-lg">
                {{ currentBet > playerRoundBet ? `Колл (${currentBet - playerRoundBet})` : "Чек" }}
              </button>

              <button
                @click="fold"
                :disabled="!isPlayerTurn"
                class="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-bold text-sm text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 active:scale-95 transition cursor-pointer">
                Фолд
              </button>
            </div>
          </template>

          <template v-else-if="stage === 'showdown' || stage === 'idle'">
            <div class="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
              <button
                v-if="tableChips > 0"
                @click="startNewHand"
                class="flex-1 sm:flex-initial px-7 py-3 rounded-xl font-bold text-sm text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg">
                {{ stage === "idle" ? "Начать раздачу" : "Новая раздача" }}
              </button>

              <button
                v-else
                @click="leaveTable"
                class="flex-1 sm:flex-initial px-7 py-3 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition cursor-pointer shadow-lg">
                Стек пуст — докупить фишки
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
