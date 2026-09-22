/**
 * Public surface of the auth feature. Routes and other features import from
 * here — never from a file inside `features/auth/`.
 */
export { LoginForm } from "./components/LoginForm";
export { AuthBrandPanel } from "../auth/components/AuthBrandPanel";
export { authDictionaries, type AuthDict } from "./i18n/index";
export { authApi } from "./api/index";
export {
  landingPathForRole,
  AuthError,
  type Role,
  type AuthUser,
  type AuthSession,
} from "./types";