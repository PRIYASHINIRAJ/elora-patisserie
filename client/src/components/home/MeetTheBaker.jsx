import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export default function MeetTheBaker({ settings }) {
  const name = settings?.baker_name;
  const title = settings?.baker_title;
  const bio = settings?.baker_bio;
  const photo = settings?.baker_photo_url;

  // Nothing to show yet — admin hasn't filled this section in. Never render
  // a half-empty "Meet the Baker" section with placeholder text.
  if (!name || !photo) return null;

  return (
    <section className="relative bg-cream overflow-hidden py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Photo, with a clip-path reveal and a rotated frame accent behind it */}
        <div className="relative order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, rotate: -2, x: -24 }}
            whileInView={{ opacity: 1, rotate: -2, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="absolute inset-0 border border-gold/40 translate-x-5 translate-y-5"
            aria-hidden="true"
          />
          <motion.div
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
            className="relative aspect-[4/5] overflow-hidden bg-beige"
          >
            <motion.img
              src={photo}
              alt={name}
              initial={{ scale: 1.15 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Text */}
        <div className="order-1 lg:order-2">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-xs tracking-wide-cap uppercase text-gold mb-5"
          >
            Meet the Baker
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl lg:text-6xl mb-2"
          >
            {name}
          </motion.h2>

          {title && (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm text-mocha italic mb-8"
            >
              {title}
            </motion.p>
          )}

          {bio && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative pl-8"
            >
              <Quote className="absolute left-0 top-0 text-gold/30" size={28} aria-hidden="true" />
              <p className="text-espresso/70 leading-relaxed max-w-md whitespace-pre-line">{bio}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
