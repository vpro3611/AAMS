import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    // host: process.env.DB_HOST,
    // port: Number(process.env.DB_PORT),
    // database: process.env.DB_NAME,
});

async function main() {
    const res = await pool.query('SELECT NOW()');
    console.log(res.rows[0]);
}

main().catch((err) => {
    console.error('Error in main function:', err);
    process.exit(1);
});
