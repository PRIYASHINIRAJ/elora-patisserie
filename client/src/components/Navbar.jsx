import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, User, ShoppingBag, Search } from 'lucide-react';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { notificationService } from '../services/notificationService';

const links = [
  { to: '/', label: 'Home' },
  { to: '/collection', label: 'Collection' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/our-story', label: 'Our Story' },
  { to: '/custom-cake', label: 'Custom Cakes' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { count, openCart } = useCart();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const transparent = isHome && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const textColor = transparent ? 'text-champagne' : 'text-espresso';
  const linkColor = transparent ? 'text-champagne/85 hover:text-champagne' : 'text-espresso/80 hover:text-espresso';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        transparent
          ? 'bg-transparent py-2'
          : 'bg-ivory/90 backdrop-blur-md border-b border-espresso/10 py-0 shadow-[0_1px_0_rgba(0,0,0,0.02)]'
      }`}
    >
      <div className={`max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between transition-all duration-500 ${transparent ? 'h-24' : 'h-16'}`}>
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo light={transparent} compact={!transparent} />
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `text-[13px] tracking-wide-cap uppercase font-body transition-colors ${
                  isActive ? 'text-gold' : linkColor
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className={`hidden lg:flex items-center gap-6 ${textColor}`}>
          <button aria-label="Search" className={linkColor}>
            <Search size={18} strokeWidth={1.4} />
          </button>
          {user && <NotificationBell fetchFn={notificationService.mine} markReadFn={notificationService.markMineRead} dark={transparent} />}
          <button onClick={openCart} aria-label="Cart" className={`relative ${linkColor}`}>
            <ShoppingBag size={20} strokeWidth={1.4} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold text-ivory text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
          <Link
            to={user ? '/account' : '/login'}
            className={`flex items-center gap-2 text-[13px] tracking-wide-cap uppercase ${linkColor}`}
          >
            <User size={18} strokeWidth={1.4} />
            {user ? user.full_name?.split(' ')[0] : 'Login'}
          </Link>
        </div>

        <button className={`lg:hidden ${textColor}`} onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-espresso/10 bg-ivory">
          <div className="px-6 py-6 flex flex-col gap-5">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className="text-sm tracking-wide-cap uppercase text-espresso/80"
              >
                {l.label}
              </NavLink>
            ))}
            <hr className="border-espresso/10" />
            <button
              onClick={() => { setOpen(false); openCart(); }}
              className="text-sm tracking-wide-cap uppercase text-espresso/80 text-left"
            >
              Cart {count > 0 && `(${count})`}
            </button>
            <Link
              to={user ? '/account' : '/login'}
              onClick={() => setOpen(false)}
              className="text-sm tracking-wide-cap uppercase text-espresso/80"
            >
              {user ? 'My Account' : 'Login'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
