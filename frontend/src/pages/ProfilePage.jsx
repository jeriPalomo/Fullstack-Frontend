import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

// Read-only summary of the logged-in customer's own profile info - all of it
// already lives in AuthContext from login, so this needs no extra API call.
export function ProfilePage() {
  const { customer } = useAuth();

  return (
    <Layout>
      <h1>User Profile</h1>
      <div className="profile-card">
        <div className="profile-card-header">
          <h2>{customer.name}</h2>
          <span className="customer-badges">
            {customer.admin && <span className="status-badge status-badge-active">ADMIN</span>}
            {customer.frozen && <span className="status-badge status-badge-frozen">FROZEN</span>}
          </span>
        </div>
        <dl className="details-grid">
          <div><dt>Customer ID</dt><dd>{customer.customerId}</dd></div>
          <div><dt>Username</dt><dd>{customer.userName}</dd></div>
          <div><dt>Email</dt><dd>{customer.email}</dd></div>
          <div><dt>Phone</dt><dd>{customer.phoneNumber}</dd></div>
          <div><dt>Branch</dt><dd>{customer.branchLocation}</dd></div>
          <div><dt>Postal Code</dt><dd>{customer.postalCode}</dd></div>
        </dl>
      </div>
    </Layout>
  );
}
