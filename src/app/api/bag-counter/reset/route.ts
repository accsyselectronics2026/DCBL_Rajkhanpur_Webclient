import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface LoaderConfig extends RowDataPacket {
  APP_ID: number;
  API_URL: string;
}

interface TruckData extends RowDataPacket {
  RECORD_ID: number;
  TRUCK_NO: string;
  LOADER_NO: number;
  TRIP_NO: number;
  DESTINATION: string | null;
  SHIPMENT_NO: string | null;
  MATERIAL_CODE: string | null;
  SKU_DESCRIPTION: string | null;
  MRP: string | null;
  SET_VALUE: number;
  TOTAL_SET_VALUE: number;
}

interface LiveData {
  RecordId?: number;
  Counter?: number;
  Truckno?: string;
  ShipmentNo?: string;
  BagType?: string;
  SetValue?: number;
  Actual?: number;
  AddBagVal?: number;
  Cnt_Starttime?: string | null;
  Cnt_Endtime?: string | null;
  video_path?: string | null;
  video_filename?: string | null;
  LineCrossedBags?: number;
  LineCrossedLocation?: string | null;
  CLASS_COUNTS?: unknown;
  CLASS_TARGETS?: unknown;
  CustomerName?: string | null;
  TripNo?: string | number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const loaderNo = Number(body.loaderNo);
    const selectedTransId = body.selectedTransId
      ? Number(body.selectedTransId)
      : null;

