import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag } from 'lucide-react';
import { portfolioService } from '../services/portfolioService';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Portfolio() {
  usePageMeta({
    title: 'Portfolio',
    description: 'A running archive of weddings, celebrations, and bespoke commissions from the Élora Patisserie studio in Kuala Lumpur.',
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOccasion, setActiveOccasion] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    portfolioService
      .list()
      .then((d) => setItems(d.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const occasions = useMemo(
    () => [...new Set(items.map((i) => i.occasion).filter(Boolean))],
    [items]
  );

  const filtered = activeOccasion ? items.filter((i) => i.occasion === activeOccasion) : items;

  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => e.key === 'Escape' && setSelected(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const openItem = async (item) => {
    setSelected(item);
    if (item.portfolio_type === 'available_for_purchase') {
      try {
        const { item: full } = await portfolioService.get(item.id);
        setSelected(full);
      } catch {
        // keep the list-view item if the detail fetch fails
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-14 lg:pt-16 pb-24">
      <div className="mb-10 lg:mb-12 max-w-2xl">
        <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">The Portfolio</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mb-4">Past occasions, in detail.</h1>
        <p className="text-espresso/70 leading-relaxed">
          A running archive of weddings, celebrations, and commissions from the Élora studio.
        </p>
      </div>

      {occasions.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-10 lg:mb-12 pb-6 border-b border-espresso/10" role="group" aria-label="Filter by occasion">
          <button
            onClick={() => setActiveOccasion('')}
            aria-pressed={!activeOccasion}
            className={`px-4 py-2.5 text-[11px] tracking-wide-cap uppercase border transition-colors ${
              !activeOccasion ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/70 hover:border-espresso/50 hover:text-espresso'
            }`}
          >
            All
          </button>
          {occasions.map((o) => (
            <button
              key={o}
              onClick={() => setActiveOccasion(o)}
              aria-pressed={activeOccasion === o}
              className={`px-4 py-2.5 text-[11px] tracking-wide-cap uppercase border transition-colors ${
                activeOccasion === o ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/70 hover:border-espresso/50 hover:text-espresso'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] bg-beige mb-3" />
              <div className="h-5 bg-beige w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-espresso/20 p-16 text-center">
          <p className="font-display text-2xl mb-2">The archive is being curated.</p>
          <p className="text-espresso/60 text-sm">New pieces will appear here soon.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => openItem(item)}
              className="break-inside-avoid block w-full text-left group cursor-pointer"
            >
              <div className="relative overflow-hidden mb-3" data-cursor="view">
                <img src={item.image_url} alt={item.title} loading="lazy" className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                {item.portfolio_type === 'available_for_purchase' && (
                  <span className="absolute top-3 right-3 bg-gold text-ivory text-[10px] tracking-wide-cap uppercase px-2.5 py-1 flex items-center gap-1">
                    <ShoppingBag size={11} aria-hidden="true" /> Available to order
                  </span>
                )}
              </div>
              <p className="text-[11px] tracking-wide-cap uppercase text-gold mb-1">{item.occasion}</p>
              <p className="font-display text-lg">{item.title}</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-espresso/70 z-50 flex items-center justify-center px-4 sm:px-6 py-8"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
        >
          <div
            className="bg-ivory max-w-3xl w-full max-h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img src={selected.images?.[0]?.url || selected.image_url} alt={selected.title} className="w-full max-h-[60vh] object-cover" />
              <button onClick={() => setSelected(null)} aria-label="Close" className="absolute top-4 right-4 bg-ivory/90 rounded-full w-9 h-9 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            {(selected.images?.length > 1 || selected.videos?.length > 0) && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-4">
                {selected.images?.slice(1).map((img) => (
                  <img key={`i${img.id}`} src={img.url} alt="" className="w-full aspect-square object-cover" />
                ))}
                {selected.videos?.map((v) => (
                  <video key={`v${v.id}`} src={v.url} controls playsInline preload="metadata" className="w-full aspect-square object-cover bg-espresso" />
                ))}
              </div>
            )}

            <div className="p-8 pt-4">
              <p className="text-[11px] tracking-wide-cap uppercase text-gold mb-2">
                {selected.occasion} {selected.event_date && `· ${new Date(selected.event_date).toLocaleDateString()}`}
              </p>
              <h2 className="font-display text-3xl mb-4">{selected.title}</h2>
              {selected.description && <p className="text-espresso/70 leading-relaxed mb-6">{selected.description}</p>}

              {selected.portfolio_type === 'available_for_purchase' && selected.linkedCake && (
                <Link
                  to={`/cake/${selected.linkedCake.slug}`}
                  className="inline-flex items-center gap-2 bg-espresso text-champagne px-7 py-3 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
                >
                  <ShoppingBag size={15} /> View & Order This Cake
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
