import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";

type SessionUser = {
  id: string;
  role: "client" | "dietitian";
};

type RequireSessionResult =
  | { session: { user: SessionUser }; error: null }
  | { session: null; error: NextResponse };

export async function requireSession(
  role?: "client" | "dietitian"
): Promise<RequireSessionResult> {
  const session = await getServerSession(authOptions);
  if (!session || (role && session.user.role !== role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Yetkisiz" }, { status: 403 }),
    };
  }
  return { session: session as { user: SessionUser }, error: null };
}

export async function withDb() {
  return dbConnect();
}
