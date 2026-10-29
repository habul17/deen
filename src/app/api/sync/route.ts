import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { db } from "@/lib/db";
import { loadSnapshot, applyOps } from "@/lib/sync-server";
import { pushOpsSchema } from "@/lib/sync";

export async function GET(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response;
  return NextResponse.json(await loadSnapshot(user.id), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response;
  const parsed = pushOpsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  await applyOps(db, user.id, parsed.data.ops);
  return NextResponse.json({ ok: true, serverTime: Date.now() });
}
