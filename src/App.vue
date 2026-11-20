<script setup>
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import MainLayout from "@/components/layout/MainLayout.vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.restoreSession();
  }
});
</script>

<template>
  <div>
    <div
      v-if="authStore.syncError"
      role="alert"
      class="flex flex-col gap-3 border-b border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-center">
      <span>Не удалось загрузить профиль: {{ authStore.syncError }}</span>
      <button
        type="button"
        class="self-start rounded-lg border border-amber-300/30 px-3 py-1 font-semibold hover:bg-amber-300/10 sm:self-auto"
        @click="authStore.retryPlayerStateLoad">
        Повторить загрузку
      </button>
    </div>
    <MainLayout>
      <RouterView />
    </MainLayout>
  </div>
</template>
