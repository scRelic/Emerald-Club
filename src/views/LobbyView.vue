<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { CircleDot, Dices, FerrisWheel } from "lucide-vue-next";
import { usePlayerStore } from "../stores/playerStore";
import { useAuthStore } from "@/stores/authStore";
import { formatNumber } from "@/utils";
import { shopItems, demoLeaderboardPlayers } from "@/utils/data";
import { runPlayerOperation } from "@/services/gameApi";

const playerStore = usePlayerStore();
const authStore = useAuthStore();
const avatar = computed(() => shopItems.find((item) => item.id === playerStore.equipped.avatars));
const currentTime = ref(Date.now());
const bonusError = ref("");
const claimingBonus = ref(false);
let dailyBonusClock;

const dailyBonusRemainingMs = computed(() => Math.max(0, playerStore.dailyBonusReadyAt - currentTime.value));
const dailyBonusAvailable = computed(() => dailyBonusRemainingMs.value === 0);
const dailyBonusCountdown = computed(() => {
  const totalSeconds = Math.ceil(dailyBonusRemainingMs.value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
});

onMounted(() => {
  dailyBonusClock = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => clearInterval(dailyBonusClock));

const claimDailyBonus = async () => {
  if (!authStore.isAuthenticated || claimingBonus.value) return;
  claimingBonus.value = true;
  bonusError.value = "";
  try {
    await runPlayerOperation("/player/daily-bonus", {}, playerStore);
    currentTime.value = Date.now();
  } catch (error) {
    bonusError.value = error.message;
  } finally {
    claimingBonus.value = false;
  }
};

const leaderboardPlayers = computed(() =>
  [...demoLeaderboardPlayers, { name: playerStore.name, level: playerStore.level, avatar: avatar.value?.symbol || "♠", isCurrent: true }].sort(
    (first, second) => second.level - first.level || Number(Boolean(second.isCurrent)) - Number(Boolean(first.isCurrent)),
  ),
);
const leaderboardPosition = computed(() => leaderboardPlayers.value.findIndex((player) => player.isCurrent) + 1);
</script>

<template>
  <div class="flex-1 flex-col text-white relative overflow-hidden font-sans selection:bg-amber-400/30">
    <div class="relative z-10 flex-1 flex flex-col justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
        <section
          class="lg:col-span-7 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 backdrop-blur-xl border border-amber-400/20 shadow-[inset_0_1px_0_rgba(255,235,160,0.15),0_25px_50px_rgba(0,0,0,0.65)]">
          <div class="mt-2">
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-gray-300/80 mb-3">Добро пожаловать в</p>
            <h1
              class="text-4xl sm:text-5xl font-bold bg-gradient-to-b from-[#FFF5CC] via-[#F3C65F] to-[#C88A1E] bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(243,198,95,0.25)] mb-4 font-cinzel">
              Emerald Club <span class="text-amber-400">♠</span>
            </h1>
            <p class="text-gray-300/90 text-base max-w-md mx-auto leading-relaxed">
              Закрытый игровой клуб: блэкджек, покер, рулетка, кости и колесо фортуны. Делай ставки и открывай эксклюзивные стили.
            </p>
          </div>

          <RouterLink
            to="/games"
            class="w-full max-w-sm my-9 py-4 px-8 rounded-2xl font-bold text-xl text-[#1c1304] flex items-center justify-center gap-3 bg-gradient-to-b from-[#F9D876] to-[#D49824] shadow-[inset_0_1px_1px_rgba(255,255,255,0.75),0_10px_30px_rgba(230,168,46,0.35)] hover:brightness-105 active:scale-[0.99] transition cursor-pointer">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Играть
          </RouterLink>

          <div class="w-full grid grid-cols-3 gap-3.5">
            <RouterLink
              to="/profile"
              class="group py-4 px-3 rounded-2xl bg-[#0c1914]/90 border border-amber-400/15 hover:border-amber-400/45 hover:bg-[#13261f] transition flex flex-col items-center gap-2.5 cursor-pointer">
              <svg class="w-6 h-6 text-amber-400 group-hover:scale-110 transition" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
              </svg>
              <span class="text-sm font-medium text-gray-200">Профиль</span>
            </RouterLink>

            <RouterLink
              to="/shop"
              class="group py-4 px-3 rounded-2xl bg-[#0c1914]/90 border border-amber-400/15 hover:border-amber-400/45 hover:bg-[#13261f] transition flex flex-col items-center gap-2.5 cursor-pointer">
              <svg class="w-6 h-6 text-amber-400 group-hover:scale-110 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span class="text-sm font-medium text-gray-200">Магазин</span>
            </RouterLink>

            <RouterLink
              to="/rules"
              class="group py-4 px-3 rounded-2xl bg-[#0c1914]/90 border border-amber-400/15 hover:border-amber-400/45 hover:bg-[#13261f] transition flex flex-col items-center gap-2.5 cursor-pointer">
              <svg class="w-6 h-6 text-amber-400 group-hover:scale-110 transition" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span class="text-sm font-medium text-gray-200">Правила</span>
            </RouterLink>
          </div>
        </section>

        <aside
          class="lg:col-span-5 rounded-3xl p-7 flex flex-col justify-between bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 backdrop-blur-xl border border-amber-400/20 shadow-[inset_0_1px_0_rgba(255,235,160,0.15),0_25px_50px_rgba(0,0,0,0.65)]">
          <div>
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-red-600 via-amber-500 to-amber-300 shadow-[0_0_20px_rgba(220,38,38,0.3)] shrink-0">
                <div class="w-full h-full rounded-full bg-[#151c1a] flex items-center justify-center text-3xl text-amber-300/90">
                  {{ avatar?.symbol || "♠" }}
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div>
                  <h2 class="text-xl font-bold text-white truncate">{{ playerStore.name }}</h2>
                </div>

                <p class="text-sm text-amber-400/90 font-medium mb-2">Уровень {{ playerStore.level }}</p>

                <div class="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/5">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-500"
                    :style="{ width: `${playerStore.xpPercentage}%` }" />
                </div>
                <div class="text-right text-[11px] text-gray-400 mt-1 tabular-nums">
                  {{ formatNumber(playerStore.xp) }} / {{ formatNumber(playerStore.nextLevelXp) }} XP
                </div>
              </div>
            </div>

            <div class="my-6 px-4 py-3 rounded-2xl bg-black/45 border border-white/10 flex items-center justify-between shadow-inner">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-gradient-to-b from-red-500 to-red-700 border-2 border-dashed border-white flex items-center justify-center text-xs font-bold shadow text-white">
                  ♠
                </div>
                <span class="text-2xl font-bold tracking-wide text-white tabular-nums">
                  {{ formatNumber(authStore.isAuthenticated ? playerStore.chips : 0) }}
                </span>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-gray-200 mb-3.5">Быстрая статистика</h3>
              <ul class="space-y-3 text-sm">
                <li class="flex items-center justify-between border-b border-white/10 pb-2">
                  <span class="flex items-center text-gray-300">
                    <span class="w-5 h-5 shrink-0 mr-2.5 flex items-center justify-center">
                      <svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z" />
                      </svg>
                    </span>
                    <span class="mr-1.5">Игр сыграно в</span>
                    <span class="font-semibold text-gray-200">Блэкджек</span>
                  </span>
                  <span class="font-bold text-white tabular-nums">{{ playerStore.stats.blackjack.betsCount }}</span>
                </li>

                <li class="flex items-center justify-between border-b border-white/10 pb-2">
                  <span class="flex items-center text-gray-300">
                    <span class="w-5 h-5 shrink-0 mr-2.5 flex items-center justify-center">
                      <svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z" />
                      </svg>
                    </span>
                    <span class="mr-1.5">Игр сыграно в</span>
                    <span class="font-semibold text-gray-200">Покер</span>
                  </span>
                  <span class="font-bold text-white tabular-nums">{{ playerStore.stats.poker.betsCount }}</span>
                </li>

                <li class="flex items-center justify-between border-b border-white/10 pb-2">
                  <span class="flex items-center text-gray-300">
                    <span class="w-5 h-5 shrink-0 mr-2.5 flex items-center justify-center">
                      <CircleDot class="w-4 h-4 text-rose-500" aria-hidden="true" />
                    </span>
                    <span class="mr-1.5">Игр сыграно в</span>
                    <span class="font-semibold text-gray-200">Рулетку</span>
                  </span>
                  <span class="font-bold text-white tabular-nums">{{ playerStore.stats.roulette.betsCount }}</span>
                </li>

                <li class="flex items-center justify-between border-b border-white/10 pb-2">
                  <span class="flex items-center text-gray-300">
                    <span class="w-5 h-5 shrink-0 mr-2.5 flex items-center justify-center">
                      <Dices class="w-5 h-5 text-violet-300" aria-hidden="true" />
                    </span>
                    <span class="mr-1.5">Игр сыграно в</span>
                    <span class="font-semibold text-gray-200">Кости</span>
                  </span>
                  <span class="font-bold text-white tabular-nums">{{ playerStore.stats.dice.betsCount }}</span>
                </li>

                <li class="flex items-center justify-between border-b border-white/10 pb-2">
                  <span class="flex items-center text-gray-300">
                    <span class="w-5 h-5 shrink-0 mr-2.5 flex items-center justify-center">
                      <FerrisWheel class="w-5 h-5 text-amber-300" aria-hidden="true" />
                    </span>
                    <span class="mr-1.5">Игр сыграно в</span>
                    <span class="font-semibold text-gray-200">Колесо</span>
                  </span>
                  <span class="font-bold text-white tabular-nums">{{ playerStore.stats.fortune.betsCount }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-base font-medium text-gray-200">Всего игр</span>
            <span class="text-xl font-bold text-emerald-400 tabular-nums">{{ playerStore.totalGames }}</span>
          </div>
        </aside>

        <section class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-7 lg:col-span-12">
          <div
            class="rounded-2xl p-5 bg-gradient-to-b from-[#10241d]/75 to-[#091410]/90 backdrop-blur-md border border-amber-400/15 flex items-center justify-between gap-4">
            <div>
              <span class="text-[11px] uppercase tracking-wider text-amber-400/80 font-semibold">Ежедневный бонус</span>
              <h3 class="text-base font-bold text-white mt-0.5">+500 фишек</h3>
              <p class="text-xs text-gray-400 mt-1">
                {{
                  !authStore.isAuthenticated
                    ? "Войдите, чтобы получить бонус"
                    : dailyBonusAvailable
                      ? "Можно забрать сейчас"
                      : `Следующий через ${dailyBonusCountdown}`
                }}
              </p>
            </div>
            <button
              type="button"
              :disabled="!authStore.isAuthenticated || !dailyBonusAvailable || claimingBonus"
              @click="claimDailyBonus"
              class="px-4 py-2.5 rounded-xl text-xs font-bold text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] hover:brightness-105 transition shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              {{
                !authStore.isAuthenticated
                  ? "Войти"
                  : dailyBonusAvailable
                    ? "Забрать"
                    : "Получено"
              }}
            </button>
            <p v-if="bonusError" class="mt-2 text-xs text-rose-300">{{ bonusError }}</p>
          </div>

          <div
            class="rounded-2xl p-5 bg-gradient-to-b from-[#10241d]/75 to-[#091410]/90 backdrop-blur-md border border-amber-400/15 flex items-center justify-between gap-4">
            <div>
              <span class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Статистика</span>
              <h3 class="text-base font-bold text-white mt-0.5">История игр</h3>
              <p class="text-xs text-gray-400 mt-1">Таблица результатов</p>
            </div>
            <RouterLink
              to="/profile"
              class="px-4 py-2.5 rounded-xl text-xs font-medium text-amber-300 border border-amber-400/30 hover:bg-amber-400/10 transition shrink-0">
              Открыть
            </RouterLink>
          </div>
        </section>

        <section
          class="lg:col-span-12 rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 backdrop-blur-xl border border-amber-400/20 shadow-[0_25px_50px_rgba(0,0,0,0.45)]">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-400/80 mb-1">Рейтинг по уровням</p>
              <h2 class="font-casino text-2xl sm:text-3xl font-bold text-amber-100">Рейтинг игроков</h2>
              <p class="text-xs text-gray-400 mt-1">Общий онлайн-рейтинг.</p>
            </div>
            <span class="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-sm font-bold text-amber-200">
              Ваше место: #{{ leaderboardPosition }}
            </span>
          </div>

          <ol class="space-y-3">
            <li
              v-for="(competitor, index) in leaderboardPlayers"
              :key="competitor.isCurrent ? 'current-player' : competitor.name"
              :class="[
                'flex items-center gap-3 p-3.5 rounded-2xl border min-w-0',
                competitor.isCurrent ? 'bg-emerald-500/10 border-emerald-400/40' : 'bg-black/30 border-white/10',
              ]">
              <span
                :class="[
                  'w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-extrabold',
                  index === 0
                    ? 'bg-amber-300 text-[#1c1304]'
                    : index === 1
                      ? 'bg-gray-300 text-gray-900'
                      : index === 2
                        ? 'bg-orange-400 text-orange-950'
                        : 'bg-white/10 text-gray-300',
                ]">
                {{ index + 1 }}
              </span>
              <span
                :class="[
                  'w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl',
                  competitor.isCurrent ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/5 text-amber-200',
                ]">
                {{ competitor.avatar }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block break-words text-base sm:text-lg font-bold text-white">{{ competitor.name }}</span>
                <span class="block text-xs text-gray-400">{{ competitor.isCurrent ? "Ваш профиль" : "Демо-игрок" }}</span>
              </span>
              <span class="text-xs font-bold text-amber-200 tabular-nums">УР. {{ competitor.level }}</span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  </div>
</template>
