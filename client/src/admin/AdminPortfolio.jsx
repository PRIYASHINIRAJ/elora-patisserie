import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminPortfolioService } from '../services/adminPortfolioService';

export default function AdminPortfolio() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    adminPortfolioService.list().then((d) => setItems(d.items)).catch(() => setError('Could not load portfolio.'));
  };

  useEffect(load, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await adminPortfolioService.remove(id);
    load();
  };

  return (
    <div className="px-8 py-10 lg:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl text-espresso">Portfolio</h1>
        <Link
          to="/admin/portfolio/new"
          className="flex items-center gap-2 bg-espresso text-champagne px-5 py-2.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
        >
          <Plus size={15} /> Add Portfolio Item
        </Link>
      </div>

      {error && <p className="text-red-700 text-sm mb-4">{error}</p>}

      {!items ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-espresso/20 bg-white p-12 text-center max-w-xl">
          <p className="text-espresso/60 text-sm">No portfolio items yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-espresso/10 overflow-hidden">
              <div className="aspect-[4/3] bg-beige">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <p className="font-display text-lg truncate">{item.title}</p>
                <p className="text-xs text-espresso/50 mt-1">
                  {item.occasion || 'Uncategorized'} · {item.portfolio_type === 'available_for_purchase' ? 'For Purchase' : 'Portfolio Only'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <Link to={`/admin/portfolio/${item.id}/edit`} className="flex items-center gap-1 text-xs text-espresso/60 hover:text-espresso">
                    <Pencil size={13} /> Edit
                  </Link>
                  <button onClick={() => handleDelete(item.id, item.title)} className="flex items-center gap-1 text-xs text-espresso/60 hover:text-red-700">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
