import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { db } from "@/lib/db";

export async function DELETE(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response;
  // Every table cascades from the user row.
  await db.user.delete({ where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
