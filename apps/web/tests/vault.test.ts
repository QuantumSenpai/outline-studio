import { describe, expect, it } from 'vitest';
import { decryptVault, encryptVault } from '@/adapters/security/keyVault';
describe('local encrypted key vault', () => {
  it('round-trips keys and rejects the wrong passphrase and tampering', async () => {
    const connections = [{ provider: 'groq' as const, model: 'model', key: 'private-test-key', authorized: true as const }];
    const vault = await encryptVault(connections, 'a long test passphrase');
    expect(JSON.stringify(vault)).not.toContain('private-test-key');
    expect(await decryptVault(vault, 'a long test passphrase')).toEqual(connections);
    await expect(decryptVault(vault, 'a different passphrase')).rejects.toThrow();
    await expect(decryptVault({ ...vault, ciphertext: vault.ciphertext.slice(4) }, 'a long test passphrase')).rejects.toThrow();
  });
});
