import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Calls the shared login() from AuthContext, then routes to the admin or
  // customer dashboard depending on the returned account's `admin` flag.
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedIn = await login(customerId.trim(), password);
      navigate(loggedIn.admin ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Sign in</h1>
        {error && <div className="banner banner-error">{error}</div>}
        <label>
          Customer ID
          <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="hint">
          Demo customer: C001 / pass123 &nbsp;·&nbsp; Demo admin: A001 / admin123
        </p>
      </form>
    </div>
  );
}
