import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { customRequestService } from '../services/customRequestService';

const statusStyles = {
  new: 'bg-gold/20 text-mocha',
  reviewing: 'bg-champagne text-mocha',
  quoted: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  converted: 'bg-espresso text-champagne',
};

export default function AdminCustomRequests() {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteDesignNotes, setQuoteDesignNotes] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [plainMessage, setPlainMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    customRequestService.adminList().then((d) => setRequests(d.requests)).catch(() => setError('Could not load custom requests.'));
  };

  useEffect(load, []);

  useEffect(() => {
    if (!activeId) return;
    customRequestService.get(activeId).then(setDetail);
  }, [activeId]);

  const refreshDetail = async () => {
    const d = await customRequestService.get(activeId);
    setDetail(d);
    load();
  };

  const handleSendQuote = async () => {
    if (!quotePrice) return;
    setBusy(true);
    try {
      await customRequestService.adminSendQuote(activeId, {
        proposedPrice: Number(quotePrice),
        proposedDesignNotes: quoteDesignNotes,
        message: quoteMessage,
      });
      setQuotePrice('');
      setQuoteDesignNotes('');
      setQuoteMessage('');
      await refreshDetail();
    } finally {
      setBusy(false);
    }
  };

  const handleSendMessage = async () => {
    if (!plainMessage) return;
    setBusy(true);
    try {
      await customRequestService.adminSendMessage(activeId, plainMessage);
      setPlainMessage('');
      await refreshDetail();
    } finally {
      setBusy(false);
    }
  };

  const handleConvert = async () => {
    if (!window.confirm('Convert this accepted request into a real order?')) return;
    setBusy(true);
    try {
      await customRequestService.adminConvert(activeId);
      await refreshDetail();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-8 py-10 lg:px-12">
      <h1 className="font-display text-4xl text-espresso mb-8">Custom Cake Requests</h1>

      {error && <p className="text-red-700 text-sm">{error}</p>}

      {!requests ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="border border-dashed border-espresso/20 bg-white p-12 text-center max-w-xl">
          <p className="text-espresso/60 text-sm">No custom requests submitted yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-espresso/10 divide-y divide-espresso/10 max-h-[700px] overflow-y-auto">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className={`w-full text-left p-4 ${activeId === r.id ? 'bg-champagne/30' : 'hover:bg-champagne/10'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium truncate">{r.full_name}</p>
                  <span className={`text-[10px] tracking-wide-cap uppercase px-2 py-0.5 rounded-full shrink-0 capitalize ${statusStyles[r.status] || ''}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-espresso/50 truncate">{r.occasion} — {r.description}</p>
                {r.images?.[0] && <img src={r.images[0].url} alt="" className="w-full h-20 object-cover mt-2" />}
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 bg-white border border-espresso/10 p-6 max-h-[700px] overflow-y-auto">
            {!detail ? (
              <p className="text-espresso/40 text-sm">Select a request to view details.</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-display text-2xl">{detail.request.full_name}</h2>
                    <span className={`text-[11px] tracking-wide-cap uppercase px-3 py-1 rounded-full capitalize ${statusStyles[detail.request.status] || ''}`}>
                      {detail.request.status}
                    </span>
                  </div>
                  <p className="text-sm text-espresso/50">{detail.request.email} {detail.request.phone && `· ${detail.request.phone}`}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-cream/50 p-4">
                  <p><span className="text-espresso/40">Occasion:</span> {detail.request.occasion || '—'}</p>
                  <p><span className="text-espresso/40">Budget:</span> {detail.request.budget_range || '—'}</p>
                  <p><span className="text-espresso/40">Size:</span> {detail.request.size || '—'}</p>
                  <p><span className="text-espresso/40">Flavour:</span> {detail.request.flavour || '—'}</p>
                  <p><span className="text-espresso/40">Colour:</span> {detail.request.colour || '—'}</p>
                  <p><span className="text-espresso/40">Required date:</span> {detail.request.preferred_date || '—'}</p>
                </div>

                <div>
                  <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Description</p>
                  <p className="text-sm">{detail.request.description}</p>
                </div>

                {detail.request.notes && (
                  <div>
                    <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Additional Notes</p>
                    <p className="text-sm whitespace-pre-line">{detail.request.notes}</p>
                  </div>
                )}

                {detail.request.images?.length > 0 && (
                  <div>
                    <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Inspiration Images</p>
                    <div className="flex flex-wrap gap-3">
                      {detail.request.images.map((img) => (
                        <img key={img.id} src={img.url} alt="" className="w-24 h-24 object-cover" />
                      ))}
                    </div>
                  </div>
                )}

                {detail.request.quoted_price != null && (
                  <div className="border border-gold/40 bg-champagne/30 p-4">
                    <p className="text-[11px] tracking-wide-cap uppercase text-mocha mb-1">Quote Sent</p>
                    <p className="font-display text-2xl">RM {detail.request.quoted_price.toFixed(2)}</p>
                    {detail.request.quoted_design_notes && <p className="text-sm text-espresso/60 mt-1">{detail.request.quoted_design_notes}</p>}
                  </div>
                )}

                {detail.request.status === 'accepted' && (
                  <button
                    onClick={handleConvert}
                    disabled={busy}
                    className="flex items-center gap-2 bg-espresso text-champagne px-6 py-3 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
                  >
                    <ShoppingBag size={15} /> Convert to Order
                  </button>
                )}

                {detail.request.converted_order_id && (
                  <p className="text-sm text-green-700">✓ Converted to order #{detail.request.converted_order_id}</p>
                )}

                {/* Conversation thread */}
                <div className="border-t border-espresso/10 pt-5">
                  <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-3">Conversation</p>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {detail.messages.map((m) => (
                      <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-2 text-sm ${m.sender_type === 'admin' ? 'bg-espresso text-champagne' : 'bg-cream'}`}>
                          {m.body}
                        </div>
                      </div>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={plainMessage}
                    onChange={(e) => setPlainMessage(e.target.value)}
                    placeholder="Send a message or ask a question…"
                    className="w-full border border-espresso/20 px-3 py-2 text-sm mb-2 focus:outline-none focus:border-gold"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={busy || !plainMessage}
                    className="text-xs tracking-wide-cap uppercase border border-espresso/30 px-5 py-2 hover:border-espresso disabled:opacity-50"
                  >
                    Send Message
                  </button>
                </div>

                {/* Quote form */}
                {!detail.request.converted_order_id && (
                  <div className="border-t border-espresso/10 pt-5">
                    <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-3">Send a Quote</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="number"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                        placeholder="Proposed price (RM)"
                        className="border border-espresso/20 px-3 py-2 text-sm focus:outline-none focus:border-gold"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={quoteDesignNotes}
                      onChange={(e) => setQuoteDesignNotes(e.target.value)}
                      placeholder="Proposed design notes"
                      className="w-full border border-espresso/20 px-3 py-2 text-sm mb-2 focus:outline-none focus:border-gold"
                    />
                    <textarea
                      rows={2}
                      value={quoteMessage}
                      onChange={(e) => setQuoteMessage(e.target.value)}
                      placeholder="Message to accompany the quote"
                      className="w-full border border-espresso/20 px-3 py-2 text-sm mb-3 focus:outline-none focus:border-gold"
                    />
                    <button
                      onClick={handleSendQuote}
                      disabled={busy || !quotePrice}
                      className="bg-espresso text-champagne px-6 py-2.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
                    >
                      Send Quote
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
