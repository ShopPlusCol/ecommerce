export const MAX_LOGIN_FAILURES = 5;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;

export function normalizeIdentity(email: string) {
  return email.trim().toLocaleLowerCase("en-US");
}

export function nextLoginAttempt(
  failedCount: number,
  now = new Date(),
): { failedCount: number; lockedUntil: Date | null } {
  const nextCount = failedCount + 1;
  return {
    failedCount: nextCount,
    lockedUntil: nextCount >= MAX_LOGIN_FAILURES ? new Date(now.getTime() + LOGIN_LOCK_MS) : null,
  };
}

export function isLoginLocked(lockedUntil: Date | null, now = new Date()) {
  return Boolean(lockedUntil && lockedUntil.getTime() > now.getTime());
}
