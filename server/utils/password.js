import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const SCRYPT_PARAMETERS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

export const hashPassword = async (password) => {
    const salt = randomBytes(16);
    const key = await scryptAsync(password, salt, KEY_LENGTH, SCRYPT_PARAMETERS);

    return `scrypt$${SCRYPT_PARAMETERS.N}$${SCRYPT_PARAMETERS.r}$${SCRYPT_PARAMETERS.p}$${salt.toString('hex')}$${key.toString('hex')}`;
};

export const verifyPassword = async (password, encodedHash) => {
    if (typeof encodedHash !== 'string') return false;

    const [algorithm, n, r, p, saltHex, keyHex] = encodedHash.split('$');
    if (
        algorithm !== 'scrypt' ||
        Number(n) !== SCRYPT_PARAMETERS.N ||
        Number(r) !== SCRYPT_PARAMETERS.r ||
        Number(p) !== SCRYPT_PARAMETERS.p ||
        !/^[0-9a-f]{32}$/i.test(saltHex || '') ||
        !/^[0-9a-f]{128}$/i.test(keyHex || '')
    ) {
        return false;
    }

    const expectedKey = Buffer.from(keyHex, 'hex');
    const actualKey = await scryptAsync(
        password,
        Buffer.from(saltHex, 'hex'),
        KEY_LENGTH,
        SCRYPT_PARAMETERS,
    );

    return timingSafeEqual(expectedKey, actualKey);
};
