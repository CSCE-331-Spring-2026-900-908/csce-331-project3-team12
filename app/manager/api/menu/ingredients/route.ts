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

async function hasColumn(client: Awaited<ReturnType<typeof pool.connect>>, table: string, column: string) {
  const res = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2 LIMIT 1`,
    [table, column]
  );
  return res.rows.length > 0;
}

// GET /manager/api/menu/ingredients?drinkId=X
export async function GET(req: NextRequest) {
  const drinkId = req.nextUrl.searchParams.get('drinkId');
  if (!drinkId) return NextResponse.json({ error: 'drinkId required' }, { status: 400 });

  const client = await pool.connect();
  try {
    const hasUnits = await hasColumn(client, 'drink_ingredients', 'units_per_drink');

    const existingSql = hasUnits
      ? `SELECT ingredientid, units_per_drink FROM drink_ingredients WHERE drinkid=$1`
      : `SELECT ingredientid FROM drink_ingredients WHERE drinkid=$1`;

    const existingRes = await client.query(existingSql, [drinkId]);
    const existingMap = new Map<number, number>();
    for (const row of existingRes.rows) {
      existingMap.set(row.ingredientid, hasUnits ? (row.units_per_drink || 1) : 1);
    }

    const allRes = await client.query(
      `SELECT ingredientid, ingredientname, ingredienttype FROM inventory ORDER BY ingredientname`
    );

    return NextResponse.json(allRes.rows.map(r => ({
      ingredientId:  r.ingredientid,
      name:          r.ingredientname,
      type:          r.ingredienttype,
      selected:      existingMap.has(r.ingredientid),
      unitsPerDrink: existingMap.get(r.ingredientid) ?? 1,
    })));
  } catch (e) {
    console.error('[menu/ingredients GET]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST /manager/api/menu/ingredients
// body: { drinkId, ingredients: [{ingredientId, unitsPerDrink}] }
export async function POST(req: NextRequest) {
  const { drinkId, ingredients } = await req.json();
  const client = await pool.connect();
  try {
    const hasUnits = await hasColumn(client, 'drink_ingredients', 'units_per_drink');

    await client.query('BEGIN');
    await client.query(`DELETE FROM drink_ingredients WHERE drinkid=$1`, [drinkId]);

    for (const ing of ingredients as { ingredientId: number; unitsPerDrink: number }[]) {
      if (hasUnits) {
        await client.query(
          `INSERT INTO drink_ingredients (drinkid, ingredientid, units_per_drink) VALUES ($1,$2,$3)`,
          [drinkId, ing.ingredientId, ing.unitsPerDrink]
        );
      } else {
        await client.query(
          `INSERT INTO drink_ingredients (drinkid, ingredientid) VALUES ($1,$2)`,
          [drinkId, ing.ingredientId]
        );
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[menu/ingredients POST]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}
