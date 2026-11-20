import pokerSolver from 'pokersolver';
import { POKER_TABLES } from '../../src/config/pokerTables.js';
import {
    clockwiseSeatIds,
    getPokerCombinationStat,
    getPokerPositions,
    splitPot,
} from '../../src/utils/pokerRules.js';

const { Hand } = pokerSolver;
const SUITS = [
    { symbol: '♠', english: 'spades' },
    { symbol: '♥', english: 'hearts' },
    { symbol: '♦', english: 'diamonds' },
    { symbol: '♣', english: 'clubs' },
];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUIT_CODES = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
const RANK_CODES = { '10': 'T' };
const PLAYING_STAGES = new Set(['preflop', 'flop', 'turn', 'river']);

const createDeck = (randomInt) => {
    const deck = SUITS.flatMap(({ symbol, english }) => RANKS.map((rank) => ({
        rank,
        value: rank,
        suit: symbol,
        englishSuit: english,
    })));
    for (let index = deck.length - 1; index > 0; index--) {
        const swapIndex = randomInt(0, index + 1);
        [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
    }
    return deck;
};

const cardCode = (card) => `${RANK_CODES[card.rank] || card.rank}${SUIT_CODES[card.suit]}`;
const evaluate = (cards) => Hand.solve(cards.map(cardCode));

const translateHandName = (description = '') => {
    if (description.includes('Royal Flush')) return 'Роял-флеш';
    if (description.includes('Straight Flush')) return 'Стрейт-флеш';
    if (description.includes('Four of a Kind')) return 'Каре';
    if (description.includes('Full House')) return 'Фулл-хаус';
    if (description.includes('Flush')) return 'Флеш';
    if (description.includes('Straight')) return 'Стрейт';
    if (description.includes('Three of a Kind')) return 'Тройка (Сет)';
    if (description.includes('Two Pair')) return 'Две пары';
    if (description.includes('Pair')) return 'Пара';
    if (description.includes('High Card')) return 'Старшая карта';
    return description || 'Старшая карта';
};

const tableFor = (tableId) => {
    const table = POKER_TABLES[tableId];
    if (!table) throw Object.assign(new Error('Неизвестный покерный стол.'), { status: 400 });
    return table;
};

const invest = (state, seatId, requestedAmount) => {
    const isPlayer = seatId === 'player';
    const stackKey = isPlayer ? 'tableChips' : 'botChips';
    const roundKey = isPlayer ? 'playerRoundBet' : 'botRoundBet';
    const investedKey = isPlayer ? 'playerTotalInvested' : 'botTotalInvested';
    const amount = Math.min(Math.max(0, requestedAmount), state[stackKey]);
    state[stackKey] -= amount;
    state[roundKey] += amount;
    state[investedKey] += amount;
    state.pot += amount;
    return amount;
};

const seatPositions = (state) => getPokerPositions(2, state.dealerIndex);
const opponentOf = (seatId) => seatId === 'player' ? 'bot-1' : 'player';
const stackFor = (state, seatId) => seatId === 'player' ? state.tableChips : state.botChips;
const roundBetFor = (state, seatId) => seatId === 'player' ? state.playerRoundBet : state.botRoundBet;
const canAct = (state, seatId) => stackFor(state, seatId) > 0;

const setNextActor = (state) => {
    state.currentActorId = state.pendingActors.find((seatId) => canAct(state, seatId)) || null;
};

const finishResult = (state, winnerIds, showdown = false) => {
    const potAmount = state.pot;
    let remainingPot = potAmount;
    let playerPayout = 0;

    if (state.playerTotalInvested > state.botTotalInvested) {
        const refund = state.playerTotalInvested - state.botTotalInvested;
        state.tableChips += refund;
        playerPayout += refund;
        remainingPot -= refund;
    } else if (state.botTotalInvested > state.playerTotalInvested) {
        const refund = state.botTotalInvested - state.playerTotalInvested;
        state.botChips += refund;
        remainingPot -= refund;
    }

    const clockwiseOrder = clockwiseSeatIds(
        [{ id: 'player' }, { id: 'bot-1' }],
        (seatPositions(state).dealer + 1) % 2,
    );
    const awards = splitPot(remainingPot, winnerIds, clockwiseOrder);
    for (const award of awards) {
        if (award.id === 'player') {
            state.tableChips += award.amount;
            playerPayout += award.amount;
        } else {
            state.botChips += award.amount;
        }
    }

    const netChange = playerPayout - state.playerTotalInvested;
    const outcome = state.playerFolded || netChange < 0
        ? 'loss'
        : netChange > 0
            ? 'win'
            : 'draw';
    const playerSolved = showdown && !state.playerFolded
        ? evaluate([...state.playerCards, ...state.communityCards])
        : null;
    const combinationStat = getPokerCombinationStat(playerSolved?.descr);
    state.stage = 'showdown';
    state.currentActorId = null;
    state.pendingActors = [];
    state.showdownRevealed = showdown;
    state.winnerIds = [...winnerIds];
    state.resultType = outcome;
    state.playerHandEval = playerSolved ? { name: translateHandName(playerSolved.descr) } : null;
    state.botHandEval = showdown && !state.botFolded
        ? { name: translateHandName(evaluate([...state.botCards, ...state.communityCards]).descr) }
        : null;
    state.resultMessage = outcome === 'win'
        ? `Победа! Выплата: ${playerPayout}, чистый выигрыш: ${netChange}`
        : outcome === 'draw'
            ? `Делёж банка — ваша доля ${playerPayout}`
            : state.playerFolded
                ? 'Вы сбросили карты. Банк выиграл соперник.'
                : `Банк выиграл соперник. Ваша выплата: ${playerPayout}`;
    state.handHistory.unshift(state.resultMessage);
    state.pot = potAmount;
    state.pendingRoundResult = {
        bet: state.playerTotalInvested,
        payout: playerPayout,
        netChange,
        outcome,
        label: outcome === 'win'
            ? `Победа (${playerSolved ? translateHandName(playerSolved.descr) : 'соперник сбросил карты'})`
            : outcome === 'draw' ? 'Делёж' : 'Проигрыш в раздаче',
        combinationStat,
    };
    if (!showdown && outcome === 'win') state.resultMessage = `Все соперники сбросили карты! Банк ваш: ${playerPayout}`;
};

const settleShowdown = (state) => {
    const playerHand = evaluate([...state.playerCards, ...state.communityCards]);
    const botHand = evaluate([...state.botCards, ...state.communityCards]);
    const winners = Hand.winners([playerHand, botHand]);
    const winnerIds = [];
    if (winners.includes(playerHand)) winnerIds.push('player');
    if (winners.includes(botHand)) winnerIds.push('bot-1');
    finishResult(state, winnerIds, true);
};

const runOutBoard = (state) => {
    while (state.communityCards.length < 5) {
        state.deck.pop();
        const cardsToReveal = state.communityCards.length === 0 ? 3 : 1;
        for (let index = 0; index < cardsToReveal; index++) {
            state.communityCards.push(state.deck.pop());
        }
    }
    settleShowdown(state);
};

const advanceStreet = (state, randomInt) => {
    if (state.stage === 'river') {
        settleShowdown(state);
        return;
    }

    state.deck.pop();
    const cardsToReveal = state.stage === 'preflop' ? 3 : 1;
    for (let index = 0; index < cardsToReveal; index++) {
        state.communityCards.push(state.deck.pop());
    }
    state.stage = state.stage === 'preflop'
        ? 'flop'
        : state.stage === 'flop'
            ? 'turn'
            : 'river';
    state.currentBet = 0;
    state.playerRoundBet = 0;
    state.botRoundBet = 0;
    state.minRaiseSize = tableFor(state.tableId).bigBlind;
    const first = seatPositions(state).postflopFirst === 0 ? 'player' : 'bot-1';
    state.pendingActors = [first, opponentOf(first)];
    continueActions(state, randomInt);
};

const finishBettingRound = (state, randomInt) => {
    if (state.tableChips === 0 || state.botChips === 0) {
        runOutBoard(state);
        return;
    }
    advanceStreet(state, randomInt);
};

const completeAction = (state, actor, raise = false) => {
    const opponent = opponentOf(actor);
    if (raise) {
        state.pendingActors = [opponent];
    } else {
        state.pendingActors = state.pendingActors.filter((seatId) => seatId !== actor);
    }
    setNextActor(state);
};

const processBotAction = (state, randomInt) => {
    const callNeeded = Math.max(0, state.currentBet - state.botRoundBet);
    const roll = randomInt(0, 100);
    if (callNeeded > 0 && roll < 12) {
        state.botFolded = true;
        state.botLastAction = 'Фолд';
        state.handHistory.unshift('Соперник сбросил карты (Фолд).');
        finishResult(state, ['player']);
        return;
    }

    const canRaise = roll > 82 && state.botChips > callNeeded;
    if (canRaise) {
        const raiseAmount = Math.max(
            state.minRaiseSize,
            randomInt(tableFor(state.tableId).bigBlind, tableFor(state.tableId).bigBlind * 2 + 1),
        );
        const paid = invest(state, 'bot-1', callNeeded + raiseAmount);
        const raiseIncrement = state.botRoundBet - state.currentBet;
        if (raiseIncrement > 0) {
            state.currentBet = state.botRoundBet;
            state.minRaiseSize = Math.max(state.minRaiseSize, raiseIncrement);
            state.botLastAction = `Рейз (+${raiseIncrement})`;
            state.handHistory.unshift(`Соперник повысил ставку на ${raiseIncrement}.`);
            completeAction(state, 'bot-1', true);
            return;
        }
        state.botLastAction = paid > 0 ? `Колл (${paid})` : 'Чек';
    } else {
        const paid = invest(state, 'bot-1', callNeeded);
        state.botLastAction = paid > 0 ? `Колл (${paid})` : 'Чек';
    }
    state.handHistory.unshift(`Соперник сделал ${state.botLastAction}.`);
    completeAction(state, 'bot-1');
};

const continueActions = (state, randomInt) => {
    while (PLAYING_STAGES.has(state.stage)) {
        setNextActor(state);
        if (state.tableChips === 0 || state.botChips === 0) {
            const playerMustRespond = state.currentActorId === 'player' &&
                state.tableChips > 0 &&
                state.playerRoundBet < state.currentBet;
            const botMustRespond = state.currentActorId === 'bot-1' &&
                state.botChips > 0 &&
                state.botRoundBet < state.currentBet;
            if (!playerMustRespond && !botMustRespond) {
                runOutBoard(state);
                return;
            }
        }

        if (!state.pendingActors.length) {
            finishBettingRound(state, randomInt);
            if (!PLAYING_STAGES.has(state.stage)) return;
            continue;
        }

        if (!state.currentActorId) {
            state.pendingActors = [];
            continue;
        }
        if (state.currentActorId === 'player') return;
        processBotAction(state, randomInt);
        if (state.stage === 'showdown') return;
    }
};

export const startPokerHand = (state, randomInt) => {
    const table = tableFor(state.tableId);

    if (state.tableChips < table.bigBlind * 10) {
        throw Object.assign(
            new Error(
                `Для начала раздачи необходимо минимум ${table.bigBlind * 10} фишек за столом.`
            ),
            { status: 409 }
        );
    }
    if (state.botChips <= 0) state.botChips = state.buyIn;

    state.deck = createDeck(randomInt);
    state.playerCards = [];
    state.botCards = [];
    state.communityCards = [];
    state.stage = 'preflop';
    state.pot = 0;
    state.currentBet = 0;
    state.playerRoundBet = 0;
    state.botRoundBet = 0;
    state.playerTotalInvested = 0;
    state.botTotalInvested = 0;
    state.playerFolded = false;
    state.botFolded = false;
    state.showdownRevealed = false;
    state.botLastAction = '';
    state.resultMessage = '';
    state.resultType = 'neutral';
    state.winnerIds = [];
    state.playerHandEval = null;
    state.botHandEval = null;
    state.pendingRoundResult = null;
    state.handHistory = [`Раздача началась. Блайнды ${table.smallBlind}/${table.bigBlind}.`];
    state.dealerIndex = (state.dealerIndex + 1) % 2;
    state.minRaiseSize = table.bigBlind;

    const positions = seatPositions(state);
    const smallBlindSeat = positions.smallBlind === 0 ? 'player' : 'bot-1';
    const bigBlindSeat = positions.bigBlind === 0 ? 'player' : 'bot-1';
    const smallBlindPaid = invest(state, smallBlindSeat, table.smallBlind);
    const bigBlindPaid = invest(state, bigBlindSeat, table.bigBlind);
    state.currentBet = Math.max(smallBlindPaid, bigBlindPaid);
    for (let round = 0; round < 2; round++) {
        state.playerCards.push(state.deck.pop());
        state.botCards.push(state.deck.pop());
    }

    const first = positions.preflopFirst === 0 ? 'player' : 'bot-1';
    state.pendingActors = [first, opponentOf(first)];
    continueActions(state, randomInt);
    return state;
};

export const createPokerSession = ({ tableId, buyIn }, randomInt) => {
    const table = tableFor(tableId);

    if (
        !Number.isSafeInteger(buyIn) ||
        buyIn < table.minBuyIn ||
        buyIn > table.maxBuyIn ||
        buyIn % table.step !== 0
    ) {
        throw Object.assign(
            new Error('Некорректная сумма для входа за выбранный стол.'),
            { status: 400 }
        );
    }

    return {
        tableId,
        buyIn,
        tableChips: buyIn,
        botChips: buyIn,
        botId: 'bot-1',
        botName: 'Виктор',
        dealerIndex: 0,

        deck: [],
        playerCards: [],
        botCards: [],
        communityCards: [],

        stage: 'idle',
        pot: 0,
        currentBet: 0,
        playerRoundBet: 0,
        botRoundBet: 0,
        playerTotalInvested: 0,
        botTotalInvested: 0,

        currentActorId: null,
        pendingActors: [],
        minRaiseSize: table.bigBlind,

        playerFolded: false,
        botFolded: false,
        showdownRevealed: false,
        botLastAction: '',

        resultMessage: '',
        resultType: 'neutral',
        winnerIds: [],
        playerHandEval: null,
        botHandEval: null,
        pendingRoundResult: null,
        handHistory: [],
    };
};

export const applyPokerAction = (state, { action, amount }, randomInt) => {
    if (!PLAYING_STAGES.has(state.stage) || state.currentActorId !== 'player') {
        throw Object.assign(new Error('Сейчас нельзя сделать ход.'), { status: 409 });
    }
    if (action === 'fold') {
        state.playerFolded = true;
        state.handHistory.unshift('Вы сбросили карты (Фолд).');
        finishResult(state, ['bot-1']);
        return state;
    }

    const callNeeded = Math.max(0, state.currentBet - state.playerRoundBet);
    if (action === 'check' || action === 'call') {
        if (action === 'check' && callNeeded > 0) {
            throw Object.assign(new Error('При текущей ставке нужно уравнять или сбросить карты.'), { status: 400 });
        }
        const paid = invest(state, 'player', callNeeded);
        state.handHistory.unshift(paid > 0 ? `Вы уравняли ставку (${paid}).` : 'Вы сделали чек.');
        completeAction(state, 'player');
    } else if (action === 'raise') {
        if (!Number.isSafeInteger(amount) || amount <= 0) {
            throw Object.assign(new Error('Размер повышения должен быть положительным целым числом.'), {
                status: 400,
            });
        }
        const totalRequested = callNeeded + amount;
        const finalAmount = Math.min(totalRequested, state.tableChips);
        const resultingRoundBet = state.playerRoundBet + finalAmount;
        const raiseIncrement = resultingRoundBet - state.currentBet;
        const isAllIn = finalAmount === state.tableChips;
        if (raiseIncrement <= 0) {
            throw Object.assign(new Error('Ставка не увеличивает текущий банк.'), { status: 400 });
        }
        if (raiseIncrement < state.minRaiseSize && !isAllIn) {
            throw Object.assign(new Error(`Минимальное повышение — ${state.minRaiseSize}.`), { status: 400 });
        }
        invest(state, 'player', finalAmount);
        state.currentBet = state.playerRoundBet;
        state.minRaiseSize = Math.max(state.minRaiseSize, raiseIncrement);
        state.handHistory.unshift(`Вы повысили ставку на ${raiseIncrement}.`);
        completeAction(state, 'player', true);
    } else {
        throw Object.assign(new Error('Недопустимый ход в покере.'), { status: 400 });
    }

    continueActions(state, randomInt);
    return state;
};

export const leavePokerTable = (state, randomInt) => {
    if (PLAYING_STAGES.has(state.stage)) {
        if (state.currentActorId === 'player') {
            applyPokerAction(state, { action: 'fold' }, randomInt);
        } else {
            runOutBoard(state);
        }
    }
    return state.tableChips;
};

export const getPublicPokerState = (state) => {
    const revealCount = {
        idle: 0,
        preflop: 0,
        flop: 3,
        turn: 4,
        river: 5,
        showdown: 5,
    }[state.stage] ?? 0;
    const revealed = state.showdownRevealed;
    const botCards = revealed
        ? state.botCards
        : [null, null];
    const table = tableFor(state.tableId);
    const positions = seatPositions(state);
    return {
        tableId: state.tableId,
        buyIn: state.buyIn,
        tableChips: state.tableChips,
        botChips: state.botChips,
        botId: state.botId,
        botName: state.botName,
        dealerIndex: state.dealerIndex,
        playerCards: state.playerCards,
        bots: [{
            id: state.botId,
            name: state.botName,
            cards: botCards,
            folded: state.botFolded,
            chips: state.botChips,
            roundBet: state.botRoundBet,
            totalInvested: state.botTotalInvested,
            lastAction: state.botLastAction || '',
            handEval: state.botHandEval,
        }],
        communityCards: state.communityCards.slice(0, revealCount),
        stage: state.stage,
        pot: state.pot,
        currentBet: state.currentBet,
        playerRoundBet: state.playerRoundBet,
        playerTotalInvested: state.playerTotalInvested,
        minRaiseSize: state.minRaiseSize,
        currentActorId: state.currentActorId,
        pendingActions: state.pendingActors,
        playerFolded: state.playerFolded,
        showdownRevealed: revealed,
        resultMessage: state.resultMessage,
        resultType: state.resultType,
        winnerIds: state.winnerIds,
        playerHandEval: state.playerHandEval,
        handHistory: state.handHistory,
        dealerSeatId: positions.dealer === 0 ? 'player' : state.botId,
        sbSeatId: positions.smallBlind === 0 ? 'player' : state.botId,
        bbSeatId: positions.bigBlind === 0 ? 'player' : state.botId,
        smallBlind: table.smallBlind,
        bigBlind: table.bigBlind,
    };
};
