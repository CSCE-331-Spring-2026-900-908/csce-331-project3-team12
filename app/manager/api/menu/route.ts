export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port:     Number(process.env.DB_PORT),
  ssl:      { rejectUnauthorized: false },
});

async function hasColumn(client: PoolClient, table: string, column: string) {
  const res = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2 LIMIT 1`,
    [table, column]
  );
  return res.rows.length > 0;
}

export async function GET() {
  const client = await pool.connect();
  try {
    const hasCat = await hasColumn(client, 'drinks', 'category');
    const sql = hasCat
      ? `SELECT drinkid, name, price, COALESCE(category,'') AS category FROM drinks ORDER BY name`
      : `SELECT drinkid, name, price, '' AS category FROM drinks ORDER BY name`;
    const res = await client.query(sql);
    return NextResponse.json(res.rows.map(r => ({
      id:       r.drinkid,
      name:     r.name,
      price:    parseFloat(r.price),
      category: r.category,
    })));
  } catch (e) {
    console.error('[manager/menu GET]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const { name, price, category } = await req.json();
  const client = await pool.connect();
  try {
    const hasCat = await hasColumn(client, 'drinks', 'category');
    if (hasCat) {
      await client.query(
        `INSERT INTO drinks (name, price, category) VALUES ($1, $2, $3)`,
        [name, parseFloat(price), category]
      );
    } else {
      await client.query(`INSERT INTO drinks (name, price) VALUES ($1, $2)`, [name, parseFloat(price)]);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[manager/menu POST]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest) {
  const { id, name, price, category } = await req.json();
  const client = await pool.connect();
  try {
    const hasCat = await hasColumn(client, 'drinks', 'category');
    if (hasCat) {
      await client.query(
        `UPDATE drinks SET name=$1, price=$2, category=$3 WHERE drinkid=$4`,
        [name, parseFloat(price), category, id]
      );
    } else {
      await client.query(
        `UPDATE drinks SET name=$1, price=$2 WHERE drinkid=$3`,
        [name, parseFloat(price), id]
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[manager/menu PUT]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM drink_ingredients WHERE drinkid=$1`, [id]);
    await client.query(`DELETE FROM drinks WHERE drinkid=$1`, [id]);
    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[manager/menu DELETE]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}
