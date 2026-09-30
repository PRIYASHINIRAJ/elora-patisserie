import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cakeService } from '../services/cakeService';
import CakeCard, { CakeCardSkeleton } from '../components/CakeCard';
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
    <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-14 lg:pt-16 pb-24">
      <div className="mb-10 lg:mb-12 max-w-2xl">
        <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">The Collection</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mb-4">Every cake, catalogued.</h1>
        <p className="text-espresso/70 leading-relaxed">
          Each piece is built to order in our Kuala Lumpur atelier. Browse by occasion, or
          start from any of these as a base for something fully custom.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-10 lg:mb-12 pb-6 border-b border-espresso/10" role="group" aria-label="Filter by occasion">
        <button
          onClick={() => setCategory('')}
          aria-pressed={!activeCategory}
          className={`px-4 py-2.5 text-[11px] tracking-wide-cap uppercase border transition-colors ${
            !activeCategory ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/70 hover:border-espresso/50 hover:text-espresso'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.slug)}
            aria-pressed={activeCategory === c.slug}
          className={`px-4 py-2.5 text-[11px] tracking-wide-cap uppercase border transition-colors ${
              activeCategory === c.slug ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/70 hover:border-espresso/50 hover:text-espresso'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {Array.from({ length: 6 }, (_, i) => <CakeCardSkeleton key={i} />)}
        </div>
      ) : cakes.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-display text-2xl mb-2">No cakes here yet</p>
          <p className="text-sm text-espresso/60 mb-6">Try another occasion, or tell us what you have in mind.</p>
          <Link to="/custom-cake" className="inline-block border border-espresso/30 px-6 py-3 text-xs tracking-wide-cap uppercase hover:border-espresso">
            Start a Custom Request
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {cakes.map((cake, i) => (
            <CakeCard key={cake.id} cake={cake} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
