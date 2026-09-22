import type { AuthDict } from "../auth/i18n/index";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export function validateLogin(
  values: { email: string; password: string },
  t: AuthDict
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  const email = values.email.trim();
  if (!email) errors.email = t.errRequiredEmail;
  else if (!EMAIL_RE.test(email)) errors.email = t.errInvalidEmail;

  if (!values.password) errors.password = t.errRequiredPassword;
  else if (values.password.length < MIN_PASSWORD_LENGTH)
    errors.password = t.errShortPassword;

  return errors;
}