import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useBanner } from '../hooks/useBanner';
import { api } from '../api/client';

const currency = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const label = (a) => `${a.nickname || a.accountType} · •••• ${a.accountNumber.slice(-4)}`;

// Dedicated Transfer page, reachable either from the top nav (no preselected
// account) or from an account's own page (accountNumber pre-fills "From").
// Both From and To are dropdowns over the customer's own accounts - there's
// no free-text account number entry, so a typo can't send money to the wrong
// place. Submitting opens a confirmation summary; the transfer only actually
// happens once that's confirmed.
export function TransferPage() {
  const { accountNumber } = useParams();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [myAccounts, setMyAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState(accountNumber || '');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [banner, showBanner] = useBanner();

  useEffect(() => {
    api.getCustomerAccounts(customer.customerId).then((accounts) => {
      // Only accounts that can actually send/receive a transfer right now.
      const transactable = accounts.filter((a) => a.status === 'ACTIVE');
      setMyAccounts(transactable);
      setFromAccount((prev) => prev || transactable[0]?.accountNumber || '');
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A Certificate that hasn't matured yet can't send a transfer (receiving is fine).
  const fromOptions = myAccounts.filter((a) => !(a.accountType === 'Certificate' && !a.matured));
  const toOptions = myAccounts.filter((a) => a.accountNumber !== fromAccount);
  const fromDetail = myAccounts.find((a) => a.accountNumber === fromAccount);
  const toDetail = myAccounts.find((a) => a.accountNumber === toAccount);

  function openConfirm(e) {
    e.preventDefault();
    if (!fromAccount || !toAccount || !(Number(amount) > 0)) return;
    setShowConfirm(true);
  }

  async function handleConfirm() {
    const value = Number(amount);
    setSubmitting(true);
    try {
      await api.transfer(fromAccount, toAccount, value);
      navigate(`/accounts/${fromAccount}`, {
        state: { banner: { type: 'success', text: `Transferred ${currency(value)} to ${toDetail ? label(toDetail) : toAccount}.` } },
      });
    } catch (err) {
      setShowConfirm(false);
      showBanner('error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout banner={banner}>
      {accountNumber && <Link className="back-link" to={`/accounts/${accountNumber}`}>&larr; Back to account</Link>}
      <div className="simple-form-page">
        <form className="simple-form-card" onSubmit={openConfirm}>
          <h1>Transfer</h1>
          <label>
            From Account
            <select required value={fromAccount} onChange={(e) => setFromAccount(e.target.value)}>
              <option value="" disabled>Select an account</option>
              {fromOptions.map((a) => (
                <option key={a.accountNumber} value={a.accountNumber}>{label(a)}</option>
              ))}
            </select>
          </label>
          <label>
            To Account
            <select required value={toAccount} onChange={(e) => setToAccount(e.target.value)}>
              <option value="" disabled>Select an account</option>
              {toOptions.map((a) => (
                <option key={a.accountNumber} value={a.accountNumber}>{label(a)}</option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input type="number" min="0.01" step="0.01" placeholder="$0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <div className="form-actions">
            <button className="primary" type="submit">Confirm</button>
          </div>
        </form>
      </div>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm this transfer?"
        actions={
          <>
            <button className="primary" disabled={submitting} onClick={handleConfirm}>Confirm</button>
            <button disabled={submitting} onClick={() => setShowConfirm(false)}>Cancel</button>
          </>
        }
      >
        <dl className="details-grid">
          <div><dt>From</dt><dd>{fromDetail ? label(fromDetail) : fromAccount}</dd></div>
          <div><dt>To</dt><dd>{toDetail ? label(toDetail) : toAccount}</dd></div>
          <div><dt>Amount</dt><dd>{currency(Number(amount) || 0)}</dd></div>
        </dl>
        <p className="muted">Double-check the accounts and amount - this can't be undone.</p>
      </Modal>
    </Layout>
  );
}
