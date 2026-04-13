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

// GET — list all inventory via the existing DB function
export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT ingredientname, ingredienttype, quantity, lowstocklevel
       FROM get_inventory_remaining()`
    );
    return NextResponse.json(res.rows.map(r => ({
      name:          r.ingredientname,
      category:      r.ingredienttype,
      stock:         parseInt(r.quantity),
      lowStockLevel: parseInt(r.lowstocklevel),
    })));
  } catch (e) {
    console.error('[inventory GET]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST — upsert an inventory item (update if exists, insert if not)
export async function POST(req: NextRequest) {
  const { name, category, quantity } = await req.json();
  const client = await pool.connect();
  try {
    const upd = await client.query(
      `UPDATE inventory SET ingredienttype=$1, quantity=$2 WHERE ingredientname=$3`,
      [category, parseInt(quantity), name]
    );
    if (upd.rowCount === 0) {
      await client.query(
        `INSERT INTO inventory (ingredientname, ingredienttype, quantity) VALUES ($1, $2, $3)`,
        [name, category, parseInt(quantity)]
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[inventory POST]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE — remove an inventory item by name
export async function DELETE(req: NextRequest) {
  const { name } = await req.json();
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM inventory WHERE ingredientname=$1`, [name]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[inventory DELETE]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}
