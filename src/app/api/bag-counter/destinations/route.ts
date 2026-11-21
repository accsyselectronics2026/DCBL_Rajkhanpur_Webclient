
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface DestinationRow extends RowDataPacket {
  RECORD_ID: number;
  DESTINATION: string;
}

export async function GET() {
  try {
    const destinations = await query<DestinationRow>(
      `SELECT RECORD_ID, DESTINATION
       FROM destination_master
       WHERE DESTINATION IS NOT NULL
         AND TRIM(DESTINATION) <> ''
       ORDER BY DESTINATION ASC`
    );

    return NextResponse.json({
      success: true,
      destinations,
    });
  } catch (error) {
    console.error("Destination API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load destinations" },
      { status: 500 }
    );
  }
}
