<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import GameStatCard from "@/components/GameStatCard.vue";
import ProfileAchievements from "@/components/ProfileAchievements.vue";
import GamesHistory from "@/components/GamesHistory.vue";
import { formatNumber } from "@/utils";
import { usePlayerStore } from "../stores/playerStore";
import { useAuthStore } from "@/stores/authStore";
import { shopItems } from "@/utils/data";

const playerStore = usePlayerStore();
const authStore = useAuthStore();
const router = useRouter();

const isEditingName = ref(false);
const tempName = ref(playerStore.name);
const actionError = ref("");
const isSavingName = ref(false);
const isLoggingOut = ref(false);

const avatars = computed(() =>
  shopItems.filter((item) =>
    item.category === "avatars" && playerStore.ownedItems.includes(item.id),
  ),
);
const selectedAvatar = computed(() =>
  avatars.value.find((avatar) => avatar.id === playerStore.equipped.avatars),
);

const activeSubTab = ref("stats");

const combinationStats = computed(() => [
  { label: "Стриты", value: playerStore.stats.poker.straights },
  { label: "Флеши", value: playerStore.stats.poker.flushes },
  { label: "Стрит-флеши", value: playerStore.stats.poker.straightFlushes },
  { label: "Каре", value: playerStore.stats.poker.kare },
  { label: "Роял-флеши", value: playerStore.stats.poker.royalFlushes },
]);

const stats = computed(() => [
  {
    title: "Всего ставок / игр",
    value: playerStore.totalGames,
    color: "text-white",
  },
  {
    title: "Общий винрейт",
    value: playerStore.winRate,
    suffix: "%",
    color: "text-amber-300",
  },
]);

const startEditName = () => {
  actionError.value = "";
  tempName.value = playerStore.name;
  isEditingName.value = true;
};

const saveName = async () => {
  const trimmed = tempName.value.trim();
  if (!trimmed || trimmed.length > 32) {
    actionError.value = "Никнейм должен содержать от 1 до 32 символов.";
    return;
  }

  actionError.value = "";
  isSavingName.value = true;
  try {
    await authStore.updateDisplayName(trimmed);
    isEditingName.value = false;
  } catch (error) {
    actionError.value = error.message;
  } finally {
    isSavingName.value = false;
  }
};

