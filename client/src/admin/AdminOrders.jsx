import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { orderService } from '../services/orderService';

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
const STATUS_STYLE = {
  pending: 'bg-gold/20 text-mocha',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-champagne text-mocha',
  ready: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-espresso/10 text-espresso/50',
};
const PAYMENT_STYLE = {
  unpaid: 'text-espresso/50',
  processing: 'text-mocha',
  paid: 'text-green-700',
  failed: 'text-red-700',
  refunded: 'text-espresso/50',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = {};
    if (filter) params.status = filter;
    if (search) params.search = search;
    orderService.adminList(params).then((d) => setOrders(d.orders)).catch(() => setError('Could not load orders.'));
  }, [filter, search]);

  return (
    <div className="px-8 py-10 lg:px-12">
      <h1 className="font-display text-4xl text-espresso mb-6">Orders</h1>

      <div className="relative max-w-sm mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order number, name, or email…"
          className="w-full border border-espresso/20 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gold"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['', ...STATUSES].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 text-[11px] tracking-wide-cap uppercase border ${
              filter === s ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/60'
            }`}
          >
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      {error && <p className="text-red-700 text-sm">{error}</p>}

      {!orders ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-espresso/20 bg-white p-12 text-center max-w-xl">
          <p className="text-espresso/60 text-sm">No orders here yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-espresso/10 divide-y divide-espresso/10">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/admin/orders/${order.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 hover:bg-champagne/10"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{order.order_number}</p>
                <p className="text-xs text-espresso/50 mt-1 truncate">
                  {order.customer_name} · {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'} · {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center flex-wrap gap-3 shrink-0">
                <span className={`text-xs ${PAYMENT_STYLE[order.payment_status] || ''}`}>{order.payment_status}</span>
                <span className={`text-[11px] tracking-wide-cap uppercase px-3 py-1 rounded-full whitespace-nowrap ${STATUS_STYLE[order.status] || ''}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <span className="font-display text-lg sm:w-24 sm:text-right">RM {order.total.toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
