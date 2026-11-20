<script setup>
import { ref } from "vue";

const activeTab = ref("poker");

const pokerCombinations = [
  {
    rank: 1,
    name: "Роял-флеш",
    badge: "Максимальная рука",
    badgeStyle: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    description: "Пять старших карт одной масти от Десятки до Туза.",
    example: ["A♠", "K♠", "Q♠", "J♠", "10♠"],
  },
  {
    rank: 2,
    name: "Стрит-флеш",
    badge: "Очень редкая",
    badgeStyle: "bg-rose-500/20 text-rose-300 border-rose-400/35",
    description: "Пять последовательных карт одной масти.",
    example: ["9♥", "8♥", "7♥", "6♥", "5♥"],
  },
  {
    rank: 3,
    name: "Каре",
    badge: "Сильная рука",
    badgeStyle: "bg-purple-500/20 text-purple-300 border-purple-400/35",
    description: "Четыре карты одного достоинства и одна любая (кикер).",
    example: ["Q♠", "Q♥", "Q♦", "Q♣", "7♠"],
  },
  {
    rank: 4,
    name: "Фулл-хаус",
    badge: "Сильная рука",
    badgeStyle: "bg-purple-500/20 text-purple-300 border-purple-400/35",
    description: "Тройка карт одного достоинства плюс одна пара.",
    example: ["K♠", "K♦", "K♣", "9♥", "9♠"],
  },
  {
    rank: 5,
    name: "Флеш",
    badge: "Выше среднего",
    badgeStyle: "bg-sky-500/20 text-sky-300 border-sky-400/35",
    description: "Любые пять карт одной масти не по порядку.",
    example: ["A♣", "J♣", "8♣", "5♣", "2♣"],
  },
  {
    rank: 6,
    name: "Стрит",
    badge: "Выше среднего",
    badgeStyle: "bg-sky-500/20 text-sky-300 border-sky-400/35",
    description: "Пять последовательных карт разных мастей. Туз может начинать (A-2-3-4-5) или замыкать (10-J-Q-K-A) ряд.",
    example: ["10♦", "9♠", "8♣", "7♥", "6♦"],
  },
  {
    rank: 7,
    name: "Сет (Тройка)",
    badge: "Средняя рука",
    badgeStyle: "bg-emerald-500/20 text-emerald-300 border-emerald-400/35",
    description: "Три карты одного достоинства и две непарные карты.",
    example: ["8♠", "8♥", "8♦", "K♣", "4♠"],
  },
  {
    rank: 8,
    name: "Две пары",
    badge: "Базовая рука",
    badgeStyle: "bg-white/10 text-gray-300 border-white/15",
    description: "Две карты одного достоинства, две другого и один кикер.",
    example: ["J♠", "J♦", "5♣", "5♥", "A♠"],
  },
  {
    rank: 9,
    name: "Пара",
    badge: "Базовая рука",
    badgeStyle: "bg-white/10 text-gray-300 border-white/15",
    description: "Две карты одного достоинства и три непарные карты.",
    example: ["10♠", "10♥", "A♦", "7♣", "3♠"],
  },
  {
    rank: 10,
    name: "Старшая карта",
    badge: "Минимальная",
    badgeStyle: "bg-white/5 text-gray-400 border-white/10",
    description: "Если ни одна из комбинаций выше не собрана, победитель определяется по самой старшей карте в руке.",
    example: ["A♦", "Q♠", "9♣", "6♥", "2♦"],
  },
];

const isRedCard = (cardStr) => cardStr.includes("♥") || cardStr.includes("♦");
</script>

