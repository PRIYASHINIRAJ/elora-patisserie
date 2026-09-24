import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import MagneticButton from '../MagneticButton';

const HERO_VIDEO = '/homecake.mp4';

const particles = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${(i * 37) % 100}%`,
  size: 2 + ((i * 7) % 5),
  duration: 8 + (i % 6),
  delay: (i % 5) * 0.6,
}));

export default function Hero() {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Scroll-linked effects
  const videoScale = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [1, 1] : [1, 1.25]
  );

  const videoY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ['0%', '0%'] : ['0%', '18%']
  );

  const overlayOpacity = useTransform(
    scrollYProgress,
    [0, 1],
    [0.45, 0.75]
  );

  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.6],
    prefersReducedMotion ? [1, 1] : [1, 0]
  );

  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ['0%', '0%'] : ['0%', '20%']
  );

  return (
    <section
      ref={ref}
      className="relative h-screen overflow-hidden bg-espresso"
    >
      {/* Hero Video */}
      <motion.div
        style={{
          scale: videoScale,
          y: videoY,
        }}
        className="absolute inset-0"
      >
        <video
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Dark overlay */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-espresso"
      />

      {/* Floating particles */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute rounded-full bg-gold-light/60"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                bottom: '-5%',
              }}
              animate={{
                y: ['0%', '-120vh'],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* Hero Content */}
      <motion.div
        style={{
          opacity: contentOpacity,
          y: contentY,
        }}
        className="relative h-full flex flex-col items-center justify-center text-center px-6"
      >
        {/* Location */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.2,
          }}
          className="text-[11px] tracking-[0.3em] uppercase text-gold-light mb-6"
        >
          Kuala Lumpur Atelier
        </motion.p>

        {/* Main Heading */}
        <h1 className="font-display text-champagne leading-[0.95]">
          {['SWEET', 'MOMENTS,', 'BEAUTIFULLY', 'MADE.'].map(
            (word, i) => (
              <span
                key={word}
                className="block overflow-hidden"
              >
                <motion.span
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{
                    duration: 0.9,
                    delay: 0.3 + i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="block text-[12vw] sm:text-7xl lg:text-8xl"
                >
                  {word}
                </motion.span>
              </span>
            )
          )}
        </h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.95,
          }}
          className="mt-8 max-w-md text-champagne/75 text-base leading-relaxed"
        >
          Artisanal cakes crafted for celebrations that deserve
          something extraordinary.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.1,
          }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          {/* Collection Button */}
          <MagneticButton className="inline-block">
            <Link
              to="/collection"
              data-cursor="button"
              className="block px-8 py-3.5 text-xs tracking-wide-cap uppercase bg-champagne text-espresso hover:bg-gold-light transition-colors"
            >
              Discover the Collection
            </Link>
          </MagneticButton>

          {/* Custom Cake Button */}
          <MagneticButton className="inline-block">
            <Link
              to="/custom-cake"
              data-cursor="button"
              className="block px-8 py-3.5 text-xs tracking-wide-cap uppercase border border-champagne/50 text-champagne hover:bg-champagne/10 transition-colors"
            >
              Create Your Cake
            </Link>
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: 1.6,
          duration: 0.8,
        }}
        className="absolute bottom-8 inset-x-0 flex flex-col items-center text-champagne/60"
      >
        <span className="text-[10px] tracking-wide-cap uppercase mb-2">
          Scroll
        </span>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
          }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>
    </section>
  );
}