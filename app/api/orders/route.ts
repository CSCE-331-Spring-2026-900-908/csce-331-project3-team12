export const runtime = 'nodejs';

import pool from '@/app/lib/db';
import { computeInventoryUsage } from '@/app/lib/inventoryUsage';

interface OrderItem {
  name: string;
  size: string;
  sugar: string;
  ice: string;
  toppings: string[];
  price: number;
}

interface OrderPayload {
  items: OrderItem[];
  total: number;
}

// POST: Submit a new customer order into in_progress_orders
export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body: OrderPayload = await request.json();
    const { items, total } = body;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items in order' }), { status: 400 });
    }

    await client.query('BEGIN');
    const orderId = `ORD${Date.now().toString().slice(-6)}`;

    const now = new Date();

    // BOTH in UTC now
    const orderdate = now.toISOString().slice(0, 10);   // YYYY-MM-DD
    const ordertime = now.toISOString().slice(11, 19);  // HH:MM:SS



    const normalized = items.map(item => ({
      ...item,
      quantity: typeof (item as any).quantity === "number" && (item as any).quantity > 0
        ? (item as any).quantity
        : 1,
      toppings: Array.isArray(item.toppings) ? item.toppings : [],
    }));

    const detail = normalized.map(item =>
      `${item.name}, ${item.size}, ${item.sugar}, ${item.ice}, ${item.toppings.join(", ")} x${item.quantity}`
    ).join(' | ');

    await client.query(
      `INSERT INTO in_progress_orders (total, orderid, orderdetail, employeeid, employeetip, orderdate, ordertime)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [total, orderId, detail, null, null, orderdate, ordertime]
    );

    const usage = computeInventoryUsage(
      normalized.map(item => ({
        name: item.name,
        size: item.size,
        toppings: item.toppings,
        quantity: item.quantity, // real quantity
      }))
    );

    for (const [ingredient, amount] of Object.entries(usage)) {
      await client.query(
        `UPDATE inventory
         SET quantity = GREATEST(quantity - $1, 0)
         WHERE ingredientname = $2`,
        [amount, ingredient]
      );
    }

    await client.query('COMMIT');

    return new Response(JSON.stringify({ success: true, orderId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Orders POST error:', err);
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
  } finally {
    client.release();
  }
}
