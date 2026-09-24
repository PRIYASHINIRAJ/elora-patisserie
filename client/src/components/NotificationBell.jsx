import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr.replace(' ', 'T') + 'Z')) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ fetchFn, markReadFn, dark = false }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const load = () => {
    fetchFn().then((d) => {
      setNotifications(d.notifications);
      setUnreadCount(d.unreadCount);
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) {
      await markReadFn();
      setUnreadCount(0);
    }
  };

  const iconColor = dark ? 'text-champagne/80 hover:text-champagne' : 'text-espresso/70 hover:text-espresso';

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} aria-label="Notifications" className={`relative ${iconColor}`}>
        <Bell size={19} strokeWidth={1.4} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-gold text-ivory text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-ivory border border-espresso/10 shadow-xl z-50">
          <div className="px-4 py-3 border-b border-espresso/10">
            <p className="text-xs tracking-wide-cap uppercase text-espresso/50">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-espresso/40 px-4 py-8 text-center">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-espresso/10">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link || '#'}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-cream/60"
                >
                  <p className="text-sm text-espresso font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-espresso/60 mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-espresso/35 mt-1">{timeAgo(n.created_at)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
