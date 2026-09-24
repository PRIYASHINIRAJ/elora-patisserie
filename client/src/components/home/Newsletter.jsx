import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const { data } = await api.post('/newsletter', { email });
      setMessage(data.message);
      setStatus('success');
      setEmail('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong.');
      setStatus('error');
    }
  };

  return (
    <section className="bg-espresso py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
        className="max-w-xl mx-auto px-6 text-center"
      >
        <p className="text-xs tracking-wide-cap uppercase text-gold-light mb-3">Stay in Touch</p>
        <h2 className="font-display text-4xl text-champagne mb-4">Join the Atelier List</h2>
        <p className="text-champagne/60 text-sm mb-8">
          New collections, seasonal specials, and the occasional behind-the-scenes look at the studio.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent border border-champagne/30 px-5 py-3 text-sm text-champagne placeholder:text-champagne/40 focus:outline-none focus:border-gold-light"
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="bg-champagne text-espresso px-7 py-3 text-xs tracking-wide-cap uppercase hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {status === 'submitting' ? 'Joining…' : 'Subscribe'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-sm ${status === 'error' ? 'text-red-300' : 'text-gold-light'}`}>{message}</p>
        )}
      </motion.div>
    </section>
  );
}
