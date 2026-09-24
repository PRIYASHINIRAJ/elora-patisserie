import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, CheckCircle2, DollarSign, Sparkles, Truck, MessageSquareText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { dashboardService } from '../services/cakeService';
import { useAdminAuth } from '../context/AdminAuthContext';

const statCards = [
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingBag, format: (v) => v },
  { key: 'pendingOrders', label: 'Pending', icon: Clock, format: (v) => v },
  { key: 'completedOrders', label: 'Completed', icon: CheckCircle2, format: (v) => v },
  { key: 'revenue', label: 'Revenue (Paid)', icon: DollarSign, format: (v) => `RM ${Number(v).toFixed(2)}` },
  { key: 'newEnquiries', label: 'New Enquiries', icon: Sparkles, format: (v) => v },
  { key: 'upcomingDeliveries', label: 'Upcoming Deliveries', icon: Truck, format: (v) => v },
  { key: 'unreadMessages', label: 'Unread Messages', icon: MessageSquareText, format: (v) => v },
];

const statusBreakdownKeys = [
  ['pendingOrders', 'Pending'],
  ['confirmedOrders', 'Confirmed'],
  ['preparingOrders', 'Preparing'],
  ['readyOrders', 'Ready'],
  ['outForDeliveryOrders', 'Out for Delivery'],
  ['completedOrders', 'Completed'],
  ['cancelledOrders', 'Cancelled'],
];

export default function AdminDashboard() {
  const { admin } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService
      .stats()
      .then(setData)
      .catch(() => setError('Could not load dashboard stats.'));
  }, []);

  return (
    <div className="px-8 py-10 lg:px-12">
      <p className="text-[11px] tracking-wide-cap uppercase text-mocha mb-2">Studio Overview</p>
      <h1 className="font-display text-4xl text-espresso mb-10">Welcome back, {admin?.full_name?.split(' ')[0]}.</h1>

      {error && <p className="text-red-700 text-sm mb-6">{error}</p>}

      {!data ? (
        <p className="text-espresso/50 text-sm">Loading dashboard…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {statCards.map(({ key, label, icon: Icon, format }) => (
              <div key={key} className="bg-white border border-espresso/10 p-6">
                <Icon className="text-gold mb-4" size={20} strokeWidth={1.5} />
                <p className="font-display text-3xl text-espresso mb-1">{format(data.stats[key])}</p>
                <p className="text-[11px] tracking-wide-cap uppercase text-espresso/50">{label}</p>
              </div>
            ))}
          </div>

          {/* Order status breakdown */}
          <div className="bg-white border border-espresso/10 p-6 mb-10">
            <h2 className="font-display text-xl mb-5">Orders by Status</h2>
            <div className="flex flex-wrap gap-3">
              {statusBreakdownKeys.map(([key, label]) => (
                <div key={key} className="flex-1 min-w-[100px] bg-cream/50 p-4 text-center">
                  <p className="font-display text-2xl">{data.stats[key]}</p>
                  <p className="text-[10px] tracking-wide-cap uppercase text-espresso/50 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white border border-espresso/10 p-6">
              <h2 className="font-display text-xl mb-5">Revenue — Last 14 Days</h2>
              {data.revenueTrend.length === 0 ? (
                <p className="text-sm text-espresso/40">No paid orders yet in this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B201915" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#2B201980' }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: '#2B201980' }} />
                    <Tooltip formatter={(v) => [`RM ${Number(v).toFixed(2)}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#B08A4E" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white border border-espresso/10 p-6">
              <h2 className="font-display text-xl mb-5">Popular Cakes</h2>
              {data.popularCakes.length === 0 ? (
                <p className="text-sm text-espresso/40">No orders yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.popularCakes} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B201915" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#2B201980' }} />
                    <YAxis dataKey="cake_name" type="category" width={110} tick={{ fontSize: 11, fill: '#2B2019' }} />
                    <Tooltip formatter={(v) => [v, 'Units Sold']} />
                    <Bar dataKey="units_sold" fill="#6B4C3B" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-espresso/10 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl">Recent Orders</h2>
                <Link to="/admin/orders" className="text-xs text-gold hover:underline">View all</Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-espresso/40">No orders yet.</p>
              ) : (
                <div className="divide-y divide-espresso/10">
                  {data.recentOrders.map((o) => (
                    <Link to={`/admin/orders/${o.id}`} key={o.id} className="py-3 flex justify-between text-sm hover:bg-cream/40 -mx-2 px-2">
                      <div>
                        <p className="font-medium">{o.order_number}</p>
                        <p className="text-espresso/50">{o.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="capitalize">{o.status.replace(/_/g, ' ')}</p>
                        <p className="text-espresso/50">RM {Number(o.total).toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-espresso/10 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl">Recent Enquiries</h2>
                <Link to="/admin/custom-requests" className="text-xs text-gold hover:underline">View all</Link>
              </div>
              {data.recentEnquiries.length === 0 ? (
                <p className="text-sm text-espresso/40">No custom requests yet.</p>
              ) : (
                <div className="divide-y divide-espresso/10">
                  {data.recentEnquiries.map((e) => (
                    <div key={e.id} className="py-3 flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{e.full_name}</p>
                        <p className="text-espresso/50">{e.occasion || '—'}</p>
                      </div>
                      <p className="capitalize text-espresso/60">{e.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
