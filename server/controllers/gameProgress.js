import { readProgress } from './playerController.js';
import { httpError } from './gameOperation.js';

const XP_REWARDS = {
    blackjack: { blackjack: 60, win: 35, draw: 15, loss: 10 },
    poker: { win: 60, draw: 25, loss: 10 },
    dice: { win: 35, loss: 10 },
    fortune: { win: 35, draw: 15, loss: 10 },
    roulette: { win: 40, draw: 20, loss: 10 },
};

const STAT_COLUMNS = [
    'bets_count',
    'wins',
    'losses',
    'draws',
    'naturals_21',
    'straights',
    'flushes',
    'straight_flushes',
    'four_of_a_kind',
    'royal_flushes',
    'zero_hits',
];

export const requireBet = (bet, allowedBets) => {
    if (!allowedBets.includes(bet)) {
        throw httpError(400, 'Выберите один из доступных номиналов фишек.');
    }
};

export const insertChipTransaction = (client, playerId, amountDelta, reason, gameHistoryId = null) => (
    client.query(
        `INSERT INTO chip_transactions (player_id, amount_delta, reason, game_history_id)
         VALUES ($1, $2, $3, $4)`,
        [playerId, amountDelta, reason, gameHistoryId],
    )
);

export const updateBalance = (client, playerId, amountDelta) => client.query(
    `UPDATE players
     SET chips = chips + $2, updated_at = NOW()
     WHERE id = $1 AND chips + $2 >= 0
     RETURNING chips`,
    [playerId, amountDelta],
);

const addExperience = async (client, playerId, amount) => {
    const result = await client.query(
        'SELECT level, xp FROM players WHERE id = $1 FOR UPDATE',
        [playerId],
    );
    let level = Number(result.rows[0].level);
    let xp = Number(result.rows[0].xp) + amount;
    while (xp >= level * 100) {
        xp -= level * 100;
        level++;
    }
    await client.query(
        'UPDATE players SET level = $2, xp = $3, updated_at = NOW() WHERE id = $1',
        [playerId, level, xp],
    );
};

const updateGameStats = async (client, playerId, game, outcome, details = {}) => {
    const values = Object.fromEntries(STAT_COLUMNS.map((column) => [column, 0]));
    values.bets_count = 1;
    if (outcome === 'win' || outcome === 'blackjack') values.wins = 1;
    else if (outcome === 'loss') values.losses = 1;
    else if (outcome === 'draw') values.draws = 1;

    for (const column of [
        'naturals_21',
        'straights',
        'flushes',
        'straight_flushes',
        'four_of_a_kind',
        'royal_flushes',
        'zero_hits',
    ]) {
        if (details[column]) values[column] = 1;
    }

    const columns = STAT_COLUMNS.join(', ');
    const placeholders = STAT_COLUMNS.map((_, index) => `$${index + 3}`).join(', ');
    const updates = STAT_COLUMNS.map(
        (column) => `${column} = player_game_stats.${column} + EXCLUDED.${column}`,
    ).join(', ');
    await client.query(
        `INSERT INTO player_game_stats (player_id, game, ${columns})
         VALUES ($1, $2, ${placeholders})
         ON CONFLICT (player_id, game) DO UPDATE SET ${updates}`,
        [playerId, game, ...STAT_COLUMNS.map((column) => values[column])],
    );

    if (Number.isSafeInteger(details.biggestWin) && details.biggestWin > 0) {
        await client.query(
            `UPDATE player_game_stats
             SET biggest_win_chips = GREATEST(biggest_win_chips, $3)
             WHERE player_id = $1 AND game = $2`,
            [playerId, game, details.biggestWin],
        );
    }
};

const recordGameHistory = async (client, playerId, {
    game,
    symbol,
    bet,
    payout,
    outcome,
    label,
}) => {
    const result = await client.query(
        `INSERT INTO game_history
            (player_id, game, symbol, bet_chips, payout_chips, net_change_chips, outcome, label)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [playerId, game, symbol, bet, payout, payout - bet, outcome, label],
    );
    return result.rows[0].id;
};

const getAchievementProgress = (state, progressKey) => {
    if (progressKey === 'chips') return state.chips;
    if (progressKey === 'totalGames') {
        return Object.values(state.stats).reduce((total, game) => total + game.betsCount, 0);
    }

    const [game, field] = progressKey.split('.');
    return state.stats[game]?.[field] ?? 0;
};

export const awardUnlockedAchievements = async (client, playerId) => {
    const catalog = await client.query(
        `SELECT id, reward_chips, target, progress_key
         FROM achievement_catalog
         WHERE is_active = TRUE`,
    );
    const claimed = new Set((await client.query(
        'SELECT achievement_id FROM player_achievements WHERE player_id = $1',
        [playerId],
    )).rows.map((row) => row.achievement_id));

    let state = await readProgress(client, playerId);
    for (const achievement of catalog.rows) {
        if (
            claimed.has(achievement.id) ||
            getAchievementProgress(state, achievement.progress_key) < Number(achievement.target)
        ) continue;

        const reward = Number(achievement.reward_chips);
        const inserted = await client.query(
            `INSERT INTO player_achievements (player_id, achievement_id, reward_chips)
             VALUES ($1, $2, $3)
             ON CONFLICT (player_id, achievement_id) DO NOTHING
             RETURNING achievement_id`,
            [playerId, achievement.id, reward],
        );
        if (!inserted.rowCount) continue;

        await updateBalance(client, playerId, reward);
        await insertChipTransaction(client, playerId, reward, 'achievement_reward');
        claimed.add(achievement.id);
        state.chips += reward;
        state.claimedAchievementIds.push(achievement.id);
    }
};

export const finishRound = async (client, playerId, game, result, options = {}) => {
    const historyId = await recordGameHistory(client, playerId, {
        game,
        symbol: options.symbol,
        bet: result.bet,
        payout: result.payout,
        outcome: result.outcome,
        label: options.label(result),
    });

    await updateGameStats(client, playerId, game, result.outcome, options.stats?.(result));
    await addExperience(client, playerId, XP_REWARDS[game][result.outcome]);
    if (result.payout > 0) {
        await updateBalance(client, playerId, result.payout);
        await insertChipTransaction(client, playerId, result.payout, 'game_payout', historyId);
    }
    await awardUnlockedAchievements(client, playerId);
    return historyId;
};

export const finishPokerRound = async (client, playerId, result) => {
    const combinationColumns = {
        straights: 'straights',
        flushes: 'flushes',
        straightFlushes: 'straight_flushes',
        kare: 'four_of_a_kind',
        royalFlushes: 'royal_flushes',
    };
    const stats = {};
    const column = combinationColumns[result.combinationStat];
    if (column) stats[column] = true;

    await recordGameHistory(client, playerId, {
        game: 'poker',
        symbol: '♥',
        bet: result.bet,
        payout: result.payout,
        outcome: result.outcome,
        label: result.label,
    });
    await updateGameStats(client, playerId, 'poker', result.outcome, stats);
    await addExperience(client, playerId, XP_REWARDS.poker[result.outcome]);
    await awardUnlockedAchievements(client, playerId);
};
