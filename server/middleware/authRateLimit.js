import { rateLimit } from 'express-rate-limit';

export const createAuthRateLimiter = ({ windowMs, limit, message, skipSuccessfulRequests = false }) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        skipSuccessfulRequests,
        message: { message },
    });

export const loginAttemptLimiter = createAuthRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Слишком много попыток входа. Попробуйте позже.',
    skipSuccessfulRequests: true,
});

export const registrationAttemptLimiter = createAuthRateLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: 'Слишком много попыток регистрации. Попробуйте позже.',
});
