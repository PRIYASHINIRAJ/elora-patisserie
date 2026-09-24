import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { favouriteService } from '../services/favouriteService';

export default function Favourites() {
  const [favourites, setFavourites] = useState(null);

  const load = () => favouriteService.mine().then((d) => setFavourites(d.favourites));
  useEffect(load, []);

  const handleRemove = async (cakeId) => {
    await favouriteService.remove(cakeId);
    load();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16">
      <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">My Account</p>
      <h1 className="font-display text-5xl mb-10">Favourites</h1>

      {!favourites ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : favourites.length === 0 ? (
        <div className="border border-dashed border-espresso/20 p-12 text-center">
          <p className="font-display text-2xl mb-3">No favourites yet.</p>
          <Link to="/collection" className="text-gold text-sm tracking-wide-cap uppercase underline">
            Browse the Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {favourites.map((cake) => (
            <div key={cake.id} className="group relative">
              <button
                onClick={() => handleRemove(cake.id)}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-ivory/90 rounded-full flex items-center justify-center hover:bg-ivory"
                aria-label="Remove from favourites"
              >
                <Heart size={15} fill="#B08A4E" className="text-gold" />
              </button>
              <Link to={`/cake/${cake.slug}`} className="block">
                <div className="aspect-[4/5] overflow-hidden bg-beige mb-4">
                  <img src={cake.image_url} alt={cake.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <h3 className="font-display text-xl mb-1">{cake.name}</h3>
                <p className="text-sm text-espresso/60">From RM {cake.base_price.toFixed(0)}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
