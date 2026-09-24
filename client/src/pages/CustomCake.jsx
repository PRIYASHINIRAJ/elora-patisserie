import { useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { customRequestService } from '../services/customRequestService';
import OccasionFields from '../components/customize/OccasionFields';
import { usePageMeta } from '../hooks/usePageMeta';

const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Engagement', 'Graduation', 'Baby Shower', 'Corporate', "Valentine's Day", "Mother's Day", "Father's Day", 'Other'];

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  occasion: 'Birthday',
  colour: '',
  size: '',
  flavour: '',
  budgetRange: '',
  preferredDate: '',
  description: '',
  notes: '',
};

export default function CustomCake() {
  usePageMeta({
    title: 'Create Your Cake',
    description: 'Upload inspiration images and describe your vision — our design team will follow up with a concept and quote for your fully bespoke cake.',
  });
  const [form, setForm] = useState(initialForm);
  const [occasionFields, setOccasionFields] = useState({});
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleFiles = (e) => {
    const files = Array.from(e.target.files).slice(0, 8);
    setImages(files);
  };

  const removeImage = (idx) => setImages(images.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const occasionDetailsText = Object.entries(occasionFields)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
      const combinedNotes = [form.notes, occasionDetailsText].filter(Boolean).join('\n\n');

      await customRequestService.create({ ...form, notes: combinedNotes }, images);
      setStatus('success');
      setForm(initialForm);
      setOccasionFields({});
      setImages([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong submitting your request.');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
      <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">Create Your Cake</p>
      <h1 className="font-display text-5xl mb-4">Design a Custom Cake</h1>
      <p className="text-espresso/60 mb-12 max-w-lg">
        Upload a few inspiration images and tell us about the occasion — our design team will
        follow up with a concept, a proposed price, and answers to any questions.
      </p>

      {status === 'success' ? (
        <div className="border border-gold/40 bg-champagne/40 p-10 text-center">
          <p className="font-display text-2xl mb-2">Request received.</p>
          <p className="text-sm text-espresso/60">
            Our studio will follow up by message within 1–2 business days with a design concept and quote.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image upload */}
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">
              Inspiration Images
            </label>
            <label className="border border-dashed border-espresso/25 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gold text-espresso/50 text-xs">
              <UploadCloud size={22} className="mb-2" />
              Upload cake references, decoration ideas, colour inspiration…
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {images.map((f, i) => (
                  <div key={i} className="relative w-16 h-16">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-espresso text-champagne rounded-full w-5 h-5 flex items-center justify-center">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Full name</label>
              <input required value={form.fullName} onChange={handleChange('fullName')} className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Email</label>
              <input required type="email" value={form.email} onChange={handleChange('email')} className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Phone</label>
              <input value={form.phone} onChange={handleChange('phone')} className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Occasion</label>
              <select
                value={form.occasion}
                onChange={(e) => { handleChange('occasion')(e); setOccasionFields({}); }}
                className="w-full border border-espresso/20 bg-white px-4 py-3 text-sm focus:outline-none focus:border-gold"
              >
                {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Colour</label>
              <input value={form.colour} onChange={handleChange('colour')} placeholder="e.g. Sage green & ivory" className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Size</label>
              <input value={form.size} onChange={handleChange('size')} placeholder="e.g. 8 inch, serves 15" className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Flavour</label>
              <input value={form.flavour} onChange={handleChange('flavour')} className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Budget range (RM)</label>
              <input value={form.budgetRange} onChange={handleChange('budgetRange')} placeholder="e.g. 500–800" className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Required date</label>
              <input type="date" value={form.preferredDate} onChange={handleChange('preferredDate')} className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>

          <div className="bg-cream/60 p-5">
            <p className="text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-3">{form.occasion} Details</p>
            <OccasionFields occasion={form.occasion} fields={occasionFields} onChange={setOccasionFields} />
          </div>

          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Describe your vision</label>
            <textarea required rows={4} value={form.description} onChange={handleChange('description')} className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold" />
          </div>

          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Additional notes</label>
            <textarea rows={3} value={form.notes} onChange={handleChange('notes')} placeholder="Allergies, dietary needs, delivery instructions…" className="w-full border border-espresso/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-gold" />
          </div>

          {status === 'error' && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="bg-espresso text-champagne px-8 py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
          >
            {status === 'submitting' ? 'Sending…' : 'Send Custom Request'}
          </button>
        </form>
      )}
    </div>
  );
}
