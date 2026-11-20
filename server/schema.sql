BEGIN;

CREATE TABLE IF NOT EXISTS shop_items (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('cards', 'tables', 'avatars', 'chips')),
    title TEXT NOT NULL,
    price_chips BIGINT NOT NULL DEFAULT 0 CHECK (price_chips >= 0),
    chips_amount BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (id, category),
    CHECK (
        (category = 'chips' AND chips_amount IS NOT NULL AND chips_amount > 0)
        OR
        (category <> 'chips' AND chips_amount IS NULL)
    )
);

INSERT INTO shop_items (id, category, title, price_chips, chips_amount)
VALUES
    ('card-classic', 'cards', 'Классический Изумруд', 0, NULL),
    ('card-royal-gold', 'cards', 'Императорское Золото', 2500, NULL),
    ('card-emerald-silk', 'cards', 'Изумрудный Шёлк', 1800, NULL),
    ('card-sapphire', 'cards', 'Сапфировая Ночь', 2200, NULL),
    ('card-ruby', 'cards', 'Рубиновый Вальс', 2400, NULL),
    ('card-amethyst', 'cards', 'Аметистовый Бархат', 2800, NULL),
    ('card-ivory', 'cards', 'Слоновая Кость', 3000, NULL),
    ('table-emerald', 'tables', 'Классический Изумруд', 0, NULL),
    ('table-burgundy', 'tables', 'Королевский Бордо', 4000, NULL),
    ('table-midnight', 'tables', 'Полночный Сапфир', 3500, NULL),
    ('table-sapphire', 'tables', 'Сапфировый Зал', 4500, NULL),
    ('table-royal-purple', 'tables', 'Королевский Аметист', 5500, NULL),
    ('avatar-spade', 'avatars', 'Туз Пик', 0, NULL),
    ('avatar-diamond', 'avatars', 'Бриллиантовый Клуб', 5000, NULL),
    ('avatar-crown', 'avatars', 'Золотая Корона', 4500, NULL),
    ('avatar-knight', 'avatars', 'Рыцарь Клуба', 4000, NULL),
    ('chips-starter', 'chips', 'Стек Новичка', 0, 2500),
    ('chips-highroller', 'chips', 'Кейс Хайроллера', 0, 10000)
ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    title = EXCLUDED.title,
    price_chips = EXCLUDED.price_chips,
    chips_amount = EXCLUDED.chips_amount,
    is_active = TRUE;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE CHECK (char_length(username) BETWEEN 3 AND 32),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash BYTEA PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
    ON auth_sessions (user_id);

CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(32) NOT NULL DEFAULT 'Player',
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
    chips BIGINT NOT NULL DEFAULT 5000 CHECK (chips >= 0),
    daily_bonus_last_claimed_at TIMESTAMPTZ,
    state_initialized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE players
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE players
    ADD COLUMN IF NOT EXISTS state_initialized_at TIMESTAMPTZ;

ALTER TABLE players
    ALTER COLUMN xp SET DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS players_user_id_idx
    ON players (user_id)
    WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS player_inventory (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES shop_items(id),
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    price_paid BIGINT NOT NULL DEFAULT 0 CHECK (price_paid >= 0),
    PRIMARY KEY (player_id, item_id)
);

CREATE TABLE IF NOT EXISTS player_equipped_items (
    player_id UUID NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cards', 'tables', 'avatars')),
    item_id TEXT NOT NULL,
    PRIMARY KEY (player_id, category),
    FOREIGN KEY (player_id, item_id)
        REFERENCES player_inventory(player_id, item_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id, category)
        REFERENCES shop_items(id, category)
);

CREATE TABLE IF NOT EXISTS player_game_stats (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game TEXT NOT NULL CHECK (game IN ('blackjack', 'poker', 'roulette', 'dice', 'fortune')),
    bets_count BIGINT NOT NULL DEFAULT 0 CHECK (bets_count >= 0),
    wins BIGINT NOT NULL DEFAULT 0 CHECK (wins >= 0),
    losses BIGINT NOT NULL DEFAULT 0 CHECK (losses >= 0),
    draws BIGINT NOT NULL DEFAULT 0 CHECK (draws >= 0),
    naturals_21 BIGINT NOT NULL DEFAULT 0 CHECK (naturals_21 >= 0),
    straights BIGINT NOT NULL DEFAULT 0 CHECK (straights >= 0),
    flushes BIGINT NOT NULL DEFAULT 0 CHECK (flushes >= 0),
    straight_flushes BIGINT NOT NULL DEFAULT 0 CHECK (straight_flushes >= 0),
    four_of_a_kind BIGINT NOT NULL DEFAULT 0 CHECK (four_of_a_kind >= 0),
    royal_flushes BIGINT NOT NULL DEFAULT 0 CHECK (royal_flushes >= 0),
    zero_hits BIGINT NOT NULL DEFAULT 0 CHECK (zero_hits >= 0),
    biggest_win_chips BIGINT NOT NULL DEFAULT 0 CHECK (biggest_win_chips >= 0),
    PRIMARY KEY (player_id, game)
);

