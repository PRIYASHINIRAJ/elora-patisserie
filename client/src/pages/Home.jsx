import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Camera, Sparkles, Leaf, PenTool, Truck } from 'lucide-react';
import { cakeService } from '../services/cakeService';
import { portfolioService } from '../services/portfolioService';
import { settingsService } from '../services/settingsService';
import { studioVideoService } from '../services/studioVideoService';
import Hero from '../components/home/Hero';
import HorizontalGallery from '../components/home/HorizontalGallery';
import MeetTheBaker from '../components/home/MeetTheBaker';
import StudioReels from '../components/home/StudioReels';
import Testimonials from '../components/home/Testimonials';
import Newsletter from '../components/home/Newsletter';
import { usePageMeta } from '../hooks/usePageMeta';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const craftsmanship = [
  { icon: PenTool, title: 'Designed With You', body: 'Every commission starts with a conversation, a sketch, a mood board.' },
  { icon: Leaf, title: 'Premium Ingredients', body: 'Belgian couverture, French butter, seasonal fruit — nothing shortcut.' },
  { icon: Sparkles, title: 'Hand-Finished', body: 'Piping, sugar work, and gold leaf applied by hand, tier by tier.' },
  { icon: Truck, title: 'Delivered With Care', body: 'Climate-controlled transport across Klang Valley, set up on site.' },
];

