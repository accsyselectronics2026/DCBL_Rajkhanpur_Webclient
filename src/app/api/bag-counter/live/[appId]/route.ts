
import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface LoaderConfig extends RowDataPacket {
  APP_ID: number;
  API_URL: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await context.params;
    const id = Number(appId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid loader ID" },
        { status: 400 }
      );
    }

    // Get the Python API URL from MySQL
    const loader = await queryOne<LoaderConfig>(
      `SELECT APP_ID, API_URL
       FROM application_configuration
       WHERE APP_ID = ? AND TMP_DELETE = 0`,
      [id]
    );

    if (!loader) {
      return NextResponse.json(
        { success: false, message: "Loader configuration not found" },
        { status: 404 }
      );
    }

    const apiUrl = loader.API_URL.replace(/\/+$/, "");
    const pythonUrl = `${apiUrl}/GetLiveData/${id}`;

    // Match the original PHP request:
    // POST with an empty JSON object
    const response = await fetch(pythonUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const responseText = await response.text();

    let liveData;

    try {
      liveData = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Python API returned an invalid JSON response",
          details: responseText.slice(0, 300),
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Python API request failed",
          details: liveData,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: liveData.data ?? liveData,
    });
  } catch (error) {
    console.error("Live data API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to fetch live data",
      },
      { status: 500 }
    );
  }
}
