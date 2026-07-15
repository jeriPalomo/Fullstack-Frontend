import { useState } from 'react';

const currency = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// Reusable card showing one account's balance plus deposit/withdraw/transfer controls.
// Used on both the customer dashboard and the admin accounts tab; `adminActions`
// lets the admin view slot in extra buttons (e.g. Close Account) without a second component.
export function AccountCard({ account, onDeposit, onWithdraw, onTransfer, adminActions }) {
  const [amount, setAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Reads the amount input and returns it as a positive number, or null if invalid.
  function parsedAmount() {
    const value = Number(amount);
    return value > 0 ? value : null;
  }

  return (
    <div className="account-card">
      <div className="account-card-header">
        <div>
          <h3>{account.accountType} · {account.accountNumber}</h3>
          <p className="muted">Routing {account.routingNumber} · APY {account.apy}%</p>
        </div>
        <div className="balance">{currency(account.balance)}</div>
      </div>

      <div className="account-actions">
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={() => { const v = parsedAmount(); if (v) { onDeposit(account.accountNumber, v); setAmount(''); } }}>
          Deposit
        </button>
        <button onClick={() => { const v = parsedAmount(); if (v) { onWithdraw(account.accountNumber, v); setAmount(''); } }}>
          Withdraw
        </button>
      </div>

      <div className="account-actions">
        <input
          type="text"
          placeholder="Transfer to account #"
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
        />
        <button
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
          {account.transactionHistory.slice().reverse().map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
