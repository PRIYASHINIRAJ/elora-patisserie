import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../services/notificationService';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    notificationService.admin().then((d) => {
      setNotifications(d.notifications);
      if (d.unreadCount > 0) notificationService.markAdminRead();
    });
  }, []);

  return (
    <div className="px-8 py-10 lg:px-12 max-w-3xl">
      <h1 className="font-display text-4xl text-espresso mb-8">Notifications</h1>

      {!notifications ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="border border-dashed border-espresso/20 bg-white p-12 text-center">
          <p className="text-espresso/60 text-sm">Nothing here yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-espresso/10 divide-y divide-espresso/10">
          {notifications.map((n) => (
            <Link key={n.id} to={n.link || '#'} className={`block p-5 hover:bg-champagne/10 ${!n.is_read ? 'bg-champagne/5' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium">{n.title}</p>
                <span className="text-xs text-espresso/40">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              {n.body && <p className="text-sm text-espresso/60 mt-1">{n.body}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
