import { useEffect, useRef, useState } from 'react';
import { UploadCloud, Trash2, Link2 } from 'lucide-react';
import { mediaService } from '../services/mediaService';
import { adminCakeService } from '../services/adminCakeService';
import { adminPortfolioService } from '../services/adminPortfolioService';

export default function AdminMedia() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [attachTarget, setAttachTarget] = useState(null); // media item being attached
  const [cakes, setCakes] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const fileInputRef = useRef(null);

  const load = () => {
    mediaService.list(filter || undefined).then((d) => setItems(d.items)).catch(() => setError('Could not load media.'));
  };

  useEffect(load, [filter]);

  useEffect(() => {
    adminCakeService.list({}).then((d) => setCakes(d.cakes)).catch(() => {});
    adminPortfolioService.list().then((d) => setPortfolioItems(d.items)).catch(() => {});
  }, []);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      await mediaService.upload(files);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this media item?')) return;
    await mediaService.remove(id);
    load();
  };

  const handleAttach = async (type, targetId) => {
    await mediaService.attach(attachTarget.id, type, targetId);
    setAttachTarget(null);
    load();
  };

  return (
    <div className="px-8 py-10 lg:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl text-espresso">Media Library</h1>
        <label className="flex items-center gap-2 bg-espresso text-champagne px-5 py-2.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors cursor-pointer">
          <UploadCloud size={15} /> {uploading ? 'Uploading…' : 'Upload'}
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUpload} />
        </label>
      </div>

      <div className="flex gap-2 mb-6">
        {['', 'image', 'video'].map((t) => (
          <button
            key={t || 'all'}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 text-[11px] tracking-wide-cap uppercase border ${
              filter === t ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/60'
            }`}
          >
            {t ? `${t}s` : 'All'}
          </button>
        ))}
      </div>

      {error && <p className="text-red-700 text-sm mb-4">{error}</p>}

      {!items ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-espresso/20 bg-white p-12 text-center max-w-xl">
          <p className="text-espresso/60 text-sm">No media uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-espresso/10 overflow-hidden group relative">
              <div className="aspect-square bg-beige">
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.url} alt={item.original_name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] truncate text-espresso/60">{item.original_name}</p>
                {item.attached_to_type && (
                  <p className="text-[10px] text-gold">Attached to {item.attached_to_type}</p>
                )}
              </div>
              <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setAttachTarget(item)} title="Attach" className="w-7 h-7 bg-espresso/80 text-champagne rounded-full flex items-center justify-center hover:bg-espresso">
                  <Link2 size={13} />
                </button>
                <button onClick={() => handleDelete(item.id)} title="Delete" className="w-7 h-7 bg-espresso/80 text-champagne rounded-full flex items-center justify-center hover:bg-red-700">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {attachTarget && (
        <div className="fixed inset-0 bg-espresso/40 flex items-center justify-center z-50 px-6" onClick={() => setAttachTarget(null)}>
          <div className="bg-ivory max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl mb-5">Attach Media</h2>
            <p className="text-xs text-espresso/50 mb-4">Choose where this file should appear.</p>

            <div className="mb-5">
              <p className="text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Cakes</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {cakes.map((c) => (
                  <button key={c.id} onClick={() => handleAttach('cake', c.id)} className="block w-full text-left text-sm px-3 py-1.5 hover:bg-champagne/40">
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Portfolio</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {portfolioItems.map((p) => (
                  <button key={p.id} onClick={() => handleAttach('portfolio', p.id)} className="block w-full text-left text-sm px-3 py-1.5 hover:bg-champagne/40">
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setAttachTarget(null)} className="text-sm text-espresso/50 hover:text-espresso">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
