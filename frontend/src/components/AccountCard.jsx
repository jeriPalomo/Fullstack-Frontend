import { useState } from 'react';

const currency = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const isCredit = (type) => type === 'DEPOSIT' || type === 'TRANSFER_IN';

// Reusable card showing one account's balance plus deposit/withdraw/transfer controls.
// Used on both the customer dashboard and the admin accounts tab; `adminActions`
// lets the admin view slot in extra buttons (e.g. Close Account) without a second component.
export function AccountCard({ account, onDeposit, onWithdraw, onTransfer, adminActions }) {
  const [amount, setAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const status = account.status || 'ACTIVE';
  const canTransact = status === 'ACTIVE';

  // Reads the amount input and returns it as a positive number, or null if invalid.
  function parsedAmount() {
    const value = Number(amount);
    return value > 0 ? value : null;
  }

  return (
    <div className="account-card">
      <div className="account-card-header">
        <div>
          <h3>{account.nickname ? `${account.nickname} · ` : ''}{account.accountType} · {account.accountNumber}</h3>
          <p className="muted">Routing {account.routingNumber} · APY {account.apy}%</p>
        </div>
        <div>
          <div className="balance">{currency(account.balance)}</div>
          <span className={`status-badge status-badge-${status.toLowerCase()}`}>{status}</span>
        </div>
      </div>

      <div className="account-actions">
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          disabled={!canTransact}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button disabled={!canTransact} onClick={() => { const v = parsedAmount(); if (v) { onDeposit(account.accountNumber, v); setAmount(''); } }}>
          Deposit
        </button>
        <button disabled={!canTransact} onClick={() => { const v = parsedAmount(); if (v) { onWithdraw(account.accountNumber, v); setAmount(''); } }}>
          Withdraw
        </button>
      </div>

      <div className="account-actions">
        <input
          type="text"
          placeholder="Transfer to account #"
          value={transferTo}
          disabled={!canTransact}
          onChange={(e) => setTransferTo(e.target.value)}
        />
        <button
          disabled={!canTransact}
          onClick={() => {
            const v = parsedAmount();
            if (v && transferTo.trim()) {
              onTransfer(account.accountNumber, transferTo.trim(), v);
              setAmount('');
              setTransferTo('');
            }
          }}
        >
          Transfer
        </button>
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
