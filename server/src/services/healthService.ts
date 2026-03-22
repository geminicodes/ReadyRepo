export type ServiceHealthSnapshot = {
  ok: boolean;
  timestamp: string;
  services: Record<string, { ok: boolean; details?: Record<string, unknown> }>;
};

/**
 * Minimal health snapshot for local dev.
 *
 * This repo's `/health` route expects this module to exist; some branches
 * omitted it, causing `Cannot find module '../services/healthService'`.
 */
export async function getServiceHealthSnapshot(): Promise<ServiceHealthSnapshot> {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    services: {
      api: { ok: true }
    }
  };
}

