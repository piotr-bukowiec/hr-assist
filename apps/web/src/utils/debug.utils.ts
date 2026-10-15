// Logi diagnostyczne — wyłączone w buildzie produkcyjnym.

const IS_ENABLED = process.env.NODE_ENV !== "production";

type DebugLogger = (event: string, payload?: Record<string, unknown>) => void;

/** Czas od startu strony (klient) lub znacznik czasu (serwer) — do porządkowania zdarzeń. */
const timestamp = (): string =>
  typeof window === "undefined"
    ? new Date().toISOString()
    : `+${Math.round(performance.now())}ms`;

const createDebugLogger =
  (scope: string): DebugLogger =>
  (event, payload) => {
    if (!IS_ENABLED) return;
    const side = typeof window === "undefined" ? "server" : "client";
    console.log(`[${scope}][${side}] ${timestamp()} ${event}`, payload ?? "");
  };

export const calendarLog = createDebugLogger("EmployeeCalendar");

// TODO(auth-debug): tymczasowa diagnostyka 401 po odświeżeniu — usunąć po naprawie.
export const authLog = createDebugLogger("auth-debug");

/**
 * Odczytuje `exp` z payloadu JWT BEZ weryfikacji podpisu — wyłącznie do logów.
 * Pozwala odróżnić "brak ciasteczka" od "ciasteczko jest, ale token wygasł".
 */
export const describeJwtExpiry = (
  token: string | undefined,
): Record<string, unknown> => {
  if (!token) return { hasToken: false };

  try {
    const [, payloadPart] = token.split(".");
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const { exp, iat } = JSON.parse(atob(padded)) as {
      exp?: number;
      iat?: number;
    };

    if (!exp) return { hasToken: true, exp: null };

    const secondsLeft = Math.round(exp - Date.now() / 1000);
    return {
      hasToken: true,
      issuedAt: iat ? new Date(iat * 1000).toISOString() : null,
      expiresAt: new Date(exp * 1000).toISOString(),
      isExpired: secondsLeft <= 0,
      secondsLeft,
    };
  } catch {
    return { hasToken: true, decodable: false };
  }
};
