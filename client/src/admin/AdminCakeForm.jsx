import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, UploadCloud } from 'lucide-react';
import { adminCakeService } from '../services/adminCakeService';
import { cakeService } from '../services/cakeService';

const emptyForm = {
  name: '',
  categoryId: '',
  description: '',
  basePrice: '',
  serves: '',
  flavour: '',
  filling: '',
  ingredients: '',
  colours: '',
  customizationOptions: '',
  tags: '',
  isCustomizable: true,
  isFeatured: false,
  isAvailable: true,
};

export default function AdminCakeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [sizes, setSizes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cakeService.categories().then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    adminCakeService.get(id).then(({ cake }) => {
      setForm({
        name: cake.name,
        categoryId: cake.category_id || '',
        description: cake.description || '',
        basePrice: cake.base_price,
        serves: cake.serves || '',
        flavour: cake.flavour || '',
        filling: cake.filling || '',
        ingredients: cake.ingredients.join(', '),
        colours: cake.colours.join(', '),
        customizationOptions: cake.customization_options.join(', '),
        tags: cake.tags.join(', '),
        isCustomizable: !!cake.is_customizable,
        isFeatured: !!cake.is_featured,
        isAvailable: !!cake.is_available,
      });
      setSizes(cake.sizes.length ? cake.sizes : []);
      setExistingImages(cake.images);
      setExistingVideos(cake.videos);
    });
  }, [id, isEdit]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setCheck = (field) => (e) => setForm({ ...form, [field]: e.target.checked });

  const addSizeRow = () => setSizes([...sizes, { label: '', price: 0 }]);
  const updateSize = (idx, field, value) =>
    setSizes(sizes.map((s, i) => (i === idx ? { ...s, [field]: field === 'price' ? Number(value) : value } : s)));
  const removeSize = (idx) => setSizes(sizes.filter((_, i) => i !== idx));

  const csvToArray = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);

  const buildFields = (status) => ({
    name: form.name,
    categoryId: form.categoryId || '',
    description: form.description,
    basePrice: form.basePrice,
    serves: form.serves,
    flavour: form.flavour,
    filling: form.filling,
    sizes,
    ingredients: csvToArray(form.ingredients),
    colours: csvToArray(form.colours),
    customizationOptions: csvToArray(form.customizationOptions),
    tags: csvToArray(form.tags),
    isCustomizable: form.isCustomizable,
    isFeatured: form.isFeatured,
    isAvailable: form.isAvailable,
    status,
  });

  const buildFiles = () => ({
    mainImage: mainImageFile || undefined,
    galleryImages: galleryFiles.length ? galleryFiles : undefined,
    videos: videoFiles.length ? videoFiles : undefined,
  });

  const handleSave = async (status) => {
    if (!form.name) {
      setError('Cake name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await adminCakeService.update(id, buildFields(status), buildFiles());
      } else {
        await adminCakeService.create(buildFields(status), buildFiles());
      }
      navigate('/admin/cakes');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong saving this cake.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveExistingImage = async (imageId) => {
    await adminCakeService.removeImage(id, imageId);
    setExistingImages(existingImages.filter((img) => img.id !== imageId));
  };

  const handleRemoveExistingVideo = async (videoId) => {
    await adminCakeService.removeVideo(id, videoId);
    setExistingVideos(existingVideos.filter((v) => v.id !== videoId));
  };

  return (
    <div className="px-8 py-10 lg:px-12 max-w-4xl">
      <h1 className="font-display text-4xl text-espresso mb-8">{isEdit ? 'Edit Cake' : 'Add Cake'}</h1>

      {error && <p className="text-red-700 text-sm mb-5">{error}</p>}

      <div className="space-y-8 bg-white border border-espresso/10 p-8">
        {/* Basics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Name</label>
            <input value={form.name} onChange={set('name')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Category</label>
            <select value={form.categoryId} onChange={set('categoryId')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Base Price (RM)</label>
            <input type="number" value={form.basePrice} onChange={set('basePrice')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Serves</label>
            <input value={form.serves} onChange={set('serves')} placeholder="e.g. 10-14 guests" className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Flavour</label>
            <input value={form.flavour} onChange={set('flavour')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Filling</label>
            <input value={form.filling} onChange={set('filling')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Description</label>
            <textarea rows={4} value={form.description} onChange={set('description')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
        </section>

        {/* Sizes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[11px] tracking-wide-cap uppercase text-espresso/50">Sizes & Pricing</label>
            <button type="button" onClick={addSizeRow} className="flex items-center gap-1 text-xs text-gold hover:underline">
              <Plus size={13} /> Add size
            </button>
          </div>
          <div className="space-y-2">
            {sizes.map((s, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <input
                  placeholder="Label (e.g. 8 inch)"
                  value={s.label}
                  onChange={(e) => updateSize(idx, 'label', e.target.value)}
                  className="flex-1 border border-espresso/20 px-3 py-2 text-sm focus:outline-none focus:border-gold"
                />
                <input
                  type="number"
                  placeholder="+ price"
                  value={s.price}
                  onChange={(e) => updateSize(idx, 'price', e.target.value)}
                  className="w-28 border border-espresso/20 px-3 py-2 text-sm focus:outline-none focus:border-gold"
                />
                <button type="button" onClick={() => removeSize(idx)} className="text-espresso/40 hover:text-red-700">
                  <X size={15} />
                </button>
              </div>
            ))}
            {sizes.length === 0 && <p className="text-xs text-espresso/40">No size variants added — the base price will apply.</p>}
          </div>
        </section>

        {/* CSV fields */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Ingredients <span className="normal-case text-espresso/30">(comma separated)</span></label>
            <input value={form.ingredients} onChange={set('ingredients')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Colours <span className="normal-case text-espresso/30">(comma separated)</span></label>
            <input value={form.colours} onChange={set('colours')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Customization Options <span className="normal-case text-espresso/30">(comma separated)</span></label>
            <input value={form.customizationOptions} onChange={set('customizationOptions')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Tags <span className="normal-case text-espresso/30">(comma separated)</span></label>
            <input value={form.tags} onChange={set('tags')} className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
        </section>

        {/* Toggles */}
        <section className="flex flex-wrap gap-8">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isCustomizable} onChange={setCheck('isCustomizable')} /> Customizable
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFeatured} onChange={setCheck('isFeatured')} /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isAvailable} onChange={setCheck('isAvailable')} /> Available
          </label>
        </section>

        {/* Media */}
        <section>
          <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-3">Media</label>

          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {existingImages.map((img) => (
                <div key={img.id} className="relative w-20 h-20 group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {img.is_primary === 1 && <span className="absolute bottom-0 inset-x-0 bg-gold text-[9px] text-center text-ivory">MAIN</span>}
                  <button type="button" onClick={() => handleRemoveExistingImage(img.id)} className="absolute -top-2 -right-2 bg-espresso text-champagne rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {existingVideos.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {existingVideos.map((v) => (
                <div key={v.id} className="relative w-32 h-20 bg-espresso/5 group">
                  <video src={v.url} className="w-full h-full object-cover" muted />
                  <button type="button" onClick={() => handleRemoveExistingVideo(v.id)} className="absolute -top-2 -right-2 bg-espresso text-champagne rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="border border-dashed border-espresso/25 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gold text-espresso/50 text-xs">
              <UploadCloud size={20} className="mb-2" />
              Main image
              {mainImageFile && <span className="mt-1 text-gold truncate w-full">{mainImageFile.name}</span>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setMainImageFile(e.target.files[0])} />
            </label>
            <label className="border border-dashed border-espresso/25 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gold text-espresso/50 text-xs">
              <UploadCloud size={20} className="mb-2" />
              Gallery images
              {galleryFiles.length > 0 && <span className="mt-1 text-gold">{galleryFiles.length} selected</span>}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setGalleryFiles(Array.from(e.target.files))} />
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
          onClick={() => handleSave('published')}
          className="bg-espresso text-champagne px-7 py-3 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Publish'}
        </button>
        <button
          disabled={saving}
          onClick={() => handleSave('draft')}
          className="border border-espresso/30 text-espresso px-7 py-3 text-xs tracking-wide-cap uppercase hover:border-espresso disabled:opacity-50"
        >
          Save Draft
        </button>
        <button type="button" onClick={() => navigate('/admin/cakes')} className="text-sm text-espresso/50 hover:text-espresso">
          Cancel
        </button>
      </div>
    </div>
  );
}
