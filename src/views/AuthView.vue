<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const mode = ref("register");
const username = ref("");
const password = ref("");
const passwordConfirmation = ref("");
const isPasswordVisible = ref(false);
const isPasswordConfirmationVisible = ref(false);
const errorMessage = ref("");
const isSubmitting = ref(false);

const getRedirectPath = () => {
  const redirect = route.query.redirect;
  if (typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//") && !redirect.startsWith("/auth")) {
    return redirect;
  }
  return "/profile";
};

const submit = async () => {
  errorMessage.value = "";

  if (mode.value === "register" && password.value !== passwordConfirmation.value) {
    errorMessage.value = "Пароли не совпадают.";
    return;
  }

  isSubmitting.value = true;
  try {
    const credentials = { username: username.value, password: password.value };
    if (mode.value === "register") {
      await authStore.register(credentials);
    } else {
      await authStore.login(credentials);
    }

    await router.push(getRedirectPath());
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
};

const logout = async () => {
  errorMessage.value = "";
  isSubmitting.value = true;
  try {
    await authStore.logout();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <section class="w-full max-w-6xl mx-auto px-4 py-10 sm:py-16">
    <div class="max-w-md mx-auto rounded-3xl border border-amber-400/20 bg-[#08130f]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      <p class="text-center text-xs font-bold uppercase tracking-[0.3em] text-amber-400">Emerald Club</p>

      <template v-if="authStore.isAuthenticated">
        <h1 class="mt-4 text-center text-2xl font-bold text-amber-100">Аккаунт</h1>
        <p class="mt-3 text-center text-sm text-gray-400">
          Вы вошли как <span class="font-semibold text-white">{{ authStore.user.username }}</span>
        </p>
        <p v-if="authStore.player" class="mt-1 text-center text-sm text-gray-500">Профиль: {{ authStore.player.displayName }}</p>
        <p v-if="errorMessage" role="alert" class="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {{ errorMessage }}
        </p>
        <button
          type="button"
          class="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:border-amber-400/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isSubmitting"
          @click="logout">
          {{ isSubmitting ? "Выходим…" : "Выйти" }}
        </button>
      </template>

      <template v-else>
        <h1 class="mt-4 text-center text-2xl font-bold text-amber-100">
          {{ mode === "register" ? "Создать аккаунт" : "Войти в аккаунт" }}
        </h1>
        <p class="mt-2 text-center text-sm text-gray-400">Сохраните имя игрока в своём аккаунте Emerald Club.</p>

        <div class="mt-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-semibold transition"
            :class="mode === 'register' ? 'bg-amber-400 text-black' : 'text-gray-400 hover:text-white'"
            @click="
              mode = 'register';
              errorMessage = '';
            ">
            Регистрация
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-semibold transition"
            :class="mode === 'login' ? 'bg-amber-400 text-black' : 'text-gray-400 hover:text-white'"
            @click="
              mode = 'login';
              errorMessage = '';
            ">
            Вход
          </button>
        </div>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-200">Имя игрока</span>
            <input
              v-model="username"
              type="text"
              name="username"
              autocomplete="username"
              minlength="3"
              maxlength="32"
              required
              class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-amber-400/60"
              placeholder="Например, EmeraldFox" />
            <span class="mt-1 block text-xs text-gray-500">3–32 буквы, цифры, дефис или подчёркивание.</span>
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-200">Пароль</span>
            <div class="relative">
              <input
                v-model="password"
                :type="isPasswordVisible ? 'text' : 'password'"
                name="password"
                :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
                minlength="8"
                maxlength="128"
                required
                class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-gray-600 focus:border-amber-400/60"
                placeholder="Не менее 8 символов" />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 transition hover:text-amber-300"
                :aria-label="isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'"
                :aria-pressed="isPasswordVisible"
                @click="isPasswordVisible = !isPasswordVisible">
                <svg v-if="!isPasswordVisible" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a16 16 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8" />
                </svg>
              </button>
            </div>
          </label>

          <label v-if="mode === 'register'" class="block">
            <span class="mb-2 block text-sm font-medium text-gray-200">Повторите пароль</span>
            <div class="relative">
              <input
                v-model="passwordConfirmation"
                :type="isPasswordConfirmationVisible ? 'text' : 'password'"
                name="password-confirmation"
                autocomplete="new-password"
                minlength="8"
                maxlength="128"
                required
                class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-gray-600 focus:border-amber-400/60"
                placeholder="Введите пароль ещё раз" />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 transition hover:text-amber-300"
                :aria-label="isPasswordConfirmationVisible ? 'Скрыть пароль' : 'Показать пароль'"
                :aria-pressed="isPasswordConfirmationVisible"
                @click="isPasswordConfirmationVisible = !isPasswordConfirmationVisible">
                <svg
                  v-if="!isPasswordConfirmationVisible"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  aria-hidden="true">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a16 16 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8" />
                </svg>
              </button>
            </div>
          </label>

          <p v-if="authStore.restoreError" role="status" class="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100">
            Не удалось восстановить сессию: {{ authStore.restoreError }}
          </p>
          <p v-if="errorMessage" role="alert" class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-3 font-bold text-[#1c1304] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            :disabled="isSubmitting">
            {{ isSubmitting ? "Подождите…" : mode === "register" ? "Зарегистрироваться" : "Войти" }}
          </button>
        </form>
      </template>
    </div>
  </section>
</template>
