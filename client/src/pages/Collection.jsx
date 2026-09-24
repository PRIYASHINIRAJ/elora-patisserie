import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cakeService } from '../services/cakeService';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Collection() {
  usePageMeta({
    title: 'The Collection',
    description: 'Browse Élora Patisserie\'s full collection of luxury cakes, catalogued by occasion — weddings, birthdays, anniversaries, and more.',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const [categories, setCategories] = useState([]);
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cakeService.categories().then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    cakeService
      .list(activeCategory ? { category: activeCategory } : {})
      .then((d) => setCakes(d.cakes))
      .catch(() => setCakes([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const setCategory = (slug) => {
    if (slug) setSearchParams({ category: slug });
    else setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-24">
      <div className="mb-14 max-w-2xl">
        <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">The Collection</p>
        <h1 className="font-display text-5xl lg:text-6xl mb-4">Every cake, catalogued.</h1>
        <p className="text-espresso/60 leading-relaxed">
          Each piece is built to order in our Kuala Lumpur atelier. Browse by occasion, or
          start from any of these as a base for something fully custom.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-12">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 text-[11px] tracking-wide-cap uppercase border ${
            !activeCategory ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/70'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.slug)}
            className={`px-4 py-2 text-[11px] tracking-wide-cap uppercase border ${
              activeCategory === c.slug ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/70'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : cakes.length === 0 ? (
        <p className="text-espresso/50 text-sm">No cakes in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {cakes.map((cake) => (
            <Link key={cake.id} to={`/cake/${cake.slug}`} data-cursor="explore" className="group block">
              <div className="aspect-[4/5] overflow-hidden bg-beige mb-5">
                <img
                  src={cake.image_url}
                  alt={cake.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <p className="text-[11px] tracking-wide-cap uppercase text-gold mb-2">{cake.catalog_number}</p>
              <h3 className="font-display text-2xl mb-1">{cake.name}</h3>
              <p className="text-sm text-espresso/60">From RM {cake.base_price.toFixed(0)} · {cake.serves}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
