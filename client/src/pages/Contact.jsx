import { useEffect, useState } from 'react';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { settingsService } from '../services/settingsService';
import api from '../services/api';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Contact() {
  usePageMeta({
    title: 'Contact',
    description: "Get in touch with the Élora Patisserie studio in Kuala Lumpur — via WhatsApp, email, or the form below.",
  });

  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    settingsService.public().then((d) => setSettings(d.settings)).catch(() => setSettings({}));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      await api.post('/contact', form);
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const whatsappNumber = settings?.whatsapp_number;
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}` : null;

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-24">
      <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">Get in Touch</p>
      <h1 className="font-display text-5xl mb-12">Let's talk about your cake.</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            data-cursor="button"
            className="border border-espresso/15 p-8 hover:border-gold transition-colors"
          >
            <MessageCircle className="text-gold mb-4" size={22} strokeWidth={1.5} aria-hidden="true" />
            <h3 className="font-display text-xl mb-1">WhatsApp</h3>
            <p className="text-sm text-espresso/60">{whatsappNumber}</p>
          </a>
        )}
        <a
          href={`mailto:${settings?.contact_email || ''}`}
          data-cursor="button"
          className="border border-espresso/15 p-8 hover:border-gold transition-colors"
        >
          <Mail className="text-gold mb-4" size={22} strokeWidth={1.5} aria-hidden="true" />
          <h3 className="font-display text-xl mb-1">Email</h3>
          <p className="text-sm text-espresso/60">{settings?.contact_email || '—'}</p>
        </a>
        <div className="border border-espresso/15 p-8">
          <MapPin className="text-gold mb-4" size={22} strokeWidth={1.5} aria-hidden="true" />
          <h3 className="font-display text-xl mb-1">Studio</h3>
          <p className="text-sm text-espresso/60">{settings?.address || '—'}</p>
          {settings?.opening_hours && <p className="text-xs text-espresso/40 mt-2">{settings.opening_hours}</p>}
        </div>
      </div>

      <div className="max-w-xl">
        <h2 className="font-display text-2xl mb-6">Or send us a message</h2>

        {status === 'success' ? (
          <div className="border border-gold/40 bg-champagne/40 p-8 text-center">
            <p className="font-display text-xl mb-1">Message sent.</p>
            <p className="text-sm text-espresso/60">We'll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="contact-name" className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">
                Name
              </label>
              <input
                id="contact-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">
                Email
              </label>
              <input
                id="contact-email"
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </div>

            {status === 'error' && <p className="text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={status === 'submitting'}
              data-cursor="button"
              className="bg-espresso text-champagne px-8 py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
            >
              {status === 'submitting' ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
