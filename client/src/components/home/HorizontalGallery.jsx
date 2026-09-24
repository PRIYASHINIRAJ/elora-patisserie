import { useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CARD_WIDTH = 288; // w-72
const GAP = 24; // gap-6
const STEP = CARD_WIDTH + GAP;

export default function HorizontalGallery({ cakes }) {
  const trackRef = useRef(null);
  const x = useMotionValue(0);
  const [index, setIndex] = useState(0);

  if (!cakes?.length) return null;

  const maxIndex = cakes.length - 1;
  const minX = -(maxIndex * STEP);

  const goTo = (nextIndex) => {
    const clamped = Math.max(0, Math.min(maxIndex, nextIndex));
    setIndex(clamped);
    animate(x, -clamped * STEP, { type: 'tween', duration: 0.5, ease: [0.22, 1, 0.36, 1] });
  };

  const handleDragEnd = () => {
    const current = x.get();
    const nearest = Math.round(-current / STEP);
    goTo(nearest);
  };

  return (
    <section className="py-24 bg-espresso overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="text-xs tracking-wide-cap uppercase text-gold-light mb-3">The Full Gallery</p>
          <h2 className="font-display text-4xl lg:text-5xl text-champagne">Drag or Browse</h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous cake"
            className="w-11 h-11 rounded-full border border-champagne/25 flex items-center justify-center text-champagne hover:bg-champagne hover:text-espresso transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-champagne"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            disabled={index === maxIndex}
            aria-label="Next cake"
            className="w-11 h-11 rounded-full border border-champagne/25 flex items-center justify-center text-champagne hover:bg-champagne hover:text-espresso transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-champagne"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <motion.div
        ref={trackRef}
        drag="x"
        style={{ x }}
        dragConstraints={{ left: minX, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        className="flex gap-6 px-6 lg:px-10 cursor-grab active:cursor-grabbing"
      >
        {cakes.map((cake) => (
          <Link
            to={`/cake/${cake.slug}`}
            key={cake.id}
            draggable={false}
            className="w-72 shrink-0 select-none group"
          >
            <div className="aspect-[3/4] overflow-hidden bg-champagne/10 mb-4">
              <img
                src={cake.image_url}
                alt={cake.name}
                draggable={false}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <p className="text-[11px] tracking-wide-cap uppercase text-gold-light mb-1">{cake.catalog_number}</p>
            <p className="font-display text-xl text-champagne">{cake.name}</p>
          </Link>
        ))}
      </motion.div>

      {/* progress indicator */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-8">
        <div className="h-px bg-champagne/15 relative">
          <motion.div
            className="absolute top-0 left-0 h-px bg-gold-light"
            animate={{ width: `${((index + 1) / cakes.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </section>
  );
}
