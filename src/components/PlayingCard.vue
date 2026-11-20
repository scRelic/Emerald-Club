<script setup>
import { computed } from "vue";
import { usePlayerStore } from "@/stores/playerStore";
const playerStore = usePlayerStore();

const props = defineProps({
  card: {
    type: Object,
    default: null,
  },
  hidden: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: "md", 
  },
});

const isRed = computed(() => props.card?.suit === "♥" || props.card?.suit === "♦");

const sizeClasses = computed(() => {
  if (props.size === "sm") return "w-14 h-20 sm:w-16 sm:h-24 text-xs";
  if (props.size === "lg") return "w-24 h-34 sm:w-28 sm:h-40 text-base";
  return "w-20 h-28 sm:w-24 sm:h-34 text-sm";
});


const cardBackStyles = computed(() => {
  const theme = playerStore.activeCardBack || "classic";

  switch (theme) {
    case "card-emerald-silk":
      return {
        outer: "from-[#064e3b] via-[#022c22] to-[#011a14] border-emerald-300/60",
        inner: "border-emerald-300/30 [background-image:radial-gradient(#6ee7b7_1px,transparent_1px)]",
        emblem: "bg-[#022c22] border-emerald-300/50 text-emerald-300",
      };
    case "card-sapphire":
      return {
        outer: "from-[#123c70] via-[#0b2445] to-[#06152c] border-sky-300/70",
        inner: "border-sky-300/30 [background-image:radial-gradient(#7dd3fc_1px,transparent_1px)]",
        emblem: "bg-[#081c35] border-sky-300/50 text-sky-300",
      };
    case "card-ruby":
      return {
        outer: "from-[#851b3a] via-[#541026] to-[#280812] border-rose-300/70",
        inner: "border-rose-300/30 [background-image:radial-gradient(#fda4af_1px,transparent_1px)]",
        emblem: "bg-[#350818] border-rose-300/50 text-rose-300",
      };
    case "card-amethyst":
      return {
        outer: "from-[#542b82] via-[#32194f] to-[#180d29] border-violet-300/70",
        inner: "border-violet-300/30 [background-image:radial-gradient(#c4b5fd_1px,transparent_1px)]",
        emblem: "bg-[#24113b] border-violet-300/50 text-violet-300",
      };
    case "card-ivory":
      return {
        outer: "from-[#e8d9b7] via-[#bba878] to-[#766342] border-amber-100",
        inner: "border-amber-900/30 [background-image:radial-gradient(#78350f_1px,transparent_1px)]",
        emblem: "bg-[#e7d6ad] border-amber-900/50 text-amber-900",
      };
    case "card-royal-gold":
      return {
        outer: "from-zinc-900 via-neutral-800 to-black border-amber-300",
        inner: "border-amber-300/30 [background-image:radial-gradient(#fbbf24_1px,transparent_1px)]",
        emblem: "bg-black border-amber-300/50 text-amber-300",
      };
    case "blue":
      return {
        outer: "from-[#1a365d] via-[#0f1f38] to-[#080e1a] border-blue-400/50",
        inner: "border-blue-400/25 [background-image:radial-gradient(#60a5fa_1px,transparent_1px)]",
        emblem: "bg-[#0a1424] border-blue-400/40 text-blue-400",
      };
    case "red":
      return {
        outer: "from-[#4a1522] via-[#2b0b13] to-[#120306] border-rose-400/50",
        inner: "border-rose-400/25 [background-image:radial-gradient(#fb7185_1px,transparent_1px)]",
        emblem: "bg-[#1c070c] border-rose-400/40 text-rose-400",
      };
    case "dark":
      return {
        outer: "from-[#1f1f1f] via-[#121212] to-[#080808] border-gray-400/50",
        inner: "border-gray-400/25 [background-image:radial-gradient(#9ca3af_1px,transparent_1px)]",
        emblem: "bg-[#0f0f0f] border-gray-400/40 text-gray-300",
      };
    case "card-classic":
    case "classic":
    default:
      return {
        outer: "from-[#133529] via-[#0b2119] to-[#06120e] border-amber-400/50",
        inner: "border-amber-400/25 [background-image:radial-gradient(#fbbf24_1px,transparent_1px)]",
        emblem: "bg-[#091913] border-amber-400/40 text-amber-400",
      };
  }
});
</script>

<template>
  <div :class="['relative rounded-xl select-none transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.55)]', sizeClasses]">
    
    <div
      v-if="hidden || !card"
      :class="[
        'w-full h-full rounded-xl bg-gradient-to-br border-2 p-1.5 flex items-center justify-center transition-colors duration-500',
        cardBackStyles.outer,
      ]">
      <div :class="['w-full h-full rounded-lg border bg-[length:8px_8px] opacity-90 flex items-center justify-center', cardBackStyles.inner]">
        <div :class="['w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center text-xs shadow-inner', cardBackStyles.emblem]">♠</div>
      </div>
    </div>

    
    <div
      v-else
      :class="[
        'w-full h-full rounded-xl bg-gradient-to-b from-[#ffffff] to-[#f1efe9] border border-black/15 p-1.5 sm:p-2 flex flex-col justify-between',
        isRed ? 'text-rose-600' : 'text-slate-900',
      ]">
      <div class="flex flex-col items-center leading-none w-4 sm:w-5">
        <span class="font-bold tracking-tighter">{{ card.rank }}</span>
        <span class="mt-0.5">{{ card.suit }}</span>
      </div>

      <div class="self-center text-xl sm:text-3xl opacity-90">
        {{ card.suit }}
      </div>

      <div class="flex flex-col items-center leading-none w-4 sm:w-5 self-end rotate-180">
        <span class="font-bold tracking-tighter">{{ card.rank }}</span>
        <span class="mt-0.5">{{ card.suit }}</span>
      </div>
    </div>
  </div>
</template>
