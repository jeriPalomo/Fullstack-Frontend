import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { AccountTile } from '../components/AccountTile';
import { useAuth } from '../context/AuthContext';
import { useBanner } from '../hooks/useBanner';
import { api } from '../api/client';

// Default APY applied when a customer self-opens an account, matching the
// values used for the same account types in the seed data.
const DEFAULT_APY = { Checking: 0.01, Savings: 3.75 };

const emptyForm = { nickname: '', balance: '' };

// Home page for a logged-in (non-admin) customer: accounts grouped into
// Checking / Savings / Certificate sections. Checking and Savings each get a
// "+ Add account" button (self-service, via a small form); Certificates are
// admin-opened only, per spec, so no add button there.
export function CustomerDashboard() {
  const { customer } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, showBanner] = useBanner();
  const [openForm, setOpenForm] = useState(null); // 'Checking' | 'Savings' | null
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  async function loadAccounts() {
    setLoading(true);
    try {
      setAccounts(await api.getCustomerAccounts(customer.customerId));
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startOpenForm(accountType) {
    setForm(emptyForm);
    setOpenForm(accountType);
  }

  async function handleCreate(e, accountType) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createAccount({
        accountType,
        primaryOwner: customer.customerId,
        nickname: form.nickname.trim() || undefined,
        balance: Number(form.balance) || 0,
        directDeposit: false,
        apy: DEFAULT_APY[accountType],
      });
      showBanner('success', `${accountType} account opened.`);
      setOpenForm(null);
      setForm(emptyForm);
      loadAccounts();
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setCreating(false);
    }
  }

  // Closed accounts are read-only and have nothing left to do on the dashboard,
  // so they're dropped here rather than shown alongside active accounts.
  const activeAccounts = accounts.filter((a) => a.status !== 'CLOSED');
  const buckets = {
    Checking: activeAccounts.filter((a) => a.accountType === 'Checking'),
    Savings: activeAccounts.filter((a) => a.accountType === 'Savings'),
    Certificate: activeAccounts.filter((a) => a.accountType !== 'Checking' && a.accountType !== 'Savings'),
  };

  function renderOpenForm(accountType) {
    if (openForm !== accountType) return null;
    return (
      <form className="inline-form" onSubmit={(e) => handleCreate(e, accountType)}>
        <input
          placeholder="Account nickname (optional)"
          value={form.nickname}
          onChange={(e) => setForm({ ...form, nickname: e.target.value })}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Opening deposit"
          value={form.balance}
          onChange={(e) => setForm({ ...form, balance: e.target.value })}
        />
        <button className="primary" type="submit" disabled={creating}>Create</button>
        <button type="button" onClick={() => setOpenForm(null)} disabled={creating}>Cancel</button>
      </form>
    );
  }

  function renderSection(title, accountType, accountList, canAdd) {
    return (
      <section className="home-section">
        <div className="home-section-header">
          <h2>{title}</h2>
          {canAdd && (
            <button className="accent" onClick={() => (openForm === accountType ? setOpenForm(null) : startOpenForm(accountType))}>
              {openForm === accountType ? 'Cancel' : `+ Add ${title} Account`}
            </button>
          )}
        </div>
        {renderOpenForm(accountType)}
        {accountList.length === 0 ? (
          <p className="empty-state">No {title.toLowerCase()} accounts yet.</p>
        ) : (
          <div className="tile-grid">
            {accountList.map((account) => (
              <AccountTile key={account.accountNumber} account={account} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <Layout banner={banner}>
      <h1>Welcome, {customer.name}</h1>
      {loading ? (
        <p>Loading accounts...</p>
      ) : (
        <>
          {renderSection('Checking', 'Checking', buckets.Checking, true)}
          {renderSection('Savings', 'Savings', buckets.Savings, true)}
          {renderSection('Certificates', 'Certificate', buckets.Certificate, false)}
        </>
      )}
    </Layout>
  );
}
