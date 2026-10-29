import { NextResponse } from "next/server";
import { runNotifications } from "@/lib/notify";

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  const query = new URL(req.url).searchParams.get("secret");
  if (!secret || (header !== `Bearer ${secret}` && query !== secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runNotifications());
}

export const GET = handle;
export const POST = handle;
