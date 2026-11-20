<script setup>
import { computed } from "vue";
import DiceDie from "@/components/DiceDie.vue";
import { useDice } from "@/composables/useDice";
import { chipOptions } from "@/utils/data";
import { formatNumber } from "@/utils";
import { usePlayerStore } from "@/stores/playerStore";

const playerStore = usePlayerStore();
const { dice, selectedBet, selectedPrediction, isRolling, result, errorMessage, recentRolls, canRoll, predictions, setBet, roll } = useDice();

const diceTotal = computed(() => dice.value[0] + dice.value[1]);
</script>

<template>
  <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 text-white z-10">
    <div class="mb-7">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400/80 mb-2">Казино • Испытай удачу</p>
      <div class="flex items-center gap-2">
        <h1 class="font-casino text-3xl sm:text-5xl font-bold bg-gradient-to-b from-[#FFF5CC] via-[#F3C65F] to-[#C88A1E] bg-clip-text text-transparent">
          Кости клуба
        </h1>
        <span class="text-3xl">🎲</span>
      </div>
      <p class="text-sm text-gray-400 mt-2">Предскажи сумму двух кубиков, сделай ставку и бросай.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section
        class="lg:col-span-8 rounded-3xl p-5 sm:p-8 bg-gradient-to-b from-[#10241d]/90 to-[#091410]/95 border border-amber-400/20 shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-gray-400">Ваш баланс</p>
            <p class="text-xl font-bold text-amber-200 tabular-nums">{{ formatNumber(playerStore.chips) }} фишек</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-black/40 border border-white/10 text-xs text-gray-300"> Ставка {{ formatNumber(selectedBet) }} фишек </span>
        </div>

        <div
          class="my-8 min-h-72 rounded-3xl border border-emerald-400/15 bg-[radial-gradient(ellipse_at_center,#135c42_0%,#073627_60%,#031f16_100%)] flex flex-col items-center justify-center gap-5 relative overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center text-7xl sm:text-9xl text-amber-300/[0.035] pointer-events-none select-none">♣</div>
          <div class="relative z-10 flex items-center gap-5 sm:gap-8" aria-live="polite">
            <DiceDie :value="dice[0]" :rolling="isRolling" />
            <span class="text-amber-300 text-xl font-bold">+</span>
            <DiceDie :value="dice[1]" :rolling="isRolling" />
          </div>
          <div class="relative z-10 px-4 py-1 rounded-full bg-black/45 border border-amber-400/25 text-sm">
            Сумма: <strong class="text-amber-300 text-lg ml-1">{{ diceTotal }}</strong>
          </div>
          <p
            v-if="result"
            :class="['relative z-10 text-sm sm:text-base font-bold text-center', result.outcome === 'win' ? 'text-emerald-300' : 'text-rose-300']">
            {{ result.outcome === "win" ? `Победа! +${formatNumber(result.profit)} фишек` : `Не угадали — ставка ${formatNumber(result.bet)} фишек проиграла` }}
          </p>
          <p v-else-if="isRolling" class="relative z-10 text-sm font-semibold text-amber-200 animate-pulse">Кости бросаются…</p>
          <p v-else class="relative z-10 text-sm text-gray-400">Выберите ставку и предсказание</p>
        </div>

        <div>
          <h2 class="text-sm font-bold text-gray-200 mb-3">На какую сумму ставите?</h2>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <button
              v-for="chip in chipOptions"
              :key="chip.amount"
              type="button"
              :disabled="isRolling || playerStore.chips < chip.amount"
              @click="setBet(chip.amount)"
              :class="[
                'py-2.5 rounded-xl border text-xs font-bold tabular-nums transition disabled:opacity-30 disabled:cursor-not-allowed',
                selectedBet === chip.amount
                  ? 'bg-amber-400/20 border-amber-300 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.2)]'
                  : 'bg-black/35 border-white/10 text-gray-300 hover:border-amber-400/40',
              ]">
              {{ formatNumber(chip.amount) }}
            </button>
          </div>
        </div>

        <div class="mt-6">
          <h2 class="text-sm font-bold text-gray-200 mb-3">Предсказание</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              v-for="prediction in predictions"
              :key="prediction.id"
              type="button"
              :disabled="isRolling"
              @click="selectedPrediction = prediction.id"
              :class="[
                'p-3.5 rounded-2xl border text-left transition cursor-pointer disabled:cursor-not-allowed',
                selectedPrediction === prediction.id
                  ? 'bg-amber-400/10 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.1)]'
                  : 'bg-black/30 border-white/10 hover:border-white/25',
              ]">
              <span class="flex items-center justify-between gap-2">
                <span class="text-sm font-bold text-white">{{ prediction.label }}</span>
                <span class="text-xs font-extrabold text-amber-300">{{ prediction.multiplier }}</span>
              </span>
              <span class="block text-xs text-gray-400 mt-1">{{ prediction.details }}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          :disabled="!canRoll"
          @click="roll"
          class="w-full mt-6 py-4 rounded-2xl font-bold text-base sm:text-lg text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] shadow-[0_8px_24px_rgba(230,168,46,0.25)] hover:brightness-110 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed">
          {{ isRolling ? "Бросаем кости…" : `Сделать ставку и бросить — ${formatNumber(selectedBet)} ♠` }}
        </button>
        <p v-if="errorMessage" class="text-sm text-rose-300 text-center mt-3">{{ errorMessage }}</p>
        <p v-if="playerStore.chips < selectedBet && !isRolling" class="text-xs text-rose-300 text-center mt-2">Недостаточно фишек. Выберите меньшую ставку.</p>
        <p class="text-[11px] text-gray-500 text-center mt-3">Выплата включает вашу ставку: x2 за меньше/больше 7, x5 за точное попадание в 7.</p>
      </section>

      <aside class="lg:col-span-4 space-y-5">
        <div class="rounded-3xl p-6 bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 border border-amber-400/20">
          <h2 class="font-casino text-lg font-bold text-amber-100 mb-4">Статистика костей</h2>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Бросков</span><strong>{{ playerStore.stats.dice.betsCount }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Побед</span><strong class="text-emerald-300">{{ playerStore.stats.dice.wins }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Поражений</span><strong class="text-rose-300">{{ playerStore.stats.dice.losses }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Крупнейшая прибыль</span><strong class="text-amber-200">{{ formatNumber(playerStore.stats.dice.biggestWin) }}</strong>
            </div>
          </div>
        </div>

        <div class="rounded-3xl p-6 bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 border border-white/10">
          <h2 class="font-casino text-lg font-bold text-white mb-4">Последние броски</h2>
          <p v-if="recentRolls.length === 0" class="text-sm text-gray-500">Здесь появятся результаты ваших бросков.</p>
          <div v-else class="space-y-2.5">
            <div v-for="entry in recentRolls" :key="entry.id" class="flex items-center justify-between px-3 py-2 rounded-xl bg-black/30 border border-white/5">
              <span class="text-sm text-gray-300"
                >{{ entry.dice[0] }} + {{ entry.dice[1] }} = <strong class="text-white">{{ entry.total }}</strong></span
              >
              <span :class="entry.outcome === 'win' ? 'text-emerald-300' : 'text-rose-300'" class="text-xs font-bold">
                {{ entry.outcome === "win" ? "Победа" : "Мимо" }}
              </span>
            </div>
          </div>
        </div>

        <RouterLink to="/games" class="block text-center text-sm text-amber-300 hover:text-amber-200 transition"> ← Вернуться в игровой зал </RouterLink>
      </aside>
    </div>
  </div>
</template>
