/**
 * AES-GCM envelope shared by every feature that stores a user-supplied secret
 * (Laboratorio de APIs and the integration settings page). The key is derived
 * from DEVELOPER_LAB_ENCRYPTION_KEY, so an operator without that variable can
 * read the rows but not the credentials.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type SealedSecret = { encryptedValue: string; iv: string };

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function importKey(secret: string | undefined): Promise<CryptoKey> {
  const trimmed = secret?.trim();
  if (!trimmed)
    throw new Error(
      "Configura DEVELOPER_LAB_ENCRYPTION_KEY antes de guardar credenciales desde la interfaz.",
    );
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(trimmed));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function sealSecret(
  value: string,
  encryptionKey: string | undefined,
): Promise<SealedSecret> {
  const key = await importKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(value),
  );
  return {
    encryptedValue: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
  };
}

export async function openSecret(
  sealed: SealedSecret,
  encryptionKey: string | undefined,
): Promise<string> {
  const key = await importKey(encryptionKey);
  const clear = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(sealed.iv) },
    key,
    fromBase64(sealed.encryptedValue),
  );
  return decoder.decode(clear);
}
