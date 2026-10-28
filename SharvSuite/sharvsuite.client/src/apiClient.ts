const TENANT_HEADER_NAME = 'X-Tenant';
const TENANT_STORAGE_KEY = 'sharvsuite_tenant_id';
const DEFAULT_TENANT_ID = 'alpha';

function resolveTenantId(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_TENANT_ID;
  }

  const storedTenantId = window.localStorage.getItem(TENANT_STORAGE_KEY)?.trim();
  if (storedTenantId) {
    if (storedTenantId === 'demo-tenant') {
      return DEFAULT_TENANT_ID;
    }
    return storedTenantId;
  }

  return DEFAULT_TENANT_ID;
}

export function setTenantId(tenantId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TENANT_STORAGE_KEY, tenantId.trim());
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set(TENANT_HEADER_NAME, resolveTenantId());

  return fetch(input, {
    ...init,
    headers,
  });
}
