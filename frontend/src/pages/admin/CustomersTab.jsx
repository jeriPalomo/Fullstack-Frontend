import { useEffect, useState } from 'react';
import { AccountCard } from '../../components/AccountCard';
import { Modal } from '../../components/Modal';
import { api } from '../../api/client';

const emptyCustomerForm = {
  userName: '',
  password: '',
  name: '',
  email: '',
  phoneNumber: '',
  branchLocation: '',
  postalCode: '',
};

const emptyAccountForm = {
  nickname: '',
  balance: '',
  directDeposit: false,
  apy: '',
  termMonths: '',
};

// Admin's single directory view: a list of customers (searchable by name, not
// customerId) where each row expands to lazy-load that customer's own
// accounts, read-only. Admins can view any account and open Certificates on a
// customer's behalf, but every other account action (deposit/withdraw/
// transfer/rename/freeze/close) is owner-only, enforced server-side - the
// only action admins have here at all is freezing the customer's login.
export function CustomersTab({ showBanner }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCustomerForm);

  // customerId -> accounts[], populated lazily the first time a row is expanded.
  // `null` means "currently loading"; a missing key means "not requested yet".
  const [accountsByCustomer, setAccountsByCustomer] = useState({});

  const [openAccountFormFor, setOpenAccountFormFor] = useState(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);

  // Customer pending freeze/unfreeze confirmation (freezes login, not an account).
  const [pendingCustomerFreeze, setPendingCustomerFreeze] = useState(null);
  const [customerFreezing, setCustomerFreezing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setCustomers(await api.getCustomers());
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

  async function loadAccountsFor(customerId) {
    setAccountsByCustomer((prev) => ({ ...prev, [customerId]: null }));
    try {
      const accounts = await api.getCustomerAccounts(customerId);
      setAccountsByCustomer((prev) => ({ ...prev, [customerId]: accounts }));
    } catch (err) {
      showBanner('error', err.message);
      setAccountsByCustomer((prev) => {
        const next = { ...prev };
        delete next[customerId];
        return next;
      });
    }
  }

  function handleRowToggle(customerId, e) {
    if (e.target.open && accountsByCustomer[customerId] === undefined) {
      loadAccountsFor(customerId);
    }
  }

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function updateAccountField(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setAccountForm({ ...accountForm, [field]: value });
    };
  }

  async function handleCreateCustomer(e) {
    e.preventDefault();
    try {
      await api.createCustomer({ ...form, postalCode: Number(form.postalCode) });
      showBanner('success', `Customer ${form.userName} created.`);
      setForm(emptyCustomerForm);
      setShowForm(false);
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function confirmCustomerFreeze() {
    const customer = pendingCustomerFreeze;
    setCustomerFreezing(true);
    try {
      if (customer.frozen) {
        await api.unfreezeCustomer(customer.customerId);
        showBanner('success', `${customer.name} unfrozen.`);
      } else {
        await api.freezeCustomer(customer.customerId);
        showBanner('success', `${customer.name} frozen.`);
      }
      setPendingCustomerFreeze(null);
      load();
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setCustomerFreezing(false);
    }
  }

  // Admins can only open Certificates on a customer's behalf - Checking/Savings
  // stay self-service, enforced server-side too.
  async function handleCreateAccount(e, customerId) {
    e.preventDefault();
    try {
      const created = await api.createAccount({
        accountType: 'Certificate',
        primaryOwner: customerId,
        nickname: accountForm.nickname.trim() || undefined,
        balance: Number(accountForm.balance),
        apy: Number(accountForm.apy),
        termMonths: Number(accountForm.termMonths),
        directDeposit: accountForm.directDeposit,
      });
      showBanner('success', `Certificate ${created.accountNumber} opened.`);
      setAccountForm(emptyAccountForm);
      setOpenAccountFormFor(null);
      loadAccountsFor(customerId);
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  return (
    <div>
      <div className="toolbar">
        <h2>Customers</h2>
        <button className="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New Customer'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleCreateCustomer}>
          <input required placeholder="Username" value={form.userName} onChange={update('userName')} />
          <input required type="password" placeholder="Password" value={form.password} onChange={update('password')} />
          <input required placeholder="Name" value={form.name} onChange={update('name')} />
          <input required type="email" placeholder="Email" value={form.email} onChange={update('email')} />
          <input required placeholder="Phone" value={form.phoneNumber} onChange={update('phoneNumber')} />
          <input required placeholder="Branch" value={form.branchLocation} onChange={update('branchLocation')} />
          <input required type="number" placeholder="Postal Code" value={form.postalCode} onChange={update('postalCode')} />
          <button className="primary" type="submit">Create</button>
        </form>
      )}

      {loading && customers.length === 0 ? (
        <p>Loading...</p>
      ) : (
        <div className="customer-list">
          {customers.filter((c) => !c.admin).map((c) => {
            const accounts = accountsByCustomer[c.customerId];
            return (
              <details key={c.customerId} className="customer-row" onToggle={(e) => handleRowToggle(c.customerId, e)}>
                <summary>
                  <span>
                    <h3>{c.name}</h3>
                    <p className="muted">@{c.userName} · {c.email} · {c.branchLocation}</p>
                  </span>
                  <span className="customer-badges">
                    {c.frozen && <span className="status-badge status-badge-frozen">FROZEN</span>}
                  </span>
                </summary>

                <div className="customer-detail">
                  <div className="account-actions">
                    <button onClick={() => setPendingCustomerFreeze(c)}>{c.frozen ? 'Unfreeze' : 'Freeze'} Customer</button>
                    <button onClick={() => setOpenAccountFormFor(openAccountFormFor === c.customerId ? null : c.customerId)}>
                      {openAccountFormFor === c.customerId ? 'Cancel' : '+ Open Certificate'}
                    </button>
                  </div>

                  {openAccountFormFor === c.customerId && (
                    <form className="inline-form" onSubmit={(e) => handleCreateAccount(e, c.customerId)}>
                      <input placeholder="Nickname (optional)" value={accountForm.nickname} onChange={updateAccountField('nickname')} />
                      <input required type="number" step="0.01" placeholder="Initial Balance" value={accountForm.balance} onChange={updateAccountField('balance')} />
                      <input required type="number" step="0.01" placeholder="APY %" value={accountForm.apy} onChange={updateAccountField('apy')} />
                      <input required type="number" min="1" step="1" placeholder="Term (months)" value={accountForm.termMonths} onChange={updateAccountField('termMonths')} />
                      <label className="checkbox-label">
                        <input type="checkbox" checked={accountForm.directDeposit} onChange={updateAccountField('directDeposit')} />
                        Direct Deposit
                      </label>
                      <button className="primary" type="submit">Create</button>
                    </form>
                  )}

                  {accounts === undefined || accounts === null ? (
                    <p>Loading accounts...</p>
                  ) : accounts.length === 0 ? (
                    <p className="empty-state">No accounts.</p>
                  ) : (
                    <div className="account-grid">
                      {accounts.map((account) => (
                        <AccountCard
                          key={account.accountNumber}
                          account={account}
                          ownerLabel={account.primaryOwner === c.customerId ? 'Primary owner' : `Joint owner · Primary: ${account.primaryOwnerName}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}

      <Modal
        open={!!pendingCustomerFreeze}
        onClose={() => setPendingCustomerFreeze(null)}
        title={pendingCustomerFreeze?.frozen ? 'Unfreeze this customer?' : 'Freeze this customer?'}
        actions={
          <>
            <button className="primary" disabled={customerFreezing} onClick={confirmCustomerFreeze}>
              {pendingCustomerFreeze?.frozen ? 'Confirm Unfreeze' : 'Confirm Freeze'}
            </button>
            <button disabled={customerFreezing} onClick={() => setPendingCustomerFreeze(null)}>Cancel</button>
          </>
        }
      >
        {pendingCustomerFreeze && (
          <p className="muted">
            {pendingCustomerFreeze.frozen
              ? `Unfreezing ${pendingCustomerFreeze.name} will restore their ability to log in.`
              : `Freezing ${pendingCustomerFreeze.name} will immediately block them from logging in.`}
          </p>
        )}
      </Modal>
    </div>
  );
}