const logout = async () => {
  actionError.value = "";
  isLoggingOut.value = true;
  try {
    await authStore.logout();
    await router.push("/auth");
  } catch (error) {
    actionError.value = error.message;
  } finally {
    isLoggingOut.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col text-white relative overflow-hidden font-sans selection:bg-amber-400/30">
    <div class="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400/80 mb-2">Личный кабинет игрока</p>
          <h1 class="font-casino text-3xl sm:text-5xl font-bold bg-gradient-to-b from-[#FFF5CC] via-[#F3C65F] to-[#C88A1E] bg-clip-text text-transparent">
            Профиль и Статистика ♠
          </h1>
        </div>

        <div class="flex items-center gap-2 bg-black/50 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md self-start sm:self-auto">
          <button
            @click="activeSubTab = 'stats'"
            aria-label="Показать статистику по играм"
            :class="[
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer',
              activeSubTab === 'stats'
                ? 'bg-gradient-to-b from-[#F9D876] to-[#D49824] text-[#1c1304] font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-white/5',
            ]">
            Статистика по играм
          </button>
          <button
            @click="activeSubTab = 'games_history'"
            aria-label="Показать историю игр"
            :class="[
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer',
              activeSubTab === 'games_history'
                ? 'bg-gradient-to-b from-[#F9D876] to-[#D49824] text-[#1c1304] font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-white/5',
            ]">
            История игр
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <aside
          class="lg:col-span-4 rounded-3xl p-7 bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 backdrop-blur-xl border border-amber-400/20 shadow-[inset_0_1px_0_rgba(255,235,160,0.15),0_25px_50px_rgba(0,0,0,0.65)]">
          <div class="flex flex-col items-center text-center">
            <div class="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-red-600 via-amber-500 to-amber-300 shadow-[0_0_30px_rgba(245,196,81,0.25)] mb-4">
              <div class="w-full h-full rounded-full bg-[#121e1a] flex items-center justify-center text-5xl text-amber-300 select-none">
                {{ selectedAvatar?.symbol }}
              </div>
            </div>

            <div class="flex items-center gap-2 mb-5">
              <button
                v-for="av in avatars"
                :key="av.id"
                @click="playerStore.setAvatar(av.id)"
                :title="av.label"
                :aria-label="`Выбрать аватар: ${av.label}`"
                :class="[
                  'w-8 h-8 rounded-full text-sm flex items-center justify-center border transition cursor-pointer',
                  playerStore.equipped.avatars === av.id
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 scale-110'
                    : 'bg-black/40 border-white/10 text-gray-400 hover:text-white',
                ]">
                {{ av.symbol }}
              </button>
            </div>

            <div v-if="!isEditingName" class="flex items-center justify-center gap-2">
              <h2 class="text-2xl font-bold text-white">{{ playerStore.name }}</h2>
              <button
                v-if="authStore.isAuthenticated"
                @click="startEditName"
                title="Изменить никнейм"
                aria-label="Изменить никнейм"
                class="text-gray-400 hover:text-amber-400 p-1 transition cursor-pointer">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
            </div>
            <RouterLink
              v-if="!authStore.isAuthenticated && !isEditingName"
              to="/auth"
              class="mt-1 text-xs text-amber-300 hover:text-amber-200">
              Войдите, чтобы изменить никнейм
            </RouterLink>

            <form v-if="isEditingName" @submit.prevent="saveName" class="flex flex-col items-center gap-2 w-full max-w-[220px] mb-2">
              <input
                v-model="tempName"
                type="text"
                maxlength="32"
                class="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-amber-400/50 text-white text-sm focus:outline-none"
                autofocus />
              <div class="flex items-center gap-2 w-full">
                <button
                  type="submit"
                  aria-label="Сохранить никнейм"
                  :disabled="isSavingName"
                  class="w-full px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-bold text-xs cursor-pointer disabled:opacity-50">
                  {{ isSavingName ? "Сохранение…" : "Сохранить" }}
                </button>
                <button
                  type="button"
                  @click="isEditingName = false; actionError = ''"
                  aria-label="Отменить редактирование никнейма"
                  :disabled="isSavingName"
                  class="w-full px-3 py-1.5 rounded-xl bg-red-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50">
                  Отмена
                </button>
              </div>
            </form>
            <p v-if="actionError" role="alert" class="mt-2 text-xs text-red-300">
              {{ actionError }}
            </p>

            <span class="mt-1.5 inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-400/10 border border-amber-400/25 text-amber-300">
              Уровень {{ playerStore.level }} • Постоянный гость
            </span>
          </div>

          
          <div class="mt-6 pt-6 border-t border-white/10">
            <div class="flex justify-between text-xs mb-2">
              <span class="text-gray-400">Прогресс уровня</span>
              <span class="text-amber-300 font-semibold tabular-nums">
                {{ formatNumber(playerStore.xp) }} / {{ formatNumber(playerStore.nextLevelXp) }} XP
              </span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-black/60 overflow-hidden border border-white/5">
              <div
                class="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-500"
                :style="{ width: `${playerStore.xpPercentage}%` }" />
            </div>
          </div>

          <div class="mt-6 p-4 rounded-2xl bg-black/45 border border-white/10 flex items-center justify-between">
            <div>
              <span class="block text-[10px] uppercase tracking-wider text-gray-400">Демо-фишки · только в этом браузере</span>
              <span class="text-2xl font-bold text-white tabular-nums flex items-center gap-2 mt-0.5">
                <span class="w-5 h-5 rounded-full bg-red-600 border border-dashed border-white flex items-center justify-center text-[10px]">♠</span>
                {{ formatNumber(authStore.isAuthenticated ? playerStore.chips : 0) }}
              </span>
            </div>
          </div>

          <button
            v-if="authStore.isAuthenticated"
            type="button"
            :disabled="isLoggingOut"
            @click="logout"
            class="mt-4 w-full rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50">
            {{ isLoggingOut ? "Выходим…" : "Выйти из аккаунта" }}
          </button>
        </aside>

        <section v-if="activeSubTab === 'stats'" class="lg:col-span-8 space-y-6">
          <div class="rounded-3xl p-6 bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 backdrop-blur-xl border border-amber-400/20">
            <h3 class="text-xs font-semibold uppercase tracking-widest text-amber-400/80 mb-4">Общая сводка клуба</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div v-for="stat in stats" :key="stat.title" class="p-4 rounded-2xl bg-black/40 border border-white/5">
                <span class="text-xs text-gray-400">{{ stat.title }}</span>
                <div :class="`text-2xl font-bold ${stat.color} mt-1 tabular-nums`">{{ formatNumber(stat.value) }}{{ stat.suffix || "" }}</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <GameStatCard
              title="Блэкджек"
              symbol="♠"
              theme="emerald"
              :bets-count="playerStore.stats.blackjack.betsCount"
              :wins="playerStore.stats.blackjack.wins"
              :losses="playerStore.stats.blackjack.losses"
              :extra-rows="[{ label: 'Ничьих', value: playerStore.stats.blackjack.draws }]">
              <div class="flex items-center justify-between p-3 rounded-xl bg-amber-400/10 border border-amber-400/25">
                <span class="text-xs font-medium text-amber-200">Собрано 21 (Блэкджек)</span>
                <span class="text-base font-bold text-amber-300 tabular-nums">{{ playerStore.stats.blackjack.naturals21 }}</span>
              </div>
            </GameStatCard>

            <GameStatCard
              title="Покер"
              symbol="♥"
              theme="rose"
              bets-label="Раздач / Ставок"
              :bets-count="playerStore.stats.poker.betsCount"
              :wins="playerStore.stats.poker.wins"
              :losses="playerStore.stats.poker.losses">
              <div class="space-y-2">
                <span class="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">Собранные комбинации</span>
                <div
                  v-for="combination in combinationStats"
                  :key="combination.label"
                  class="flex justify-between items-center text-xs px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-400/20">
                  <span class="text-gray-300">{{ combination.label }}</span>
                  <span class="font-bold text-white tabular-nums text-yellow-300">{{ combination.value }}</span>
                </div>
              </div>
            </GameStatCard>

            <GameStatCard
              title="Рулетка"
              symbol="♦"
              theme="sky"
              bets-label="Спинов / Ставок"
              :bets-count="playerStore.stats.roulette.betsCount"
              :wins="playerStore.stats.roulette.wins"
              :losses="playerStore.stats.roulette.losses">
              <div class="space-y-2">
                <div class="flex justify-between items-center text-xs px-3 py-2 rounded-lg bg-black/40">
                  <span class="text-gray-300">Угадано Зеро (0)</span>
                  <span class="font-bold text-emerald-400 tabular-nums">{{ playerStore.stats.roulette.zeroHits }}</span>
                </div>
                <div class="flex justify-between items-center text-xs px-3 py-2 rounded-lg bg-black/40">
                  <span class="text-gray-300">Макс. выигрыш</span>
                  <span class="font-bold text-amber-300 tabular-nums">{{ formatNumber(playerStore.stats.roulette.biggestWin) }}</span>
                </div>
              </div>
            </GameStatCard>

            <GameStatCard
              title="Кости"
              symbol="⚄"
              theme="emerald"
              bets-label="Бросков"
              :bets-count="playerStore.stats.dice.betsCount"
              :wins="playerStore.stats.dice.wins"
              :losses="playerStore.stats.dice.losses"
              :extra-rows="[{ label: 'Крупнейшая прибыль', value: formatNumber(playerStore.stats.dice.biggestWin) }]" />

            <GameStatCard
              title="Колесо фортуны"
              symbol="🎡"
              theme="emerald"
              bets-label="Спинов / Ставок"
              :bets-count="playerStore.stats.fortune.betsCount"
              :wins="playerStore.stats.fortune.wins"
              :losses="playerStore.stats.fortune.losses"
              :extra-rows="[
                { label: 'Ничьих', value: playerStore.stats.fortune.draws },
                { label: 'Крупнейшая прибыль', value: formatNumber(playerStore.stats.fortune.biggestWin) },
              ]" />
          </div>

          <ProfileAchievements />
        </section>

        <section v-else class="lg:col-span-8">
          <GamesHistory :history="playerStore.gameHistory" />
        </section>
      </div>
    </div>
  </div>
</template>