CREATE TABLE IF NOT EXISTS game_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game TEXT NOT NULL CHECK (game IN ('blackjack', 'poker', 'roulette', 'dice', 'fortune')),
    symbol TEXT,
    bet_chips BIGINT NOT NULL CHECK (bet_chips >= 0),
    payout_chips BIGINT NOT NULL CHECK (payout_chips >= 0),
    net_change_chips BIGINT NOT NULL,
    outcome TEXT NOT NULL,
    label TEXT NOT NULL,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_game_sessions (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game TEXT NOT NULL CHECK (game IN ('blackjack', 'poker')),
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, game)
);

CREATE TABLE IF NOT EXISTS player_operation_requests (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, request_id)
);

CREATE TABLE IF NOT EXISTS achievement_catalog (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_chips BIGINT NOT NULL CHECK (reward_chips >= 0),
    target BIGINT NOT NULL CHECK (target > 0),
    progress_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO achievement_catalog (id, title, description, reward_chips, target, progress_key)
VALUES
    ('natural-blackjack', 'Натуральный 21', 'Соберите чистый Блэкджек с раздачи', 250, 1, 'blackjack.naturals21'),
    ('blackjack-five-wins', 'Пять побед в блэкджеке', 'Победите дилера пять раз', 600, 5, 'blackjack.wins'),
    ('poker-first-win', 'Первая победа', 'Выиграйте первую раздачу в покер', 300, 1, 'poker.wins'),
    ('roulette-zero', 'Зелёный сектор', 'Угадайте зеро в европейской рулетке', 500, 1, 'roulette.zeroHits'),
    ('club-regular', 'Постоянный гость', 'Сыграйте 10 партий в клубе', 750, 10, 'totalGames'),
    ('straight-flush', 'Король комбинаций', 'Соберите стрит-флеш в Техасском Холдеме', 1500, 1, 'poker.straightFlushes'),
    ('dice-five-wins', 'Мастер костей', 'Выиграйте пять бросков в игре «Кости»', 750, 5, 'dice.wins'),
    ('high-roller', 'Хайроллер клуба', 'Накопите на балансе 15 000 фишек', 1000, 15000, 'chips')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    reward_chips = EXCLUDED.reward_chips,
    target = EXCLUDED.target,
    progress_key = EXCLUDED.progress_key,
    is_active = TRUE;

CREATE TABLE IF NOT EXISTS player_achievements (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES achievement_catalog(id),
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reward_chips BIGINT NOT NULL CHECK (reward_chips >= 0),
    PRIMARY KEY (player_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS chip_transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    amount_delta BIGINT NOT NULL CHECK (amount_delta <> 0),
    reason TEXT NOT NULL CHECK (reason IN (
        'initial_balance',
        'game_bet',
        'game_payout',
        'shop_purchase',
        'daily_bonus',
        'achievement_reward',
        'manual_adjustment',
        'state_sync'
    )),
    game_history_id BIGINT REFERENCES game_history(id),
    shop_item_id TEXT REFERENCES shop_items(id),
    achievement_id TEXT REFERENCES achievement_catalog(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chip_transactions
    DROP CONSTRAINT IF EXISTS chip_transactions_reason_check;

ALTER TABLE chip_transactions
    ADD CONSTRAINT chip_transactions_reason_check
    CHECK (reason IN (
        'initial_balance',
        'game_bet',
        'game_payout',
        'shop_purchase',
        'daily_bonus',
        'achievement_reward',
        'manual_adjustment',
        'state_sync'
    ));

CREATE INDEX IF NOT EXISTS game_history_player_played_idx
    ON game_history (player_id, played_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS game_history_player_game_idx
    ON game_history (player_id, game, played_at DESC);

CREATE INDEX IF NOT EXISTS chip_transactions_player_created_idx
    ON chip_transactions (player_id, created_at DESC, id DESC);

CREATE OR REPLACE VIEW player_leaderboard AS
SELECT
    id AS player_id,
    display_name,
    level,
    xp,
    ROW_NUMBER() OVER (ORDER BY level DESC, xp DESC, created_at ASC) AS rank
FROM players;

COMMIT;
