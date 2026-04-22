export const runtime = 'nodejs';

import pool from '@/app/lib/db';

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
    const orderdate = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const ordertime = now.toTimeString().slice(0, 5);  // "HH:MM"



    for (const item of items) {
      // Format: "Name, Size, Sugar%, Ice, topping1, topping2"
      const detail = [item.name, item.size, item.sugar, item.ice, ...item.toppings].join(', ');
      await client.query(
        `INSERT INTO in_progress_orders (total, orderid, orderdetail, employeeid, employeetip, orderdate, ordertime)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [Math.round(total * 100), orderId, detail, null, null, orderdate, ordertime]
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
