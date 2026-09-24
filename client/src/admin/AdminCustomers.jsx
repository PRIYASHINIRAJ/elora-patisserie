import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';

const statusStyle = {
  active: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = () => {
    api.get('/admin/customers', { params: search ? { search } : {} }).then((r) => setCustomers(r.data.customers));
  };

  useEffect(load, [search]);

  useEffect(() => {
    if (!selected) return;
    api.get(`/admin/customers/${selected}`).then((r) => setDetail(r.data));
  }, [selected]);

  const toggleStatus = async (customer) => {
    const next = customer.account_status === 'active' ? 'blocked' : 'active';
    if (next === 'blocked' && !window.confirm(`Block ${customer.full_name}'s account?`)) return;
    await api.patch(`/admin/customers/${customer.id}/status`, { accountStatus: next });
    load();
    if (selected === customer.id) api.get(`/admin/customers/${customer.id}`).then((r) => setDetail(r.data));
  };

  return (
    <div className="px-8 py-10 lg:px-12">
      <h1 className="font-display text-4xl text-espresso mb-6">Customers</h1>

      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full border border-espresso/20 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gold"
        />
      </div>

      {!customers ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : customers.length === 0 ? (
        <div className="border border-dashed border-espresso/20 bg-white p-12 text-center max-w-xl">
          <p className="text-espresso/60 text-sm">No customers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-espresso/10 divide-y divide-espresso/10">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full text-left p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${selected === c.id ? 'bg-champagne/20' : 'hover:bg-champagne/10'}`}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.full_name}</p>
                  <p className="text-xs text-espresso/50 truncate">{c.email} {c.phone && `· ${c.phone}`}</p>
                </div>
                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <p className="text-sm">{c.orderCount} order{c.orderCount === 1 ? '' : 's'}</p>
                    <p className="text-xs text-espresso/50">RM {c.totalSpent.toFixed(0)} spent</p>
                  </div>
                  <span className={`text-[10px] tracking-wide-cap uppercase px-2.5 py-1 rounded-full ${statusStyle[c.account_status]}`}>
                    {c.account_status}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white border border-espresso/10 p-6">
            {!detail ? (
              <p className="text-espresso/40 text-sm">Select a customer to view details.</p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-2xl">{detail.customer.full_name}</h2>
                  <span className={`text-[10px] tracking-wide-cap uppercase px-2.5 py-1 rounded-full ${statusStyle[detail.customer.account_status]}`}>
                    {detail.customer.account_status}
                  </span>
                </div>
                <p className="text-sm text-espresso/50 mb-5">{detail.customer.email}</p>

                <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                  <div className="bg-cream/50 p-3">
                    <p className="text-espresso/40 text-[11px] tracking-wide-cap uppercase">Total Spent</p>
                    <p className="font-display text-xl">RM {detail.customer.totalSpent.toFixed(0)}</p>
                  </div>
                  <div className="bg-cream/50 p-3">
                    <p className="text-espresso/40 text-[11px] tracking-wide-cap uppercase">Orders</p>
                    <p className="font-display text-xl">{detail.orders.length}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Recent Orders</p>
                  {detail.orders.length === 0 ? <p className="text-xs text-espresso/40">None yet.</p> : (
                    <div className="space-y-1.5">
                      {detail.orders.slice(0, 5).map((o) => (
                        <div key={o.id} className="flex justify-between text-sm">
                          <span>{o.order_number}</span>
                          <span className="text-espresso/50">RM {o.total.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Custom Requests</p>
                  <p className="text-sm">{detail.customRequests.length}</p>
                </div>

                <div className="mb-6">
                  <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Conversations</p>
                  <p className="text-sm">{detail.conversations.length}</p>
                </div>

                <button
                  onClick={() => toggleStatus(detail.customer)}
                  className={`w-full text-xs tracking-wide-cap uppercase px-4 py-2.5 border ${
                    detail.customer.account_status === 'active'
                      ? 'border-red-300 text-red-700 hover:bg-red-50'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  {detail.customer.account_status === 'active' ? 'Block Account' : 'Reactivate Account'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
