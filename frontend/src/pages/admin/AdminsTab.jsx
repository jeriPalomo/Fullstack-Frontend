import { useEffect, useState } from 'react';
import { api } from '../../api/client';

// Admin tab: a plain, read-only list of admin users (bank employees, not
// customers). Admins can't freeze or delete other admins, so unlike
// CustomersTab this table has no action column at all.
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
