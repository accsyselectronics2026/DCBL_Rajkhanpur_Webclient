
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface MaterialRow extends RowDataPacket {
  MATERIAL_CODE: string;
  MATERIAL_NAME: string;
}

export async function GET() {
  try {
    const materials = await query<MaterialRow>(
      `SELECT MATERIAL_CODE, MATERIAL_NAME
       FROM material_master
       WHERE COALESCE(TMP_DELETE, 0) = 0
         AND MATERIAL_CODE IS NOT NULL
         AND MATERIAL_NAME IS NOT NULL
       ORDER BY MATERIAL_NAME ASC`
    );

    return NextResponse.json({
      success: true,
      materials,
    });
  } catch (error) {
    console.error("Material API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load materials" },
      { status: 500 }
    );
  }
}
