import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: 'The cake was the centerpiece of our entire wedding — guests were photographing it before they touched their food.',
    name: 'Aisyah R.',
    occasion: 'Wedding, Bangsar',
  },
  {
    quote: "I described a vague idea over WhatsApp and they turned it into something more beautiful than I'd imagined.",
    name: 'Daniel T.',
    occasion: 'Anniversary',
  },
  {
    quote: "Genuinely tastes as good as it looks. That's rarer than it should be at this level of detail.",
    name: 'Priya M.',
    occasion: 'Birthday',
  },
];

export default function Testimonials() {
  return (
    <section className="bg-cream py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">Kind Words</p>
          <h2 className="font-display text-4xl lg:text-5xl">From Our Clients</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-ivory p-8"
            >
              <p className="font-display text-2xl leading-snug mb-6">&ldquo;{t.quote}&rdquo;</p>
              <p className="text-sm text-espresso/50 tracking-wide-cap uppercase">{t.name} · {t.occasion}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
