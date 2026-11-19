import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2";

// export const runtime = "nodejs";

export async function GET() {
  const rows = await query<RowDataPacket>("SELECT 1 AS ok");
  return Response.json({ db: rows[0].ok === 1 ? "connected" : "failed" });
}