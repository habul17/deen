import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { db } from "@/lib/db";

const subscriptionSchema = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export async function POST(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response;
  const parsed = subscriptionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response;
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  await db.pushSubscription.deleteMany({
    where: { userId: user.id, ...(body?.endpoint ? { endpoint: body.endpoint } : {}) },
  });
  return NextResponse.json({ ok: true });
}
