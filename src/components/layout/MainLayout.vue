<script setup>
import AppNavbar from "@/components/layout/AppNavbar.vue";
import AppLoungeBG from "@/components/layout/AppLoungeBG.vue";
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppLoungeBG />
    <AppNavbar />

    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>
