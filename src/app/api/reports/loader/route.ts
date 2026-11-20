import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { query } from "@/lib/db";
import { getSession } from "@/app/api/auth/session";

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

  const marks = counters.map(() => "?").join(",");
  const rows = await query<RowDataPacket>(
    `SELECT * FROM cntrdb
      WHERE CounterNo IN (${marks})
        AND ActualCount > 0
        AND StartTime BETWEEN ? AND ?
      ORDER BY StartTime`,
    [...counters, from, to]
  );

  return NextResponse.json({ rows });
}