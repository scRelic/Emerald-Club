<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  symbol: { type: String, required: true },
  theme: {
    type: String,
    default: "emerald", 
  },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  betsCount: { type: Number, default: 0 },
  betsLabel: { type: String, default: "Ставок сделано" },
  extraRows: {
    type: Array,
    default: () => [], 
  },
});

const winRate = computed(() => {
  if (!props.betsCount) return 0;
  return Math.round((props.wins / props.betsCount) * 100);
});

const themes = {
  emerald: {
    card: "from-[#112c22]/90 to-[#081611]/95 border-emerald-400/25",
    watermark: "text-emerald-400/[0.06]",
    symbol: "text-amber-400",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  },
  rose: {
    card: "from-[#2b1216]/90 to-[#14080a]/95 border-rose-500/25",
    watermark: "text-rose-400/[0.06]",
    symbol: "text-rose-500",
    badge: "bg-rose-500/15 text-rose-300 border-rose-400/20",
  },
  sky: {
    card: "from-[#1c2126]/90 to-[#0d1012]/95 border-sky-400/20",
    watermark: "text-sky-400/[0.06]",
    symbol: "text-sky-400",
    badge: "bg-sky-500/15 text-sky-300 border-sky-400/20",
  },
};

const currentTheme = computed(() => themes[props.theme] || themes.emerald);
</script>

<template>
  <div :class="['rounded-3xl p-6 bg-gradient-to-b border backdrop-blur-xl relative overflow-hidden flex flex-col justify-between', currentTheme.card]">
    <div
      :class="[
        'absolute inset-0 flex items-center justify-center text-[150px] leading-none font-serif pointer-events-none select-none',
        currentTheme.watermark,
      ]">
      {{ symbol }}
    </div>

    <div>
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-casino text-lg font-bold text-white flex items-center gap-2">
          <span :class="currentTheme.symbol">{{ symbol }}</span>
          {{ title }}
        </h4>
        <span :class="['text-xs font-bold px-2.5 py-0.5 rounded-full border', currentTheme.badge]"> {{ winRate }}% WR </span>
      </div>

      <div class="space-y-2.5 text-sm">
        <div class="flex justify-between text-gray-300">
          <span class="text-gray-400">{{ betsLabel }}</span>
          <span class="font-bold text-white tabular-nums">{{ betsCount }}</span>
        </div>

        <div class="flex justify-between text-gray-300">
          <span class="text-gray-400">Побед / Поражений</span>
          <span class="font-bold tabular-nums">
            <span class="text-emerald-400">{{ wins }}</span> /
            <span class="text-rose-400">{{ losses }}</span>
          </span>
        </div>

        <div v-for="row in extraRows" :key="row.label" class="flex justify-between text-gray-300">
          <span class="text-gray-400">{{ row.label }}</span>
          <span class="font-semibold text-gray-200 tabular-nums">{{ row.value }}</span>
        </div>
      </div>
    </div>

    <div v-if="$slots.default" class="mt-5 pt-4 border-t border-white/10">
      <slot />
    </div>
  </div>
</template>
