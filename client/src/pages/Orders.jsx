import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PAYMENT_STYLE = {
  unpaid: 'text-espresso/50',
  processing: 'text-mocha',
  paid: 'text-green-700',
  failed: 'text-red-700',
  refunded: 'text-espresso/50',
};

export default function Orders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    orderService.mine().then((d) => setOrders(d.orders)).catch(() => setOrders([]));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
      <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">My Account</p>
      <h1 className="font-display text-5xl mb-10">Order History</h1>

      {!orders ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-espresso/20 p-12 text-center">
          <p className="font-display text-2xl mb-3">You haven't placed any orders yet.</p>
          <Link to="/collection" className="text-gold text-sm tracking-wide-cap uppercase underline">
            Browse the Collection
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-espresso/10 border border-espresso/10">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between p-5 hover:bg-cream/50">
              <div>
                <p className="font-display text-lg">{order.order_number}</p>
                <p className="text-xs text-espresso/50 mt-1">
                  {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'} · {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg">RM {order.total.toFixed(2)}</p>
                <p className={`text-xs mt-1 ${PAYMENT_STYLE[order.payment_status] || ''}`}>
                  {STATUS_LABEL[order.status] || order.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
