import mysql, { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";

const g = globalThis as unknown as { pool?: Pool };

export const pool =
  g.pool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    dateStrings: true,
    connectionLimit: 10,
    namedPlaceholders: true, // lets us keep PHP-style :email params
  });

if (process.env.NODE_ENV !== "production") g.pool = pool;

type Params = Record<string, unknown> | unknown[];

export async function query<T extends RowDataPacket>(sql: string, params?: Params) {
  const [rows] = await pool.execute<T[]>(sql, params as never);
  return rows;
}

export async function queryOne<T extends RowDataPacket>(sql: string, params?: Params) {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params?: Params) {
  const [res] = await pool.execute<ResultSetHeader>(sql, params as never);
  return res;
}