import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
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
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 animate-pulse" aria-hidden="true">
        <div className="aspect-[4/5] bg-beige" />
        <div className="space-y-4 lg:pt-10">
          <div className="h-3 bg-beige w-1/4" />
          <div className="h-12 bg-beige w-3/4" />
          <div className="h-20 bg-beige" />
        </div>
      </div>
    );
  }

  const { cake, images, videos = [] } = data;
  const primaryImage = images[0]?.url || cake.image_url;
  const cakeWithImage = { ...cake, image_url: primaryImage };

  return (
    <CakeDetailContent
      cake={cake}
      images={images}
      videos={videos}
      primaryImage={primaryImage}
      cakeWithImage={cakeWithImage}
      user={user}
      isFavourite={isFavourite}
      toggleFavourite={toggleFavourite}
    />
  );
}

function CakeDetailContent({ cake, images, videos, primaryImage, cakeWithImage, user, isFavourite, toggleFavourite }) {
  usePageMeta({
    title: cake.name,
    description: cake.description?.slice(0, 155) || `${cake.name} — handcrafted by Élora Patisserie.`,
  });
  const gallery = images.length ? images.map((i) => i.url) : [primaryImage].filter(Boolean);
  const [active, setActive] = useState(0);
  const shown = gallery[active] || primaryImage;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-8 pb-20 lg:pb-24">
      <Link
        to="/collection"
        className="inline-flex items-center gap-2 text-xs tracking-wide-cap uppercase text-espresso/60 hover:text-espresso mb-8"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Back to Collection
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
        {/* Photos */}
        <div className="lg:sticky lg:top-24">
          <div className="aspect-[4/5] bg-beige overflow-hidden">
            <img src={shown} alt={cake.name} className="w-full h-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              {gallery.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show photo ${i + 1} of ${gallery.length}`}
                  aria-pressed={i === active}
                  className={`aspect-square overflow-hidden bg-beige cursor-pointer border-2 transition-colors ${
                    i === active ? 'border-gold' : 'border-transparent hover:border-espresso/20'
                  }`}
                >
                  <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:pt-4">
          <p className="text-[11px] tracking-wide-cap uppercase text-gold mb-3">
            {[cake.category_name, cake.catalog_number].filter(Boolean).join(' · ')}
          </p>
          <div className="flex items-start justify-between gap-4 mb-5">
            <h1 className="font-display text-4xl sm:text-5xl leading-tight">{cake.name}</h1>
            {user && (
              <button
                onClick={toggleFavourite}
                aria-label={isFavourite ? `Remove ${cake.name} from favourites` : `Add ${cake.name} to favourites`}
                aria-pressed={isFavourite}
                className="mt-1 w-11 h-11 rounded-full border border-espresso/15 flex items-center justify-center hover:border-gold shrink-0 cursor-pointer"
              >
                <Heart size={17} className={isFavourite ? 'text-gold' : 'text-espresso/50'} fill={isFavourite ? '#B08A4E' : 'none'} />
              </button>
            )}
          </div>
          {cake.description && <p className="text-espresso/75 leading-relaxed mb-8 max-w-lg">{cake.description}</p>}

          <dl className="grid grid-cols-2 gap-px bg-espresso/10 border border-espresso/10 mb-8 max-w-md">
            <div className="bg-ivory p-4">
              <dt className="text-espresso/50 text-[11px] tracking-wide-cap uppercase mb-1">Price from</dt>
              <dd className="font-display text-2xl">RM {Number(cake.base_price).toFixed(0)}</dd>
            </div>
            <div className="bg-ivory p-4">
              <dt className="text-espresso/50 text-[11px] tracking-wide-cap uppercase mb-1">Serves</dt>
              <dd className="font-display text-2xl">{cake.serves || '—'}</dd>
            </div>
            {cake.flavour && (
              <div className="bg-ivory p-4">
                <dt className="text-espresso/50 text-[11px] tracking-wide-cap uppercase mb-1">Flavour</dt>
                <dd className="text-sm">{cake.flavour}</dd>
              </div>
            )}
            {cake.filling && (
              <div className="bg-ivory p-4">
                <dt className="text-espresso/50 text-[11px] tracking-wide-cap uppercase mb-1">Filling</dt>
                <dd className="text-sm">{cake.filling}</dd>
              </div>
            )}
          </dl>

          {cake.ingredients?.length > 0 && (
            <p className="text-sm text-espresso/70 mb-3">
              <span className="text-espresso">Ingredients:</span> {cake.ingredients.join(', ')}
            </p>
          )}
          {cake.is_customizable === 1 && (
            <p className="text-sm text-espresso/70">
              Not seeing quite the right fit?{' '}
              <Link to="/custom-cake" className="text-gold underline underline-offset-4">
                Start a fully custom request
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      {videos.length > 0 && (
        <section className="mt-16">
          <p className="text-xs tracking-wide-cap uppercase text-gold mb-4">See it up close</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <video key={v.id} src={v.url} controls playsInline preload="metadata" className="w-full aspect-[4/5] object-cover bg-espresso" />
            ))}
          </div>
        </section>
      )}

      <CakeCustomizer cake={cakeWithImage} />
    </div>
  );
}
