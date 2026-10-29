import "server-only";
import { NextResponse } from "next/server";
import { auth } from "./auth";

/** Resolves the signed-in user for a route handler, or a 401 response. */
export async function requireUser(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return { user: null, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) } as const;
  return { user: session.user, response: null } as const;
}
