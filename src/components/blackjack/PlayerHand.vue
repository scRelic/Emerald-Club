<script setup>
import { computed } from "vue";
import PlayingCard from "@/components/PlayingCard.vue";

const props = defineProps({
  cards: {
    type: Array,
    default: () => [],
  },
  score: {
    type: Number,
    default: 0,
  },
});

const badgeStyle = computed(() => {
  if (props.score > 21) {
    return "bg-rose-500/20 text-rose-300 border-rose-400/30";
  }
  if (props.score === 21) {
    return "bg-emerald-500/20 text-emerald-300 border-emerald-400/35";
  }
  return "bg-amber-400/15 text-amber-300 border-amber-400/25";
});
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div class="flex items-center justify-center min-h-[7rem] sm:min-h-[8.5rem]">
      <div
        v-for="(card, index) in cards"
        :key="`${card.value}-${card.suit}-${index}`"
        :class="['transition-transform duration-300 hover:-translate-y-2', index > 0 ? '-ml-7 sm:-ml-8' : '']">
        <PlayingCard :card="card" />
      </div>
    </div>

    <div class="flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-black/45 border border-white/10 backdrop-blur-md">
      <span class="text-xs font-semibold uppercase tracking-wider text-gray-300">Вы</span>
      <span v-if="cards.length" :class="['px-2 py-0.5 rounded-md text-xs font-bold tabular-nums border', badgeStyle]">
        {{ score }}
      </span>
    </div>
  </div>
</template>
