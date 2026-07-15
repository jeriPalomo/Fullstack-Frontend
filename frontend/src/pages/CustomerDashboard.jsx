import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { AccountCard } from '../components/AccountCard';
import { useAuth } from '../context/AuthContext';
import { useBanner } from '../hooks/useBanner';
import { api } from '../api/client';

// Landing page for a logged-in (non-admin) customer: lists their accounts and
// lets them deposit/withdraw/transfer via AccountCard. Every mutating action
// re-fetches the account list afterward so balances stay in sync with the server.
export function CustomerDashboard() {
  const { customer } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, showBanner] = useBanner();

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

  // Fetch accounts once on mount (customer.customerId is stable for the session).
  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeposit(accountNumber, amount) {
    try {
      await api.deposit(accountNumber, amount);
      showBanner('success', `Deposited $${amount.toFixed(2)} into ${accountNumber}.`);
      loadAccounts();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleWithdraw(accountNumber, amount) {
    try {
      await api.withdraw(accountNumber, amount);
      showBanner('success', `Withdrew $${amount.toFixed(2)} from ${accountNumber}.`);
      loadAccounts();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleTransfer(accountNumber, toAccountNumber, amount) {
    try {
      await api.transfer(accountNumber, toAccountNumber, amount);
      showBanner('success', `Transferred $${amount.toFixed(2)} to ${toAccountNumber}.`);
      loadAccounts();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  return (
    <Layout banner={banner}>
      <h1>Welcome, {customer.name}</h1>
      {loading ? (
        <p>Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <p>You don't have any accounts yet. Contact an admin to open one.</p>
      ) : (
        <div className="account-grid">
          {accounts.map((account) => (
            <AccountCard
              key={account.accountNumber}
              account={account}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              onTransfer={handleTransfer}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
