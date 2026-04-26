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

const BASE_DRINK_TIME = 2;      // minutes per drink
const TOPPING_TIME    = 0.5;    // minutes per topping

/**
 * GET /api/wait-time?orderid=ORD1234
 *
 * Returns the estimated wait in minutes for the given order.
 * Calculation: sum up prep time for every drink in orders placed
 * at or before this order (by date+time), including the order itself.
 *
 * Each drink: 2 min base + 0.5 min per topping.
 * Toppings are everything after the 4th comma-separated field in orderdetail.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderid = searchParams.get('orderid');

    if (!orderid) {
      return new Response(JSON.stringify({ error: 'Missing orderid parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the timestamp of the target order
    const targetResult = await pool.query(
      `SELECT orderdate, ordertime
       FROM in_progress_orders
       WHERE orderid = $1
       LIMIT 1`,
      [orderid]
    );

    if (targetResult.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { orderdate, ordertime } = targetResult.rows[0];

    // Get all drinks from orders placed at or before this order's timestamp
    const drinksResult = await pool.query(
      `SELECT orderdetail
       FROM in_progress_orders
       WHERE (orderdate < $1)
          OR (orderdate = $1 AND ordertime <= $2)`,
      [orderdate, ordertime]
    );

    // Calculate total prep time
    let totalMinutes = 0;
    for (const row of drinksResult.rows) {
      const parts = (row.orderdetail as string).split(',').map(s => s.trim());
      // Format: Name, Size, Sugar, Ice, [topping1, topping2, ...]
      const toppingCount = Math.max(0, parts.length - 4);
      totalMinutes += BASE_DRINK_TIME + toppingCount * TOPPING_TIME;
    }

    const estimatedMinutes = Math.ceil(totalMinutes);

    return new Response(JSON.stringify({ estimatedMinutes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Wait-time error:', err);
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}