<template>
  <div class="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 text-white relative z-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
      <div>
        <span class="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-400/80 block mb-1.5"> Справочник клуба </span>
        <h1 class="font-casino text-4xl sm:text-5xl font-bold text-[#F3D58D] tracking-wide">Правила игр</h1>
        <p class="text-xs sm:text-sm text-gray-400 mt-2 max-w-xl">
          Подробное руководство по механике столов, старшинству комбинаций и коэффициентам выплат в Emerald Club.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md self-start md:self-auto">
        <button
          @click="activeTab = 'poker'"
          :class="[
            'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'poker' ? 'bg-gradient-to-b from-[#F9D876] to-[#D49824] text-[#1c1304] shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/5',
          ]">
          <span>♥</span> Техасский Холдем
        </button>

        <button
          @click="activeTab = 'blackjack'"
          :class="[
            'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'blackjack'
              ? 'bg-gradient-to-b from-[#F9D876] to-[#D49824] text-[#1c1304] shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5',
          ]">
          <span>♠</span> Блэкджек
        </button>

        <button
          @click="activeTab = 'roulette'"
          :class="[
            'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'roulette'
              ? 'bg-gradient-to-b from-[#F9D876] to-[#D49824] text-[#1c1304] shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5',
          ]">
          <span>🎯</span> Рулетка
        </button>

        <button
          @click="activeTab = 'dice'"
          :class="[
            'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'dice' ? 'bg-gradient-to-b from-[#F9D876] to-[#D49824] text-[#1c1304] shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/5',
          ]">
          <span>⚄</span> Кости
        </button>

        <button
          @click="activeTab = 'fortune'"
          :class="[
            'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'fortune'
              ? 'bg-gradient-to-b from-[#F9D876] to-[#D49824] text-[#1c1304] shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5',
          ]">
          <span>🎡</span> Колесо
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'poker'" class="space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          class="lg:col-span-5 rounded-3xl bg-gradient-to-br from-[#2d0d16] via-[#1f0910] to-[#140509] border border-rose-500/20 p-6 sm:p-7 flex flex-col justify-between shadow-xl">
          <div>
            <span
              class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 inline-block mb-4">
              Texas Hold'em
            </span>
            <h2 class="font-casino text-2xl sm:text-3xl text-white mb-3">Цель и механика стола</h2>
            <p class="text-xs sm:text-sm text-gray-300/90 leading-relaxed mb-5">
              Задача игрока — собрать сильнейшую 5-карточную комбинацию из <strong>2 своих закрытых карт</strong> и <strong>5 общих карт</strong> на столе, либо
              заставить всех соперников сбросить карты (Фолд) до вскрытия.
            </p>

            <ul class="space-y-2.5 text-xs sm:text-sm text-gray-300">
              <li class="flex items-start gap-2.5">
                <span class="text-amber-400 font-bold">1.</span>
                <span><strong>Выбор стека (Buy-in):</strong> перед посадкой за стол вы выбираете сумму фишек в пределах лимита зала (от 50 до 25 000).</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="text-amber-400 font-bold">2.</span>
                <span
                  ><strong>Блайнды и позиции:</strong> обычно малый и большой блайнды ставят игроки слева от дилера; в игре один на один дилер ставит малый
                  блайнд, соперник — большой. Префлоп первым действует игрок слева от большого блайнда, на следующих улицах — первый активный игрок слева от
                  дилера.</span
                >
              </li>
              <li class="flex items-start gap-2.5">
                <span class="text-amber-400 font-bold">3.</span>
                <span
                  ><strong>Делёж банка (Split Pot):</strong> если у двух и более игроков на шоудауне одинаковая комбинация и кикеры, банк делится поровну.</span
                >
              </li>
            </ul>
          </div>

          <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3 max-[440px]:flex-col max-[440px]:items-stretch">
            <span class="text-xs text-gray-400 max-[440px]:text-center"> Готовы проверить стратегию? </span>

            <router-link
              to="/games/poker"
              class="px-5 py-2.5 rounded-xl font-bold text-xs text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] hover:brightness-110 transition max-[440px]:w-full max-[440px]:text-center">
              Перейти за стол ▶
            </router-link>
          </div>
        </div>

        <div class="lg:col-span-7 rounded-3xl bg-[#0e1412]/90 border border-white/10 p-6 sm:p-7 flex flex-col justify-between shadow-xl">
          <div>
            <h3 class="font-casino text-2xl text-amber-200 mb-4">Этапы раздачи (Улицы)</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              <div class="p-4 rounded-2xl bg-black/40 border border-white/10">
                <span class="text-[11px] font-bold uppercase text-amber-400">1. Префлоп (Preflop)</span>
                <p class="text-xs text-gray-300 mt-1 leading-relaxed">Игрок и 1–4 соперника получают по 2 закрытые карты. Начинается первый круг торгов.</p>
              </div>

              <div class="p-4 rounded-2xl bg-black/40 border border-white/10">
                <span class="text-[11px] font-bold uppercase text-amber-400">2. Флоп (Flop)</span>
                <p class="text-xs text-gray-300 mt-1 leading-relaxed">На центр стола выкладываются первые 3 общие карты в открытую.</p>
              </div>

              <div class="p-4 rounded-2xl bg-black/40 border border-white/10">
                <span class="text-[11px] font-bold uppercase text-amber-400">3. Тёрн (Turn)</span>
                <p class="text-xs text-gray-300 mt-1 leading-relaxed">Открывается 4-я общая карта. Ставки становятся крупнее, слабые руки начинают пасовать.</p>
              </div>

              <div class="p-4 rounded-2xl bg-black/40 border border-white/10">
                <span class="text-[11px] font-bold uppercase text-amber-400">4. Ривер и Вскрытие</span>
                <p class="text-xs text-gray-300 mt-1 leading-relaxed">
                  Открывается 5-я финальная карта. После последних ставок оставшиеся игроки вскрывают карты.
                </p>
              </div>
            </div>

            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Доступные действия в раздаче</h4>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200">
                <strong>Чек / колл:</strong> пропустить ставку, если её нет, или уравнять текущую
              </span>
              <span class="px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-200">
                <strong>1/4, 1/2, Банк:</strong> повысить ставку и оказать давление на соперников
              </span>
              <span class="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-200">
                <strong>Олл-ин:</strong> поставить весь оставшийся стек за столом
              </span>
            </div>
            <p class="text-xs text-gray-400 mt-3 leading-relaxed">
              Размеры блайндов зависят от стола. Минимальное полное повышение — не меньше большого блайнда, а последующие — не меньше предыдущего полного
              повышения. Короткий олл-ин разрешён, но не переоткрывает торги.
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-3xl bg-[#0e1412]/90 border border-amber-400/15 p-6 sm:p-8 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-400/80"> Иерархия рук </span>
            <h2 class="font-casino text-2xl sm:text-3xl text-white">Комбинации покера (от сильной к слабой)</h2>
          </div>
          <span class="text-xs text-gray-400"> Подсказка текущей комбинации всегда отображается под вашими картами </span>
        </div>

        <div class="divide-y divide-white/10">
          <div
            v-for="combo in pokerCombinations"
            :key="combo.rank"
            class="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-start gap-3.5 max-w-xl">
              <div
                class="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                #{{ combo.rank }}
              </div>
              <div>
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h3 class="font-bold text-base text-white">{{ combo.name }}</h3>
                  <span :class="['px-2 py-0.5 rounded-md text-[10px] font-bold border', combo.badgeStyle]">
                    {{ combo.badge }}
                  </span>
                </div>
                <p class="text-xs text-gray-400 mt-1 leading-relaxed">
                  {{ combo.description }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0 self-start md:self-center">
              <div
                v-for="(card, idx) in combo.example"
                :key="idx"
                :class="[
                  'w-10 h-14 rounded-lg bg-[#f8fafc] border border-gray-300 shadow-md flex flex-col items-center justify-center font-bold text-xs select-none',
                  isRedCard(card) ? 'text-rose-600' : 'text-slate-900',
                ]">
                <span>{{ card.slice(0, -1) }}</span>
                <span class="text-sm leading-none mt-0.5">{{ card.slice(-1) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'blackjack'" class="space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          class="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#0f2920] via-[#0b1f18] to-[#07140f] border border-emerald-500/20 p-6 sm:p-7 flex flex-col justify-between shadow-xl">
          <div>
            <span
              class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-block mb-4">
              Классика 21
            </span>
            <h2 class="font-casino text-2xl sm:text-3xl text-white mb-3">Как играть в Блэкджек</h2>
            <p class="text-xs sm:text-sm text-gray-300/90 leading-relaxed mb-6">
              Вы играете один на один против дилера клуба. Главная цель — набрать сумму очков <strong>ближе к 21, чем у дилера</strong>, но ни в коем случае не
              превысить 21 (перебор означает мгновенный проигрыш ставки).
            </p>

            <h3 class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">Номинал карт</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                <div class="text-lg font-extrabold text-white mb-1">2 — 10</div>
                <p class="text-xs text-gray-400">Дают количество очков, равное их числовому номиналу.</p>
              </div>

              <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                <div class="text-lg font-extrabold text-amber-300 mb-1">J, Q, K</div>
                <p class="text-xs text-gray-400">Валет, Дама и Король всегда оцениваются ровно в <strong>10 очков</strong>.</p>
              </div>

              <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                <div class="text-lg font-extrabold text-emerald-300 mb-1">Туз (A)</div>
                <p class="text-xs text-gray-400">
                  Считается как <strong>11 очков</strong> или <strong>1 очко</strong> — в зависимости от того, что выгоднее руке.
                </p>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-400/20 text-xs sm:text-sm text-gray-200">
              <strong class="text-emerald-300">Правило дилера Emerald Club:</strong> Дилер обязан брать карты (Hit), пока сумма его очков меньше 17, и обязан
              остановиться (Stand), как только наберёт <strong>17 или больше очков</strong>.
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3 max-[520px]:flex-col max-[440px]:items-stretch">
            <span class="text-xs text-gray-400 max-[440px]:text-center"> Лимиты стола: от 50 до 5 000 фишек</span>

            <router-link
              to="/games/blackjack"
              class="px-5 py-2.5 rounded-xl font-bold text-xs text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] hover:brightness-110 transition max-[520px]:w-full max-[520px]:text-center">
              Играть в Блэкджек ▶
            </router-link>
          </div>
        </div>

        <div class="lg:col-span-5 space-y-6">
          <div class="rounded-3xl bg-[#0e1412]/90 border border-amber-400/20 p-6 shadow-xl">
            <h3 class="font-casino text-xl text-amber-200 mb-4">Коэффициенты выплат</h3>
            <div class="space-y-3 text-xs sm:text-sm">
              <div class="flex items-center justify-between p-3 rounded-xl bg-amber-400/10 border border-amber-400/25">
                <div>
                  <strong class="text-amber-300 block">Натуральный Блэкджек (21 с 2 карт)</strong>
                  <span class="text-[11px] text-gray-400">Туз + любая карта номиналом 10</span>
                </div>
                <span class="font-extrabold text-amber-300 text-base">3 : 2 (×2.5)</span>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <strong class="text-white block">Обычная победа над дилером</strong>
                  <span class="text-[11px] text-gray-400">Больше очков или перебор у дилера</span>
                </div>
                <span class="font-extrabold text-emerald-400 text-base">1 : 1 (×2)</span>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <strong class="text-white block">Ничья (Push)</strong>
                  <span class="text-[11px] text-gray-400">Равное количество очков с дилером</span>
                </div>
                <span class="font-bold text-gray-300 text-sm">Возврат ставки</span>
              </div>
            </div>
          </div>

          <div class="rounded-3xl bg-[#0e1412]/90 border border-white/10 p-6 shadow-xl">
            <h3 class="font-casino text-xl text-white mb-4">Действия во время хода</h3>
            <ul class="space-y-3 text-xs text-gray-300">
              <li class="p-3 rounded-xl bg-black/35 border border-white/5">
                <strong class="text-emerald-300 block mb-0.5">Ещё (Hit)</strong>
                Взять дополнительную карту из колоды. Можно брать сколько угодно карт, пока сумма не достигнет 21.
              </li>
              <li class="p-3 rounded-xl bg-black/35 border border-white/5">
                <strong class="text-rose-300 block mb-0.5">Хватит (Stand)</strong>
                Остановиться на текущих очках и передать ход дилеру.
              </li>
              <li class="p-3 rounded-xl bg-black/35 border border-white/5">
                <strong class="text-amber-300 block mb-0.5">Удвоить (Double Down)</strong>
                Удвоить начальную ставку, получить ровно <strong>одну</strong> карту и автоматически завершить ход. Доступно только на первых двух картах.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'roulette'" class="space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          class="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#0e1c18] via-[#091411] to-[#050c0a] border border-emerald-500/20 p-6 sm:p-7 flex flex-col justify-between shadow-xl">
          <div>
            <span
              class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-block mb-4">
              Европейское колесо • 37 секторов
            </span>
            <h2 class="font-casino text-2xl sm:text-3xl text-white mb-3">Правила Европейской рулетки</h2>
            <p class="text-xs sm:text-sm text-gray-300/90 leading-relaxed mb-6">
              Колесо европейской рулетки состоит из 37 лунок: числа от 1 до 36 (разделены на красный и чёрный цвета) и зелёный сектор <strong>Зеро (0)</strong>.
              Ваша задача — угадать, на каком секторе остановится шарик после вращения.
            </p>

            <h3 class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">Типы ставок на столе</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                <div class="text-sm font-bold text-white mb-1">Внутренние ставки</div>
                <p class="text-xs text-gray-400">Ставка на конкретное число от 0 до 36. Выплачивается по максимальному коэффициенту.</p>
              </div>

              <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                <div class="text-sm font-bold text-white mb-1">Внешние ставки</div>
                <p class="text-xs text-gray-400">Ставки на равные шансы (Красное/Чёрное, Чёт/Нечёт, 1–18 / 19–36) или колонки/дюжины.</p>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-400/20 text-xs sm:text-sm text-gray-200">
              <strong class="text-emerald-300">Особенность Зеро (0):</strong> При выпадении зелёного сектора все простые ставки (на цвета, чётность и диапазоны)
              проигрывают, давая преимущество игорному дому.
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3 max-[520px]:flex-col max-[440px]:items-stretch">
            <span class="text-xs text-gray-400 max-[440px]:text-center"> Лимиты стола: от 25 до 5 000 фишек</span>

            <router-link
              to="/games/roulette"
              class="px-5 py-2.5 rounded-xl font-bold text-xs text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] hover:brightness-110 transition max-[520px]:w-full max-[520px]:text-center">
              Крутить рулетку ▶
            </router-link>
          </div>
        </div>

        <div class="lg:col-span-5 rounded-3xl bg-[#0e1412]/90 border border-amber-400/20 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 class="font-casino text-xl text-amber-200 mb-4">Коэффициенты выплат</h3>
            <div class="space-y-3 text-xs sm:text-sm">
              <div class="flex items-center justify-between p-3 rounded-xl bg-amber-400/10 border border-amber-400/25">
                <div>
                  <strong class="text-amber-300 block">Прямая ставка на число (Straight)</strong>
                  <span class="text-[11px] text-gray-400">Число от 0 до 36</span>
                </div>
                <span class="font-extrabold text-amber-300 text-base">35 : 1</span>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <strong class="text-white block">Колонки и Дюжины (Column / Dozen)</strong>
                  <span class="text-[11px] text-gray-400">12 чисел на поле</span>
                </div>
                <span class="font-extrabold text-emerald-400 text-base">2 : 1</span>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <strong class="text-white block">Красное / Чёрное (Red / Black)</strong>
                  <span class="text-[11px] text-gray-400">Равные шансы</span>
                </div>
                <span class="font-bold text-gray-200 text-sm">1 : 1</span>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <strong class="text-white block">Чёт / Нечёт (Even / Odd)</strong>
                  <span class="text-[11px] text-gray-400">Равные шансы</span>
                </div>
                <span class="font-bold text-gray-200 text-sm">1 : 1</span>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <strong class="text-white block">Старшие / Младшие (1–18 / 19–36)</strong>
                  <span class="text-[11px] text-gray-400">Диапазоны чисел</span>
                </div>
                <span class="font-bold text-gray-200 text-sm">1 : 1</span>
              </div>
            </div>
          </div>

          <p class="text-[11px] text-gray-400 mt-6 text-center">Вы можете комбинировать сразу несколько фишек на разные сектора за один спин.</p>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'dice'" class="space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#241237] via-[#180d29] to-[#0d0716] border border-violet-500/20 p-6 sm:p-7 shadow-xl">
          <span
            class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-200 border border-violet-400/30 inline-block mb-4">
            Два шестигранных кубика
          </span>
          <h2 class="font-casino text-2xl sm:text-3xl text-white mb-3">Как играть в кости</h2>
          <p class="text-xs sm:text-sm text-gray-300/90 leading-relaxed mb-5">
            Выберите размер ставки и предскажите сумму двух кубиков. После броска ставка списывается с баланса. При выигрыше выплата включает возвращённую
            ставку.
          </p>
          <ul class="space-y-3 text-xs sm:text-sm text-gray-300">
            <li><strong class="text-amber-300">Меньше 7:</strong> суммы от 2 до 6, выплата x2.</li>
            <li><strong class="text-amber-300">Больше 7:</strong> суммы от 8 до 12, выплата x2.</li>
            <li><strong class="text-amber-300">Ровно 7:</strong> точная сумма 7, выплата x5.</li>
          </ul>
        </div>

        <div class="lg:col-span-5 rounded-3xl bg-[#0e1412]/90 border border-amber-400/20 p-6 shadow-xl">
          <h3 class="font-casino text-xl text-amber-200 mb-4">Пример выплаты</h3>
          <p class="text-sm text-gray-300 leading-relaxed">
            Если поставить 100 фишек на «Больше 7» и выпадет сумма 9, на баланс вернутся 200 фишек: 100 — ставка и 100 — выигрыш.
          </p>
          <p class="text-sm text-gray-300 leading-relaxed mt-4">
            Если выпадет 7, ставка на «Меньше 7» или «Больше 7» проигрывает. Для выигрыша на семёрке нужно выбрать «Ровно 7».
          </p>
          <router-link
            to="/games/dice"
            class="inline-flex mt-6 px-5 py-2.5 rounded-xl font-bold text-xs text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] hover:brightness-110 transition">
            Играть в кости ▶
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#35220d] via-[#201508] to-[#100b05] border border-amber-500/20 p-6 sm:p-7 shadow-xl">
          <span
            class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-200 border border-amber-400/30 inline-block mb-4">
            Одиннадцать равных секторов
          </span>
          <h2 class="font-casino text-2xl sm:text-3xl text-white mb-3">Как играть в Колесо фортуны</h2>
          <p class="text-xs sm:text-sm text-gray-300/90 leading-relaxed mb-5">
            Выберите ставку, затем запустите колесо. После вращения ставка списывается, а выплата начисляется на баланс; размер выплаты равен ставке, умноженной
            на коэффициент сектора.
          </p>
          <ul class="space-y-3 text-xs sm:text-sm text-gray-300">
            <li><strong class="text-rose-300">x0:</strong> ставка проигрывает.</li>
            <li><strong class="text-amber-200">x1.5 и x2:</strong> выплата включает ставку и прибыль.</li>
            <li><strong class="text-sky-300">x5 и x10:</strong> крупные выплаты, включая ставку.</li>
          </ul>
        </div>

        <div class="lg:col-span-5 rounded-3xl bg-[#0e1412]/90 border border-amber-400/20 p-6 shadow-xl">
          <h3 class="font-casino text-xl text-amber-200 mb-4">Пример выплаты</h3>
          <p class="text-sm text-gray-300 leading-relaxed">
            При ставке 100 фишек и секторе x2 на баланс начислят 200 фишек: 100 — возврат ставки, ещё 100 — прибыль.
          </p>
          <p class="text-sm text-gray-300 leading-relaxed mt-4">
            Вращение сопровождается анимацией и звуком. Итоговый сектор выбирается случайно; недоступные из-за баланса ставки заблокированы.
          </p>
          <router-link
            to="/games/fortune"
            class="inline-flex mt-6 px-5 py-2.5 rounded-xl font-bold text-xs text-[#1c1304] bg-gradient-to-b from-[#F9D876] to-[#D49824] hover:brightness-110 transition">
            Крутить колесо ▶
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
