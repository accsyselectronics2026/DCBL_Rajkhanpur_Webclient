
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2";

// export const dynamic = "force-dynamic";

interface Loader extends RowDataPacket {
  APP_ID: number;
  APP_NAME: string;
  API_URL: string;
  STREAMING_URL: string;
}

export async function GET() {
  try {
    const loaders = await query<Loader>(
      `SELECT APP_ID, APP_NAME, API_URL, STREAMING_URL
       FROM application_configuration
       WHERE TMP_DELETE = 0
       ORDER BY APP_ID ASC`
    );

    return NextResponse.json({
      success: true,
      loaders,
    });
  } catch (error) {
    console.error("Failed to fetch loaders:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch loader configuration",
      },
      { status: 500 }
    );
  }
}
