import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
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
      navigate(location.state?.from?.pathname || '/account');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <p className="text-xs tracking-wide-cap uppercase text-gold mb-3 text-center">Welcome back</p>
      <h1 className="font-display text-4xl mb-10 text-center">Log in to your account</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-espresso text-champagne py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
        >
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="text-center text-sm text-espresso/60 mt-8">
        New to Élora?{' '}
        <Link to="/register" className="text-gold underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
