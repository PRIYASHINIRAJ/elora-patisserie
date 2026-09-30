import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Shared cake card for the home page and the collection.
export default function CakeCard({ cake, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.06 }}
    >
      <Link to={`/cake/${cake.slug}`} data-cursor="explore" className="group block">
        <div className="aspect-[4/5] overflow-hidden bg-beige mb-4">
          <img
            src={cake.image_url}
            alt={cake.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-2xl leading-snug">{cake.name}</h3>
          <p className="text-sm text-espresso/70 shrink-0">From RM {Number(cake.base_price).toFixed(0)}</p>
        </div>
        <p className="text-[11px] tracking-wide-cap uppercase text-gold mt-1">
          {[cake.category_name, cake.serves].filter(Boolean).join(' · ')}
        </p>
      </Link>
    </motion.div>
  );
}

export function CakeCardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="aspect-[4/5] bg-beige mb-4" />
      <div className="h-6 bg-beige w-2/3 mb-2" />
      <div className="h-3 bg-beige w-1/3" />
    </div>
  );
}
