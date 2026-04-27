export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port:     Number(process.env.DB_PORT),
  ssl:      { rejectUnauthorized: false },
});

function parseDateTime(orderdate: string, ordertime: string) {
  const paddedTime = ordertime.padStart(5, '0'); // "7:41" -> "07:41"

  if (orderdate.includes('-')) {
    return new Date(`${orderdate}T${paddedTime}`);
  } else {
    const [month, day, year] = orderdate.split('/');
    return new Date(`${year}-${month}-${day}T${paddedTime}`);
  }
}

// GET /manager/api/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns KPIs, daily sales, product usage, and hourly sales in one call.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || '2000-01-01';
  const to   = searchParams.get('to')   || new Date().toISOString().split('T')[0];

  const client = await pool.connect();
  try {
    // KPIs — single query for revenue, order count, and items sold
    const kpiRes = await client.query(
      `SELECT
         COALESCE(SUM(total), 0) AS total_revenue,
         COUNT(*) AS total_orders,
         COALESCE(SUM(array_length(regexp_split_to_array(orderdetail, ',\\s*'), 1)), 0) AS items_sold
       FROM completed_orders
       WHERE orderdate::text BETWEEN $1 AND $2`,
      [from, to]
    );
    const { total_revenue, total_orders, items_sold } = kpiRes.rows[0];
    const rev    = parseFloat(total_revenue);
    const orders = parseInt(total_orders);
    const items  = parseInt(items_sold);

    // Daily sales
    const dailyRes = await client.query(
      `SELECT orderdate, COALESCE(SUM(total), 0) AS revenue
       FROM completed_orders
       WHERE orderdate::text BETWEEN $1 AND $2
       GROUP BY orderdate
       ORDER BY orderdate`,
      [from, to]
    );

    // Product usage
    const usageRes = await client.query(
      `SELECT unnest(regexp_split_to_array(orderdetail, ',\\s*')) AS item, COUNT(*) AS usage
       FROM completed_orders
       WHERE orderdate::text BETWEEN $1 AND $2
       GROUP BY item
       ORDER BY usage DESC`,
      [from, to]
    );

    // Hourly sales (X-Report) — fixed for production
    const hourlyRes = await client.query(
      `SELECT 
        EXTRACT(HOUR FROM ordertime::time) AS hour,
        COUNT(*) AS total_orders,
        COALESCE(SUM(total), 0) AS revenue
      FROM completed_orders
      WHERE orderdate::text BETWEEN $1 AND $2
      GROUP BY hour
      ORDER BY hour`,
      [from, to]
    );

    // In-progress orders (for Recent Orders section)
    const inProgressRes = await client.query(
      `SELECT orderid, total, orderdetail, orderdate, ordertime
      FROM in_progress_orders`
    );

    const recentOrders = inProgressRes.rows
    .map(r => {
      const ts = parseDateTime(r.orderdate, r.ordertime).getTime();
      return {
        id: r.orderid,
        total: parseFloat(r.total),
        details: r.orderdetail,
        date: r.orderdate,
        time: r.ordertime,
        timestamp: ts,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10); // latest 10 orders

    return NextResponse.json({
      kpis: {
        totalRevenue: rev,
        totalOrders:  orders,
        avgOrder:     orders > 0 ? rev / orders : 0,
        itemsSold:    items,
      },
      dailySales: dailyRes.rows.map(r => ({
        date:    r.orderdate,
        revenue: parseFloat(r.revenue),
      })),
      productUsage: usageRes.rows.map(r => ({
        ingredient: r.item,
        used:       parseInt(r.usage),
      })),
      hourly: hourlyRes.rows.map(r => ({
        hour:    `${parseInt(r.hour)}:00`,
        orders:  parseInt(r.total_orders),
        revenue: parseFloat(r.revenue),
      })),
      recentOrders,
    });
  } catch (e) {
    console.error('[analytics GET]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST /manager/api/analytics — Generate Z-Report (closes today's business day)
export async function POST() {
  const client = await pool.connect();
  try {
    const today = new Date().toISOString().split('T')[0];

    // Guard: already closed?
    const checkRes = await client.query(
      `SELECT status FROM business_day WHERE business_date = $1::date`,
      [today]
    );
    if (checkRes.rows.length > 0 && checkRes.rows[0].status === 'closed') {
      return NextResponse.json(
        { error: "Today's business day is already closed!" },
        { status: 400 }
      );
    }

    // Totals for today
    const sumRes = await client.query(
      `SELECT COALESCE(SUM(total), 0)       AS total_revenue,
              COALESCE(SUM(employeetip), 0)  AS tip_revenue,
              COUNT(*)                        AS total_orders
       FROM completed_orders
       WHERE orderdate::date = $1::date`,
      [today]
    );
    const { total_revenue, tip_revenue, total_orders } = sumRes.rows[0];

    // Upsert business_day row
    const upd = await client.query(
      `UPDATE business_day
       SET status='closed', total_revenue=$1, tip_revenue=$2, total_orders=$3
       WHERE business_date=$4::date`,
      [total_revenue, tip_revenue, total_orders, today]
    );
    if (upd.rowCount === 0) {
      await client.query(
        `INSERT INTO business_day (business_date, status, total_revenue, tip_revenue, total_orders)
         VALUES ($1, 'closed', $2, $3, $4)`,
        [today, total_revenue, tip_revenue, total_orders]
      );
    }

    return NextResponse.json({
      date:         today,
      totalRevenue: parseFloat(total_revenue),
      tipRevenue:   parseFloat(tip_revenue),
      totalOrders:  parseInt(total_orders),
    });
  } catch (e) {
    console.error('[analytics POST z-report]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}
