
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface TruckSequenceRow extends RowDataPacket {
  TRANS_ID: number;
  WAGON_NO: number;
  BOX_NO: string;
  LOADER_NO: string;
  DESTINATION: string | null;
  MATERIAL_CODE: string | null;
  SET_VALUE: number;
  ACTUAL_COUNT: number | null;
  STATUS: string | null;
  START_TIME: string | null;
  END_TIME: string | null;
  CREATED_AT: string | null;
  SHIPMENT_COUNT: number;
  TOTAL_SET_VALUE: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loaderNo = Number(searchParams.get("loaderNo"));

    if (!Number.isInteger(loaderNo) || loaderNo <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid loader number" },
        { status: 400 }
      );
    }

    const trucks = await query<TruckSequenceRow>(
      `SELECT
          T.RECORD_ID AS TRANS_ID,
          T.TRIP_NO AS WAGON_NO,
          T.TRUCK_NO AS BOX_NO,
          T.LOADER_NO,
          T.DESTINATION,
          MAX(S.MATERIAL_CODE) AS MATERIAL_CODE,
          T.SET_VALUE,
          T.ACTUAL_COUNT,
          T.STATUS,
          T.START_TIME,
          T.END_TIME,
          T.CREATED_AT,
          COUNT(S.RECORD_ID) AS SHIPMENT_COUNT,
          COALESCE(SUM(S.SET_VALUE), 0) AS TOTAL_SET_VALUE
       FROM transcation_table T
       LEFT JOIN shipment_table S
          ON S.TRANS_ID = T.RECORD_ID
          AND S.TMP_DELETE = 0
       WHERE T.LOADER_NO = :LOADER_NO
          AND T.TMP_DELETE = 0
       GROUP BY
          T.RECORD_ID,
          T.TRIP_NO,
          T.TRUCK_NO,
          T.LOADER_NO,
          T.DESTINATION,
          T.SET_VALUE,
          T.ACTUAL_COUNT,
          T.STATUS,
          T.START_TIME,
          T.END_TIME,
          T.CREATED_AT
       ORDER BY T.RECORD_ID DESC`,
      { LOADER_NO: loaderNo }
    );

    return NextResponse.json({
      success: true,
      trucks,
    });
  } catch (error) {
    console.error("Get truck sequence error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load truck sequence" },
      { status: 500 }
    );
  }
}
