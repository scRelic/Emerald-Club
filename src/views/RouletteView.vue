<script setup>
import { useRoute, useRouter } from "vue-router";
import { usePlayerStore } from "@/stores/playerStore";
import { useRoulette } from "@/composables/useRoulette";
import { formatNumber } from "@/utils";
import { chipOptions } from "@/utils/data";

const router = useRouter();
const playerStore = usePlayerStore();

const {
  selectedChip,
  chipValues,
  bets,
  isSpinning,
  displayNumber,
  errorMessage,
  lastWinningNumber,
  lastWinAmount,
  lastNetChange,
  spinHistory,
  totalBetAmount,
  getNumberColor,
  placeBet,
  clearBets,
  spinRoulette,
} = useRoulette();


const rouletteGridNumbers = Array.from({ length: 36 }, (_, i) => i + 1);
</script>

<template>
  <div class="relative z-10 w-full max-w-[1300px] mx-auto px-3 sm:px-6 py-6 text-white flex flex-col items-center">
    
    <div class="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 bg-[#0e1412]/90 border border-amber-400/20 px-4 sm:px-6 py-4 rounded-3xl backdrop-blur-md shadow-xl">
      <div class="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          @click="router.push('/games')"
          class="shrink-0 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-gray-300 transition cursor-pointer">
          ← В лобби
        </button>
        <div class="min-w-0">
          <h1 class="font-casino text-xl sm:text-2xl text-amber-200 leading-tight">European Roulette</h1>
          <p class="text-[11px] sm:text-xs text-gray-400">Европейский стол • Зеро • Выплаты до 35:1</p>
        </div>
      </div>

      <div class="flex items-center justify-between sm:justify-end gap-4">
        <div class="text-right">
          <span class="text-xs text-gray-400 block">Ваш баланс:</span>
          <strong class="text-emerald-300 text-base sm:text-lg tabular-nums whitespace-nowrap">{{ formatNumber(playerStore.chips) }} фишек</strong>
        </div>
      </div>
    </div>

    
    <div
      class="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-[#0b1210]/80 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
      
      <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">История:</span>
        <div v-if="spinHistory.length === 0" class="text-xs text-gray-500 italic">Сделайте ставку и запустите колесо</div>
        <div
          v-for="(item, idx) in spinHistory"
          :key="idx"
          :class="[
            'w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 shadow-md border',
            item.color === 'green'
              ? 'bg-emerald-700 text-white border-emerald-400'
              : item.color === 'red'
                ? 'bg-rose-600 text-white border-rose-400'
                : 'bg-slate-900 text-white border-slate-700',
          ]">
          {{ item.number }}
        </div>
      </div>

      
      <div v-if="lastWinningNumber !== null && !isSpinning" class="flex items-center gap-3 bg-amber-400/15 border border-amber-400/30 px-5 py-2.5 rounded-2xl animate-pulse">
        <span class="text-xs text-amber-200"
          >Выпало: <strong class="text-white text-base">{{ lastWinningNumber }}</strong></span
        >
        <span v-if="lastWinAmount > 0" class="text-xs font-bold text-emerald-300">
          Выплата: {{ formatNumber(lastWinAmount) }} фишек
        </span>
        <span
          v-if="lastNetChange !== null"
          :class="['text-xs font-bold', lastNetChange > 0 ? 'text-emerald-300' : lastNetChange < 0 ? 'text-rose-300' : 'text-amber-200']">
          Чистый результат: {{ lastNetChange > 0 ? '+' : '' }}{{ formatNumber(lastNetChange) }}
        </span>
      </div>
    </div>

    
    <div class="w-full bg-[#08100e]/95 border-2 border-amber-400/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative mb-6">

      <div class="flex justify-center mb-6">
        <div class="flex items-center gap-4 rounded-2xl border border-amber-400/20 bg-black/30 px-5 py-3">
          <div
            :class="[
              'flex h-16 w-16 items-center justify-center rounded-2xl border-2 font-casino text-3xl font-bold tabular-nums shadow-lg transition-colors duration-100',
              displayNumber === null
                ? 'border-slate-600 bg-slate-900 text-gray-400'
                : getNumberColor(displayNumber) === 'green'
                  ? 'border-emerald-300 bg-emerald-700 text-white'
                  : getNumberColor(displayNumber) === 'red'
                    ? 'border-rose-300 bg-rose-700 text-white'
                    : 'border-slate-500 bg-slate-900 text-white',
              isSpinning ? 'motion-safe:animate-pulse scale-105' : '',
            ]">
            {{ displayNumber ?? '—' }}
          </div>
          <div>
            <p class="text-sm font-bold text-amber-200">
              {{ isSpinning ? 'Шарик крутится...' : lastWinningNumber !== null ? 'Последний результат' : 'Рулетка готова' }}
            </p>
            <p class="mt-1 text-xs text-gray-400">
              {{ isSpinning ? 'Числа меняются — ждём остановки' : 'Сделайте ставку и запустите колесо' }}
            </p>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-13 gap-2 mb-6">
        
        <button
          @click="placeBet('num_0')"
          :class="[
            'col-span-1 row-span-3 rounded-2xl border flex flex-col items-center justify-center font-bold text-lg transition cursor-pointer relative',
            getNumberColor(0) === 'green' ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-400/50' : '',
            isSpinning ? 'pointer-events-none opacity-60' : '',
          ]">
          <span>0</span>
          <span v-if="bets['num_0']" class="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-[#1c1304] text-[10px] font-extrabold shadow">
            {{ bets["num_0"] }}
          </span>
        </button>

        
        <div class="col-span-12 grid grid-cols-12 gap-2">
          <button
            v-for="num in rouletteGridNumbers"
            :key="num"
            @click="placeBet(`num_${num}`)"
            :class="[
              'h-14 rounded-xl border flex flex-col items-center justify-center font-bold text-sm sm:text-base transition cursor-pointer relative',
              getNumberColor(num) === 'red'
                ? 'bg-rose-700/80 hover:bg-rose-600 text-white border-rose-400/40'
                : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700',
              isSpinning ? 'pointer-events-none opacity-60' : '',
            ]">
            <span>{{ num }}</span>

            
            <div
              v-if="bets[`num_${num}`]"
              class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-2 border-white/90 text-[#1c1304] text-[10px] font-black flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10">
              {{ bets[`num_${num}`] }}
            </div>
          </button>
        </div>
      </div>

      
      <div class="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        <button
          @click="placeBet('1-18')"
          class="py-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 font-bold text-xs transition cursor-pointer relative">
          1 — 18
          <div
            v-if="bets['1-18']"
            class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-2 border-white/90 text-[#1c1304] text-[10px] font-black flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10">
            {{ bets["1-18"] }}
          </div>
        </button>

        <button
          @click="placeBet('even')"
          class="py-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 font-bold text-xs transition cursor-pointer relative">
          ЧЁТ (EVEN)
          <div
            v-if="bets['even']"
            class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-2 border-white/90 text-[#1c1304] text-[10px] font-black flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10">
            {{ bets["even"] }}
          </div>
        </button>

        <button
          @click="placeBet('red')"
          class="py-3 rounded-xl bg-rose-700/60 hover:bg-rose-600 border border-rose-500/40 font-bold text-xs text-white transition cursor-pointer relative">
          КРАСНОЕ

          
          <div
            v-if="bets['red']"
            class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-2 border-white/90 text-[#1c1304] text-[10px] font-black flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10">
            {{ bets["red"] }}
          </div>
        </button>

        <button
          @click="placeBet('black')"
          class="py-3 rounded-xl bg-black-900 hover:bg-black-800 border border-slate-700 font-bold text-xs text-white transition cursor-pointer relative">
          ЧЁРНОЕ

          
          <div
            v-if="bets['black']"
            class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-2 border-white/90 text-[#1c1304] text-[10px] font-black flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10">
            {{ bets["black"] }}
          </div>
        </button>

        <button
          @click="placeBet('odd')"
          class="py-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 font-bold text-xs transition cursor-pointer relative">
          НЕЧЁТ (ODD)
          <div
            v-if="bets['odd']"
            class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-2 border-white/90 text-[#1c1304] text-[10px] font-black flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10">
            {{ bets["odd"] }}
          </div>
        </button>

        <button
          @click="placeBet('19-36')"
          class="py-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 font-bold text-xs transition cursor-pointer relative">
          19 — 36
          <div
            v-if="bets['19-36']"
            class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-2 border-white/90 text-[#1c1304] text-[10px] font-black flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10">
            {{ bets["19-36"] }}
          </div>
        </button>
      </div>
    </div>

    
    <div
      class="w-full bg-[#0e1412]/90 border border-amber-400/20 p-4 sm:p-5 rounded-3xl backdrop-blur-md flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xl">
      
      <div class="grid w-full grid-cols-3 sm:grid-cols-7 gap-2 sm:gap-3 lg:w-auto">
        <span class="col-span-3 sm:col-span-1 flex items-center text-xs text-gray-400">Фишка:</span>
        <button
          v-for="chip in chipOptions"
          :key="chip.amount"
          @click="selectedChip = chip.amount"
          :class="[
            'relative w-12 h-12 sm:w-14 sm:h-14 justify-self-center rounded-full border-2 border-dashed bg-gradient-to-b flex items-center justify-center font-extrabold text-xs sm:text-sm tabular-nums transition-all duration-200 cursor-pointer shadow-xl',
            chip.style,
            selectedChip === chip.amount
              ? 'ring-4 ring-amber-400 scale-110 shadow-[0_0_20px_rgba(249,216,118,0.6)] z-10'
              : 'opacity-75 hover:opacity-100 hover:scale-105',
          ]">
          {{ chip.amount }}
        </button>
      </div>

      
      <div class="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-end">
        <div class="text-right w-full sm:w-auto sm:mr-3">
          <span class="text-xs text-gray-400 block">Ставка на спин:</span>
          <strong class="text-amber-300 text-base tabular-nums">{{ formatNumber(totalBetAmount) }} фишек</strong>
        </div>

        <button
          @click="clearBets"
          :disabled="totalBetAmount === 0 || isSpinning"
          class="px-4 sm:px-5 py-3 rounded-2xl font-bold text-xs text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/30 disabled:opacity-30 transition cursor-pointer">
          Очистить
        </button>

        <button
          @click="spinRoulette"
          :disabled="totalBetAmount === 0 || isSpinning"
          class="px-5 sm:px-8 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] hover:brightness-110 active:scale-95 disabled:opacity-40 transition cursor-pointer shadow-[0_10px_25px_rgba(230,168,46,0.35)]">
          {{ isSpinning ? "Вращение..." : "Крутить рулетку" }}
        </button>
        <p v-if="errorMessage" class="w-full text-sm text-rose-300 text-center">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>
