import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { cakeService } from '../services/cakeService';
import { favouriteService } from '../services/favouriteService';
import { useAuth } from '../context/AuthContext';
import CakeCustomizer from '../components/customize/CakeCustomizer';
import { usePageMeta } from '../hooks/usePageMeta';

export default function CakeDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);

  useEffect(() => {
    cakeService
      .getBySlug(slug)
      .then((d) => setData(d))
      .catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    if (!user || !data) return;
    favouriteService.mine().then((d) => {
      setIsFavourite(d.favourites.some((f) => f.id === data.cake.id));
    }).catch(() => {});
  }, [user, data]);

  const toggleFavourite = async () => {
    if (!user || !data) return;
    if (isFavourite) {
      await favouriteService.remove(data.cake.id);
    } else {
      await favouriteService.add(data.cake.id);
    }
    setIsFavourite(!isFavourite);
  };

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <p className="font-display text-3xl mb-4">This piece isn't in the collection.</p>
        <Link to="/collection" className="text-gold text-sm tracking-wide-cap uppercase underline">
          Back to Collection
        </Link>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-7xl mx-auto px-6 py-32 text-espresso/50 text-sm">Loading…</div>;
  }

  const { cake, images } = data;
  const primaryImage = images[0]?.url || cake.image_url;
  const cakeWithImage = { ...cake, image_url: primaryImage };

  return (
    <CakeDetailContent
      cake={cake}
      primaryImage={primaryImage}
      cakeWithImage={cakeWithImage}
      user={user}
      isFavourite={isFavourite}
      toggleFavourite={toggleFavourite}
    />
  );
}

function CakeDetailContent({ cake, primaryImage, cakeWithImage, user, isFavourite, toggleFavourite }) {
  usePageMeta({
    title: cake.name,
    description: cake.description?.slice(0, 155) || `${cake.name} — handcrafted by Élora Patisserie.`,
  });

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
        <div className="aspect-[4/5] bg-beige overflow-hidden">
          <img src={primaryImage} alt={cake.name} className="w-full h-full object-cover" />
        </div>

        <div className="lg:pt-6">
          <p className="text-[11px] tracking-wide-cap uppercase text-gold mb-3">
            {cake.catalog_number} · {cake.category_name}
          </p>
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-5xl mb-5">{cake.name}</h1>
            {user && (
              <button
                onClick={toggleFavourite}
                aria-label={isFavourite ? `Remove ${cake.name} from favourites` : `Add ${cake.name} to favourites`}
                aria-pressed={isFavourite}
                className="mt-1 w-10 h-10 rounded-full border border-espresso/15 flex items-center justify-center hover:border-gold shrink-0"
              >
                <Heart size={17} className={isFavourite ? 'text-gold' : 'text-espresso/40'} fill={isFavourite ? '#B08A4E' : 'none'} />
              </button>
            )}
          </div>
          <p className="text-espresso/70 leading-relaxed mb-8 max-w-md">{cake.description}</p>

          <div className="flex items-center gap-6 mb-6 text-sm">
            <div>
              <p className="text-espresso/40 text-[11px] tracking-wide-cap uppercase mb-1">Price from</p>
              <p className="font-display text-2xl">RM {cake.base_price.toFixed(0)}</p>
            </div>
            <div className="h-8 w-px bg-espresso/10" />
            <div>
              <p className="text-espresso/40 text-[11px] tracking-wide-cap uppercase mb-1">Serves</p>
              <p className="font-display text-2xl">{cake.serves}</p>
            </div>
          </div>

          {cake.ingredients?.length > 0 && (
            <p className="text-sm text-espresso/50 mb-2">
              <span className="text-espresso/70">Ingredients:</span> {cake.ingredients.join(', ')}
            </p>
          )}
          {cake.is_customizable === 1 && (
            <p className="text-sm text-espresso/50">
              Not seeing quite the right fit?{' '}
              <Link to="/custom-cake" className="text-gold underline">
                Start a fully custom request
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      <CakeCustomizer cake={cakeWithImage} />
    </div>
  );
}
