import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const query = (text, params) => pool.query(text, params);

export const withTransaction = async (callback) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query('BEGIN');
        transactionStarted = true;
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                throw new AggregateError(
                    [error, rollbackError],
                    'Database transaction failed and rollback could not complete.',
                );
            }
        }

        throw error;
    } finally {
        client.release();
    }
};