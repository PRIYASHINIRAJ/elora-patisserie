import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import Logo from '../components/Logo';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo light />
        </div>
        <p className="text-center text-[11px] tracking-wide-cap uppercase text-champagne/40 mb-8">
          Studio Admin
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-champagne/50 mb-2">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-champagne/20 bg-transparent text-champagne px-4 py-3 text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-champagne/50 mb-2">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-champagne/20 bg-transparent text-champagne px-4 py-3 text-sm focus:outline-none focus:border-gold"
            />
          </div>

          {error && <p className="text-sm text-dusty-rose">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-champagne text-espresso py-3.5 text-xs tracking-wide-cap uppercase hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {submitting ? 'Logging in…' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
