import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import { createCsrfProtection } from './middleware/csrfProtection.js';
import { isAllowedOrigin } from './utils/origin.js';

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.CLIENT_ORIGINS?.trim()) {
    throw new Error('CLIENT_ORIGINS must be configured in production.');
}

const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
if (isProduction && allowedOrigins.length === 0) {
    throw new Error('CLIENT_ORIGINS must contain at least one production origin.');
}
const hasInvalidClientOrigin = allowedOrigins.some((origin) => {
    try {
        const parsedOrigin = new URL(origin);
        return parsedOrigin.origin !== origin || (isProduction && parsedOrigin.protocol !== 'https:');
    } catch {
        return true;
    }
});
if (hasInvalidClientOrigin) {
    throw new Error('CLIENT_ORIGINS must contain exact origins without paths; production origins must use HTTPS.');
}

const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
}

app.set('trust proxy', trustProxyHops);
app.use(createCsrfProtection({ allowedOrigins, isProduction }));
app.use(cors({
    origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin, allowedOrigins, isProduction)) {
            return callback(null, true);
        }

        return callback(null, false);
    },
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

app.get('/api/status', (req, res) => {
    res.json({ success: true, message: 'Node.js API сервер работает!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/games', gameRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Маршрут не найден.' });
});

app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});