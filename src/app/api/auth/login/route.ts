import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { RowDataPacket } from "mysql2";
import { queryOne, execute } from "@/lib/db";
import { createSession } from "@/lib/auth/session";

interface UserRow extends RowDataPacket {
  record_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  approved: string;
  email_validated: string;
  default_page: string | null;
  role_name: string | null;
}

const pageMap: Record<string, string> = {
  "/bagcounter/index": "/bag-counter",
  "/reports/index": "/reports",
};

const fail = (message: string, status = 401) =>
  NextResponse.json({ message }, { status });

function sameText(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "").trim();
  if (!email || !password) return fail("Enter email and password", 400);

  const user = await queryOne<UserRow>(
    `SELECT u.*, r.default_page, r.role_name
       FROM user_master u
       LEFT JOIN role_master r ON u.role_id = r.role_name
      WHERE u.email = :email AND COALESCE(u.tmp_delete, 0) = 0`,
    { email }
  );

  const isHash = !!user && user.password.startsWith("$2");
  const ok =
    !!user &&
    (isHash
      ? await bcrypt.compare(password, user.password)
      : sameText(password, user.password));

  if (!user || !ok) return fail("Invalid email or password");
  if (user.approved !== "true")
    return fail("Your account is not approved yet. Contact the plant admin.", 403);
  if (user.email_validated !== "true")
    return fail("Your email is not verified yet.", 403);

  if (!isHash && process.env.UPGRADE_PASSWORDS === "true") {
    await execute("UPDATE user_master SET password = :p WHERE record_id = :id", {
      p: await bcrypt.hash(password, 10),
      id: user.record_id,
    });
  }

  const redirect = pageMap[(user.default_page ?? "").toLowerCase()] ?? "/reports";

  await createSession({
    userId: user.record_id,
    email: user.email,
    name: `${user.first_name} ${user.last_name}`.trim(),
    roleName: user.role_name ?? "",
    defaultPage: redirect,
  });

  return NextResponse.json({ redirect });
}