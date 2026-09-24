import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { settingsService } from '../services/settingsService';

const SECTIONS = [
  {
    title: 'Business Identity',
    fields: [
      { key: 'business_name', label: 'Business Name' },
      { key: 'tagline', label: 'Tagline' },
      { key: 'description', label: 'Description', textarea: true },
    ],
  },
  {
    title: 'Contact & Social',
    fields: [
      { key: 'whatsapp_number', label: 'WhatsApp Number', placeholder: '+60123456789' },
      { key: 'contact_email', label: 'Contact Email' },
      { key: 'instagram_handle', label: 'Instagram' },
      { key: 'tiktok_handle', label: 'TikTok' },
      { key: 'facebook_url', label: 'Facebook URL' },
    ],
  },
  {
    title: 'Studio',
    fields: [
      { key: 'address', label: 'Address' },
      { key: 'opening_hours', label: 'Opening Hours' },
    ],
  },
  {
    title: 'Commerce',
    fields: [
      { key: 'delivery_fee', label: 'Delivery Fee (RM)', type: 'number' },
      { key: 'minimum_order', label: 'Minimum Order (RM)', type: 'number' },
    ],
  },
  {
    title: 'Meet the Baker',
    fields: [
      { key: 'baker_name', label: 'Baker Name' },
      { key: 'baker_title', label: 'Title', placeholder: 'e.g. Founder & Head Pâtissière' },
      { key: 'baker_bio', label: 'Bio', textarea: true },
    ],
  },
];

export default function AdminSettings() {
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBakerPhoto, setUploadingBakerPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const bakerPhotoInputRef = useRef(null);

  useEffect(() => {
    settingsService.admin().then((d) => setValues(d.settings)).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const d = await settingsService.update(values);
    setValues(d.settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { logoUrl } = await settingsService.uploadLogo(file);
      setValues({ ...values, logo_url: logoUrl });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBakerPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBakerPhoto(true);
    try {
      const { photoUrl } = await settingsService.uploadBakerPhoto(file);
      setValues({ ...values, baker_photo_url: photoUrl });
    } finally {
      setUploadingBakerPhoto(false);
    }
  };

  if (loading) return <div className="px-8 py-10 text-espresso/50 text-sm">Loading…</div>;

  return (
    <div className="px-8 py-10 lg:px-12 max-w-2xl">
      <h1 className="font-display text-4xl text-espresso mb-2">Business Settings</h1>
      <p className="text-sm text-espresso/50 mb-8">
        Nothing here is hardcoded — these values power the site footer, contact page, and
        the floating WhatsApp button's prefilled messages.
      </p>

      {/* Logo */}
      <div className="bg-white border border-espresso/10 p-8 mb-6">
        <p className="text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-3">Logo</p>
        <div className="flex items-center gap-5">
          {values.logo_url ? (
            <img src={values.logo_url} alt="Logo" className="w-16 h-16 object-contain border border-espresso/10" />
          ) : (
            <div className="w-16 h-16 border border-dashed border-espresso/20 flex items-center justify-center text-espresso/30 text-[10px] text-center">No logo</div>
          )}
          <label className="flex items-center gap-2 text-xs tracking-wide-cap uppercase border border-espresso/30 px-4 py-2.5 hover:border-espresso cursor-pointer">
            <UploadCloud size={14} /> {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
        </div>
      </div>

      {/* Baker Photo */}
      <div className="bg-white border border-espresso/10 p-8 mb-6">
        <p className="text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-3">Baker Photo</p>
        <p className="text-xs text-espresso/40 mb-4">
          Shown in the homepage's "Meet the Baker" section, alongside the name, title and
          bio filled in below. The section only appears once both a name and a photo are set.
        </p>
        <div className="flex items-center gap-5">
          {values.baker_photo_url ? (
            <img src={values.baker_photo_url} alt="Baker" className="w-16 h-16 object-cover rounded-full border border-espresso/10" />
          ) : (
            <div className="w-16 h-16 rounded-full border border-dashed border-espresso/20 flex items-center justify-center text-espresso/30 text-[9px] text-center">No photo</div>
          )}
          <label className="flex items-center gap-2 text-xs tracking-wide-cap uppercase border border-espresso/30 px-4 py-2.5 hover:border-espresso cursor-pointer">
            <UploadCloud size={14} /> {uploadingBakerPhoto ? 'Uploading…' : 'Upload Photo'}
            <input ref={bakerPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleBakerPhotoUpload} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white border border-espresso/10 p-8">
            <p className="text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-4">{section.title}</p>
            <div className="space-y-4">
              {section.fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">{f.label}</label>
                  {f.textarea ? (
                    <textarea
                      rows={3}
                      value={values[f.key] || ''}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
                    />
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={values[f.key] || ''}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4">
          <button type="submit" className="bg-espresso text-champagne px-7 py-3 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors">
            Save Settings
          </button>
          {saved && <span className="text-sm text-gold">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
