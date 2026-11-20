import { isAllowedOrigin } from '../utils/origin.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const createCsrfProtection = ({ allowedOrigins, isProduction }) => (req, res, next) => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) return next();

    const origin = req.get('origin');
    if (!isAllowedOrigin(origin, allowedOrigins, isProduction)) {
        return res.status(403).json({ message: 'Запрос отклонён: источник не разрешён.' });
    }

    return next();
};