export default function Home() {
  usePageMeta({
    title: 'Luxury Custom Cakes in Kuala Lumpur',
    description: 'Handcrafted luxury cakes for weddings, birthdays, and celebrations. Browse the collection, customize a design, or commission something completely bespoke.',
  });
  const [featured, setFeatured] = useState([]);
  const [allCakes, setAllCakes] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [studioVideos, setStudioVideos] = useState([]);

  useEffect(() => {
    cakeService.list({ featured: 'true' }).then((d) => setFeatured(d.cakes)).catch(() => {});
    cakeService.list().then((d) => setAllCakes(d.cakes)).catch(() => {});
    portfolioService.list().then((d) => setPortfolioItems(d.items)).catch(() => {});
    settingsService.public().then((d) => setSettings(d.settings)).catch(() => {});
    studioVideoService.public().then((d) => setStudioVideos(d.videos)).catch(() => {});
  }, []);

  const signature = featured[0] || allCakes[0];
  const weddingCakes = allCakes.filter((c) => c.category_slug === 'wedding').slice(0, 3);

  return (
    <div>
      <Hero />

      {/* Meet the Baker */}
      <MeetTheBaker settings={settings} />

      {/* Studio Reels (TikTok-style videos, admin-managed) */}
      <StudioReels videos={studioVideos} tiktokHandle={settings?.tiktok_handle} />

      {/* 2. Brand Introduction */}
      <section className="max-w-5xl mx-auto px-6 py-28 text-center">
        <motion.p {...fadeUp} className="text-xs tracking-wide-cap uppercase text-gold mb-5">
          Since the first commission
        </motion.p>
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="font-display text-4xl lg:text-5xl leading-tight mb-6">
          We treat every cake as a piece of architecture —
          <span className="italic text-mocha"> built to be remembered, not just eaten.</span>
        </motion.h2>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="text-espresso/60 max-w-xl mx-auto leading-relaxed">
          Founded in Kuala Lumpur, Élora Patisserie designs and hand-builds cakes for the moments
          that call for more than something sweet — weddings, milestones, and everything in between.
        </motion.p>
      </section>

      {/* 3. Featured Cakes */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-28">
        <motion.div {...fadeUp} className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">The Atelier Edit</p>
            <h2 className="font-display text-4xl lg:text-5xl">Signature Cakes</h2>
          </div>
          <Link to="/collection" className="hidden sm:flex items-center gap-1 text-xs tracking-wide-cap uppercase text-espresso/60 hover:text-espresso">
            See all <ArrowUpRight size={14} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {featured.map((cake, i) => (
            <motion.div
              key={cake.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            >
              <Link to={`/cake/${cake.slug}`} data-cursor="explore" className="group block">
                <div className="aspect-[4/5] overflow-hidden bg-beige mb-5">
                  <img src={cake.image_url} alt={cake.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <p className="text-[11px] tracking-wide-cap uppercase text-gold mb-2">{cake.catalog_number}</p>
                <h3 className="font-display text-2xl mb-1">{cake.name}</h3>
                <p className="text-sm text-espresso/60">From RM {cake.base_price.toFixed(0)}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Horizontal Gallery */}
      <HorizontalGallery cakes={allCakes} />

      {/* 5. Signature Cake spotlight */}
      {signature && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-28 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <motion.div {...fadeUp} className="aspect-[4/5] overflow-hidden bg-beige order-2 lg:order-1">
            <img src={signature.image_url} alt={signature.name} loading="lazy" className="w-full h-full object-cover" />
          </motion.div>
          <motion.div {...fadeUp} className="order-1 lg:order-2">
            <p className="text-xs tracking-wide-cap uppercase text-gold mb-4">The House Signature</p>
            <h2 className="font-display text-5xl mb-6">{signature.name}</h2>
            <p className="text-espresso/60 leading-relaxed mb-8 max-w-md">{signature.description}</p>
            <Link
              to={`/cake/${signature.slug}`}
              className="inline-flex items-center gap-2 bg-espresso text-champagne px-8 py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
            >
              View This Cake <ArrowUpRight size={15} />
            </Link>
          </motion.div>
        </section>
      )}

      {/* 6. Portfolio Showcase */}
      {portfolioItems.length > 0 && (
        <section className="bg-champagne py-28">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <motion.div {...fadeUp} className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs tracking-wide-cap uppercase text-mocha mb-3">Past Work</p>
                <h2 className="font-display text-4xl lg:text-5xl">From the Portfolio</h2>
              </div>
              <Link to="/portfolio" className="hidden sm:flex items-center gap-1 text-xs tracking-wide-cap uppercase text-espresso/60 hover:text-espresso">
                View portfolio <ArrowUpRight size={14} />
              </Link>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {portfolioItems.slice(0, 4).map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="aspect-[4/5] overflow-hidden bg-ivory group"
                  data-cursor="view"
                >
                  <img src={item.image_url} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Custom Cake CTA */}
      <section className="bg-ivory">
        <motion.div {...fadeUp} className="max-w-7xl mx-auto px-6 lg:px-10 py-28 text-center">
          <p className="text-xs tracking-wide-cap uppercase text-mocha mb-4">Nothing off the shelf</p>
          <h2 className="font-display text-4xl lg:text-5xl max-w-2xl mx-auto mb-8">
            Have something specific in mind?
          </h2>
          <Link
            to="/custom-cake"
            className="inline-flex items-center gap-2 bg-espresso text-champagne px-8 py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
          >
            Start a Custom Request <ArrowUpRight size={15} />
          </Link>
        </motion.div>
      </section>

      {/* 8. Wedding Section */}
      <section className="relative bg-espresso text-champagne overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <motion.div {...fadeUp}>
            <p className="text-xs tracking-wide-cap uppercase text-gold-light mb-4">For the Aisle & Beyond</p>
            <h2 className="font-display text-4xl lg:text-5xl mb-6">Wedding Cakes, Built to Be the Centerpiece.</h2>
            <p className="text-champagne/60 leading-relaxed mb-8 max-w-md">
              From intimate two-tier settings to five-tier reception statements — every wedding
              commission includes a private tasting and a full design consultation.
            </p>
            <Link
              to="/collection?category=wedding"
              className="inline-flex items-center gap-2 border border-champagne/30 px-8 py-3.5 text-xs tracking-wide-cap uppercase hover:bg-champagne hover:text-espresso transition-colors"
            >
              Explore Wedding Cakes <ArrowUpRight size={15} />
            </Link>
          </motion.div>

          <motion.div {...fadeUp} className="grid grid-cols-2 gap-4">
            {(weddingCakes.length ? weddingCakes : allCakes.slice(0, 2)).slice(0, 2).map((c, i) => (
              <div key={c.id} className={`aspect-[3/4] overflow-hidden bg-champagne/10 ${i === 1 ? 'mt-10' : ''}`}>
                <img src={c.image_url} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 9. Craftsmanship */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <motion.div {...fadeUp} className="text-center mb-16">
          <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">How We Work</p>
          <h2 className="font-display text-4xl lg:text-5xl">Craftsmanship, Tier by Tier</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {craftsmanship.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-5 text-gold">
                <c.icon size={20} strokeWidth={1.4} />
              </div>
              <h3 className="font-display text-xl mb-2">{c.title}</h3>
              <p className="text-sm text-espresso/55 leading-relaxed">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 10. Testimonials */}
      <Testimonials />

      {/* 11. Social Gallery */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <motion.div {...fadeUp} className="text-center mb-12">
          <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">Follow Along</p>
          <h2 className="font-display text-4xl lg:text-5xl flex items-center justify-center gap-3">
            <Camera size={30} strokeWidth={1.3} /> @elorapatisserie
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(allCakes.length ? allCakes : []).slice(0, 6).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="aspect-square overflow-hidden bg-beige group"
            >
              <img src={c.image_url} alt={c.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* 12. Newsletter */}
      <Newsletter />
    </div>
  );
}
