import { usePageMeta } from '../hooks/usePageMeta';

export default function OurStory() {
  usePageMeta({
    title: 'Our Story',
    description: 'The story behind Élora Patisserie — a Kuala Lumpur cake studio built on conversation, craftsmanship, and celebrations worth remembering.',
  });
  return (
    <div>
      <section className="bg-espresso text-champagne">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-28 text-center">
          <p className="text-xs tracking-wide-cap uppercase text-gold-light mb-6">Our Story</p>
          <h1 className="font-display text-5xl lg:text-6xl leading-tight">
            Every cake begins as a conversation, not a catalogue.
          </h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 lg:px-10 py-24 space-y-8 text-espresso/80 leading-relaxed text-lg">
        <p>
          Élora Patisserie was founded in Kuala Lumpur on a simple belief: a cake for a
          milestone occasion deserves the same care as a couture gown or a bespoke suit —
          designed around the person, not pulled off a shelf.
        </p>
        <p>
          Our studio pairs pastry technique with a design-first process. Every commission
          starts with the story behind the celebration, and ends with a cake built to be the
          centerpiece of the room.
        </p>
        <p>
          Based in Bangsar, we work with couples, families, and businesses across Kuala Lumpur
          and the Klang Valley — from intimate anniversaries to full wedding productions.
        </p>
      </section>
    </div>
  );
}
