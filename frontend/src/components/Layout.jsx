import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Shared page chrome: top bar with nav/logout plus an optional status banner.
// Pages pass their content as children and their own banner state as `banner`.
export function Layout({ banner, children }) {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">Citibank Customer Portal</Link>
        {customer && (
          <nav className="nav-links">
            {!customer.admin && <Link to="/">Accounts</Link>}
            {!customer.admin && <Link to="/transfer">Transfer</Link>}
            <Link to="/profile">User Profile</Link>
            {customer.admin && <Link to="/admin">Admin</Link>}
            <span className="nav-user">{customer.name}</span>
            <button className="link-button" onClick={handleLogout}>Log out</button>
          </nav>
        )}
      </header>
      {banner && <div className={`banner banner-${banner.type}`}>{banner.text}</div>}
      <main className="content">{children}</main>
    </div>
  );
}
