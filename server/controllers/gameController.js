import { createBlackjackController } from './blackjackController.js';
import { createPlayerOperationsController } from './playerOperationsController.js';
import { createPokerController } from './pokerController.js';
import { createSimpleGamesController } from './simpleGamesController.js';

export { createBlackjackController } from './blackjackController.js';
export { createPlayerOperationsController } from './playerOperationsController.js';
export { createPokerController } from './pokerController.js';
export { createSimpleGamesController } from './simpleGamesController.js';

export const createGameController = (options = {}) => ({
    ...createSimpleGamesController(options),
    ...createBlackjackController(options),
    ...createPokerController(options),
    ...createPlayerOperationsController(options),
});

const controller = createGameController();

export const {
    diceRound,
    fortuneRound,
    rouletteRound,
    startBlackjack,
    blackjackAction,
    resumeBlackjack,
    sitAtPokerTable,
    pokerAction,
    pokerNextHand,
    pokerLeaveTable,
    resumePokerTable,
    claimDailyBonus,
    shopAction,
} = controller;
