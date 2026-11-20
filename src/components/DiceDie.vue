<script setup>
import { computed } from 'vue'

const props = defineProps({
    value: { type: Number, required: true },
    rolling: { type: Boolean, default: false },
})

const pipLayouts = {
    1: ['center'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
}

const pips = computed(() => pipLayouts[props.value] || pipLayouts[1])
</script>

<template>
  <div
    :class="['dice-face', rolling ? 'dice-face--rolling' : '']"
    role="img"
    :aria-label="`Кубик: ${value}`">
    <span v-for="pip in pips" :key="pip" :class="['dice-pip', `dice-pip--${pip}`]" />
  </div>
</template>

<style scoped>
.dice-face {
  display: grid;
  grid-template: repeat(3, minmax(0, 1fr)) / repeat(3, minmax(0, 1fr));
  width: clamp(5.5rem, 18vw, 8rem);
  height: clamp(5.5rem, 18vw, 8rem);
  box-sizing: border-box;
  flex: 0 0 auto;
  padding: 14%;
  border: 1px solid rgb(255 255 255 / 75%);
  border-radius: 22%;
  background: linear-gradient(145deg, #fffdf7, #ded8c9);
  box-shadow:
    inset 0 2px 3px rgb(255 255 255 / 95%),
    0 18px 35px rgb(0 0 0 / 40%);
  transform-style: preserve-3d;
}

.dice-face--rolling {
  animation: dice-tumble 0.24s linear infinite;
}

.dice-pip {
  width: 58%;
  aspect-ratio: 1;
  align-self: center;
  justify-self: center;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #545454, #111);
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 50%);
}

.dice-pip--top-left { grid-area: 1 / 1; }
.dice-pip--top-right { grid-area: 1 / 3; }
.dice-pip--middle-left { grid-area: 2 / 1; }
.dice-pip--center { grid-area: 2 / 2; }
.dice-pip--middle-right { grid-area: 2 / 3; }
.dice-pip--bottom-left { grid-area: 3 / 1; }
.dice-pip--bottom-right { grid-area: 3 / 3; }

@keyframes dice-tumble {
  0% { transform: rotate(-12deg) translateY(0); }
  50% { transform: rotate(12deg) translateY(-12px); }
  100% { transform: rotate(348deg) translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .dice-face--rolling {
    animation-duration: 0.8s;
  }
}
</style>
