import { useState, Suspense } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cake,
  GalleryHorizontal,
  Image,
  Clapperboard,
  ShoppingBag,
  MessageSquareText,
  Sparkles,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import NotificationBell from './NotificationBell';
import { notificationService } from '../services/notificationService';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/cakes', label: 'Cakes', icon: Cake },
  { to: '/admin/portfolio', label: 'Portfolio', icon: GalleryHorizontal },
  { to: '/admin/media', label: 'Media Library', icon: Image },
  { to: '/admin/studio-videos', label: 'Studio Reels', icon: Clapperboard },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/custom-requests', label: 'Custom Requests', icon: Sparkles },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquareText },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ admin, handleLogout, onNavigate }) {
  return (
    <>
      <div className="px-6 py-7 border-b border-champagne/10">
        <p className="font-display text-2xl">Élora</p>
        <p className="text-[11px] tracking-wide-cap uppercase text-champagne/50 mt-1">Studio Admin</p>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive ? 'bg-champagne/10 text-champagne' : 'text-champagne/60 hover:bg-champagne/5 hover:text-champagne'
              }`
            }
          >
            <Icon size={17} strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-5 border-t border-champagne/10">
        <p className="text-xs text-champagne/50 mb-2 truncate">{admin?.email}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-champagne/70 hover:text-champagne"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const currentLabel = nav.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label || 'Admin';

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Desktop sidebar — static, always visible at lg+ */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-espresso text-champagne flex-col">
        <SidebarContent admin={admin} handleLogout={handleLogout} />
      </aside>

      {/* Mobile off-canvas sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-espresso/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-espresso text-champagne flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-6 right-4 text-champagne/60 hover:text-champagne"
            >
              <X size={22} />
            </button>
            <SidebarContent admin={admin} handleLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-40 bg-espresso text-champagne flex items-center justify-between px-4 h-16 border-b border-champagne/10">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="text-champagne">
            <Menu size={22} />
          </button>
          <p className="font-display text-lg truncate">{currentLabel}</p>
          <NotificationBell fetchFn={notificationService.admin} markReadFn={notificationService.markAdminRead} dark />
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:flex justify-end px-8 lg:px-12 pt-6">
          <NotificationBell fetchFn={notificationService.admin} markReadFn={notificationService.markAdminRead} />
        </div>

        <Suspense
          fallback={
            <div className="p-12 text-espresso/40 text-sm tracking-wide-cap uppercase">Loading…</div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
