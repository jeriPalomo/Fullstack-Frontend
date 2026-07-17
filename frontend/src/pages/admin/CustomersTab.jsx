import { useEffect, useState } from 'react';
import { AccountCard } from '../../components/AccountCard';
import { Modal } from '../../components/Modal';
import { ConfirmDangerModal } from '../../components/ConfirmDangerModal';
import { SettingsMenu } from '../../components/SettingsMenu';
import { api } from '../../api/client';

const currency = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

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
  accountType: 'Checking',
  nickname: '',
  balance: '',
  directDeposit: false,
  apy: '',
  termMonths: '',
};

// Admin's single directory view: a list of customers (searchable by name, not
// customerId) where each row expands to lazy-load that customer's own
// accounts. Admins can view accounts and open new ones (including
// Certificates) here, but every account-editing action (deposit/withdraw/
// transfer/rename) is owner-only and enforced server-side - the admin panel
// only ever exposes account-level Settings (freeze/delete), not edits.
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

  // { customerId, account } for the account pending freeze/unfreeze confirmation.
  const [pendingFreeze, setPendingFreeze] = useState(null);
  const [freezing, setFreezing] = useState(false);

  // { customerId, account } for the account pending a type-to-confirm delete.
  const [pendingAccountDelete, setPendingAccountDelete] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Customer pending freeze/unfreeze confirmation (freezes login, not an account).
  const [pendingCustomerFreeze, setPendingCustomerFreeze] = useState(null);
  const [customerFreezing, setCustomerFreezing] = useState(false);

  // Customer pending a type-to-confirm delete.
  const [pendingCustomerDelete, setPendingCustomerDelete] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

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

  async function confirmCustomerDelete() {
    const customer = pendingCustomerDelete;
    setDeletingCustomer(true);
    try {
      await api.deleteCustomer(customer.customerId);
      showBanner('success', `Customer ${customer.name} deleted.`);
      setPendingCustomerDelete(null);
      load();
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setDeletingCustomer(false);
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

  async function handleCreateAccount(e, customerId) {
    e.preventDefault();
    try {
      const created = await api.createAccount({
        ...accountForm,
        primaryOwner: customerId,
        nickname: accountForm.nickname.trim() || undefined,
        balance: Number(accountForm.balance),
        apy: Number(accountForm.apy),
        termMonths: accountForm.accountType === 'Certificate' ? Number(accountForm.termMonths) : undefined,
      });
      showBanner('success', `Account ${created.accountNumber} opened.`);
      setAccountForm(emptyAccountForm);
      setOpenAccountFormFor(null);
      loadAccountsFor(customerId);
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function confirmAccountDelete() {
    const { customerId, account } = pendingAccountDelete;
    setDeletingAccount(true);
    try {
      await api.deleteAccount(account.accountNumber);
      showBanner('success', `Account ${account.accountNumber} closed.`);
      setPendingAccountDelete(null);
      loadAccountsFor(customerId);
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setDeletingAccount(false);
    }
  }

  function openFreezeModal(customerId, account) {
    setPendingFreeze({ customerId, account });
  }

  async function confirmToggleFrozen() {
    const { customerId, account } = pendingFreeze;
    setFreezing(true);
    try {
      if (account.status === 'FROZEN') {
        await api.unfreezeAccount(account.accountNumber);
        showBanner('success', `Account ${account.accountNumber} unfrozen.`);
      } else {
        await api.freezeAccount(account.accountNumber);
        showBanner('success', `Account ${account.accountNumber} frozen.`);
      }
      setPendingFreeze(null);
      loadAccountsFor(customerId);
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setFreezing(false);
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
                    <SettingsMenu
                      label="Customer Settings"
                      items={[
                        {
                          key: 'freeze',
                          label: c.frozen ? 'Unfreeze Customer' : 'Freeze Customer',
                          onSelect: () => setPendingCustomerFreeze(c),
                        },
                        {
                          key: 'delete',
                          label: 'Delete Customer',
                          danger: true,
                          onSelect: () => setPendingCustomerDelete(c),
                        },
                      ]}
                    />
                    <button onClick={() => setOpenAccountFormFor(openAccountFormFor === c.customerId ? null : c.customerId)}>
                      {openAccountFormFor === c.customerId ? 'Cancel' : '+ Open Account'}
                    </button>
                  </div>

                  {openAccountFormFor === c.customerId && (
                    <form className="inline-form" onSubmit={(e) => handleCreateAccount(e, c.customerId)}>
                      <select value={accountForm.accountType} onChange={updateAccountField('accountType')}>
                        <option>Checking</option>
                        <option>Savings</option>
                        <option>Certificate</option>
                      </select>
                      <input placeholder="Nickname (optional)" value={accountForm.nickname} onChange={updateAccountField('nickname')} />
                      <input required type="number" step="0.01" placeholder="Initial Balance" value={accountForm.balance} onChange={updateAccountField('balance')} />
                      <input required type="number" step="0.01" placeholder="APY %" value={accountForm.apy} onChange={updateAccountField('apy')} />
                      {accountForm.accountType === 'Certificate' && (
                        <input required type="number" min="1" step="1" placeholder="Term (months)" value={accountForm.termMonths} onChange={updateAccountField('termMonths')} />
                      )}
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
                          adminActions={
                            <div className="account-actions">
                              <span className="muted">
                                {account.primaryOwner === c.customerId ? 'Primary owner' : `Joint owner · Primary: ${account.primaryOwnerName}`}
                              </span>
                              <SettingsMenu
                                label="Account Settings"
                                items={[
                                  {
                                    key: 'freeze',
                                    label: account.status === 'FROZEN' ? 'Unfreeze Account' : 'Freeze Account',
                                    disabled: account.status === 'CLOSED',
                                    onSelect: () => openFreezeModal(c.customerId, account),
                                  },
                                  {
                                    key: 'delete-account',
                                    label: 'Delete Account',
                                    danger: true,
                                    disabled: account.status === 'CLOSED',
                                    onSelect: () => setPendingAccountDelete({ customerId: c.customerId, account }),
                                  },
                                  {
                                    key: 'delete-customer',
                                    label: 'Delete Customer',
                                    danger: true,
                                    onSelect: () => setPendingCustomerDelete(c),
                                  },
                                ]}
                              />
                            </div>
                          }
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
        open={!!pendingFreeze}
        onClose={() => setPendingFreeze(null)}
        title={pendingFreeze?.account.status === 'FROZEN' ? 'Unfreeze this account?' : 'Freeze this account?'}
        actions={
          <>
            <button className="primary" disabled={freezing} onClick={confirmToggleFrozen}>
              {pendingFreeze?.account.status === 'FROZEN' ? 'Confirm Unfreeze' : 'Confirm Freeze'}
            </button>
            <button disabled={freezing} onClick={() => setPendingFreeze(null)}>Cancel</button>
          </>
        }
      >
        {pendingFreeze && (
          <>
            <dl className="details-grid">
              <div><dt>Account Type</dt><dd>{pendingFreeze.account.accountType}</dd></div>
              <div><dt>Account Number</dt><dd>{pendingFreeze.account.accountNumber}</dd></div>
              <div><dt>Routing Number</dt><dd>{pendingFreeze.account.routingNumber}</dd></div>
              <div><dt>Primary Owner</dt><dd>{pendingFreeze.account.primaryOwnerName}</dd></div>
              <div><dt>Joint Owner(s)</dt><dd>{pendingFreeze.account.jointOwnerNames.length ? pendingFreeze.account.jointOwnerNames.join(', ') : 'None'}</dd></div>
              <div><dt>Balance</dt><dd>{currency(pendingFreeze.account.balance)}</dd></div>
              <div><dt>Current Status</dt><dd><span className={`status-badge status-badge-${pendingFreeze.account.status.toLowerCase()}`}>{pendingFreeze.account.status}</span></dd></div>
            </dl>
            <p className="muted">
              {pendingFreeze.account.status === 'FROZEN'
                ? 'Unfreezing this account will restore the ability to deposit, withdraw, and transfer funds.'
                : 'Freezing this account will immediately block all deposits, withdrawals, and transfers until it is unfrozen.'}
            </p>
          </>
        )}
      </Modal>

      <ConfirmDangerModal
        open={!!pendingAccountDelete}
        onClose={() => setPendingAccountDelete(null)}
        title="Delete this account?"
        confirmText={pendingAccountDelete?.account.accountNumber}
        confirmLabel="Delete Account"
        busy={deletingAccount}
        onConfirm={confirmAccountDelete}
      >
        {pendingAccountDelete && (
          <dl className="details-grid">
            <div><dt>Account Type</dt><dd>{pendingAccountDelete.account.accountType}</dd></div>
            <div><dt>Account Number</dt><dd>{pendingAccountDelete.account.accountNumber}</dd></div>
            <div><dt>Balance</dt><dd>{currency(pendingAccountDelete.account.balance)}</dd></div>
          </dl>
        )}
      </ConfirmDangerModal>

      <ConfirmDangerModal
        open={!!pendingCustomerDelete}
        onClose={() => setPendingCustomerDelete(null)}
        title="Delete this customer?"
        confirmText={pendingCustomerDelete?.userName}
        confirmLabel="Delete Customer"
        busy={deletingCustomer}
        onConfirm={confirmCustomerDelete}
      >
        {pendingCustomerDelete && (
          <dl className="details-grid">
            <div><dt>Name</dt><dd>{pendingCustomerDelete.name}</dd></div>
            <div><dt>Username</dt><dd>{pendingCustomerDelete.userName}</dd></div>
            <div><dt>Email</dt><dd>{pendingCustomerDelete.email}</dd></div>
          </dl>
        )}
      </ConfirmDangerModal>

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
