import { z } from 'zod';
import { savedConnectionsSchema } from '@/ui/stores/providerStore';
import type { Connection } from '@outline-studio/schemas';

const vaultSchema = z.object({ version: z.literal(1), salt: z.string().max(80), iv: z.string().max(80), ciphertext: z.string().max(18000) }).strict();
export type VaultData = z.infer<typeof vaultSchema>;
const encode = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const decode = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));
async function derive(passphrase: string, salt: Uint8Array<ArrayBuffer>) {
  if (passphrase.length < 12 || passphrase.length > 256) throw new Error('Use a passphrase between 12 and 256 characters.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, key,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptVault(connections: Connection[], passphrase: string): Promise<VaultData> {
  const safe = savedConnectionsSchema.parse(connections);
  const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('outline-vault-v1') }, key,
    new TextEncoder().encode(JSON.stringify(safe)));
  return { version: 1, salt: encode(salt.buffer), iv: encode(iv.buffer), ciphertext: encode(ciphertext) };
}
export async function decryptVault(value: unknown, passphrase: string): Promise<Connection[]> {
  const data = vaultSchema.parse(value);
  const salt = decode(data.salt); const iv = decode(data.iv);
  if (salt.length !== 16 || iv.length !== 12) throw new Error('Encrypted vault format is invalid.');
  const key = await derive(passphrase, salt);
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('outline-vault-v1') }, key, decode(data.ciphertext));
  const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
  return savedConnectionsSchema.parse(parsed);
}
