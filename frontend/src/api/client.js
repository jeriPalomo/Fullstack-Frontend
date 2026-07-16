// Thrown by request() on any non-2xx response so callers can read err.status/err.message.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// The JWT issued at login is stored here (alongside the customer profile,
// which AuthContext manages under its own key) and attached to every request.
const TOKEN_KEY = 'customer-portal.token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// AuthProvider registers a callback here on mount (it has router access; this
// plain module doesn't) so a 401 from any request - expired/invalid/missing
// token - can trigger an automatic logout + redirect to /login.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

// Shared fetch wrapper used by every api.* method below.
// Prefixes the backend base path, sends/expects JSON, attaches the bearer
// token when present, and normalizes errors + empty bodies.
async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (HTTP ${res.status}).`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      // no JSON body to read, fall back to the status-based message
    }
    if (res.status === 401 && unauthorizedHandler) unauthorizedHandler();
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// One method per backend endpoint. IDs are encodeURIComponent'd since they're
// interpolated straight into the URL path.
export const api = {
  login: (userName, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ userName, password }) }),
  register: (customer) => request('/auth/register', { method: 'POST', body: JSON.stringify(customer) }),

  getCustomers: () => request('/customers'),
  getCustomer: (customerId) => request(`/customers/${encodeURIComponent(customerId)}`),
  createCustomer: (customer) => request('/customers', { method: 'POST', body: JSON.stringify(customer) }),
  deleteCustomer: (customerId) => request(`/customers/${encodeURIComponent(customerId)}`, { method: 'DELETE' }),
  freezeCustomer: (customerId) => request(`/customers/${encodeURIComponent(customerId)}/freeze`, { method: 'PUT' }),
  unfreezeCustomer: (customerId) => request(`/customers/${encodeURIComponent(customerId)}/unfreeze`, { method: 'PUT' }),
  getCustomerAccounts: (customerId) => request(`/customers/${encodeURIComponent(customerId)}/accounts`),

  getAllAccounts: () => request('/accounts'),
  getAccount: (accountNumber) => request(`/accounts/${encodeURIComponent(accountNumber)}`),
  createAccount: (account) => request('/accounts', { method: 'POST', body: JSON.stringify(account) }),
  renameAccount: (accountNumber, nickname) =>
    request(`/accounts/${encodeURIComponent(accountNumber)}/nickname`, { method: 'PUT', body: JSON.stringify({ nickname }) }),
  deleteAccount: (accountNumber) => request(`/accounts/${encodeURIComponent(accountNumber)}`, { method: 'DELETE' }),
  freezeAccount: (accountNumber) => request(`/accounts/${encodeURIComponent(accountNumber)}/freeze`, { method: 'PUT' }),
  unfreezeAccount: (accountNumber) => request(`/accounts/${encodeURIComponent(accountNumber)}/unfreeze`, { method: 'PUT' }),
  deposit: (accountNumber, amount) =>
    request(`/accounts/${encodeURIComponent(accountNumber)}/deposit`, { method: 'POST', body: JSON.stringify({ amount }) }),
  withdraw: (accountNumber, amount) =>
    request(`/accounts/${encodeURIComponent(accountNumber)}/withdraw`, { method: 'POST', body: JSON.stringify({ amount }) }),
  transfer: (accountNumber, toAccountNumber, amount) =>
    request(`/accounts/${encodeURIComponent(accountNumber)}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ toAccountNumber, amount }),
    }),
  addJointOwner: (accountNumber, customerId) =>
    request(`/accounts/${encodeURIComponent(accountNumber)}/joint-owners/${encodeURIComponent(customerId)}`, {
      method: 'POST',
    }),
};
