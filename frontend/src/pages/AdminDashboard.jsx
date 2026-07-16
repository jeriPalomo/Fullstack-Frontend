import { useState } from 'react';
import { Layout } from '../components/Layout';
import { CustomersTab } from './admin/CustomersTab';
import { AdminsTab } from './admin/AdminsTab';
import { useBanner } from '../hooks/useBanner';

// Admin landing page: a two-tab shell (Customers / Admins). Customers is the
// directory of non-admin customers, each expandable to manage their own
// accounts; Admins is a separate, simpler list of admin users, since bank
// employees aren't customers and don't hold accounts.
export function AdminDashboard() {
  const [tab, setTab] = useState('customers');
  const [banner, showBanner] = useBanner();

  return (
    <Layout banner={banner}>
      <h1>Admin</h1>
      <div className="tabs">
        <button className={tab === 'customers' ? 'active' : ''} onClick={() => setTab('customers')}>
          Customers
        </button>
        <button className={tab === 'admins' ? 'active' : ''} onClick={() => setTab('admins')}>
          Admins
        </button>
      </div>
      {tab === 'customers' ? <CustomersTab showBanner={showBanner} /> : <AdminsTab showBanner={showBanner} />}
    </Layout>
  );
}
