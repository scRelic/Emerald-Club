import express from 'express';
import { getSession, login, logout, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { loginAttemptLimiter, registrationAttemptLimiter } from '../middleware/authRateLimit.js';

const router = express.Router();

router.post('/register', registrationAttemptLimiter, register);
router.post('/login', loginAttemptLimiter, login);
router.get('/me', requireAuth, getSession);
router.post('/logout', logout);

export default router;
