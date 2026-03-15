import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

export interface AuthUser {
  id:   string;
  role: "app_user" | "app_admin";
}

export async function verifyAuth(req: NextRequest): Promise<AuthUser> {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Authorization ヘッダがありません"), { status: 401 });
  }

  const token  = header.slice(7);
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

  const { payload } = await jwtVerify(token, secret).catch(() => {
    throw Object.assign(new Error("トークンが無効です"), { status: 401 });
  });

  const role = payload["role"] as string;
  if (role !== "app_user" && role !== "app_admin") {
    throw Object.assign(new Error("ロールが不正です"), { status: 403 });
  }

  return { id: payload.sub as string, role };
}
