import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useBanner } from '../hooks/useBanner';
import { api } from '../api/client';

const currency = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// Standalone withdraw page: amount in, Confirm, back to the account detail page.
export function WithdrawPage() {
  const { accountNumber } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [banner, showBanner] = useBanner();

  useEffect(() => {
    api.getAccount(accountNumber).then(setAccount).catch(() => {});
  }, [accountNumber]);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!(value > 0)) return;
    if (account && value > account.balance) {
      showBanner('error', 'Amount exceeds available balance.');
      return;
    }
    setSubmitting(true);
    try {
      await api.withdraw(accountNumber, value);
      navigate(`/accounts/${accountNumber}`, { state: { banner: { type: 'success', text: `Withdrew $${value.toFixed(2)}.` } } });
    } catch (err) {
      showBanner('error', err.message);
      setSubmitting(false);
    }
  }

  return (
    <Layout banner={banner}>
      <Link className="back-link" to={`/accounts/${accountNumber}`}>&larr; Back to account</Link>
      <div className="simple-form-page">
        <form className="simple-form-card" onSubmit={handleSubmit}>
          <h1>Withdraw{account ? ` from ${account.nickname || account.accountType}` : ''}</h1>
          {account && <p className="muted">Available balance: {currency(account.balance)}</p>}
          <label>
            Amount
            <input
              autoFocus
              type="number"
              min="0.01"
              step="0.01"
              placeholder="$0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button className="primary" type="submit" disabled={submitting}>Confirm</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
