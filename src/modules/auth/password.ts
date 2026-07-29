import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash de contraseña con scrypt (node:crypto, sin criptografía propia).
 * Suficiente para crear el usuario propietario del seed en la Fase 1; el
 * flujo de login real de la Fase 3 puede mantener este esquema o migrar a
 * una librería de autenticación dedicada si conviene por UX (2FA, etc.).
 */
const KEY_LENGTH = 64;

export function hashPassword(plainPassword: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plainPassword, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  const [scheme, salt, hash] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(plainPassword, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function generateRandomPassword(): string {
  return randomBytes(12).toString("base64url");
}
