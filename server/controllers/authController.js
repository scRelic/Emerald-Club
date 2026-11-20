import { randomBytes } from 'node:crypto';
import { query, withTransaction } from '../config/db.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
    cookieOptions,
    hashSessionToken,
    readSessionToken,
    SESSION_COOKIE,
} from '../utils/session.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const USERNAME_PATTERN = /^[\p{L}\p{N}_-]{3,32}$/u;

const normalizeUsername = (username) => username.trim().toLowerCase();

const assertUsernameAvailable = async (client, username) => {
    await client.query(
        'SELECT pg_advisory_xact_lock(hashtext(lower(btrim($1)))::bigint)',
        [username],
    );
    const result = await client.query(
        `SELECT EXISTS (
            SELECT 1 FROM users WHERE username = lower(btrim($1))
            UNION ALL
            SELECT 1 FROM players WHERE lower(btrim(display_name)) = lower(btrim($1))
        ) AS name_taken`,
        [username],
    );

    if (result.rows[0]?.name_taken) {
        const error = new Error('Это имя уже занято.');
        error.status = 409;
        throw error;
    }
};

const validateCredentials = (body) => {
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!USERNAME_PATTERN.test(username)) {
        return { error: 'Имя должно содержать 3–32 буквы, цифры, дефис или подчёркивание.' };
    }

    if (password.length < 8 || password.length > 128) {
        return { error: 'Пароль должен содержать от 8 до 128 символов.' };
    }

    return { username, normalizedUsername: normalizeUsername(username), password };
};

const createSession = async (client, userId) => {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await client.query(
        'INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
        [hashSessionToken(token), userId, expiresAt],
    );

    return token;
};

const setSessionCookie = (res, token) => {
    res.cookie(SESSION_COOKIE, token, {
        ...cookieOptions(),
        maxAge: SESSION_TTL_MS,
    });
};

const publicSession = (user, player) => ({
    user: {
        id: user.id,
        username: user.username,
    },
    player: {
        id: player.id,
        displayName: player.display_name,
        level: Number(player.level),
        xp: Number(player.xp),
        chips: Number(player.chips),
    },
});

export const register = async (req, res, next) => {
    const credentials = validateCredentials(req.body);
    if (credentials.error) {
        return res.status(400).json({ message: credentials.error });
    }

    try {
        const passwordHash = await hashPassword(credentials.password);
        const session = await withTransaction(async (client) => {
            await assertUsernameAvailable(client, credentials.normalizedUsername);
            const userResult = await client.query(
                'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
                [credentials.normalizedUsername, passwordHash],
            );
            const user = userResult.rows[0];

            const playerResult = await client.query(
                'INSERT INTO players (user_id, display_name) VALUES ($1, $2) RETURNING id, display_name, level, xp, chips',
                [user.id, credentials.username],
            );
            const player = playerResult.rows[0];

            await client.query(
                `INSERT INTO player_inventory (player_id, item_id, price_paid)
                 VALUES
                    ($1, 'card-classic', 0),
                    ($1, 'table-emerald', 0),
                    ($1, 'avatar-spade', 0)`,
                [player.id],
            );

            await client.query(
                `INSERT INTO player_equipped_items (player_id, category, item_id)
                 VALUES
                    ($1, 'cards', 'card-classic'),
                    ($1, 'tables', 'table-emerald'),
                    ($1, 'avatars', 'avatar-spade')`,
                [player.id],
            );

            await client.query(
                `INSERT INTO player_game_stats (player_id, game)
                 VALUES
                    ($1, 'blackjack'),
                    ($1, 'poker'),
                    ($1, 'roulette'),
                    ($1, 'dice'),
                    ($1, 'fortune')`,
                [player.id],
            );

            await client.query(
                `INSERT INTO chip_transactions (player_id, amount_delta, reason)
                 VALUES ($1, $2, 'initial_balance')`,
                [player.id, player.chips],
            );

            const token = await createSession(client, user.id);
            return { user, player, token };
        });

        setSessionCookie(res, session.token);
        return res.status(201).json(publicSession(session.user, session.player));
    } catch (error) {
        if (error.status === 409) {
            return res.status(409).json({ message: error.message });
        }
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Это имя уже занято.' });
        }
        return next(error);
    }
};

export const login = async (req, res, next) => {
    const credentials = validateCredentials(req.body);
    if (credentials.error) {
        return res.status(400).json({ message: credentials.error });
    }

    try {
        const result = await query(
            `SELECT u.id, u.username, u.password_hash, p.id AS player_id,
                    p.display_name, p.level, p.xp, p.chips
             FROM users u
             JOIN players p ON p.user_id = u.id
             WHERE u.username = $1`,
            [credentials.normalizedUsername],
        );
        const account = result.rows[0];

        if (!account || !(await verifyPassword(credentials.password, account.password_hash))) {
            return res.status(401).json({ message: 'Неверное имя или пароль.' });
        }

        const token = randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
        await query(
            'INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
            [hashSessionToken(token), account.id, expiresAt],
        );

        setSessionCookie(res, token);
        return res.json(publicSession(
            { id: account.id, username: account.username },
            {
                id: account.player_id,
                display_name: account.display_name,
                level: account.level,
                xp: account.xp,
                chips: account.chips,
            },
        ));
    } catch (error) {
        return next(error);
    }
};

export const getSession = (req, res) => {
    return res.json(publicSession(req.authSession.user, req.authSession.player));
};

export const logout = async (req, res, next) => {
    const token = readSessionToken(req);

    try {
        if (token) {
            await query('DELETE FROM auth_sessions WHERE token_hash = $1', [hashSessionToken(token)]);
        }

        res.clearCookie(SESSION_COOKIE, cookieOptions());
        return res.json({ success: true });
    } catch (error) {
        return next(error);
    }
};
