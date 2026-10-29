"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

type Mode = "sign-in" | "sign-up";

export function AuthForm({ mode, googleEnabled }: { mode: Mode; googleEnabled: boolean }) {
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const signUp = mode === "sign-up";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending("email");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const res = signUp
      ? await authClient.signUp.email({ name: String(form.get("name")).trim(), email, password })
      : await authClient.signIn.email({ email, password });
    if (res.error) {
      setPending(null);
      setError(friendlyError(res.error.code, res.error.message));
      return;
    }
    window.location.assign(signUp ? "/onboarding" : "/today");
  }

  async function google() {
    setError(null);
    setPending("google");
    const res = await authClient.signIn.social({ provider: "google", callbackURL: "/today", newUserCallbackURL: "/onboarding" });
    if (res?.error) {
      setPending(null);
      setError(friendlyError(res.error.code, res.error.message));
    }
  }

  return (
    <div>
      <h1 className="display text-[2.75rem] leading-[0.95] font-semibold">{signUp ? "Begin" : "Welcome back"}</h1>
      <p className="mt-3 text-[1rem] text-ink-soft">
        {signUp ? "Create your private space to keep track of your prayers." : "Sign in to continue where you left off."}
      </p>

      {googleEnabled && (
        <>
          <Button variant="secondary" size="lg" className="mt-8 w-full" onClick={google} disabled={pending !== null}>
            {pending === "google" ? <LoaderCircle className="size-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-4 text-[0.8125rem] text-ink-soft">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className={googleEnabled ? "space-y-4" : "mt-8 space-y-4"} noValidate={false}>
        {signUp && (
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" required maxLength={80} placeholder="Your name" />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@example.com" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Password</Label>
            {!signUp && (
              <Link href="/forgot-password" className="text-[0.8125rem] text-ink-soft hover:text-ink">
                Forgot?
              </Link>
            )}
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={signUp ? "new-password" : "current-password"}
              required
              minLength={8}
              placeholder={signUp ? "At least 8 characters" : "••••••••"}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-soft hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" strokeWidth={1.75} /> : <Eye className="size-4" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-[0.875rem] font-medium text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending !== null}>
          {pending === "email" && <LoaderCircle className="size-4 animate-spin" />}
          {signUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-center text-[0.875rem] text-ink-soft">
        {signUp ? "Already have an account? " : "New to Deen? "}
        <Link href={signUp ? "/sign-in" : "/sign-up"} className="font-semibold text-ink underline underline-offset-4">
          {signUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

export function friendlyError(code?: string, message?: string) {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Try signing in.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 8 characters for your password.";
    case "INVALID_EMAIL":
      return "That email address doesn't look right.";
    case "INVALID_TOKEN":
      return "This link has expired. Request a new one.";
    default:
      return message || "Something went wrong. Please try again.";
  }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
