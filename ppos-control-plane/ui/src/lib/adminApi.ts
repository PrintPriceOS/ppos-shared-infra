// ppos-control-plane/ui/src/lib/adminApi.ts
type Range = "24h" | "7d" | "30d";

const AUTH_TOKEN_STORAGE = "ppos_control_token";
const ADMIN_KEY_STORAGE = "ppos_control_key";

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_STORAGE) || "";
export const setAuthToken = (token: string) => localStorage.setItem(AUTH_TOKEN_STORAGE, token);
export const clearAuth = () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE);
    localStorage.removeItem(ADMIN_KEY_STORAGE);
};

export const getAdminKey = () => localStorage.getItem(ADMIN_KEY_STORAGE) || "";

async function controlFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const apiBase = import.meta.env.VITE_API_URL || "";
    const token = getAuthToken();
    const key = getAdminKey();

    const res = await fetch(`${apiBase}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...(key ? { "X-Admin-Api-Key": key } : {}),
            ...(options?.headers || {}),
        }
    });

    if (res.status === 401) {
        clearAuth();
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Control Plane error ${res.status}`);
    }
    return res.json();
}

export async function login(username: string, password: string) {
    const data = await controlFetch<{ token: string; operator: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    setAuthToken(data.token);
    return data;
}

export async function logout() {
    await controlFetch('/api/auth/logout', { method: 'POST' });
    clearAuth();
}

// Metrics
export async function getOverview(range: Range) {
    return controlFetch<any>(`/api/metrics/overview?range=${range}`);
}

export async function getRecentJobs() {
    return controlFetch<any[]>(`/api/metrics/jobs/recent`);
}

export async function getTenantsSummary() {
    return controlFetch<any[]>(`/api/metrics/tenants/summary`);
}

export async function getGovernanceMetrics(range: Range) {
    return controlFetch<any>(`/api/metrics/governance?range=${range}`);
}

// Governance
export async function quarantineTenant(tenantId: string, reason: string) {
    return controlFetch<any>('/api/governance/tenant/quarantine', {
        method: 'POST',
        body: JSON.stringify({ tenantId, reason })
    });
}

export async function pardonTenant(tenantId: string, reason?: string) {
    return controlFetch<any>('/api/governance/tenant/pardon', {
        method: 'POST',
        body: JSON.stringify({ tenantId, reason })
    });
}

export async function setQueueState(queueName: string, state: 'PAUSED' | 'RUNNING', reason: string) {
    return controlFetch<any>('/api/governance/queue/state', {
        method: 'POST',
        body: JSON.stringify({ queueName, state, reason })
    });
}

export async function getAuditLogs() {
    return controlFetch<any[]>('/api/governance/audit-logs');
}

export async function getActivePolicies() {
    return controlFetch<any[]>('/api/governance/policies');
}

// Destructive Actions (19.B.2)
export async function flushQueue(queueType: string, reason: string) {
    return controlFetch<any>('/api/governance/queue/flush', {
        method: 'POST',
        body: JSON.stringify({ queueType, reason })
    });
}

export async function purgeHistory(days: number, reason: string) {
    return controlFetch<any>('/api/governance/history/purge', {
        method: 'POST',
        body: JSON.stringify({ days, reason })
    });
}

// Resource Governance (Phase 20.F)
export async function getResourceOverview() {
    return controlFetch<any>('/api/governance/resources/overview');
}

export async function getTenantsResourceUsage() {
    return controlFetch<any[]>('/api/governance/resources/tenants');
}

export async function getTenantResourceDetail(id: string) {
    return controlFetch<any>(`/api/governance/resources/tenant/${id}`);
}

// Federation (Phase 23.G)
export async function getFederationOverview() {
    return controlFetch<any>('/api/federation/health/overview');
}

export async function getFederationPrinters() {
    return controlFetch<any[]>('/api/federation/printers');
}

export async function getFederationStuckJobs() {
    return controlFetch<any[]>('/api/federation/stuck');
}

export async function getFederationJobTimeline(dispatchId: string) {
    return controlFetch<any>(`/api/federation/jobs/${dispatchId}/timeline`);
}

export async function forceRedispatch(jobId: string) {
    return controlFetch<any>(`/api/federation/admin/redispatch/${jobId}`, {
        method: 'POST'
    });
}
