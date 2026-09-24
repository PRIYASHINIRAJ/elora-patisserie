import { useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const CARD_WIDTH = 220;
const GAP = 20;
const STEP = CARD_WIDTH + GAP;

export default function StudioReels({ videos, tiktokHandle }) {
  const x = useMotionValue(0);
  const [index, setIndex] = useState(0);
  const trackRef = useRef(null);

  if (!videos?.length) return null;

  const maxIndex = Math.max(0, videos.length - 1);
  const minX = -(maxIndex * STEP);

  const goTo = (nextIndex) => {
    const clamped = Math.max(0, Math.min(maxIndex, nextIndex));
    setIndex(clamped);
    animate(x, -clamped * STEP, { type: 'tween', duration: 0.5, ease: [0.22, 1, 0.36, 1] });
  };

  const handleDragEnd = () => {
    const nearest = Math.round(-x.get() / STEP);
    goTo(nearest);
  };

  return (
    <section className="bg-espresso py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="text-xs tracking-wide-cap uppercase text-gold-light mb-3">From the Studio</p>
          <h2 className="font-display text-4xl lg:text-5xl text-champagne">
            Follow Along{tiktokHandle ? ` @${tiktokHandle.replace(/^@/, '')}` : ''}
          </h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous video"
            className="w-11 h-11 rounded-full border border-champagne/25 flex items-center justify-center text-champagne hover:bg-champagne hover:text-espresso transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-champagne"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            disabled={index === maxIndex}
            aria-label="Next video"
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
        className="flex gap-5 px-6 lg:px-10 cursor-grab active:cursor-grabbing"
      >
        {videos.map((video) => (
          <div key={video.id} className="w-[220px] shrink-0 select-none group relative">
            <div className="aspect-[9/16] overflow-hidden bg-champagne/10 rounded-sm relative">
              <video
                src={video.video_url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
              {video.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-espresso/90 to-transparent p-3 pt-8">
                  <p className="text-champagne text-xs leading-snug">{video.caption}</p>
                </div>
              )}
              {video.tiktok_url && (
                <a
                  href={video.tiktok_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View on TikTok"
                  className="absolute top-2 right-2 bg-ivory/90 rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink size={14} className="text-espresso" />
                </a>
              )}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
