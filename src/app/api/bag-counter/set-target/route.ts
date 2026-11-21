
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

    if (!Number.isInteger(value) || value <= 0) {
      return NextResponse.json(
        { title: "Failed", message: "Enter a valid Set Value" },
        { status: 400 }
      );
    }

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

    const response = await fetch(`${apiUrl}/ChangeTarget`, {
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

    const message =
      typeof pythonResponse === "string"
        ? pythonResponse
        : (pythonResponse as { message?: string })?.message ??
          JSON.stringify(pythonResponse);

    return NextResponse.json(
      {
        title: response.ok ? "Success" : "Failed",
        message,
      },
      { status: response.ok ? 200 : response.status }
    );
  } catch (error) {
    console.error("Set Target API error:", error);

    return NextResponse.json(
      {
        title: "Failed",
        message:
          error instanceof Error ? error.message : "Unable to update Set Value",
      },
      { status: 500 }
    );
  }
}
