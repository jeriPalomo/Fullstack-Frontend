import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken, setToken, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

// Persist the logged-in customer in localStorage so a page refresh doesn't log them out.
// The JWT itself lives under its own key, managed by api/client.js.
const STORAGE_KEY = 'customer-portal.customer';

// Wraps the app and exposes { customer, login, logout } to any descendant via useAuth().
export function AuthProvider({ children }) {
  // Lazy initializer: read any previously-saved session once, on first render.
  const [customer, setCustomer] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setCustomer(null);
    localStorage.removeItem(STORAGE_KEY);
    clearToken();
  }, []);

  // client.js is a plain module with no router access of its own, so it calls
  // back into here on any 401 (expired/invalid/missing token) to log out and
  // send the user back to the login page.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate('/login', { replace: true });
    });
  }, [logout, navigate]);

  async function login(userName, password) {
    const { token, customer: loggedIn } = await api.login(userName, password);
    setToken(token);
    setCustomer(loggedIn);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
    return loggedIn;
  }

  // Registers a new customer, then logs them straight in with the password
  // they just chose (the register response never carries the password back).
  async function register(newCustomer) {
    await api.register(newCustomer);
    return login(newCustomer.userName, newCustomer.password);
  }

  return (
    <AuthContext.Provider value={{ customer, login, register, logout }}>
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
