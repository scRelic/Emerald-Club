<script setup>
import { computed } from "vue";
import { useFortuneWheel } from "@/composables/useFortuneWheel";
import { formatNumber } from "@/utils";
import { chipOptions } from "@/utils/data";
import { fortuneWheelSegments } from "@/utils/fortuneWheel";
import { usePlayerStore } from "@/stores/playerStore";

const playerStore = usePlayerStore();
const { selectedBet, wheelRotation, isSpinning, result, errorMessage, recentSpins, canSpin, setBet, spin } = useFortuneWheel();
const segmentAngle = 360 / fortuneWheelSegments.length;

const wheelStyle = computed(() => ({
  background: `conic-gradient(from ${-segmentAngle / 2}deg, ${fortuneWheelSegments
    .map((segment, index) => `${segment.color} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`)
    .join(", ")})`,
  transform: `rotate(${wheelRotation.value}deg)`,
}));

const labelPosition = (index) => {
  const angle = (index * segmentAngle * Math.PI) / 180;
  return {
    left: `${50 + 32 * Math.sin(angle)}%`,
    top: `${50 - 32 * Math.cos(angle)}%`,
  };
};
</script>

<template>
  <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 text-white z-10">
    <div class="mb-7">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400/80 mb-2">Казино • Испытай удачу</p>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 class="font-casino text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight min-w-0 bg-gradient-to-b from-[#FFF5CC] via-[#F3C65F] to-[#C88A1E] bg-clip-text text-transparent">
          Колесо фортуны
        </h1>
        <span class="text-3xl sm:text-4xl shrink-0">🎡</span>
      </div>
      <p class="text-sm text-gray-400 mt-2">Выберите ставку, запустите колесо и получите выплату по выпавшему множителю.</p>
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
          class="my-8 min-h-[22rem] sm:min-h-[25rem] rounded-3xl py-2 border border-emerald-400/15 bg-[radial-gradient(ellipse_at_center,#135c42_0%,#073627_60%,#031f16_100%)] flex flex-col items-center justify-center relative overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center text-8xl sm:text-9xl text-amber-300/[0.035] pointer-events-none select-none">♣</div>
          <div class="wheel-wrap relative z-10" :aria-label="`Колесо с ${fortuneWheelSegments.length} секторами`">
            <div class="wheel-pointer" aria-hidden="true"></div>
            <div class="wheel-dial" :style="wheelStyle">
              <span v-for="(segment, index) in fortuneWheelSegments" :key="segment.id" class="wheel-label" :style="labelPosition(index)">
                {{ segment.label }}
              </span>
              <div class="wheel-center">
                <span class="text-xl" aria-hidden="true">♠</span>
              </div>
            </div>
          </div>

          <div class="relative z-10 mt-6 min-h-8 text-center" aria-live="polite">
            <p
              v-if="result"
              :class="[
                'text-sm sm:text-base font-bold',
                result.outcome === 'win' ? 'text-emerald-300' : result.outcome === 'draw' ? 'text-amber-200' : 'text-rose-300',
              ]">
              <template v-if="result.outcome === 'win'">Победа! +{{ formatNumber(result.profit) }} фишек</template>
              <template v-else-if="result.outcome === 'draw'">Ставка возвращена — множитель x1</template>
              <template v-else-if="result.payout > 0">Выплата {{ formatNumber(result.payout) }} фишек — выпал x{{ result.multiplier }}</template>
              <template v-else>Не повезло — ставка проиграла</template>
            </p>
            <p v-else-if="isSpinning" class="text-sm font-semibold text-amber-200 animate-pulse">Колесо вращается…</p>
            <p v-else class="text-sm text-gray-400">Выберите ставку и нажмите «Крутить»</p>
          </div>
        </div>

        <div>
          <h2 class="text-sm font-bold text-gray-200 mb-3">Размер ставки</h2>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <button
              v-for="chip in chipOptions"
              :key="chip.amount"
              type="button"
              :disabled="isSpinning || playerStore.chips < chip.amount"
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

        <button
          type="button"
          :disabled="!canSpin"
          @click="spin"
          class="w-full mt-6 py-4 rounded-2xl font-bold text-base sm:text-lg text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] shadow-[0_8px_24px_rgba(230,168,46,0.25)] hover:brightness-110 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed">
          {{ isSpinning ? "Колесо вращается…" : `Крутить — ${formatNumber(selectedBet)} ♠` }}
        </button>
        <p v-if="errorMessage" class="text-sm text-rose-300 text-center mt-3">{{ errorMessage }}</p>
        <p v-if="playerStore.chips < selectedBet && !isSpinning" class="text-xs text-rose-300 text-center mt-2">Недостаточно фишек. Выберите меньшую ставку.</p>
        <p class="text-[11px] text-gray-500 text-center mt-3">Выплата включает ставку. Секторы x0, x1.5, x2, x5 и x10.</p>
      </section>

      <aside class="lg:col-span-4 space-y-5">
        <div class="rounded-3xl p-6 bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 border border-amber-400/20">
          <h2 class="font-casino text-lg font-bold text-amber-100 mb-4">Статистика колеса</h2>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Спинов</span><strong>{{ playerStore.stats.fortune.betsCount }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Побед</span><strong class="text-emerald-300">{{ playerStore.stats.fortune.wins }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Ничьих</span><strong class="text-amber-200">{{ playerStore.stats.fortune.draws }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Поражений</span><strong class="text-rose-300">{{ playerStore.stats.fortune.losses }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Крупнейшая прибыль</span
              ><strong class="text-amber-200">{{ formatNumber(playerStore.stats.fortune.biggestWin) }}</strong>
            </div>
          </div>
        </div>

        <div class="rounded-3xl p-6 bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 border border-white/10">
          <h2 class="font-casino text-lg font-bold text-white mb-4">Последние спины</h2>
          <p v-if="recentSpins.length === 0" class="text-sm text-gray-500">Здесь появятся результаты вращений.</p>
          <div v-else class="space-y-2.5">
            <div v-for="entry in recentSpins" :key="entry.id" class="flex items-center justify-between px-3 py-2 rounded-xl bg-black/30 border border-white/5">
              <span class="text-sm text-gray-300"
                >Сектор <strong class="text-white">x{{ entry.multiplier }}</strong></span
              >
              <span
                :class="entry.outcome === 'win' ? 'text-emerald-300' : entry.outcome === 'draw' ? 'text-amber-200' : 'text-rose-300'"
                class="text-xs font-bold">
                {{ entry.outcome === "win" ? `+${formatNumber(entry.payout - entry.bet)}` : entry.outcome === "draw" ? "Ничья" : "Мимо" }}
              </span>
            </div>
          </div>
        </div>

        <RouterLink to="/games" class="block text-center text-sm text-amber-300 hover:text-amber-200 transition">← Вернуться в игровой зал</RouterLink>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.wheel-wrap {
  width: min(100%, 22rem);
  aspect-ratio: 1;
}

.wheel-dial {
  position: absolute;
  inset: 0;
  border: 7px solid #e8c66d;
  border-radius: 50%;
  box-shadow:
    0 0 0 5px #34230b,
    0 0 38px #fbbf2433,
    inset 0 0 0 2px #fff3;
  transition: transform 5s cubic-bezier(0.12, 0.75, 0.1, 1);
}

.wheel-pointer {
  position: absolute;
  z-index: 2;
  top: -8px;
  left: 50%;
  width: 28px;
  height: 36px;
  transform: translateX(-50%);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  background: linear-gradient(180deg, #fff5cc, #d49824);
  filter: drop-shadow(0 2px 4px #000);
}

.wheel-label {
  position: absolute;
  transform: translate(-50%, -50%);
  color: #fff8df;
  font-size: clamp(0.72rem, 3vw, 1rem);
  font-weight: 900;
  text-shadow: 0 2px 4px #000;
  white-space: nowrap;
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: 4px solid #f3d58d;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #1c3e30, #07140f 75%);
  color: #f3d58d;
  box-shadow:
    0 3px 12px #000a,
    inset 0 0 10px #0008;
  display: grid;
  place-items: center;
}
</style>
