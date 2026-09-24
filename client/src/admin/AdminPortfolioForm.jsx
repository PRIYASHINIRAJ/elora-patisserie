import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UploadCloud, X } from 'lucide-react';
import { adminPortfolioService } from '../services/adminPortfolioService';
import { adminCakeService } from '../services/adminCakeService';

const emptyForm = {
  title: '',
  description: '',
  occasion: '',
  category: '',
  eventDate: '',
  tags: '',
  portfolioType: 'portfolio_only',
  linkedCakeId: '',
  featured: false,
};

export default function AdminPortfolioForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [cakes, setCakes] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [, setExistingVideos] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminCakeService.list({ status: 'published' }).then((d) => setCakes(d.cakes)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    adminPortfolioService.get(id).then(({ item }) => {
      setForm({
        title: item.title,
        description: item.description || '',
        occasion: item.occasion || '',
        category: item.category || '',
        eventDate: item.event_date || '',
        tags: item.tags.join(', '),
        portfolioType: item.portfolio_type,
        linkedCakeId: item.linked_cake_id || '',
        featured: !!item.featured,
      });
      setExistingImages(item.images);
      setExistingVideos(item.videos);
    });
  }, [id, isEdit]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const csvToArray = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!form.title) {
      setError('Title is required.');
      return;
    }
    if (!isEdit && imageFiles.length === 0) {
      setError('At least one photo is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const fields = { ...form, tags: csvToArray(form.tags), linkedCakeId: form.linkedCakeId || '' };
      const files = { images: imageFiles.length ? imageFiles : undefined, videos: videoFiles.length ? videoFiles : undefined };
      if (isEdit) {
        await adminPortfolioService.update(id, fields, files);
      } else {
        await adminPortfolioService.create(fields, files);
      }
      navigate('/admin/portfolio');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong saving this item.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = async (imageId) => {
    await adminPortfolioService.removeImage(id, imageId);
    setExistingImages(existingImages.filter((img) => img.id !== imageId));
  };

  return (
    <div className="px-8 py-10 lg:px-12 max-w-3xl">
      <h1 className="font-display text-4xl text-espresso mb-8">{isEdit ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</h1>

      {error && <p className="text-red-700 text-sm mb-5">{error}</p>}

      <div className="space-y-8 bg-white border border-espresso/10 p-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Title</label>
            <input value={form.title} onChange={set('title')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Occasion</label>
            <input value={form.occasion} onChange={set('occasion')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Category</label>
            <input value={form.category} onChange={set('category')} placeholder="wedding, birthday…" className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Date</label>
            <input type="date" value={form.eventDate} onChange={set('eventDate')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Tags <span className="normal-case text-espresso/30">(comma separated)</span></label>
            <input value={form.tags} onChange={set('tags')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Description</label>
            <textarea rows={4} value={form.description} onChange={set('description')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
        </section>

        <section>
          <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-3">Listing Type</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="portfolioType" checked={form.portfolioType === 'portfolio_only'} onChange={() => setForm({ ...form, portfolioType: 'portfolio_only' })} />
              Portfolio Only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="portfolioType" checked={form.portfolioType === 'available_for_purchase'} onChange={() => setForm({ ...form, portfolioType: 'available_for_purchase' })} />
              Available for Purchase
            </label>
          </div>

          {form.portfolioType === 'available_for_purchase' && (
            <div className="mt-4">
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Link to Cake</label>
              <select value={form.linkedCakeId} onChange={set('linkedCakeId')} className="w-full sm:w-72 border border-espresso/20 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
                <option value="">— Select a cake —</option>
                {cakes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm mt-5">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Feature on homepage
          </label>
        </section>

        <section>
          <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-3">Media</label>

          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {existingImages.map((img) => (
                <div key={img.id} className="relative w-20 h-20 group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleRemoveImage(img.id)} className="absolute -top-2 -right-2 bg-espresso text-champagne rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="border border-dashed border-espresso/25 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gold text-espresso/50 text-xs">
              <UploadCloud size={20} className="mb-2" />
              Photos {!isEdit && <span className="text-red-600">*</span>}
              {imageFiles.length > 0 && <span className="mt-1 text-gold">{imageFiles.length} selected</span>}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setImageFiles(Array.from(e.target.files))} />
            </label>
            <label className="border border-dashed border-espresso/25 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gold text-espresso/50 text-xs">
              <UploadCloud size={20} className="mb-2" />
              Videos
              {videoFiles.length > 0 && <span className="mt-1 text-gold">{videoFiles.length} selected</span>}
              <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => setVideoFiles(Array.from(e.target.files))} />
            </label>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-4 mt-8">
        <button
          disabled={saving}
          onClick={handleSave}
          className="bg-espresso text-champagne px-7 py-3 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add to Portfolio'}
        </button>
        <button type="button" onClick={() => navigate('/admin/portfolio')} className="text-sm text-espresso/50 hover:text-espresso">
          Cancel
        </button>
      </div>
    </div>
  );
}
