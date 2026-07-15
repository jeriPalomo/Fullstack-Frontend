import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  customerId: '',
  password: '',
  name: '',
  email: '',
  phoneNumber: '',
  branchLocation: '',
  postalCode: '',
};

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ ...form, customerId: form.customerId.trim(), postalCode: Number(form.postalCode) });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        {error && <div className="banner banner-error">{error}</div>}
        <label>
          Customer ID
          <input value={form.customerId} onChange={update('customerId')} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={update('password')} required />
        </label>
        <label>
          Name
          <input value={form.name} onChange={update('name')} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} required />
        </label>
        <label>
          Phone
          <input value={form.phoneNumber} onChange={update('phoneNumber')} required />
        </label>
        <label>
          Branch
          <input value={form.branchLocation} onChange={update('branchLocation')} required />
        </label>
        <label>
          Postal Code
          <input type="number" value={form.postalCode} onChange={update('postalCode')} required />
        </label>
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
        <p className="hint">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
