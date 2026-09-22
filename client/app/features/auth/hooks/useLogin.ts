"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { interpolate } from "../../../lib/i18n";
import { writeSessionCookie } from "../../../lib/session-cookie";
import { authApi } from "../api";
import { AuthError, landingPathForRole, type Role } from "../types";
import { validateLogin, type LoginFieldErrors } from "../validation";
import type { AuthDict } from "../i18n";

export type LoginStatus = "idle" | "submitting" | "success";

export interface LoginValues {
  email: string;
  password: string;
  remember: boolean;
}

/**
 * Owns every piece of login state. The component below it renders and
 * nothing else, which is what makes this testable without a DOM.
 */
export function useLogin(t: AuthDict) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [values, setValues] = useState<LoginValues>({
    email: "",
    password: "",
    remember: true,
  });
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [status, setStatus] = useState<LoginStatus>("idle");

  const setValue = useCallback(
    <K extends keyof LoginValues>(key: K, value: LoginValues[K]) =>
      setValues((prev) => ({ ...prev, [key]: value })),
    []
  );

  const locked = formError === t.errLocked;
  const busy = status !== "idle";
  const disabled = busy || locked;

  const submit = useCallback(async () => {
    if (disabled) return;

    setFormError(null);
    setHint(null);

    const errors = validateLogin(values, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("submitting");
    try {
      const session = await authApi.signIn(values);
      writeSessionCookie(session);
      setStatus("success");
      router.push(destinationFor(session.user.role, searchParams.get("next")));
    } catch (error) {
      setStatus("idle");
      setFormError(messageFor(error, t));
      if (
        error instanceof AuthError &&
        error.code === "INVALID_CREDENTIALS" &&
        error.attemptsLeft !== undefined &&
        error.attemptsLeft <= 3
      ) {
        setHint(interpolate(t.attemptsLeft, { count: error.attemptsLeft }));
      }
    }
  }, [disabled, values, t, router, searchParams]);

  return {
    values,
    setValue,
    fieldErrors,
    formError,
    hint,
    status,
    busy,
    locked,
    disabled,
    submit,
  };
}

function messageFor(error: unknown, t: AuthDict): string {  if (!(error instanceof AuthError)) return t.errNetwork;
  switch (error.code) {
    case "ACCOUNT_LOCKED":
      return t.errLocked;
    case "NETWORK":
      return t.errNetwork;
    default:
      return t.errInvalidCredentials;
  }
}

/**
 * Honours `?next=` from the middleware redirect, but only for same-origin
 * paths — an absolute URL in that param is an open-redirect hole.
 */
function destinationFor(role: Role, next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return landingPathForRole[role];
}