import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useBanner } from '../hooks/useBanner';
import { api } from '../api/client';

// Standalone transfer page: "Start Transfer" reveals a from/to/amount form,
// Confirm calls api.transfer, and a "Transaction History" button jumps to the
// from-account's detail page (which already renders full transaction history).
export function TransferPage() {
  const { accountNumber } = useParams();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [myAccounts, setMyAccounts] = useState([]);
  const [started, setStarted] = useState(false);
  const [fromAccount, setFromAccount] = useState(accountNumber);
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [banner, showBanner] = useBanner();

  useEffect(() => {
    api.getCustomerAccounts(customer.customerId).then(setMyAccounts).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!(value > 0) || !toAccount.trim()) return;
    setSubmitting(true);
    try {
      await api.transfer(fromAccount, toAccount.trim(), value);
      navigate(`/accounts/${fromAccount}`, {
        state: { banner: { type: 'success', text: `Transferred $${value.toFixed(2)} to ${toAccount.trim()}.` } },
      });
    } catch (err) {
      showBanner('error', err.message);
      setSubmitting(false);
    }
  }

  return (
    <Layout banner={banner}>
      <Link className="back-link" to={`/accounts/${accountNumber}`}>&larr; Back to account</Link>
      <div className="simple-form-page">
        <div className="simple-form-card">
          <h1>Transfer</h1>
          {!started ? (
            <div className="form-actions">
              <button className="primary" onClick={() => setStarted(true)}>Start Transfer</button>
              <button onClick={() => navigate(`/accounts/${accountNumber}`)}>Transaction History</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                From Account
                <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)}>
                  {myAccounts.map((a) => (
                    <option key={a.accountNumber} value={a.accountNumber}>
                      {(a.nickname || a.accountType)} · •••• {a.accountNumber.slice(-4)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                To Account (account number)
                <input value={toAccount} onChange={(e) => setToAccount(e.target.value)} placeholder="Account number" />
              </label>
              <label>
                Amount
                <input type="number" min="0.01" step="0.01" placeholder="$0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </label>
              <div className="form-actions">
                <button className="primary" type="submit" disabled={submitting}>Confirm</button>
                <button type="button" onClick={() => setStarted(false)} disabled={submitting}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
