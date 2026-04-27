export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import pool from "../../../lib/db";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const fromDate = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : null;
  const toDate = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : null;

  try {
    await ensureCashierSessionTable();

    const payrollRes = await pool.query(
      `SELECT
         e.employeeid,
         e.name,
         e.position,
         e.hourlypay,
         COALESCE(SUM(
           CASE
             WHEN s.logout_time IS NOT NULL THEN EXTRACT(EPOCH FROM (s.logout_time - s.login_time)) / 3600.0
             ELSE 0
           END
         ), 0) AS hours_worked,
         COUNT(s.sessionid) FILTER (WHERE s.logout_time IS NOT NULL) AS completed_shifts,
         COUNT(s.sessionid) FILTER (WHERE s.logout_time IS NULL) AS open_shifts
       FROM employees e
       LEFT JOIN cashier_login_sessions s
         ON s.employeeid = e.employeeid
        AND ($1::date IS NULL OR s.login_time::date >= $1::date)
        AND ($2::date IS NULL OR s.login_time::date <= $2::date)
       GROUP BY e.employeeid, e.name, e.position, e.hourlypay
       ORDER BY e.employeeid`,
      [fromDate, toDate]
    );

    const rows = payrollRes.rows.map((r) => {
      const hoursWorked = Number(r.hours_worked ?? 0);
      const hourlyPay = Number(r.hourlypay ?? 0);
      const grossPay = hoursWorked * hourlyPay;

      return {
        employeeId: Number(r.employeeid),
        name: String(r.name),
        position: String(r.position),
        hourlyPay,
        hoursWorked,
        completedShifts: Number(r.completed_shifts ?? 0),
        openShifts: Number(r.open_shifts ?? 0),
        grossPay,
      };
    });

    const totals = rows.reduce(
      (acc, row) => {
        acc.totalHours += row.hoursWorked;
        acc.totalGrossPay += row.grossPay;
        return acc;
      },
      { totalHours: 0, totalGrossPay: 0 }
    );

    return NextResponse.json({
      from: fromDate,
      to: toDate,
      rows,
      totals,
    });
  } catch (error) {
    console.error("[payroll GET]", error);
    return NextResponse.json({ error: "Failed to calculate payroll." }, { status: 500 });
  }
}
