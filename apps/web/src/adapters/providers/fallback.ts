import type { Connection, ErrorData, ProviderId } from '@outline-studio/schemas';
export function eligibleConnections<T extends Connection & { validated: boolean }>(connections: T[], primary: ProviderId | null,
  fallback: boolean, cooldowns: Partial<Record<ProviderId, number>>, now = Date.now()) {
  const eligible = connections.filter(c => c.validated && c.authorized && (cooldowns[c.provider] ?? 0) <= now);
  const first = eligible.find(c => c.provider === primary);
  return fallback ? [...(first ? [first] : []), ...eligible.filter(c => c.provider !== primary)] : first ? [first] : [];
}
export function canFallback(error: ErrorData) { return ['rate_limit', 'unavailable', 'timeout'].includes(error.code); }
