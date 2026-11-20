import { query } from '../config/db.js';
import { cookieOptions, hashSessionToken, readSessionToken, SESSION_COOKIE } from '../utils/session.js';

export const requireAuth = async (req, res, next) => {
    const token = readSessionToken(req);
    if (!token) {
        return res.status(401).json({ message: 'Требуется вход в аккаунт.' });
    }

    try {
        const result = await query(
            `SELECT u.id AS user_id, u.username, p.id AS player_id,
                    p.display_name, p.level, p.xp, p.chips
             FROM auth_sessions s
             JOIN users u ON u.id = s.user_id
             JOIN players p ON p.user_id = u.id
             WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
            [hashSessionToken(token)],
        );
        const account = result.rows[0];

        if (!account) {
            res.clearCookie(SESSION_COOKIE, cookieOptions());
            return res.status(401).json({ message: 'Сессия истекла. Войдите снова.' });
        }

        req.authSession = {
            user: { id: account.user_id, username: account.username },
            player: {
                id: account.player_id,
                display_name: account.display_name,
                level: account.level,
                xp: account.xp,
                chips: account.chips,
            },
        };
        return next();
    } catch (error) {
        return next(error);
    }
};
