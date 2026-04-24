export const runtime = 'nodejs';

import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false },
});


// GET: Fetch the 6 oldest in-progress orders
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT total, orderid, orderdetail, employeeid, employeetip, orderdate, ordertime
       FROM in_progress_orders
       ORDER BY orderdate ASC, ordertime ASC
       LIMIT 6`
    );
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Kitchen GET error:', err);
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
  }
}

// POST: Mark an order as complete — move it from in_progress_orders to completed_orders
export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const { orderid } = await request.json();
    if (!orderid) {
      return new Response(JSON.stringify({ error: 'Missing orderid' }), { status: 400 });
    }

    await client.query('BEGIN');

    // Copy all rows for this order into completed_orders
    await client.query(
      `INSERT INTO completed_orders (total, orderid, orderdetail, employeeid, employeetip, orderdate, ordertime)
       SELECT total, orderid, orderdetail, employeeid, employeetip, orderdate, ordertime
       FROM in_progress_orders
       WHERE orderid = $1`,
      [orderid]
    );

    // Remove from in_progress_orders
    await client.query(
      `DELETE FROM in_progress_orders WHERE orderid = $1`,
      [orderid]
    );

    await client.query('COMMIT');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Kitchen POST error:', err);
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
  } finally {
    client.release();
  }
}
