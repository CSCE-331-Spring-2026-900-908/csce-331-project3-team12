import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW()");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("DB ERROR:", error);

    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }
}