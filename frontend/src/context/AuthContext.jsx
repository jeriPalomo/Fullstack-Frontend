import { createContext, useContext, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

// Persist the logged-in customer in localStorage so a page refresh doesn't log them out.
const STORAGE_KEY = 'customer-portal.customer';

// Wraps the app and exposes { customer, login, logout } to any descendant via useAuth().
export function AuthProvider({ children }) {
  // Lazy initializer: read any previously-saved session once, on first render.
  const [customer, setCustomer] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  async function login(customerId, password) {
    const loggedIn = await api.login(customerId, password);
    setCustomer(loggedIn);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
    return loggedIn;
  }

  function logout() {
    setCustomer(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ customer, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook for consuming auth state; throws early if used outside AuthProvider
// (catches the mistake of forgetting to wrap a component in <AuthProvider>).
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
