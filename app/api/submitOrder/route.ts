// app/api/submitOrder/route.ts
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderList } = body as { orderList: any[] };

    if (!orderList || orderList.length === 0) {
      return new Response("No items in order", { status: 400 });
    }

    // ✅ Calculate subtotal using actual prices + quantity
    let subtotal = 0;
    orderList.forEach((item) => {
      subtotal += item.price * item.quantity;
    });

    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const now = new Date();
    const orderID = `ORD${Date.now().toString().slice(-6)}`;

    const orderDetail = orderList.map(item =>
      `${item.name}, ${item.size}, ${item.sugar}, ${item.ice}, ${item.toppings.join(", ")} x${item.quantity}`
    ).join(" | ");

    const dateStr = now.toISOString().slice(0, 10);   // YYYY-MM-DD (UTC)
    const timeStr = now.toISOString().slice(11, 16);  // HH:MM (UTC)

    const insertSQL = `
      INSERT INTO in_progress_orders
        (total, orderid, orderdetail, employeeid, employeetip, orderdate, ordertime)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await pool.query(insertSQL, [
      total,
      orderID,
      orderDetail,
      null,
      null,
      dateStr,
      timeStr
    ]);

    return new Response(JSON.stringify({ message: "Order submitted", total, orderID }), {
      status: 200,
    });

  } catch (err) {
    console.error("SubmitOrder ERROR:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}