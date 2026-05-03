import { createHash, randomBytes } from "node:crypto"

const KEY_PREFIX = "trace_sk_"

/** Full secret shown once to the user; never persisted. */
export function generateApiKeyPlaintext(): string {
  return KEY_PREFIX + randomBytes(32).toString("base64url")
}

export function hashApiKeyPlaintext(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex")
}

/** Short label for lists (never includes full secret). */
export function apiKeyDisplayPrefix(plaintext: string): string {
  if (plaintext.length <= 20) return plaintext
  return `${plaintext.slice(0, 20)}…`
}
