import { withTransaction } from '../config/db.js';

const GAME_LABELS = {
    blackjack: 'Блэкджек',
    poker: 'Покер',
    roulette: 'Рулетка',
    dice: 'Кости',
    fortune: 'Колесо фортуны',
};

const GAME_KEYS = Object.keys(GAME_LABELS);

const STAT_FIELDS = {
    blackjack: {
        betsCount: 'bets_count',
        wins: 'wins',
        losses: 'losses',
        draws: 'draws',
        naturals21: 'naturals_21',
    },
    poker: {
        betsCount: 'bets_count',
        wins: 'wins',
        losses: 'losses',
        straights: 'straights',
        flushes: 'flushes',
        straightFlushes: 'straight_flushes',
        kare: 'four_of_a_kind',
        royalFlushes: 'royal_flushes',
    },
    roulette: {
        betsCount: 'bets_count',
        wins: 'wins',
        losses: 'losses',
        zeroHits: 'zero_hits',
        biggestWin: 'biggest_win_chips',
    },
    dice: {
        betsCount: 'bets_count',
        wins: 'wins',
        losses: 'losses',
        biggestWin: 'biggest_win_chips',
    },
    fortune: {
        betsCount: 'bets_count',
        wins: 'wins',
        losses: 'losses',
        draws: 'draws',
        biggestWin: 'biggest_win_chips',
    },
};

const DEFAULT_EQUIPPED = {
    cards: 'card-classic',
    tables: 'table-emerald',
    avatars: 'avatar-spade',
};

const assertPlayerNameAvailable = async (client, name, playerId = null) => {
    await client.query(
        'SELECT pg_advisory_xact_lock(hashtext(lower(btrim($1)))::bigint)',
        [name],
    );
    const result = await client.query(
        `SELECT EXISTS (
            SELECT 1
            FROM players
            WHERE lower(btrim(display_name)) = lower(btrim($1))
                AND ($2::uuid IS NULL OR id <> $2::uuid)
            UNION ALL
            SELECT 1
            FROM users
            WHERE username = lower(btrim($1))
                AND NOT EXISTS (
                    SELECT 1
                    FROM players
                    WHERE players.user_id = users.id AND players.id = $2::uuid
                )
        ) AS name_taken`,
        [name, playerId],
    );

    if (result.rows[0]?.name_taken) {
        const error = new Error('Это имя уже занято.');
        error.status = 409;
        throw error;
    }
};

const toSafeNumber = (value) => {
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : 0;
};

export const readProgress = async (client, playerId) => {
    const playerResult = await client.query(
        `SELECT display_name, level, xp, chips, daily_bonus_last_claimed_at
         FROM players WHERE id = $1`,
        [playerId],
    );
    const player = playerResult.rows[0];
    if (!player) {
        const error = new Error('Профиль игрока не найден.');
        error.status = 404;
        throw error;
    }

    const statsResult = await client.query(
        'SELECT * FROM player_game_stats WHERE player_id = $1',
        [playerId],
    );
    const historyResult = await client.query(
        `SELECT id, game, symbol, bet_chips, payout_chips, net_change_chips, outcome, label, played_at
         FROM game_history
         WHERE player_id = $1
         ORDER BY played_at DESC, id DESC
         LIMIT 30`,
        [playerId],
    );
    const inventoryResult = await client.query(
        'SELECT item_id FROM player_inventory WHERE player_id = $1',
        [playerId],
    );
    const equippedResult = await client.query(
        'SELECT category, item_id FROM player_equipped_items WHERE player_id = $1',
        [playerId],
    );
    const achievementsResult = await client.query(
        'SELECT achievement_id FROM player_achievements WHERE player_id = $1',
        [playerId],
    );

    const stats = Object.fromEntries(GAME_KEYS.map((game) => [
        game,
        Object.fromEntries(Object.keys(STAT_FIELDS[game]).map((field) => [field, 0])),
    ]));

    for (const row of statsResult.rows) {
        const gameStats = stats[row.game];
        if (!gameStats) continue;
        for (const [field, column] of Object.entries(STAT_FIELDS[row.game])) {
            gameStats[field] = toSafeNumber(row[column]);
        }
    }

    const equipped = { ...DEFAULT_EQUIPPED };
    for (const row of equippedResult.rows) {
        equipped[row.category] = row.item_id;
    }

    return {
        name: player.display_name,
        level: toSafeNumber(player.level),
        xp: toSafeNumber(player.xp),
        chips: toSafeNumber(player.chips),
        dailyBonusLastClaimedAt: player.daily_bonus_last_claimed_at
            ? new Date(player.daily_bonus_last_claimed_at).getTime()
            : 0,
        avatarId: equipped.avatars.replace('avatar-', ''),
        activeCardBack: equipped.cards,
        activeTableTheme: equipped.tables,
        stats,
        ownedItems: inventoryResult.rows.map((row) => row.item_id),
        equipped,
        claimedAchievementIds: achievementsResult.rows.map((row) => row.achievement_id),
        gameHistory: historyResult.rows.map((row) => {
            const playedAt = new Date(row.played_at);
            const isToday = playedAt.toDateString() === new Date().toDateString();
            return {
                id: row.id,
                game: GAME_LABELS[row.game],
                symbol: row.symbol,
                bet: toSafeNumber(row.bet_chips),
                payout: toSafeNumber(row.payout_chips),
                netChange: toSafeNumber(row.net_change_chips),
                outcome: row.outcome,
                label: row.label,
                time: `${isToday ? 'Сегодня' : playedAt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}, ${playedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
                playedAt: playedAt.toISOString(),
            };
        }),
    };
};

export const initializePlayerState = async (req, res, next) => {
    try {
        const state = await withTransaction(async (client) => {
            const playerResult = await client.query(
                `SELECT id, state_initialized_at
                 FROM players WHERE id = $1 FOR UPDATE`,
                [req.authSession.player.id],
            );
            const player = playerResult.rows[0];
            if (!player) {
                const error = new Error('Профиль игрока не найден.');
                error.status = 404;
                throw error;
            }

            if (!player.state_initialized_at) {
                await client.query(
                    'UPDATE players SET state_initialized_at = NOW() WHERE id = $1',
                    [player.id],
                );
            }

            return readProgress(client, player.id);
        });

        return res.json(state);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        return next(error);
    }
};

export const rejectPlayerStateUpdate = (req, res) => {
    return res.status(410).json({
        message: 'Сохранение игрового состояния с клиента отключено.',
    });
};

export const updatePlayerName = async (req, res, next) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 32) {
        return res.status(400).json({ message: 'Никнейм должен содержать от 1 до 32 символов.' });
    }

    try {
        const result = await withTransaction(async (client) => {
            const playerResult = await client.query(
                'SELECT id FROM players WHERE id = $1 FOR UPDATE',
                [req.authSession.player.id],
            );
            if (!playerResult.rows[0]) {
                return null;
            }

            await assertPlayerNameAvailable(client, name, req.authSession.player.id);
            return client.query(
                `UPDATE players
                 SET display_name = $2, updated_at = NOW()
                 WHERE id = $1
                 RETURNING display_name`,
                [req.authSession.player.id, name],
            );
        });
        if (!result) {
            return res.status(404).json({ message: 'Профиль игрока не найден.' });
        }
        const player = result.rows[0];
        if (!player) {
            return res.status(404).json({ message: 'Профиль игрока не найден.' });
        }

        return res.json({ name: player.display_name });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        return next(error);
    }
};