    if (!Number.isInteger(loaderNo) || loaderNo <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid loader number" },
        { status: 400 },
      );
    }

    if (
      selectedTransId !== null &&
      (!Number.isInteger(selectedTransId) || selectedTransId <= 0)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid selected truck" },
        { status: 400 },
      );
    }

    // 1. Get loader configuration.
    const loader = await queryOne<LoaderConfig>(
      `SELECT APP_ID, API_URL
       FROM application_configuration
       WHERE APP_ID = ? AND TMP_DELETE = 0`,
      [loaderNo],
    );

    if (!loader?.API_URL) {
      return NextResponse.json(
        { success: false, message: "Loader configuration not found" },
        { status: 404 },
      );
    }

    const apiUrl = loader.API_URL.replace(/\/+$/, "");

    // 2. Get current live counter data before resetting.
    const liveResponse = await fetch(`${apiUrl}/GetLiveData/${loaderNo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const liveText = await liveResponse.text();
    let liveResult: any;

    try {
      liveResult = JSON.parse(liveText);
    } catch {
      throw new Error("Python returned invalid live counter data");
    }

    if (!liveResponse.ok) {
      throw new Error("Unable to fetch live counter data");
    }

    const live: LiveData = liveResult.data ?? liveResult;

    // 3. Save the current counter snapshot if bags were counted.
    if (Number(live.Actual ?? 0) !== 0) {
      const actual = Number(live.Actual ?? 0);
      const target = Number(live.SetValue ?? 0);
      const addBags = Number(live.AddBagVal ?? 0);

      await execute(
        `INSERT INTO cntrdb (
          CounterNo, TruckNo, ShipmentNo, Material,
          ProductWiseCount, ProductWiseTarget,
          Target, ActualCount, AddBags, DiffCount,
          TotCount, Cummulation, StartTime, EndTime,
          ResetTime, PlayBackPath, PlayBackFileName,
          BagOnBelt, BagOnBeltImagePath, CustomerName, TripNo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
        [
          live.Counter ?? null,
          live.Truckno ?? null,
          live.ShipmentNo ?? null,
          live.BagType ?? null,
          JSON.stringify(live.CLASS_COUNTS ?? null),
          JSON.stringify(live.CLASS_TARGETS ?? null),
          target,
          actual,
          addBags,
          actual - target,
          target + addBags,
          addBags,
          live.Cnt_Starttime ?? null,
          live.Cnt_Endtime ?? null,
          live.video_path ?? null,
          live.video_filename ?? null,
          Number(live.LineCrossedBags ?? 0),
          live.LineCrossedLocation ?? null,
          live.CustomerName ?? null,
          live.TripNo != null ? String(live.TripNo) : null,
        ],
      );
    }

    // 4. No truck selected: simply reset the current counter.
    if (selectedTransId === null) {
      const response = await fetch(`${apiUrl}/BcsReset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RecordId: loaderNo }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Python counter reset failed");
      }

      return NextResponse.json({
        success: true,
        message: result.message || "Counter reset successfully",
      });
    }

    // 5. Get selected truck, destination and shipment details.
    const truck = await queryOne<TruckData>(
      `SELECT
         T.RECORD_ID,
         T.TRUCK_NO,
         T.LOADER_NO,
         T.TRIP_NO,
         T.DESTINATION,
         T.SET_VALUE,
         S.SHIPMENT_NO,
         S.MATERIAL_CODE,
         S.SKU_DESCRIPTION,
         S.MRP,
         COALESCE(SUM(S.SET_VALUE), 0) AS TOTAL_SET_VALUE
       FROM transcation_table T
       INNER JOIN shipment_table S
         ON S.TRANS_ID = T.RECORD_ID
        AND S.TMP_DELETE = 0
       WHERE T.RECORD_ID = ?
         AND T.LOADER_NO = ?
         AND T.TMP_DELETE = 0
       GROUP BY
         T.RECORD_ID,
         T.TRUCK_NO,
         T.LOADER_NO,
         T.TRIP_NO,
         T.DESTINATION,
         T.SET_VALUE,
         S.SHIPMENT_NO,
         S.MATERIAL_CODE,
         S.SKU_DESCRIPTION,
         S.MRP
       LIMIT 1`,
      [selectedTransId, loaderNo],
    );

    if (!truck) {
      return NextResponse.json(
        { success: false, message: "Selected truck or shipment not found" },
        { status: 404 },
      );
    }

    // 6. Assign selected truck to the Python counter.
    const resetPayload = {
      RecordId: truck.RECORD_ID,
      Truckno: `Box No: ${truck.TRUCK_NO}`,
      LoaderNo: String(truck.LOADER_NO),
      PackerNo: "",
      SetValue: Number(truck.TOTAL_SET_VALUE),
      BagType: truck.MATERIAL_CODE ?? "",
      MRP: truck.MRP ?? "",
      ShipmentNo: truck.SHIPMENT_NO ?? "",
      OG_BagType: truck.MATERIAL_CODE ?? "",
      OG_Grade: "",
    };

    const pythonResponse = await fetch(`${apiUrl}/Reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resetPayload),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const pythonResult = await pythonResponse.json();

    if (!pythonResponse.ok || pythonResult.status !== "success") {
      throw new Error(
        pythonResult.message || "Python could not assign the selected truck",
      );
    }

    // 7. Mark shipment as STARTED after Python confirms success.
    await execute(
      `UPDATE shipment_table
       SET STATUS = 'STARTED'
       WHERE TRANS_ID = ? AND TMP_DELETE = 0`,
      [truck.RECORD_ID],
    );

    // 8. Soft-delete the assigned truck from the pending sequence.
    await execute(
      `UPDATE transcation_table
   SET TMP_DELETE = 1
   WHERE RECORD_ID = ?
     AND LOADER_NO = ?
     AND TMP_DELETE = 0`,
      [truck.RECORD_ID, loaderNo],
    );

    // 9. Return selected truck details to the frontend.
    return NextResponse.json({
      success: true,
      message: pythonResult.message || "Truck assigned successfully",
      truck: {
        TRANS_ID: truck.RECORD_ID,
        WAGON_NO: truck.TRIP_NO,
        BOX_NO: truck.TRUCK_NO,
        DESTINATION: truck.DESTINATION,
        MATERIAL_CODE: truck.MATERIAL_CODE,
        MATERIAL_NAME: truck.SKU_DESCRIPTION,
        SET_VALUE: Number(truck.TOTAL_SET_VALUE),
      },
    });
  } catch (error) {
    console.error("Bag Counter Reset API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to reset counter",
      },
      { status: 500 },
    );
  }
}
