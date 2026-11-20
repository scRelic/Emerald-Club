<script setup>

import bgImage from "@/assets/images/lounge-bg.jpg";
</script>

<template>
  <div class="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
    
    <div
      class="absolute inset-0"
      style="background: radial-gradient(circle at 50% 10%, rgba(212, 155, 39, 0.16) 0%, rgba(16, 42, 33, 0.35) 40%, transparent 75%)" />

    
    <div class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 blur-[4px] scale-105" :style="{ backgroundImage: `url(${bgImage})` }" />

    
    <div class="absolute inset-0" style="background: radial-gradient(circle at 50% 35%, rgba(6, 12, 10, 0.35) 0%, rgba(6, 12, 10, 0.88) 70%, #060c0a 100%)" />
    <div class="absolute inset-0" style="background: radial-gradient(circle at 50% 10%, rgba(212, 155, 39, 0.18) 0%, transparent 60%)" />
  </div>
</template>
