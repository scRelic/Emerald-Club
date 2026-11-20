import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { POKER_TABLES } from '@/config/pokerTables';
import { apiRequest } from '@/services/api';
import { runPlayerOperation } from '@/services/gameApi';
import { usePlayerStore } from '@/stores/playerStore';

export const usePoker = (tableId) => {
    const playerStore = usePlayerStore();
    const selectedTableId = ref(POKER_TABLES[tableId] ? tableId : 'classic');
    const currentTable = computed(() => POKER_TABLES[selectedTableId.value]);
    const minBuyIn = computed(() => currentTable.value.minBuyIn);
    const maxBuyIn = computed(() => {
        const affordable = Math.min(currentTable.value.maxBuyIn, playerStore.chips);
        return Math.floor(affordable / currentTable.value.step) * currentTable.value.step;
    });

    const isSeated = ref(false);
    const buyInAmount = ref(minBuyIn.value);
    const tableChips = ref(0);
    const playerCards = ref([]);
    const bots = ref([]);
    const communityCards = ref([]);
    const stage = ref('idle');
    const pot = ref(0);
    const smallBlind = ref(currentTable.value.smallBlind);
    const bigBlind = ref(currentTable.value.bigBlind);
    const dealerSeatId = ref(null);
    const sbSeatId = ref(null);
    const bbSeatId = ref(null);
    const handHistory = ref([]);
    const currentBet = ref(0);
    const playerRoundBet = ref(0);
    const currentActorId = ref(null);
    const playerFolded = ref(false);
    const showdownRevealed = ref(false);
    const resultMessage = ref('');
    const resultType = ref('neutral');
    const winnerIds = ref([]);
    const playerHandEval = ref(null);
    const minRaiseSize = ref(0);
    const requestBusy = ref(false);
    const errorMessage = ref('');
    const turnTimeLeft = ref(15);
    let turnTimer = null;

    const isBotsTurn = computed(() => Boolean(currentActorId.value && currentActorId.value !== 'player'));
    const isPlayerTurn = computed(() => currentActorId.value === 'player' && !requestBusy.value);
    const betPresets = computed(() => {
        const callNeeded = Math.max(0, currentBet.value - playerRoundBet.value);
        const maxRaise = Math.max(0, tableChips.value - callNeeded);
        const roundToStep = (amount) => Math.round(amount / currentTable.value.step) * currentTable.value.step;
        const preset = (fraction) => Math.min(
            maxRaise,
            Math.max(minRaiseSize.value, roundToStep(pot.value * fraction)),
        );

        return {
            quarter: preset(0.25),
            half: preset(0.5),
            fullPot: preset(1),
            allIn: tableChips.value,
        };
    });

    const clearSession = () => {
        isSeated.value = false;
        tableChips.value = 0;
        playerCards.value = [];
        bots.value = [];
        communityCards.value = [];
        stage.value = 'idle';
        pot.value = 0;
        currentBet.value = 0;
        playerRoundBet.value = 0;
        currentActorId.value = null;
        playerFolded.value = false;
        showdownRevealed.value = false;
        resultMessage.value = '';
        resultType.value = 'neutral';
        winnerIds.value = [];
        playerHandEval.value = null;
        handHistory.value = [];
    };

    const applySession = (session) => {
        if (!session) {
            clearSession();
            return;
        }

        selectedTableId.value = session.tableId;
        buyInAmount.value = session.buyIn;
        tableChips.value = session.tableChips;
        playerCards.value = session.playerCards || [];
        bots.value = session.bots || [];
        communityCards.value = session.communityCards || [];
        stage.value = session.stage;
        pot.value = session.pot;
        smallBlind.value = session.smallBlind;
        bigBlind.value = session.bigBlind;
        dealerSeatId.value = session.dealerSeatId;
        sbSeatId.value = session.sbSeatId;
        bbSeatId.value = session.bbSeatId;
        handHistory.value = session.handHistory || [];
        currentBet.value = session.currentBet;
        playerRoundBet.value = session.playerRoundBet;
        currentActorId.value = session.currentActorId;
        playerFolded.value = session.playerFolded;
        showdownRevealed.value = session.showdownRevealed;
        resultMessage.value = session.resultMessage;
        resultType.value = session.resultType;
        winnerIds.value = session.winnerIds || [];
        playerHandEval.value = session.playerHandEval;
        minRaiseSize.value = session.minRaiseSize;
        isSeated.value = true;
    };

    const performOperation = async (path, operation, applyResult = applySession) => {
        if (requestBusy.value) return null;
        requestBusy.value = true;
        errorMessage.value = '';
        try {
            const result = await runPlayerOperation(path, operation, playerStore);
            applyResult(result);
            return result;
        } catch (error) {
            errorMessage.value = error.message || 'Не удалось выполнить действие.';
            return null;
        } finally {
            requestBusy.value = false;
        }
    };

    const sitAtTable = async () => {
        if (maxBuyIn.value < minBuyIn.value) {
            errorMessage.value = `Для этого стола нужно минимум ${minBuyIn.value} фишек.`;
            return;
        }
        await performOperation('/games/poker/sit', {
            tableId: selectedTableId.value,
            buyIn: Math.min(maxBuyIn.value, Math.max(minBuyIn.value, buyInAmount.value)),
        });
    };

    const startNewHand = () => performOperation('/games/poker/next-hand', {});

    const submitAction = (action, amount) => performOperation('/games/poker/action', { action, amount });

    const check = () => submitAction(currentBet.value > playerRoundBet.value ? 'call' : 'check');
    const raise = (amount) => {
        if (Number.isSafeInteger(amount) && amount > 0) return submitAction('raise', amount);
        return null;
    };
    const fold = () => submitAction('fold');

    const leaveTable = async () => {
        const result = await performOperation('/games/poker/leave', {}, () => clearSession());
        return result !== null;
    };

    const resumeSession = async () => {
        try {
            const response = await apiRequest('/games/poker/session');
            if (response?.session) {
                applySession(response.session);
                await leaveTable();
            } else {
                clearSession();
            }
        } catch (error) {
            errorMessage.value = error.message || 'Не удалось восстановить покерную сессию.';
        }
    };

    const selectTable = (nextTableId) => {
        if (!isSeated.value && POKER_TABLES[nextTableId]) {
            selectedTableId.value = nextTableId;
        }
    };

    watch(currentTable, (table) => {
        if (isSeated.value) return;
        buyInAmount.value = Math.max(table.minBuyIn, Math.min(table.maxBuyIn, maxBuyIn.value));
    });

    watch([currentActorId, stage], ([actorId, currentStage]) => {
        clearInterval(turnTimer);
        turnTimeLeft.value = 15;
        if (actorId !== 'player' || !['preflop', 'flop', 'turn', 'river'].includes(currentStage)) return;

        turnTimer = setInterval(() => {
            turnTimeLeft.value -= 1;
            if (turnTimeLeft.value <= 0) {
                clearInterval(turnTimer);
                fold();
            }
        }, 1000);
    });

    onMounted(resumeSession);
    onUnmounted(() => clearInterval(turnTimer));

    return {
        currentTable,
        minBuyIn,
        maxBuyIn,
        isSeated,
        buyInAmount,
        tableChips,
        playerCards,
        bots,
        communityCards,
        stage,
        smallBlind,
        bigBlind,
        pot,
        betPresets,
        resultMessage,
        resultType,
        winnerIds,
        playerHandEval,
        turnTimeLeft,
        isBotsTurn,
        dealerSeatId,
        sbSeatId,
        bbSeatId,
        handHistory,
        currentBet,
        playerRoundBet,
        isPlayerTurn,
        playerFolded,
        showdownRevealed,
        errorMessage,
        sitAtTable,
        leaveTable,
        startNewHand,
        check,
        raise,
        fold,
        selectTable,
    };
};
