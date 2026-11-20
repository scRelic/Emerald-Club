import { createGameOperationRunner, httpError } from './gameOperation.js';
import {
    awardUnlockedAchievements,
    insertChipTransaction,
    updateBalance,
} from './gameProgress.js';

export const createPlayerOperationsController = ({
    transaction,
    now = () => Date.now(),
} = {}) => {
    const runOperation = createGameOperationRunner({ transaction });

    const claimDailyBonus = (req, res, next) => runOperation(
        req,
        res,
        next,
        async (client, player) => {
            const cooldownMs = 24 * 60 * 60 * 1000;
            const lastClaimedAt = player.daily_bonus_last_claimed_at
                ? new Date(player.daily_bonus_last_claimed_at).getTime()
                : 0;
            const remainingMs = lastClaimedAt + cooldownMs - now();
            if (remainingMs > 0) {
                throw httpError(409, `Бонус будет доступен через ${Math.ceil(remainingMs / 1000)} секунд.`);
            }

            const claimedAt = now();
            const amount = 500;
            await updateBalance(client, player.id, amount);
            await client.query(
                'UPDATE players SET daily_bonus_last_claimed_at = $2 WHERE id = $1',
                [player.id, new Date(claimedAt)],
            );
            await insertChipTransaction(client, player.id, amount, 'daily_bonus');
            await awardUnlockedAchievements(client, player.id);
            return { amount, claimedAt };
        },
    );

    const shopAction = (req, res, next) => runOperation(
        req,
        res,
        next,
        async (client, player, body) => {
            const itemId = typeof body.itemId === 'string' ? body.itemId : '';
            const itemResult = await client.query(
                `SELECT id, category, price_chips, chips_amount
                 FROM shop_items
                 WHERE id = $1 AND is_active = TRUE`,
                [itemId],
            );
            const item = itemResult.rows[0];
            if (!item) throw httpError(404, 'Товар не найден.');

            const ownedResult = await client.query(
                'SELECT 1 FROM player_inventory WHERE player_id = $1 AND item_id = $2',
                [player.id, item.id],
            );
            const alreadyOwned = ownedResult.rowCount > 0;
            const price = Number(item.price_chips);
            let amountDelta = 0;
            let message;

            if (item.category === 'chips') {
                if (alreadyOwned) throw httpError(409, 'Этот пакет фишек уже был получен.');
                amountDelta = Number(item.chips_amount);
                if (!Number.isSafeInteger(amountDelta) || amountDelta <= 0) {
                    throw httpError(500, 'У пакета фишек некорректная настройка.');
                }
                message = `Начислено +${amountDelta} фишек!`;
                await client.query(
                    `INSERT INTO player_inventory (player_id, item_id, price_paid)
                     VALUES ($1, $2, 0)`,
                    [player.id, item.id],
                );
            } else {
                if (!alreadyOwned) {
                    if (Number(player.chips) < price) {
                        throw httpError(409, 'Недостаточно фишек на балансе.');
                    }
                    amountDelta = -price;
                    await client.query(
                        `INSERT INTO player_inventory (player_id, item_id, price_paid)
                         VALUES ($1, $2, $3)`,
                        [player.id, item.id, price],
                    );
                    if (price > 0) {
                        await updateBalance(client, player.id, -price);
                        await insertChipTransaction(client, player.id, -price, 'shop_purchase');
                    }
                    message = `Куплено и установлено: «${item.id}»`;
                } else {
                    message = `Экипировано: «${item.id}»`;
                }

                await client.query(
                    `INSERT INTO player_equipped_items (player_id, category, item_id)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (player_id, category) DO UPDATE SET item_id = EXCLUDED.item_id`,
                    [player.id, item.category, item.id],
                );
            }

            if (item.category === 'chips') {
                await updateBalance(client, player.id, amountDelta);
                await insertChipTransaction(client, player.id, amountDelta, 'shop_purchase');
            }
            await awardUnlockedAchievements(client, player.id);
            return { itemId: item.id, category: item.category, message };
        },
    );

    return { claimDailyBonus, shopAction };
};
