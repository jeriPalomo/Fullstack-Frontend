import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const emptyForm = {
  customerId: '',
  password: '',
  name: '',
  email: '',
  phoneNumber: '',
  branchLocation: '',
  postalCode: '',
};

// Admin tab: lists all customers in a table and supports creating, deleting,
// and freezing/unfreezing them. `load()` re-fetches the list after every
// mutation so the table always reflects the server's current state.
export function CustomersTab({ showBanner }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

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

  // Returns an onChange handler for a single form field, so each input only
  // needs update('fieldName') instead of a bespoke handler.
  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  // postalCode is typed as a number field but stored as a string in form state,
  // so it's coerced back to a number before hitting the API.
  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.createCustomer({ ...form, postalCode: Number(form.postalCode) });
      showBanner('success', `Customer ${form.customerId} created.`);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleDelete(customerId) {
    try {
      await api.deleteCustomer(customerId);
      showBanner('success', `Customer ${customerId} deleted.`);
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleToggleFrozen(customer) {
    try {
      if (customer.frozen) {
        await api.unfreezeCustomer(customer.customerId);
        showBanner('success', `${customer.customerId} unfrozen.`);
      } else {
        await api.freezeCustomer(customer.customerId);
        showBanner('success', `${customer.customerId} frozen.`);
      }
      load();
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
        <form className="inline-form" onSubmit={handleCreate}>
          <input required placeholder="Customer ID" value={form.customerId} onChange={update('customerId')} />
          <input required type="password" placeholder="Password" value={form.password} onChange={update('password')} />
          <input required placeholder="Name" value={form.name} onChange={update('name')} />
          <input required type="email" placeholder="Email" value={form.email} onChange={update('email')} />
          <input required placeholder="Phone" value={form.phoneNumber} onChange={update('phoneNumber')} />
          <input required placeholder="Branch" value={form.branchLocation} onChange={update('branchLocation')} />
          <input required type="number" placeholder="Postal Code" value={form.postalCode} onChange={update('postalCode')} />
          <button className="primary" type="submit">Create</button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Branch</th>
              <th>Frozen</th>
              <th>Admin</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.customerId}>
                <td>{c.customerId}</td>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.branchLocation}</td>
                <td>{c.frozen ? 'Yes' : 'No'}</td>
                <td>{c.admin ? 'Yes' : 'No'}</td>
                <td className="row-actions">
                  <button onClick={() => handleToggleFrozen(c)}>{c.frozen ? 'Unfreeze' : 'Freeze'}</button>
                  <button className="danger" onClick={() => handleDelete(c.customerId)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
