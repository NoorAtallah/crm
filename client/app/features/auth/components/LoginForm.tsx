"use client";

import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { useLogin } from "../hooks/useLogin";
import type { AuthDict } from "../i18n/index";

/**
 * View only. Every decision lives in `useLogin` — this file just renders
 * what the hook reports and forwards what the user does.
 */
export function LoginForm({ t }: { t: AuthDict }) {
  const reduceMotion = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);
  const {
    values,
    setValue,
    fieldErrors,
    formError,
    hint,
    busy,
    disabled,
    submit,
  } = useLogin(t);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[420px] rounded-card border border-line bg-surface p-7 shadow-card sm:p-9"
    >
      <h2 className="text-[24px] font-semibold tracking-tight text-text-primary">
        {t.title}
      </h2>
      <p className="mt-1.5 text-[14px] text-text-muted">{t.subtitle}</p>

      <div className="mt-6 empty:mt-0">
        <Alert tone="danger" show={!!formError}>
          <p>{formError}</p>
          {hint && <p className="mt-1 opacity-80">{hint}</p>}
        </Alert>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <Field
          id="email"
          type="email"
          name="email"
          label={t.email}
          placeholder={t.emailPlaceholder}
          autoComplete="email"
          dir="ltr"
          value={values.email}
          disabled={disabled}
          error={fieldErrors.email}
          onChange={(e) => setValue("email", e.target.value)}
        />

        <Field
          id="password"
          type={showPassword ? "text" : "password"}
          name="password"
          label={t.password}
          placeholder={t.passwordPlaceholder}
          autoComplete="current-password"
          dir="ltr"
          value={values.password}
          disabled={disabled}
          error={fieldErrors.password}
          onChange={(e) => setValue("password", e.target.value)}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text-primary"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          }
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-text-primary">
            <input
              type="checkbox"
              checked={values.remember}
              disabled={disabled}
              onChange={(e) => setValue("remember", e.target.checked)}
              className="h-4 w-4 rounded border-line accent-[#181818]"
            />
            {t.remember}
          </label>

          <a
            href="/forgot-password"
            className="text-[13px] font-medium text-text-muted underline-offset-4 transition-colors hover:text-brand-charcoal hover:underline"
          >
            {t.forgot}
          </a>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={busy}
          loadingLabel={t.submitting}
          disabled={disabled}
        >
          {t.submit}
        </Button>
      </form>
    </motion.div>
  );
}