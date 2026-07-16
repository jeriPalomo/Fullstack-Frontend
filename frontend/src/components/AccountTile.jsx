import { Link } from 'react-router-dom';

const currency = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// Simplified, clickable home-page card for one account. Unlike AccountCard
// (which keeps the full inline deposit/withdraw/transfer/close controls for
// the admin panel), this just links through to the account detail page.
export function AccountTile({ account }) {
  const last4 = account.accountNumber.slice(-4);
  return (
    <Link className="account-tile" to={`/accounts/${account.accountNumber}`}>
      <p className="tile-name">
        {account.nickname || account.accountType}
        {account.status === 'FROZEN' && <span className="status-badge status-badge-frozen"> Frozen</span>}
      </p>
      <p className="muted">•••• {last4}</p>
      <p className="tile-balance">{currency(account.balance)}</p>
    </Link>
  );
}
