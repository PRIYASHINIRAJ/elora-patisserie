import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Archive, Eye } from 'lucide-react';
import { adminCakeService } from '../services/adminCakeService';

const statusStyles = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-champagne text-mocha',
  archived: 'bg-espresso/10 text-espresso/50',
};

export default function AdminCakes() {
  const [cakes, setCakes] = useState(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    adminCakeService
      .list(filter ? { status: filter } : {})
      .then((d) => setCakes(d.cakes))
      .catch(() => setError('Could not load cakes.'));
  };

  useEffect(load, [filter]);

  const handleStatus = async (id, status) => {
    await adminCakeService.setStatus(id, status);
    load();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await adminCakeService.remove(id);
    load();
  };

  return (
    <div className="px-8 py-10 lg:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl text-espresso">Cakes</h1>
        <Link
          to="/admin/cakes/new"
          className="flex items-center gap-2 bg-espresso text-champagne px-5 py-2.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
        >
          <Plus size={15} /> Add Cake
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {['', 'published', 'draft', 'archived'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-[11px] tracking-wide-cap uppercase border ${
              filter === s ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/60'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <p className="text-red-700 text-sm mb-4">{error}</p>}

      {!cakes ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : cakes.length === 0 ? (
        <div className="border border-dashed border-espresso/20 bg-white p-12 text-center max-w-xl">
          <p className="text-espresso/60 text-sm">No cakes yet. Add your first one.</p>
        </div>
      ) : (
        <div className="bg-white border border-espresso/10 divide-y divide-espresso/10">
          {cakes.map((cake) => (
            <div key={cake.id} className="p-5 flex items-center gap-5">
              <div className="w-16 h-16 bg-beige overflow-hidden shrink-0">
                {cake.image_url && <img src={cake.image_url} alt={cake.name} className="w-full h-full object-cover" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-display text-lg truncate">{cake.name}</p>
                <p className="text-xs text-espresso/50">
                  {cake.catalog_number} · {cake.category_name || 'Uncategorized'} · RM {cake.base_price.toFixed(0)}
                </p>
              </div>

              <span className={`text-[11px] tracking-wide-cap uppercase px-3 py-1 rounded-full capitalize shrink-0 ${statusStyles[cake.status]}`}>
                {cake.status}
              </span>

              <div className="flex items-center gap-3 shrink-0">
                {cake.status === 'published' && (
                  <a href={`http://localhost:5173/cake/${cake.slug}`} target="_blank" rel="noreferrer" title="View live" className="text-espresso/40 hover:text-espresso">
                    <Eye size={16} />
                  </a>
                )}
                {cake.status !== 'archived' ? (
                  <button title="Archive" onClick={() => handleStatus(cake.id, 'archived')} className="text-espresso/40 hover:text-espresso">
                    <Archive size={16} />
                  </button>
                ) : (
                  <button title="Restore to draft" onClick={() => handleStatus(cake.id, 'draft')} className="text-espresso/40 hover:text-espresso text-[11px] tracking-wide-cap uppercase">
                    Restore
                  </button>
                )}
                <Link to={`/admin/cakes/${cake.id}/edit`} title="Edit" className="text-espresso/40 hover:text-espresso">
                  <Pencil size={16} />
                </Link>
                <button title="Delete" onClick={() => handleDelete(cake.id, cake.name)} className="text-espresso/40 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
