<script setup>
import { ref, computed } from "vue";
import { formatNumber } from "@/utils";
import { usePlayerStore } from "../stores/playerStore";
import { useAuthStore } from "@/stores/authStore";
import { shopItems } from "@/utils/data";
import { runPlayerOperation } from "@/services/gameApi";

const playerStore = usePlayerStore();
const authStore = useAuthStore();

const activeCategory = ref("all");
const toastMessage = ref("");
const pendingItemId = ref("");

const categories = [
  { id: "all", label: "Все товары" },
  { id: "cards", label: "Рубашки карт" },
  { id: "tables", label: "Сукно столов" },
  { id: "avatars", label: "Эмблемы" },
  { id: "chips", label: "Пополнение фишек" },
];

const filteredItems = computed(() => {
  if (activeCategory.value === "all") return shopItems;
  return shopItems.filter((item) => item.category === activeCategory.value);
});

const showToast = (msg) => {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = "";
  }, 3000);
};

const handleAction = async (item) => {
  if (!authStore.isAuthenticated || pendingItemId.value) return;
  pendingItemId.value = item.id;
  try {
    const result = await runPlayerOperation("/player/shop", { itemId: item.id }, playerStore);
    showToast(result.message);
  } catch (error) {
    showToast(error.message);
  } finally {
    pendingItemId.value = "";
  }
};

const isOwned = (item) =>
  playerStore.ownedItems.includes(item.id);

const isEquipped = (item) => {
  return isOwned(item) && playerStore.equipped[item.category] === item.id;
};
</script>

<template>
  <div class="flex flex-col text-white relative overflow-hidden font-sans selection:bg-amber-400/30">
    
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4">
      <div
        v-if="toastMessage"
        class="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-[#10241d]/95 border border-amber-400/50 text-amber-200 font-semibold text-sm shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl flex items-center gap-2.5">
        <span class="text-amber-400">♠</span>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400/80 mb-2">Бутик привилегий и стиля</p>
          <h1 class="font-casino text-3xl sm:text-5xl font-bold bg-gradient-to-b from-[#FFF5CC] via-[#F3C65F] to-[#C88A1E] bg-clip-text text-transparent">
            Магазин клуба ♠
          </h1>
        </div>

        
        <div class="flex flex-wrap items-center gap-2 bg-black/50 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="activeCategory = cat.id"
            :class="[
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer',
              activeCategory === cat.id
                ? 'bg-gradient-to-b from-[#F9D876] to-[#D49824] text-[#1c1304] font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-white/5',
            ]">
            {{ cat.label }}
          </button>
        </div>
      </div>

      <div
        v-if="!authStore.isAuthenticated"
        class="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
        <span>Баланс: 0 фишек. Войдите в аккаунт, чтобы покупать товары.</span>
        <RouterLink
          to="/auth"
          class="w-fit rounded-xl bg-gradient-to-b from-[#F9D876] to-[#D49824] px-4 py-2 font-bold text-[#1c1304] transition hover:brightness-105">
          Войти
        </RouterLink>
      </div>

      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          :class="[
            'group rounded-3xl p-6 flex flex-col justify-between bg-gradient-to-b from-[#10241d]/85 to-[#091410]/95 backdrop-blur-xl border transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.6)]',
            isEquipped(item)
              ? 'border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.12)]'
              : 'border-amber-400/20 hover:border-amber-400/50 hover:-translate-y-1',
          ]">
          <div>
            
            <div class="flex items-center justify-between gap-2 mb-5">
              <span class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                {{ item.categoryLabel }}
              </span>
              <span :class="['text-[11px] font-bold px-3 py-0.5 rounded-full', item.badgeClass]">
                {{ isEquipped(item) ? "✓ Активно" : item.badge }}
              </span>
            </div>

            
            <div class="h-40 rounded-2xl mb-5 flex items-center justify-center relative overflow-hidden">
              
              <div
                v-if="item.category === 'cards'"
                :class="[
                  'w-20 h-28 rounded-xl border-2 bg-gradient-to-br flex items-center justify-center shadow-2xl group-hover:scale-105 group-hover:-rotate-3 transition duration-300',
                  item.previewStyle,
                ]">
                <div
                  :class="[
                    'w-14 h-22 rounded-lg border flex items-center justify-center text-2xl text-amber-300/90',
                    item.id === 'card-classic'
                      ? 'border-amber-400/25 [background-image:radial-gradient(#fbbf24_1px,transparent_1px)] bg-[length:8px_8px]'
                      : 'border-white/20',
                  ]">
                  <span
                    :class="[
                      item.id === 'card-classic'
                        ? 'w-6 h-6 rounded-full border border-amber-400/40 bg-[#091913] flex items-center justify-center text-xs'
                        : '',
                    ]">
                    {{ item.symbol }}
                  </span>
                </div>
              </div>

              
              <div
                v-else-if="item.category === 'tables'"
                class="w-44 h-24 rounded-2xl border-4 border-[#5a361d] shadow-2xl flex items-center justify-center group-hover:scale-105 transition duration-300"
                :style="{ background: item.tableGradient }">
                <span class="font-casino text-[10px] tracking-[0.25em] text-amber-200/40">LOUNGE</span>
              </div>

              
              <div
                v-else-if="item.category === 'avatars'"
                class="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-red-600 via-amber-500 to-amber-300 shadow-lg group-hover:scale-105 transition duration-300">
                <div class="w-full h-full rounded-full bg-[#121e1a] flex items-center justify-center text-3xl text-amber-300">
                  {{ item.symbol }}
                </div>
              </div>

              
              <div v-else class="flex items-center justify-center gap-2 group-hover:scale-105 transition duration-300">
                <div class="w-14 h-14 rounded-full bg-red-600 border-4 border-dashed border-white shadow-xl flex items-center justify-center font-bold text-lg">
                  ♠
                </div>
                <div
                  class="w-16 h-16 rounded-full bg-amber-500 border-4 border-dashed border-[#1c1304] text-[#1c1304] shadow-xl flex items-center justify-center font-bold text-xl -ml-4">
                  $
                </div>
              </div>
            </div>

            
            <h3 class="font-casino text-xl font-bold text-white group-hover:text-amber-200 transition">
              {{ item.title }}
            </h3>
            <p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
              {{ item.description }}
            </p>
          </div>

          
          <div class="pt-5 mt-6 border-t border-white/10 flex items-center justify-between gap-3">
            <div>
              <span class="block text-[10px] uppercase tracking-wider text-gray-400">Стоимость</span>
              <span v-if="item.price === 0" class="text-sm font-bold text-emerald-400"> Бесплатно </span>
              <span v-else class="text-base font-bold text-white tabular-nums flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-red-600 border border-dashed border-white flex items-center justify-center text-[9px]">♠</span>
                {{ formatNumber(item.price) }}
              </span>
            </div>

            <button
              @click="handleAction(item)"
              :disabled="!authStore.isAuthenticated || isEquipped(item) || pendingItemId !== ''"
              :class="[
                'px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer',
                !authStore.isAuthenticated
                  ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                  : isEquipped(item)
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 cursor-default'
                  : isOwned(item)
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
                    : 'bg-gradient-to-b from-[#F9D876] to-[#D49824] text-[#1c1304] shadow-[0_6px_20px_rgba(230,168,46,0.3)] hover:brightness-105 active:scale-95',
              ]">
              <template v-if="!authStore.isAuthenticated">Войдите</template>
              <template v-else-if="item.category === 'chips'">Забрать</template>
              <template v-else-if="isEquipped(item)">Выбрано</template>
              <template v-else-if="isOwned(item)">Применить</template>
              <template v-else>Купить</template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
