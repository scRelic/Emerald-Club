import express from 'express';
import {
    blackjackAction,
    diceRound,
    fortuneRound,
    pokerAction,
    pokerLeaveTable,
    pokerNextHand,
    resumePokerTable,
    resumeBlackjack,
    rouletteRound,
    sitAtPokerTable,
    startBlackjack,
} from '../controllers/gameController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.use(requireAuth);
router.post('/dice/round', diceRound);
router.post('/fortune/round', fortuneRound);
router.post('/roulette/round', rouletteRound);
router.get('/blackjack/session', resumeBlackjack);
router.post('/blackjack/start', startBlackjack);
router.post('/blackjack/action', blackjackAction);
router.get('/poker/session', resumePokerTable);
router.post('/poker/sit', sitAtPokerTable);
router.post('/poker/action', pokerAction);
router.post('/poker/next-hand', pokerNextHand);
router.post('/poker/leave', pokerLeaveTable);

export default router;
