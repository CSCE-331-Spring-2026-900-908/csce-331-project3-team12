import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false, // some managed DBs require this
  },
});

export async function GET() {
  try {
    const result = await pool.query('SELECT name, price FROM drinks');
    return new Response(JSON.stringify(result.rows), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('Database error', { status: 500 });
  }
}