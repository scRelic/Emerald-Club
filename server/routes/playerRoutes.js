import express from 'express';
import {
    initializePlayerState,
    rejectPlayerStateUpdate,
    updatePlayerName,
} from '../controllers/playerController.js';
import { claimDailyBonus, shopAction } from '../controllers/gameController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/state', requireAuth, initializePlayerState);
router.put('/state', requireAuth, rejectPlayerStateUpdate);
router.put('/name', requireAuth, updatePlayerName);
router.post('/daily-bonus', requireAuth, claimDailyBonus);
router.post('/shop', requireAuth, shopAction);

export default router;
