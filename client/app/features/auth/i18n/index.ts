import type { Locale } from "../../../lib/i18n";

/**
 * Dictionaries cross the server → client boundary as props, so every value
 * must be serializable. No functions: use `{placeholder}` tokens and format
 * them with `interpolate()` from `@/lib/i18n`.
 */
export const authDictionaries = {
  ar: {
    brandName: "منصة إدارة المكاتب القانونية",
    panelHeadline: "إدارة القضايا والاستشارات في مكان واحد",
    panelBody:
      "القضايا، الجلسات، الوثائق، والفوترة لكل مكتب وفريق — بسجل موثّق لكل إجراء.",
    panelFooter: "دخول مصرّح به فقط. جميع العمليات مسجّلة.",
    title: "تسجيل الدخول",
    subtitle: "أدخل بيانات حسابك للمتابعة",
    email: "البريد الإلكتروني",
    emailPlaceholder: "name@firm.jo",
    password: "كلمة المرور",
    passwordPlaceholder: "••••••••",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    remember: "إبقائي مسجّلاً",
    forgot: "نسيت كلمة المرور؟",
    submit: "دخول",
    submitting: "جارٍ التحقق…",
    errRequiredEmail: "أدخل البريد الإلكتروني.",
    errInvalidEmail: "صيغة البريد الإلكتروني غير صحيحة.",
    errRequiredPassword: "أدخل كلمة المرور.",
    errShortPassword: "كلمة المرور 8 أحرف على الأقل.",
    errInvalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    errLocked: "تم إيقاف المحاولات مؤقتاً. حاول بعد 15 دقيقة.",
    errNetwork: "تعذّر الاتصال بالخادم. تحقق من الشبكة وأعد المحاولة.",
    attemptsLeft: "تبقّت {count} محاولات قبل إيقاف الحساب مؤقتاً.",
  },
  en: {
    brandName: "Legal Practice Management",
    panelHeadline: "Cases and consultations in one place",
    panelBody:
      "Cases, hearings, documents and billing across every office and team — with a record behind every action.",
    panelFooter: "Authorized access only. All activity is logged.",
    title: "Sign in",
    subtitle: "Enter your account details to continue",
    email: "Email",
    emailPlaceholder: "name@firm.jo",
    password: "Password",
    passwordPlaceholder: "••••••••",
    showPassword: "Show password",
    hidePassword: "Hide password",
    remember: "Keep me signed in",
    forgot: "Forgot your password?",
    submit: "Sign in",
    submitting: "Verifying…",
    errRequiredEmail: "Enter your email.",
    errInvalidEmail: "That email address isn't valid.",
    errRequiredPassword: "Enter your password.",
    errShortPassword: "Password must be at least 8 characters.",
    errInvalidCredentials: "Email or password is incorrect.",
    errLocked: "Too many attempts. Try again in 15 minutes.",
    errNetwork: "Couldn't reach the server. Check your connection and retry.",
    attemptsLeft: "{count} attempts left before the account is temporarily locked.",
  },
} satisfies Record<Locale, unknown>;

export type AuthDict = (typeof authDictionaries)["en"];