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
    const { orderList } = body as { orderList: string[] };

    if (!orderList || orderList.length === 0) {
      return new Response("No items in order", { status: 400 });
    }

    // Get menu prices from DB
    const menuResult = await pool.query("SELECT name, price FROM drinks");
    const menuMap = new Map<string, number>();
    menuResult.rows.forEach((row) => menuMap.set(row.name, Number(row.price)));

    // Calculate subtotal
    let subtotal = 0;
    orderList.forEach((orderStr) => {
      const flavor = orderStr.split(",")[0].trim(); // first part is flavor
      subtotal += menuMap.get(flavor) ?? 6.0; // default price if not found
    });

    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const now = new Date();
    const orderID = `ORD${now.getTime() % 10000}`;
    const orderDetail = orderList.join(", ");
    const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

    const insertSQL = `
      INSERT INTO in_progress_orders
        (total, orderid, orderdetail, employeeid, employeetip, orderdate, ordertime)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await pool.query(insertSQL, [total, orderID, orderDetail, "", null, dateStr, timeStr]);

    return new Response(JSON.stringify({ message: "Order submitted", total, orderID }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response("Database error", { status: 500 });
  }
}