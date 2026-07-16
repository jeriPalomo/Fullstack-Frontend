import { useEffect, useState } from 'react';
import { AccountCard } from '../../components/AccountCard';
import { api } from '../../api/client';

const emptyForm = {
  accountType: 'Checking',
  nickname: '',
  primaryOwner: '',
  balance: '',
  directDeposit: false,
  apy: '',
};

// Admin tab: lists every account (across all customers) as AccountCards and
// supports opening new accounts. Reuses the same AccountCard as the customer
// dashboard, adding a "Close Account" button + owner label via `adminActions`.
export function AccountsTab({ showBanner }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    try {
      setAccounts(await api.getAllAccounts());
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Returns an onChange handler for a single form field; handles checkboxes
  // (directDeposit) separately since they use `checked` instead of `value`.
  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm({ ...form, [field]: value });
    };
  }

  // balance/apy are number inputs but stored as strings in form state,
  // so they're coerced back to numbers before hitting the API.
  async function handleCreate(e) {
    e.preventDefault();
    try {
      const created = await api.createAccount({
        ...form,
        nickname: form.nickname.trim() || undefined,
        balance: Number(form.balance),
        apy: Number(form.apy),
      });
      showBanner('success', `Account ${created.accountNumber} opened.`);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleDelete(accountNumber) {
    try {
      await api.deleteAccount(accountNumber);
      showBanner('success', `Account ${accountNumber} closed.`);
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleToggleFrozen(account) {
    try {
      if (account.status === 'FROZEN') {
        await api.unfreezeAccount(account.accountNumber);
        showBanner('success', `Account ${account.accountNumber} unfrozen.`);
      } else {
        await api.freezeAccount(account.accountNumber);
        showBanner('success', `Account ${account.accountNumber} frozen.`);
      }
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleDeposit(accountNumber, amount) {
    try {
      await api.deposit(accountNumber, amount);
      showBanner('success', `Deposited $${amount.toFixed(2)} into ${accountNumber}.`);
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleWithdraw(accountNumber, amount) {
    try {
      await api.withdraw(accountNumber, amount);
      showBanner('success', `Withdrew $${amount.toFixed(2)} from ${accountNumber}.`);
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleTransfer(accountNumber, toAccountNumber, amount) {
    try {
      await api.transfer(accountNumber, toAccountNumber, amount);
      showBanner('success', `Transferred $${amount.toFixed(2)} to ${toAccountNumber}.`);
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  return (
    <div>
      <div className="toolbar">
        <h2>Accounts</h2>
        <button className="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Open Account'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <select value={form.accountType} onChange={update('accountType')}>
            <option>Checking</option>
            <option>Savings</option>
            <option>Certificate</option>
          </select>
          <input placeholder="Nickname (optional)" value={form.nickname} onChange={update('nickname')} />
          <input required placeholder="Primary Owner (Customer ID)" value={form.primaryOwner} onChange={update('primaryOwner')} />
          <input required type="number" step="0.01" placeholder="Initial Balance" value={form.balance} onChange={update('balance')} />
          <input required type="number" step="0.01" placeholder="APY %" value={form.apy} onChange={update('apy')} />
          <label className="checkbox-label">
            <input type="checkbox" checked={form.directDeposit} onChange={update('directDeposit')} />
            Direct Deposit
          </label>
          <button className="primary" type="submit">Create</button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="account-grid">
          {accounts.map((account) => (
            <AccountCard
              key={account.accountNumber}
              account={account}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              onTransfer={handleTransfer}
              adminActions={
                <div className="account-actions">
                  <span className="muted">Owner: {account.primaryOwner}</span>
                  {account.status !== 'CLOSED' && (
                    <button onClick={() => handleToggleFrozen(account)}>
                      {account.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
                    </button>
                  )}
                  <button className="danger" disabled={account.status === 'CLOSED'} onClick={() => handleDelete(account.accountNumber)}>
                    Close Account
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
