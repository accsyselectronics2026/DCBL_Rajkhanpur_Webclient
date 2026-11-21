
import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface TripRow extends RowDataPacket {
  RECORD_ID: number;
  TRUCK_NO: string;
  LOADER_NO: string;
}

interface ShipmentRow extends RowDataPacket {
  RECORD_ID: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const transId = Number(body.TRANS_ID);
    const targetValue = Number(body.SET_VALUE);
    const materialCode = String(body.MATERIAL_CODE ?? "").trim();
    const materialName = String(body.SKU_DESCRIPTION ?? "").trim();

    if (!Number.isInteger(transId) || transId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid trip ID" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(targetValue) || targetValue <= 0) {
      return NextResponse.json(
        { success: false, message: "Enter a valid Set Value" },
        { status: 400 }
      );
    }

    if (!materialCode || materialCode.length > 45) {
      return NextResponse.json(
        { success: false, message: "Please select a valid material" },
        { status: 400 }
      );
    }

    if (!materialName) {
      return NextResponse.json(
        { success: false, message: "Material name not found" },
        { status: 400 }
      );
    }

    const trip = await queryOne<TripRow>(
      `SELECT RECORD_ID, TRUCK_NO, LOADER_NO
       FROM transcation_table
       WHERE RECORD_ID = :TRANS_ID
         AND TMP_DELETE = 0`,
      { TRANS_ID: transId }
    );

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    const existingItem = await queryOne<ShipmentRow>(
      `SELECT RECORD_ID
       FROM shipment_table
       WHERE TRANS_ID = :TRANS_ID
         AND TMP_DELETE = 0`,
      { TRANS_ID: transId }
    );

    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          message: "An item has already been added to this trip"
        },
        { status: 409 }
      );
    }

    // Save material code AND material name.
    await execute(
      `INSERT INTO shipment_table
        (
          TRANS_ID,
          MATERIAL_CODE,
          SKU_DESCRIPTION,
          TRUCK_NO,
          LOADER_NO,
          SET_VALUE
        )
       VALUES
        (
          :TRANS_ID,
          :MATERIAL_CODE,
          :SKU_DESCRIPTION,
          :TRUCK_NO,
          :LOADER_NO,
          :SET_VALUE
        )`,
      {
        TRANS_ID: transId,
        MATERIAL_CODE: materialCode,
        SKU_DESCRIPTION: materialName,
        TRUCK_NO: trip.TRUCK_NO,
        LOADER_NO: trip.LOADER_NO,
        SET_VALUE: targetValue
      }
    );

    return NextResponse.json({
      success: true,
      message: "Item added successfully",
      TRANS_ID: transId,
      MATERIAL_CODE: materialCode,
      SKU_DESCRIPTION: materialName,
      TRUCK_NO: trip.TRUCK_NO,
      LOADER_NO: trip.LOADER_NO,
      SET_VALUE: targetValue
    });

  } catch (error) {
    console.error("Add item error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to add item" },
      { status: 500 }
    );
  }
}
