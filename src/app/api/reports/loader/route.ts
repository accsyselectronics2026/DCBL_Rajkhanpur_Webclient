import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const counters = (sp.get("counters") ?? "")
    .split(",")
    .map(Number)
    .filter(Number.isInteger);

  if (!from || !to || counters.length === 0) {
    return NextResponse.json({ message: "Missing filters" }, { status: 400 });
  }

  // JOIN (1): how a cntrdb row finds its trip   -> confirm these two columns
  // JOIN (2): how a trip finds its destination  -> confirm these two columns
  const marks = counters.map(() => "?").join(",");
  try {
    const rows = await query<RowDataPacket>(
      `SELECT c.*, t.TRIP_NO, t.DESTINATION
         FROM cntrdb c
         LEFT JOIN transcation_table t ON t.TRUCK_NO = c.TruckNo       
        WHERE c.CounterNo IN (${marks})
          AND c.ActualCount > 0
          AND c.StartTime BETWEEN ? AND ?
        ORDER BY c.StartTime`,
      [...counters, from, to]
    );
    return NextResponse.json({ rows });
  } catch (e) {
    console.error("loader report query failed:", e);
    const detail = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { message: process.env.NODE_ENV === "development" ? detail : "Failed to load report" },
      { status: 500 }
    );
  }
}