const API_BASE = '/api';

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  health: () => http<{ok:boolean}>('/health'),
  // Settings
  getSettings: () => http('/settings'),
  saveSettings: (payload: any) => http('/settings', { method: 'POST', body: JSON.stringify(payload) }),
  listSeats: () => http('/settings/seats'),
  setSeatVisibility: (name: string, visible: boolean) => http('/settings/seats/visibility', { method: 'POST', body: JSON.stringify({ name, visible }) }),
  // Pricing
  listPricing: () => http('/pricing'),
  addPricing: (payload: any) => http('/pricing', { method: 'POST', body: JSON.stringify(payload) }),
  updatePricing: (id: number, payload: any) => http(`/pricing/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePricing: (id: number) => http(`/pricing/${id}`, { method: 'DELETE' }),
  // Sessions
  listSessions: () => http('/sessions'),
  listActiveSessions: () => http('/sessions/active'),
  startSession: (payload: any) => http('/sessions/start', { method: 'POST', body: JSON.stringify(payload) }),
  extendSession: (payload: any) => http('/sessions/extend', { method: 'POST', body: JSON.stringify(payload) }),
  endSession: (session_id: number) => http('/sessions/end', { method: 'POST', body: JSON.stringify({ session_id }) }),
  expireSession: (session_id: number) => http('/sessions/expire', { method: 'POST', body: JSON.stringify({ session_id }) }),
  // Reports
  reports: (period: 'daily'|'weekly'|'monthly') => http(`/reports?period=${period}`)
}

export function formatCurrencyINR(value: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

