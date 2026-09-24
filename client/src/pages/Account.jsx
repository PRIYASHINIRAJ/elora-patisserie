import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';

export default function Account() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: user?.full_name || '', phone: user?.phone || '' });
  const [saved, setSaved] = useState(false);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    orderService.mine().then((d) => {
      const allPayments = d.orders.flatMap((o) =>
        (o.payments || []).map((p) => ({ ...p, order_number: o.order_number }))
      );
      setPayments(allPayments);
    }).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
      <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">My Account</p>
      <h1 className="font-display text-5xl mb-4">Hello, {user?.full_name?.split(' ')[0]}.</h1>
      <p className="text-espresso/60 mb-12">{user?.email}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
        <Link to="/orders" className="border border-espresso/15 p-6 hover:border-gold transition-colors">
          <h3 className="font-display text-xl mb-1">Order History</h3>
          <p className="text-sm text-espresso/50">View your past and current orders.</p>
        </Link>
        <Link to="/messages" className="border border-espresso/15 p-6 hover:border-gold transition-colors">
          <h3 className="font-display text-xl mb-1">Messages</h3>
          <p className="text-sm text-espresso/50">Chat with the Élora studio team.</p>
        </Link>
        <Link to="/favourites" className="border border-espresso/15 p-6 hover:border-gold transition-colors">
          <h3 className="font-display text-xl mb-1">Favourites</h3>
          <p className="text-sm text-espresso/50">Cakes you've saved for later.</p>
        </Link>
        <Link to="/addresses" className="border border-espresso/15 p-6 hover:border-gold transition-colors">
          <h3 className="font-display text-xl mb-1">Addresses</h3>
          <p className="text-sm text-espresso/50">Manage your saved delivery addresses.</p>
        </Link>
      </div>

      {payments.length > 0 && (
        <div className="border-t border-espresso/10 pt-10 mb-10">
          <h2 className="font-display text-2xl mb-6">Payment History</h2>
          <div className="divide-y divide-espresso/10">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex justify-between text-sm">
                <div>
                  <p>{p.order_number}</p>
                  <p className="text-espresso/50 text-xs">{new Date(p.created_at).toLocaleDateString()} · {p.method || p.provider}</p>
                </div>
                <div className="text-right">
                  <p>RM {p.amount.toFixed(2)}</p>
                  <p className={`text-xs ${p.status === 'succeeded' ? 'text-green-700' : 'text-red-700'}`}>{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-espresso/10 pt-10">
        <h2 className="font-display text-2xl mb-6">Profile Details</h2>
        <form onSubmit={handleSave} className="space-y-5 max-w-md">
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Full name</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
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
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="bg-espresso text-champagne px-7 py-3 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
            >
              Save Changes
            </button>
            {saved && <span className="text-sm text-gold">Saved.</span>}
          </div>
        </form>

        <button onClick={handleLogout} className="mt-10 text-sm text-espresso/50 underline hover:text-espresso">
          Log out
        </button>
      </div>
    </div>
  );
}
