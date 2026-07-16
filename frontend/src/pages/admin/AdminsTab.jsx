import { useEffect, useState } from 'react';
import { api } from '../../api/client';

// Admin tab: a plain list of admin users (bank employees, not customers - they
// don't hold accounts, so there's no expandable account section like CustomersTab).
export function AdminsTab({ showBanner }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const customers = await api.getCustomers();
      setAdmins(customers.filter((c) => c.admin));
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

  async function handleDelete(customerId) {
    try {
      await api.deleteCustomer(customerId);
      showBanner('success', `Admin ${customerId} deleted.`);
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  async function handleToggleFrozen(admin) {
    try {
      if (admin.frozen) {
        await api.unfreezeCustomer(admin.customerId);
        showBanner('success', `${admin.name} unfrozen.`);
      } else {
        await api.freezeCustomer(admin.customerId);
        showBanner('success', `${admin.name} frozen.`);
      }
      load();
    } catch (err) {
      showBanner('error', err.message);
    }
  }

  return (
    <div>
      <div className="toolbar">
        <h2>Admins</h2>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Branch</th>
              <th>Frozen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.customerId}>
                <td>{a.customerId}</td>
                <td>{a.userName}</td>
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{a.branchLocation}</td>
                <td>{a.frozen ? 'Yes' : 'No'}</td>
                <td className="row-actions">
                  <button onClick={() => handleToggleFrozen(a)}>{a.frozen ? 'Unfreeze' : 'Freeze'}</button>
                  <button className="danger" onClick={() => handleDelete(a.customerId)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
