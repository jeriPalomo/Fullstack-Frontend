import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { EditableAccountName } from '../components/EditableAccountName';
import { Modal } from '../components/Modal';
import { ConfirmDangerModal } from '../components/ConfirmDangerModal';
import { SettingsMenu } from '../components/SettingsMenu';
import { useAuth } from '../context/AuthContext';
import { useBanner } from '../hooks/useBanner';
import { api } from '../api/client';

const currency = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const TYPE_LABELS = {
  DEPOSIT: 'Deposit',
  WITHDRAW: 'Withdraw',
  TRANSFER_OUT: 'Transfer',
  TRANSFER_IN: 'Transfer',
};

const emptyFilters = { type: 'ALL', minAmount: '', maxAmount: '', fromDate: '', toDate: '' };

const isCredit = (type) => type === 'DEPOSIT' || type === 'TRANSFER_IN';

// Account detail page: editable nickname + masked number, big centered balance,
// a collapsible dropdown of account facts, deposit/withdraw/transfer buttons that
// hand off to the dedicated pages, and a filterable transaction history built on
// the structured Transaction records (id/type/amount/timestamp) from the backend.
export function AccountDetailPage() {
  const { accountNumber } = useParams();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [banner, showBanner] = useBanner();
  const [filters, setFilters] = useState(emptyFilters);
  const [freezing, setFreezing] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Deposit/Withdraw/Transfer pages navigate back here with a confirmation
  // banner in router state rather than duplicating the banner UI on each page.
  useEffect(() => {
    if (location.state?.banner) {
      showBanner(location.state.banner.type, location.state.banner.text);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  async function load() {
    setLoading(true);
    try {
      setAccount(await api.getAccount(accountNumber));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNumber]);

  const isOwner = account && (account.primaryOwner === customer.customerId || account.jointOwners.includes(customer.customerId));
  const locked = account && account.accountType === 'Certificate' && !account.matured;
  // Freeze/close change the account's lifecycle state, so only the primary
  // owner can trigger them - joint owners can view and transact, not close.
  const isPrimaryOwner = account && account.primaryOwner === customer.customerId;

  function openFreezeModal() {
    setShowFreezeModal(true);
  }

  async function confirmToggleFrozen() {
    setFreezing(true);
    try {
      const updated = account.status === 'FROZEN' ? await api.unfreezeAccount(accountNumber) : await api.freezeAccount(accountNumber);
      setAccount(updated);
      showBanner('success', updated.status === 'FROZEN' ? 'Account frozen.' : 'Account unfrozen.');
      setShowFreezeModal(false);
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setFreezing(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteAccount(accountNumber);
      showBanner('success', 'Account closed.');
      setShowDeleteModal(false);
      load();
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setDeleting(false);
    }
  }

  const filteredHistory = useMemo(() => {
    if (!account) return [];
    return account.transactionHistory
      .filter((t) => {
        if (filters.type !== 'ALL') {
          const category = t.type === 'TRANSFER_OUT' || t.type === 'TRANSFER_IN' ? 'TRANSFER' : t.type;
          if (category !== filters.type) return false;
        }
        if (filters.minAmount && t.amount < Number(filters.minAmount)) return false;
        if (filters.maxAmount && t.amount > Number(filters.maxAmount)) return false;
        const ts = new Date(t.timestamp);
        if (filters.fromDate && ts < new Date(filters.fromDate)) return false;
        if (filters.toDate && ts > new Date(`${filters.toDate}T23:59:59`)) return false;
        return true;
      })
      .slice()
      .reverse();
  }, [account, filters]);

  if (notFound) return <Navigate to="/" replace />;

  return (
    <Layout banner={banner}>
      {loading || !account ? (
        <p>Loading account...</p>
      ) : !isOwner ? (
        <p>You don't have access to this account.</p>
      ) : (
        <>
          <Link className="back-link" to="/">&larr; Back to accounts</Link>

          <div className="account-detail-header">
            <EditableAccountName
              accountNumber={account.accountNumber}
              nickname={account.nickname || account.accountType}
              onSaved={(nickname) => setAccount({ ...account, nickname })}
              onError={(message) => showBanner('error', message)}
              disabled={account.status === 'CLOSED'}
            />
            <p className="account-mask">•••• {account.accountNumber.slice(-4)}</p>
            <p className="balance-big">{currency(account.balance)}</p>
            <span className={`status-badge status-badge-${account.status.toLowerCase()}`}>{account.status}</span>

            {account.status === 'FROZEN' && <p className="muted">This account is frozen. Deposits, withdrawals, and transfers are disabled.</p>}
            {locked && <p className="muted">This Certificate is locked until it matures on {account.maturityDate}. Deposits are still allowed.</p>}

            {account.status !== 'CLOSED' && (
              <div className="account-detail-actions">
                <button className="primary" disabled={account.status === 'FROZEN'} onClick={() => navigate(`/accounts/${accountNumber}/deposit`)}>Deposit</button>
                <button className="primary" disabled={account.status === 'FROZEN' || locked} onClick={() => navigate(`/accounts/${accountNumber}/withdraw`)}>Withdraw</button>
                <button className="primary" disabled={account.status === 'FROZEN' || locked} onClick={() => navigate(`/accounts/${accountNumber}/transfer`)}>Transfer</button>
              </div>
            )}

            {isPrimaryOwner && account.status !== 'CLOSED' && (
              <div className="account-detail-actions">
                <SettingsMenu
                  label="Account Settings"
                  items={[
                    {
                      key: 'freeze',
                      label: account.status === 'FROZEN' ? 'Unfreeze Account' : 'Freeze Account',
                      onSelect: openFreezeModal,
                    },
                    {
                      key: 'delete',
                      label: 'Delete Account',
                      danger: true,
                      disabled: account.balance !== 0,
                      onSelect: () => setShowDeleteModal(true),
                    },
                  ]}
                />
              </div>
            )}
          </div>

          <Modal
            open={showFreezeModal}
            onClose={() => setShowFreezeModal(false)}
            title={account.status === 'FROZEN' ? 'Unfreeze this account?' : 'Freeze this account?'}
            actions={
              <>
                <button className="primary" disabled={freezing} onClick={confirmToggleFrozen}>
                  {account.status === 'FROZEN' ? 'Confirm Unfreeze' : 'Confirm Freeze'}
                </button>
                <button disabled={freezing} onClick={() => setShowFreezeModal(false)}>Cancel</button>
              </>
            }
          >
            <dl className="details-grid">
              <div><dt>Account Type</dt><dd>{account.accountType}</dd></div>
              <div><dt>Account Number</dt><dd>{account.accountNumber}</dd></div>
              <div><dt>Routing Number</dt><dd>{account.routingNumber}</dd></div>
              <div><dt>Primary Owner</dt><dd>{account.primaryOwnerName}</dd></div>
              <div><dt>Joint Owner(s)</dt><dd>{account.jointOwnerNames.length ? account.jointOwnerNames.join(', ') : 'None'}</dd></div>
              <div><dt>Balance</dt><dd>{currency(account.balance)}</dd></div>
              <div><dt>Current Status</dt><dd><span className={`status-badge status-badge-${account.status.toLowerCase()}`}>{account.status}</span></dd></div>
            </dl>
            <p className="muted">
              {account.status === 'FROZEN'
                ? 'Unfreezing this account will restore the ability to deposit, withdraw, and transfer funds.'
                : 'Freezing this account will immediately block all deposits, withdrawals, and transfers until it is unfrozen.'}
            </p>
          </Modal>

          <ConfirmDangerModal
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete this account?"
            confirmText={account.accountNumber}
            confirmLabel="Delete Account"
            busy={deleting}
            onConfirm={handleDelete}
          >
            <dl className="details-grid">
              <div><dt>Account Type</dt><dd>{account.accountType}</dd></div>
              <div><dt>Account Number</dt><dd>{account.accountNumber}</dd></div>
              <div><dt>Balance</dt><dd>{currency(account.balance)}</dd></div>
            </dl>
          </ConfirmDangerModal>

          <details className="details-dropdown">
            <summary>Account details</summary>
            <dl className="details-grid">
              <div><dt>Account Type</dt><dd>{account.accountType}</dd></div>
              <div><dt>Account Number</dt><dd>{account.accountNumber}</dd></div>
              <div><dt>Routing Number</dt><dd>{account.routingNumber}</dd></div>
              <div><dt>Primary Owner</dt><dd>{account.primaryOwnerName}</dd></div>
              <div><dt>Joint Owner(s)</dt><dd>{account.jointOwnerNames.length ? account.jointOwnerNames.join(', ') : 'None'}</dd></div>
              <div><dt>APY</dt><dd>{account.apy}%</dd></div>
              <div><dt>Direct Deposit</dt><dd>{account.directDeposit ? 'Yes' : 'No'}</dd></div>
              {account.accountType === 'Certificate' && (
                <>
                  <div><dt>Term</dt><dd>{account.termMonths} months</dd></div>
                  <div><dt>Maturity Date</dt><dd>{account.maturityDate}</dd></div>
                </>
              )}
            </dl>
          </details>

          <section className="transaction-section">
            <h2>Transaction History</h2>
            <div className="transaction-filters">
              <div className="filter-group">
                <label htmlFor="filter-type">Type</label>
                <select id="filter-type" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                  <option value="ALL">All</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAW">Withdraw</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="filter-min">Min Amount</label>
                <input id="filter-min" type="number" min="0" step="0.01" value={filters.minAmount} onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })} />
              </div>
              <div className="filter-group">
                <label htmlFor="filter-max">Max Amount</label>
                <input id="filter-max" type="number" min="0" step="0.01" value={filters.maxAmount} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })} />
              </div>
              <div className="filter-group">
                <label htmlFor="filter-from">From</label>
                <input id="filter-from" type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
              </div>
              <div className="filter-group">
                <label htmlFor="filter-to">To</label>
                <input id="filter-to" type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
              </div>
              <button type="button" className="link-button" onClick={() => setFilters(emptyFilters)}>Clear filters</button>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="empty-state">No transactions match these filters.</p>
            ) : (
              <table className="transaction-table">
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Balance After</th></tr>
                </thead>
                <tbody>
                  {filteredHistory.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.timestamp).toLocaleString()}</td>
                      <td><span className={`transaction-type transaction-type-${t.type.toLowerCase()}`}>{TYPE_LABELS[t.type]}</span></td>
                      <td>{t.description}</td>
                      <td className={isCredit(t.type) ? 'transaction-amount-credit' : 'transaction-amount-debit'}>
                        {isCredit(t.type) ? '+' : '-'}{currency(t.amount)}
                      </td>
                      <td>{currency(t.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
