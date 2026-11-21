
import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface LoaderConfig extends RowDataPacket {
  APP_ID: number;
  API_URL: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const loaderNo = Number(body.LoaderNo);
    const value = Number(body.Value);

    if (!Number.isInteger(loaderNo) || loaderNo <= 0) {
      return NextResponse.json(
        { title: "Failed", message: "Invalid loader ID" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json(
        { title: "Failed", message: "Enter a valid Add Bag value" },
        { status: 400 }
      );
    }

    // Get Python API URL from MySQL
    const loader = await queryOne<LoaderConfig>(
      `SELECT APP_ID, API_URL
       FROM application_configuration
       WHERE APP_ID = ? AND TMP_DELETE = 0`,
      [loaderNo]
    );

    if (!loader) {
      return NextResponse.json(
        { title: "Failed", message: "Loader configuration not found" },
        { status: 404 }
      );
    }

    const apiUrl = loader.API_URL.replace(/\/+$/, "");
    const pythonUrl = `${apiUrl}/ChangeAddBag`;

    // Same payload as the original PHP controller
    const response = await fetch(pythonUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        RecordId: loaderNo,
        Data: value,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const responseText = await response.text();

    let pythonResponse: unknown;

    try {
      pythonResponse = JSON.parse(responseText);
    } catch {
      pythonResponse = responseText;
    }

    return NextResponse.json(
      {
        title: response.ok ? "Success" : "Failed",
        message:
          typeof pythonResponse === "string"
            ? pythonResponse
            : (pythonResponse as { message?: string })?.message ??
              JSON.stringify(pythonResponse),
      },
      { status: response.ok ? 200 : response.status }
    );
  } catch (error) {
    console.error("Add Bag API error:", error);

    return NextResponse.json(
      {
        title: "Failed",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update Add Bag value",
      },
      { status: 500 }
    );
  }
}
