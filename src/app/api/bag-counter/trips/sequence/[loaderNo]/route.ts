
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface TruckSequenceRow extends RowDataPacket {
  RECORD_ID: number;
  TRIP_NO: number;
  TRUCK_NO: string;
  LOADER_NO: number;
  STATUS: string | null;
  NOOFSHIPMENTS: number;
  SET_VALUE: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ loaderNo: string }> }
) {
  try {
    const { loaderNo: loaderParam } = await context.params;
    const loaderNo = Number(loaderParam);

    if (!Number.isInteger(loaderNo) || loaderNo <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid loader number" },
        { status: 400 }
      );
    }

    const trucks = await query<TruckSequenceRow>(
      `SELECT
         T.RECORD_ID,
         T.TRIP_NO,
         T.TRUCK_NO,
         T.LOADER_NO,
         T.STATUS,
         COUNT(S.TRANS_ID) AS NOOFSHIPMENTS,
         COALESCE(SUM(S.SET_VALUE), 0) AS SET_VALUE
       FROM transcation_table AS T
       INNER JOIN shipment_table AS S
         ON S.TRANS_ID = T.RECORD_ID
        AND S.TMP_DELETE = 0
       WHERE T.TMP_DELETE = 0
         AND T.LOADER_NO = ?
         AND S.STATUS IS NULL
       GROUP BY
         T.RECORD_ID,
         T.TRIP_NO,
         T.TRUCK_NO,
         T.LOADER_NO,
         T.STATUS
       ORDER BY T.LAST_UPDATE_ON ASC`,
      [loaderNo]
    );

    return NextResponse.json({
      success: true,
      trucks,
    });
  } catch (error) {
    console.error("Get truck sequence:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch truck sequence" },
      { status: 500 }
    );
  }
}
