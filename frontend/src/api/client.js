// Thrown by request() on any non-2xx response so callers can read err.status/err.message.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Shared fetch wrapper used by every api.* method below.
// Prefixes the backend base path, sends/expects JSON, and normalizes errors + empty bodies.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!res.ok) {
    let message = `Request failed (HTTP ${res.status}).`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      // no JSON body to read, fall back to the status-based message
    }
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
