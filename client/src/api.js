export async function api(path, { body, ...options } = {}) {
  let res;
  try {
    res = await fetch(path, {
      ...options,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that it is running.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'The server did not respond. Check that it is running.');
  return data;
}

export const num = (v, digits = 0) => (v === null || v === undefined ? '–' : Number(v).toFixed(digits));

export function formatDay(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
