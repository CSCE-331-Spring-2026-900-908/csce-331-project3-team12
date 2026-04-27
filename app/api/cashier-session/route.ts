export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import pool from "../../lib/db";

async function ensureCashierSessionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cashier_login_sessions (
      sessionid BIGSERIAL PRIMARY KEY,
      employeeid INTEGER NOT NULL REFERENCES employees(employeeid),
      login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      logout_time TIMESTAMPTZ
    )
  `);
}

export async function POST(req: NextRequest) {
  try {
    await ensureCashierSessionTable();

    const body = await req.json();
    const action = body?.action;

    if (action === "login") {
      const pinRaw = String(body?.pin ?? "").trim();
      if (!/^\d{1,10}$/.test(pinRaw)) {
        return NextResponse.json({ error: "PIN must be numeric." }, { status: 400 });
      }

      const pin = Number(pinRaw);
      const employeeRes = await pool.query(
        `SELECT employeeid, name, position
         FROM employees
         WHERE pin = $1
         LIMIT 1`,
        [pin]
      );

      if (employeeRes.rows.length === 0) {
        return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
      }

      const employee = employeeRes.rows[0];
      const position = String(employee.position ?? "").toLowerCase();
      if (!position.includes("cashier")) {
        return NextResponse.json(
          { error: "This employee is not authorized for cashier login." },
          { status: 403 }
        );
      }

      const sessionRes = await pool.query(
        `INSERT INTO cashier_login_sessions (employeeid)
         VALUES ($1)
         RETURNING sessionid, login_time`,
        [employee.employeeid]
      );

      return NextResponse.json({
        success: true,
        sessionId: sessionRes.rows[0].sessionid,
        loginTime: sessionRes.rows[0].login_time,
        employee: {
          employeeId: employee.employeeid,
          name: employee.name,
        },
      });
    }

    if (action === "logout") {
      const sessionId = Number(body?.sessionId);
      if (!Number.isFinite(sessionId)) {
        return NextResponse.json({ error: "A valid sessionId is required." }, { status: 400 });
      }

      const logoutRes = await pool.query(
        `UPDATE cashier_login_sessions
         SET logout_time = COALESCE(logout_time, NOW())
         WHERE sessionid = $1
         RETURNING sessionid, employeeid, login_time, logout_time`,
        [sessionId]
      );

      if (logoutRes.rows.length === 0) {
        return NextResponse.json({ error: "Session not found." }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        sessionId: logoutRes.rows[0].sessionid,
        employeeId: logoutRes.rows[0].employeeid,
        loginTime: logoutRes.rows[0].login_time,
        logoutTime: logoutRes.rows[0].logout_time,
      });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    console.error("[cashier-session POST]", error);
    return NextResponse.json({ error: "Failed to process cashier session." }, { status: 500 });
  }
}
