import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles, Leaf, PenTool, Truck } from 'lucide-react';
import { cakeService } from '../services/cakeService';
import { portfolioService } from '../services/portfolioService';
import { settingsService } from '../services/settingsService';
import { studioVideoService } from '../services/studioVideoService';
import Hero from '../components/home/Hero';
import CakeCard from '../components/CakeCard';
import MeetTheBaker from '../components/home/MeetTheBaker';
import StudioReels from '../components/home/StudioReels';
import Testimonials from '../components/home/Testimonials';
import Newsletter from '../components/home/Newsletter';
import { usePageMeta } from '../hooks/usePageMeta';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const craftsmanship = [
  { icon: PenTool, title: 'Designed With You', body: 'Every commission starts with a conversation, a sketch, a mood board.' },
  { icon: Leaf, title: 'Premium Ingredients', body: 'Belgian couverture, French butter, seasonal fruit — nothing shortcut.' },
  { icon: Sparkles, title: 'Hand-Finished', body: 'Piping, sugar work, and gold leaf applied by hand, tier by tier.' },
  { icon: Truck, title: 'Delivered With Care', body: 'Climate-controlled transport across Klang Valley, set up on site.' },
];

function SectionHeader({ eyebrow, title, link, linkLabel, center = false }) {
  return (
    <motion.div
      {...fadeUp}
      className={`mb-10 lg:mb-12 ${center ? 'text-center' : 'flex items-end justify-between gap-6'}`}
    >
      <div>
        <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">{eyebrow}</p>
        <h2 className="font-display text-4xl lg:text-5xl leading-tight">{title}</h2>
      </div>
      {link && (
        <Link
          to={link}
          className="hidden sm:inline-flex shrink-0 items-center gap-1 text-xs tracking-wide-cap uppercase text-espresso/60 hover:text-espresso transition-colors"
        >
          {linkLabel} <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      )}
    </motion.div>
  );
}

export default function Home() {
  usePageMeta({
    title: 'Luxury Custom Cakes in Kuala Lumpur',
    description: 'Handcrafted luxury cakes for weddings, birthdays, and celebrations. Browse the collection, customize a design, or commission something completely bespoke.',
  });
  const [cakes, setCakes] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [studioVideos, setStudioVideos] = useState([]);

  useEffect(() => {
    cakeService.list().then((d) => setCakes(d.cakes)).catch(() => {});
    portfolioService.list().then((d) => setPortfolioItems(d.items)).catch(() => {});
    settingsService.public().then((d) => setSettings(d.settings)).catch(() => {});
    studioVideoService.public().then((d) => setStudioVideos(d.videos)).catch(() => {});
  }, []);

  // Featured cakes first, topped up with the rest so the row is always full.
  const signature = [...cakes.filter((c) => c.is_featured), ...cakes.filter((c) => !c.is_featured)].slice(0, 3);

  return (
    <div>
      <Hero />

      {/* Brand introduction */}
      <section className="max-w-3xl mx-auto px-6 py-20 lg:py-24 text-center">
        <motion.p {...fadeUp} className="text-xs tracking-wide-cap uppercase text-gold mb-5">
          Since the first commission
        </motion.p>
        <motion.h2 {...fadeUp} className="font-display text-3xl lg:text-4xl leading-snug mb-6">
          We treat every cake as a piece of architecture —
          <span className="italic text-mocha"> built to be remembered, not just eaten.</span>
        </motion.h2>
        <motion.p {...fadeUp} className="text-espresso/70 max-w-xl mx-auto leading-relaxed">
          Founded in Kuala Lumpur, Élora Patisserie designs and hand-builds cakes for the moments
          that call for more than something sweet — weddings, milestones, and everything in between.
        </motion.p>
      </section>

      {/* Signature cakes */}
      {signature.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-20 lg:pb-24">
          <SectionHeader eyebrow="The Atelier Edit" title="Signature Cakes" link="/collection" linkLabel="View the collection" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {signature.map((cake, i) => (
              <CakeCard key={cake.id} cake={cake} index={i} />
            ))}
          </div>
          <div className="mt-12 text-center sm:hidden">
            <Link to="/collection" className="inline-flex items-center gap-1 text-xs tracking-wide-cap uppercase text-espresso/70">
              View the collection <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {/* How we work */}
      <section className="bg-champagne/60 border-y border-espresso/5">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-20 lg:py-24">
          <SectionHeader eyebrow="How We Work" title="Craftsmanship, Tier by Tier" center />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {craftsmanship.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-5 text-gold">
                  <c.icon size={20} strokeWidth={1.4} aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl mb-2">{c.title}</h3>
                <p className="text-sm text-espresso/65 leading-relaxed max-w-[16rem] mx-auto">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio preview */}
      {portfolioItems.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-10 py-20 lg:py-24">
          <SectionHeader eyebrow="Past Work" title="From the Portfolio" link="/portfolio" linkLabel="View portfolio" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {portfolioItems.slice(0, 4).map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <Link to="/portfolio" className="group block relative aspect-[4/5] overflow-hidden bg-beige" data-cursor="view">
                  <img src={item.image_url} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-espresso/75 to-transparent">
                    <p className="font-display text-lg text-champagne leading-tight">{item.title}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Custom & wedding call-to-action */}
      <section className="bg-espresso text-champagne">
        <motion.div {...fadeUp} className="max-w-6xl mx-auto px-6 lg:px-10 py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 items-center">
          <div>
            <p className="text-xs tracking-wide-cap uppercase text-gold-light mb-4">Nothing off the shelf</p>
            <h2 className="font-display text-4xl lg:text-5xl leading-tight mb-5">Have something specific in mind?</h2>
            <p className="text-champagne/70 leading-relaxed max-w-lg">
              From intimate birthdays to five-tier wedding statements — tell us your idea and we'll
              design it with you. Every wedding commission includes a private tasting.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
            <Link
              to="/custom-cake"
              className="inline-flex items-center justify-center gap-2 bg-champagne text-espresso px-8 py-4 text-xs tracking-wide-cap uppercase hover:bg-gold-light transition-colors"
            >
              Start a Custom Request <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <Link
              to="/collection?category=wedding"
              className="inline-flex items-center justify-center gap-2 border border-champagne/30 px-8 py-4 text-xs tracking-wide-cap uppercase hover:bg-champagne hover:text-espresso transition-colors"
            >
              Explore Wedding Cakes
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Meet the founder */}
      <MeetTheBaker settings={settings} />

      {/* Studio reels (only when the admin has added videos) */}
      <StudioReels videos={studioVideos} tiktokHandle={settings?.tiktok_handle} />

      <Testimonials />

      <Newsletter />
    </div>
  );
}
