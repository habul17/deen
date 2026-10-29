"use client";

import { useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};
import Link from "next/link";
import { ArrowLeft, LoaderCircle, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { friendlyError } from "./auth-form";

export function ForgotPassword() {
  const [state, setState] = useState<"idle" | "pending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("pending");
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    const res = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    if (res.error) {
      setState("idle");
      setError(friendlyError(res.error.code, res.error.message));
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div>
        <MailCheck className="size-7 text-accent" strokeWidth={1.5} />
        <h1 className="mt-5 font-serif text-[40px] leading-none tracking-tight">Check your inbox</h1>
        <p className="mt-3 text-[15px] text-muted">If an account exists for that email, a reset link is on its way. It expires in one hour.</p>
        <ButtonLink href="/sign-in" variant="secondary" size="lg" className="mt-8 w-full">
          Back to sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <div>
      <BackLink />
      <h1 className="font-serif text-[40px] leading-none tracking-tight">Reset password</h1>
      <p className="mt-3 text-[15px] text-muted">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-missed-soft px-4 py-3 text-[14px] text-missed">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={state === "pending"}>
          {state === "pending" && <LoaderCircle className="size-4 animate-spin" />}
          Send reset link
        </Button>
      </form>
    </div>
  );
}

export function ResetPassword() {
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  const params = new URLSearchParams(search);
  const token = params.get("token");
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");
  const [submitError, setError] = useState<string | null>(null);
  const error = submitError ?? (params.get("error") ? friendlyError("INVALID_TOKEN") : null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return setError(friendlyError("INVALID_TOKEN"));
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("password"));
    if (newPassword !== String(form.get("confirm"))) return setError("Those passwords don't match.");
    setState("pending");
    setError(null);
    const res = await authClient.resetPassword({ newPassword, token });
    if (res.error) {
      setState("idle");
      setError(friendlyError(res.error.code, res.error.message));
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <div>
        <h1 className="font-serif text-[40px] leading-none tracking-tight">Password updated</h1>
        <p className="mt-3 text-[15px] text-muted">You can now sign in with your new password.</p>
        <ButtonLink href="/sign-in" size="lg" className="mt-8 w-full">
          Sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <div>
      <BackLink />
      <h1 className="font-serif text-[40px] leading-none tracking-tight">New password</h1>
      <p className="mt-3 text-[15px] text-muted">Choose something you haven&apos;t used before.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-missed-soft px-4 py-3 text-[14px] text-missed">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={state === "pending"}>
          {state === "pending" && <LoaderCircle className="size-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/sign-in" className="mb-8 inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink">
      <ArrowLeft className="size-4" strokeWidth={1.75} />
      Sign in
    </Link>
  );
}
