import { useState } from 'react';
import { Layout } from '../components/Layout';
import { CustomersTab } from './admin/CustomersTab';
import { AccountsTab } from './admin/AccountsTab';
import { useBanner } from '../hooks/useBanner';

// Admin landing page: a simple two-tab shell (Customers / Accounts) that
// delegates all the real work to CustomersTab / AccountsTab. Both tabs share
// one banner instance so success/error toasts show consistently either way.
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
        <button className={tab === 'accounts' ? 'active' : ''} onClick={() => setTab('accounts')}>
          Accounts
        </button>
      </div>
      {tab === 'customers' ? <CustomersTab showBanner={showBanner} /> : <AccountsTab showBanner={showBanner} />}
    </Layout>
  );
}
