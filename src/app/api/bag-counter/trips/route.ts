
import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface TripRow extends RowDataPacket {
  TRIP_NO: number;
}

export async function GET() {
  try {
    const lastTrip = await queryOne<TripRow>(
      `SELECT TRIP_NO
       FROM transcation_table
       WHERE TMP_DELETE = 0
       ORDER BY RECORD_ID DESC
       LIMIT 1`
    );

    const nextTripNo = lastTrip
      ? Number(lastTrip.TRIP_NO) + 1
      : 1000000;

    return NextResponse.json({
      success: true,
      nextTripNo,
    });
  } catch (error) {
    console.error("Get next trip number:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate trip number",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Wagon Number is entered manually and stored in TRIP_NO.
    const wagonNo = Number(body.WAGON_NO);

    const boxNo = String(body.BOX_NO ?? "").trim();
    const destination = String(body.DESTINATION ?? "").trim();
    const materialCode = String(body.MATERIAL_CODE ?? "").trim();
    const loaderNo = Number(body.LOADER_NO);

    // Validate all required form fields.
    if (
      !Number.isSafeInteger(wagonNo) ||
      wagonNo <= 0 ||
      !boxNo ||
      boxNo.length > 45 ||
      !destination ||
      destination.length > 100 ||
      !materialCode ||
      !Number.isInteger(loaderNo) ||
      loaderNo <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide all required trip details",
        },
        { status: 400 }
      );
    }

    // Check whether this Wagon Number and Box Number combination
    // already exists.
    const duplicate = await queryOne<TripRow>(
      `SELECT TRIP_NO
       FROM transcation_table
       WHERE TRIP_NO = ?
         AND TRUCK_NO = ?
         AND TMP_DELETE = 0
       LIMIT 1`,
      [wagonNo, boxNo]
    );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "This Wagon Number and Box Number already exist",
        },
        { status: 409 }
      );
    }

    // Create the trip.
    const result = await execute(
      `INSERT INTO transcation_table
        (
          TRIP_NO,
          TRUCK_NO,
          DESTINATION,
          LOADER_NO,
          SET_VALUE,
          STATUS,
          TMP_DELETE
        )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        wagonNo,
        boxNo,
        destination,
        String(loaderNo),
        "0",
        "CREATED",
        0,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Trip created successfully",
      TRANS_ID: result.insertId,
      details: {
        WAGON_NO: wagonNo,
        BOX_NO: boxNo,
        DESTINATION: destination,
        MATERIAL_CODE: materialCode,
        LOADER_NO: loaderNo,
      },
    });
  } catch (error) {
    console.error("Create trip:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create trip",
      },
      { status: 500 }
    );
  }
}
