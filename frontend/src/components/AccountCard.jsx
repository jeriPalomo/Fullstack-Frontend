import { useState } from 'react';

const currency = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const isCredit = (type) => type === 'DEPOSIT' || type === 'TRANSFER_IN';

// Read-only account summary used on the admin panel: balance, status, and
// transaction history, plus an `adminActions` slot for the Settings menu.
// Admins can view an account's details but never deposit/withdraw/transfer/
// rename it - those stay owner-only, both here and enforced server-side.
export function AccountCard({ account, adminActions }) {
  const [showHistory, setShowHistory] = useState(false);
  const status = account.status || 'ACTIVE';
  const locked = account.accountType === 'Certificate' && !account.matured;

  return (
    <div className="account-card">
      <div className="account-card-header">
        <div>
          <h3>{account.nickname ? `${account.nickname} · ` : ''}{account.accountType} · {account.accountNumber}</h3>
          <p className="muted">Routing {account.routingNumber} · APY {account.apy}%</p>
          {account.accountType === 'Certificate' && (
            <p className="muted">
              {account.termMonths}-month term · Matures {account.maturityDate}
              {locked && <span className="status-badge status-badge-frozen"> Locked</span>}
            </p>
          )}
        </div>
        <div>
          <div className="balance">{currency(account.balance)}</div>
          <span className={`status-badge status-badge-${status.toLowerCase()}`}>{status}</span>
        </div>
      </div>

      {adminActions}

      <button className="link-button" onClick={() => setShowHistory((v) => !v)}>
        {showHistory ? 'Hide' : 'Show'} transaction history ({account.transactionHistory.length})
      </button>
      {showHistory && (
        <ul className="transaction-history">
          {account.transactionHistory.slice().reverse().map((t) => (
            <li key={t.id} className="transaction-history-item">
              <div>
                <div className="transaction-history-desc">{t.description}</div>
                <div className="transaction-history-date">{new Date(t.timestamp).toLocaleString()}</div>
              </div>
              <div className="transaction-history-right">
                <span className={isCredit(t.type) ? 'transaction-amount-credit' : 'transaction-amount-debit'}>
                  {isCredit(t.type) ? '+' : '-'}{currency(t.amount)}
                </span>
                <div className="transaction-history-balance">Balance: {currency(t.balanceAfter)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
