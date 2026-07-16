import { useEffect, useState } from 'react';
import { AccountCard } from '../../components/AccountCard';
import { Modal } from '../../components/Modal';
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
};

// Admin's single directory view: a list of customers (searchable by name, not
// customerId) where each row expands to lazy-load and manage that customer's
// own accounts. Replaces the old separate Customers/Accounts tabs - looking up
// an account by customerId wasn't useful to an admin, so accounts now live
// under the person they belong to instead of a flat global list.
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

  async function handleDeleteCustomer(customerId) {
    try {
      await api.deleteCustomer(customerId);
      showBanner('success', `Customer ${customerId} deleted.`);
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleToggleCustomerFrozen(customer) {
    try {
      if (customer.frozen) {
        await api.unfreezeCustomer(customer.customerId);
        showBanner('success', `${customer.name} unfrozen.`);
      } else {
        await api.freezeCustomer(customer.customerId);
        showBanner('success', `${customer.name} frozen.`);
      }
      load();
    } catch (err) {
      showBanner('error', err.message);
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
      });
      showBanner('success', `Account ${created.accountNumber} opened.`);
      setAccountForm(emptyAccountForm);
      setOpenAccountFormFor(null);
      loadAccountsFor(customerId);
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleDeleteAccount(customerId, accountNumber) {
    try {
      await api.deleteAccount(accountNumber);
      showBanner('success', `Account ${accountNumber} closed.`);
      loadAccountsFor(customerId);
    } catch (err) {
      showBanner('error', err.message);
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

  async function handleDeposit(customerId, accountNumber, amount) {
    try {
      await api.deposit(accountNumber, amount);
      showBanner('success', `Deposited $${amount.toFixed(2)} into ${accountNumber}.`);
      loadAccountsFor(customerId);
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleWithdraw(customerId, accountNumber, amount) {
    try {
      await api.withdraw(accountNumber, amount);
      showBanner('success', `Withdrew $${amount.toFixed(2)} from ${accountNumber}.`);
      loadAccountsFor(customerId);
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleTransfer(customerId, accountNumber, toAccountNumber, amount) {
    try {
      await api.transfer(accountNumber, toAccountNumber, amount);
      showBanner('success', `Transferred $${amount.toFixed(2)} to ${toAccountNumber}.`);
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
                    <button onClick={() => handleToggleCustomerFrozen(c)}>{c.frozen ? 'Unfreeze' : 'Freeze'} Customer</button>
                    <button className="danger" onClick={() => handleDeleteCustomer(c.customerId)}>Delete Customer</button>
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
                          onDeposit={(accountNumber, amount) => handleDeposit(c.customerId, accountNumber, amount)}
                          onWithdraw={(accountNumber, amount) => handleWithdraw(c.customerId, accountNumber, amount)}
                          onTransfer={(accountNumber, toAccountNumber, amount) => handleTransfer(c.customerId, accountNumber, toAccountNumber, amount)}
                          adminActions={
                            <div className="account-actions">
                              <span className="muted">{account.primaryOwner === c.customerId ? 'Primary owner' : 'Joint owner'}</span>
                              {account.status !== 'CLOSED' && (
                                <button onClick={() => openFreezeModal(c.customerId, account)}>
                                  {account.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
                                </button>
                              )}
                              <button className="danger" disabled={account.status === 'CLOSED'} onClick={() => handleDeleteAccount(c.customerId, account.accountNumber)}>
                                Close Account
                              </button>
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
              <div><dt>Primary Owner</dt><dd>{pendingFreeze.account.primaryOwner}</dd></div>
              <div><dt>Joint Owner(s)</dt><dd>{pendingFreeze.account.jointOwners.length ? pendingFreeze.account.jointOwners.join(', ') : 'None'}</dd></div>
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
    </div>
  );
}
