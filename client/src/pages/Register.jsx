import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/account');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <p className="text-xs tracking-wide-cap uppercase text-gold mb-3 text-center">Join Élora</p>
      <h1 className="font-display text-4xl mb-10 text-center">Create your account</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Full name</label>
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
        </div>
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
          <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
          <p className="text-xs text-espresso/40 mt-1">At least 8 characters.</p>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-espresso text-champagne py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-espresso/60 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-gold underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
