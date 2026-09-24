import { useEffect, useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { addressService } from '../services/favouriteService';

const emptyForm = { label: '', recipientName: '', phone: '', line1: '', line2: '', city: '', state: '', postcode: '', isDefault: false };

export default function Addresses() {
  const [addresses, setAddresses] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = () => addressService.mine().then((d) => setAddresses(d.addresses));
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addressService.create(form);
    setForm(emptyForm);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    await addressService.remove(id);
    load();
  };

  const handleSetDefault = async (id) => {
    await addressService.update(id, { isDefault: true });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">My Account</p>
          <h1 className="font-display text-5xl">Addresses</h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 text-xs tracking-wide-cap uppercase border border-espresso/30 px-5 py-2.5 hover:border-espresso"
        >
          <Plus size={14} /> Add Address
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-espresso/15 bg-cream/50 p-6 mb-8 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Label (e.g. Home)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="border border-espresso/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            <input placeholder="Recipient Name" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} className="border border-espresso/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-gold" />
          </div>
          <input required placeholder="Address Line 1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="w-full border border-espresso/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-gold" />
          <input placeholder="Address Line 2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} className="w-full border border-espresso/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-gold" />
          <div className="grid grid-cols-3 gap-3">
            <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border border-espresso/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border border-espresso/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            <input required placeholder="Postcode" value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className="border border-espresso/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-gold" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> Set as default
          </label>
          <button type="submit" className="bg-espresso text-champagne px-6 py-2.5 text-xs tracking-wide-cap uppercase hover:bg-mocha">Save Address</button>
        </form>
      )}

      {!addresses ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : addresses.length === 0 ? (
        <div className="border border-dashed border-espresso/20 p-12 text-center">
          <p className="text-espresso/60 text-sm">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="border border-espresso/15 p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{a.label || 'Address'}</p>
                  {a.is_default === 1 && <span className="text-[10px] tracking-wide-cap uppercase bg-gold/20 text-mocha px-2 py-0.5 rounded-full">Default</span>}
                </div>
                <p className="text-sm text-espresso/60 mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city} {a.postcode}</p>
              </div>
              <div className="flex items-center gap-3">
                {a.is_default !== 1 && (
                  <button onClick={() => handleSetDefault(a.id)} title="Set as default" className="text-espresso/40 hover:text-gold">
                    <Star size={16} />
                  </button>
                )}
                <button onClick={() => handleDelete(a.id)} className="text-espresso/40 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
