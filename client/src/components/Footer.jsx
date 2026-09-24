import { Link } from 'react-router-dom';
import { AtSign, Mail, MapPin } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-espresso text-champagne">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-5 max-w-sm text-champagne/70 text-sm leading-relaxed">
            Made for moments worth remembering. Handcrafted patisserie for weddings,
            celebrations, and the occasions in between — Kuala Lumpur, Malaysia.
          </p>
        </div>

        <div>
          <h4 className="tracking-wide-cap uppercase text-xs text-gold-light mb-4">Explore</h4>
          <ul className="space-y-3 text-sm text-champagne/80">
            <li><Link to="/collection" className="hover:text-champagne">Collection</Link></li>
            <li><Link to="/custom-cake" className="hover:text-champagne">Custom Cakes</Link></li>
            <li><Link to="/portfolio" className="hover:text-champagne">Portfolio</Link></li>
            <li><Link to="/our-story" className="hover:text-champagne">Our Story</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="tracking-wide-cap uppercase text-xs text-gold-light mb-4">Studio</h4>
          <ul className="space-y-3 text-sm text-champagne/80">
            <li className="flex items-center gap-2"><MapPin size={15} /> Bangsar, Kuala Lumpur</li>
            <li className="flex items-center gap-2"><Mail size={15} /> hello@elorapatisserie.com</li>
            <li className="flex items-center gap-2"><AtSign size={15} /> elorapatisserie</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-champagne/10 py-6 text-center text-xs text-champagne/50 tracking-wide-cap uppercase">
        © {new Date().getFullYear()} Élora Patisserie. All rights reserved.
      </div>
    </footer>
  );
}
