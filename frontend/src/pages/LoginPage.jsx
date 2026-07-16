import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
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
      const loggedIn = await login(userName.trim(), password);
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
          Username
          <input value={userName} onChange={(e) => setUserName(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="hint">
          Demo customer: sonia.jain / pass123 &nbsp;·&nbsp; Demo admin: priya.admin / admin123
        </p>
        <p className="hint">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </form>
    </div>
  );
}
