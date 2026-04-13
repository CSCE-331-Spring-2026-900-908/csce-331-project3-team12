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

// GET — list all employees
export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT employeeid, name, hourlypay, position, pin
       FROM employees
       ORDER BY employeeid`
    );
    return NextResponse.json(res.rows);
  } catch (e) {
    console.error('[employees GET]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST — add a new employee
export async function POST(req: NextRequest) {
  const { name, hourlyPay, position, pin } = await req.json();
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO employees (name, hourlypay, position, pin) VALUES ($1, $2, $3, $4)`,
      [name, parseFloat(hourlyPay), position, parseInt(pin)]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[employees POST]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT — update an existing employee
export async function PUT(req: NextRequest) {
  const { id, name, hourlyPay, position, pin } = await req.json();
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE employees SET name=$1, hourlypay=$2, position=$3, pin=$4 WHERE employeeid=$5`,
      [name, parseFloat(hourlyPay), position, parseInt(pin), id]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[employees PUT]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE — remove an employee by id
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM employees WHERE employeeid=$1`, [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[employees DELETE]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    client.release();
  }
}
