import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import CakePreview from './CakePreview';
import ColourPicker from './ColourPicker';
import OccasionFields from './OccasionFields';
import { useCart } from '../../context/CartContext';
import { useWhatsAppContext } from '../../context/WhatsAppMessageContext';

const SIZES = ['6"', '8"', '10"', '12"', 'Custom'];
const FLAVOURS = ['Vanilla', 'Chocolate', 'Red Velvet', 'Strawberry', 'Pistachio', 'Matcha', 'Lemon', 'Custom'];
const FILLINGS = ['Vanilla Cream', 'Chocolate Ganache', 'Strawberry Cream', 'Salted Caramel', 'Pistachio Cream', 'Custom'];
const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Engagement', 'Graduation', 'Baby Shower', 'Corporate', "Valentine's Day", "Mother's Day", "Father's Day", 'Other'];
const DECORATIONS = ['Fresh Flowers', 'Gold Leaf', 'Macarons', 'Fresh Fruit', 'Sprinkles', 'Piped Florals', 'Edible Pearls', 'Chocolate Shards'];
const FONTS = ['Cormorant Garamond (Elegant)', 'Playfair Display (Classic)', 'Manrope (Modern)', 'Script (Handwritten)'];
const PLACEMENTS = ['Front Center', 'Top Tier', 'Cake Board', 'Side Tier'];
const SIZE_SURCHARGE = { '6"': 0, '8"': 0, '10"': 60, '12"': 120, Custom: 0 };

const inputClass = 'w-full border border-espresso/20 px-3 py-2 text-sm focus:outline-none focus:border-gold bg-transparent';
const labelClass = 'block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-1.5';

function Pills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3.5 py-1.5 text-xs border transition-colors ${
            value === opt ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/70 hover:border-espresso/50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function CakeCustomizer({ cake }) {
  const { addCustomizedItem } = useCart();
  const { setWhatsAppContext } = useWhatsAppContext();
  const [tab, setTab] = useState('exact'); // 'exact' | 'customize'
  const [added, setAdded] = useState(false);

  // Exact-design order state
  const [exactSize, setExactSize] = useState(SIZES[1]);
  const [exactQuantity, setExactQuantity] = useState(1);
  const [exactMessage, setExactMessage] = useState('');
  const [exactDeliveryDate, setExactDeliveryDate] = useState('');
  const [exactDeliveryTime, setExactDeliveryTime] = useState('');

  // Customize state
  const [size, setSize] = useState(SIZES[1]);
  const [customSize, setCustomSize] = useState('');
  const [flavour, setFlavour] = useState(cake.flavour || FLAVOURS[0]);
  const [customFlavour, setCustomFlavour] = useState('');
  const [filling, setFilling] = useState(cake.filling || FILLINGS[0]);
  const [customFilling, setCustomFilling] = useState('');
  const [colour, setColour] = useState({ label: 'Champagne', hex: '#EFE1C6' });
  const [messageText, setMessageText] = useState('');
  const [messageFont, setMessageFont] = useState(FONTS[0]);
  const [messageColor, setMessageColor] = useState('#2B2019');
  const [messagePlacement, setMessagePlacement] = useState(PLACEMENTS[0]);
  const [occasion, setOccasion] = useState('Birthday');
  const [occasionFields, setOccasionFields] = useState({});
  const [decorations, setDecorations] = useState([]);
  const [otherRequirements, setOtherRequirements] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  const resolvedSize = size === 'Custom' ? customSize || 'Custom' : size;
  const resolvedFlavour = flavour === 'Custom' ? customFlavour || 'Custom' : flavour;
  const resolvedFilling = filling === 'Custom' ? customFilling || 'Custom' : filling;

  const toggleDecoration = (d) =>
    setDecorations((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  // Keep the floating WhatsApp button contextual to whichever tab is active.
  useEffect(() => {
    if (tab === 'exact') {
      setWhatsAppContext({
        cakeName: cake.name,
        summary: `I would like the "${cake.name}" in ${exactSize}${exactMessage ? `, with the message "${exactMessage}"` : ''}.`,
      });
    } else {
      setWhatsAppContext({
        cakeName: cake.name,
        summary: `I'm customizing the "${cake.name}" — ${resolvedSize} size, ${resolvedFlavour} flavour, in ${colour.label || colour.hex}${occasion ? ` for a ${occasion}` : ''}.`,
      });
    }
    return () => setWhatsAppContext(null);
  }, [tab, exactSize, exactMessage, resolvedSize, resolvedFlavour, colour, occasion]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddExact = () => {
    const customization = {
      orderType: 'exact',
      size: exactSize,
      message: exactMessage ? { text: exactMessage } : null,
      deliveryDate: exactDeliveryDate,
      deliveryTime: exactDeliveryTime,
      sizeExtraCost: SIZE_SURCHARGE[exactSize] || 0,
    };
    addCustomizedItem(cake, exactQuantity, customization);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddCustomized = () => {
    const customization = {
      orderType: 'customized',
      size: resolvedSize,
      flavour: resolvedFlavour,
      filling: resolvedFilling,
      colour,
      message: messageText ? { text: messageText, font: messageFont, color: messageColor, placement: messagePlacement } : null,
      occasion,
      occasionFields,
      decorations,
      otherRequirements,
      deliveryDate,
      deliveryTime,
      sizeExtraCost: SIZE_SURCHARGE[size] || 0,
    };
    addCustomizedItem(cake, quantity, customization);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="border-t border-espresso/10 mt-14 pt-14">
      <div className="flex gap-2 mb-10">
        <button
          onClick={() => setTab('exact')}
          className={`px-6 py-3 text-xs tracking-wide-cap uppercase border-b-2 ${
            tab === 'exact' ? 'border-gold text-espresso' : 'border-transparent text-espresso/40'
          }`}
        >
          Order This Exact Design
        </button>
        <button
          onClick={() => setTab('customize')}
          className={`px-6 py-3 text-xs tracking-wide-cap uppercase border-b-2 ${
            tab === 'customize' ? 'border-gold text-espresso' : 'border-transparent text-espresso/40'
          }`}
        >
          Customize This Design
        </button>
      </div>

      {tab === 'exact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
          <div>
            <p className="text-xs tracking-wide-cap uppercase text-espresso/40 mb-3">Original Design</p>
            <div className="aspect-[4/5] bg-beige overflow-hidden">
              <img src={cake.image_url || cake.images?.[0]?.url} alt={cake.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className={labelClass}>Size</label>
              <Pills options={SIZES} value={exactSize} onChange={setExactSize} />
            </div>
            <div>
              <label className={labelClass}>Quantity</label>
              <input
                type="number"
                min={1}
                value={exactQuantity}
                onChange={(e) => setExactQuantity(Math.max(1, Number(e.target.value)))}
                className={`${inputClass} w-24`}
              />
            </div>
            <div>
              <label className={labelClass}>Message on Cake</label>
              <input value={exactMessage} onChange={(e) => setExactMessage(e.target.value)} placeholder="Happy Birthday Emma ❤️" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Delivery Date</label>
                <input type="date" value={exactDeliveryDate} onChange={(e) => setExactDeliveryDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Delivery Time</label>
                <input type="time" value={exactDeliveryTime} onChange={(e) => setExactDeliveryTime(e.target.value)} className={inputClass} />
              </div>
            </div>

            <button
              onClick={handleAddExact}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-espresso text-champagne px-8 py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
            >
              {added ? <><Check size={15} /> Added</> : 'Add This Exact Design to Cart'}
            </button>
          </div>
        </div>
      )}

      {tab === 'customize' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            <p className="text-xs tracking-wide-cap uppercase text-espresso/40">Live Preview</p>
            <CakePreview
              size={resolvedSize}
              colourHex={colour.hex}
              message={messageText ? { text: messageText, font: messageFont, color: messageColor, placement: messagePlacement } : null}
              decorations={decorations}
            />
            <div>
              <p className="text-xs tracking-wide-cap uppercase text-espresso/40 mb-2">Original Design (for reference)</p>
              <div className="aspect-[4/3] bg-beige overflow-hidden">
                <img src={cake.image_url || cake.images?.[0]?.url} alt={cake.name} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div className="space-y-7">
            <div>
              <label className={labelClass}>Size</label>
              <Pills options={SIZES} value={size} onChange={setSize} />
              {size === 'Custom' && (
                <input value={customSize} onChange={(e) => setCustomSize(e.target.value)} placeholder="Describe the size you need" className={`${inputClass} mt-2`} />
              )}
            </div>

            <div>
              <label className={labelClass}>Flavour</label>
              <Pills options={FLAVOURS} value={flavour} onChange={setFlavour} />
              {flavour === 'Custom' && (
                <input value={customFlavour} onChange={(e) => setCustomFlavour(e.target.value)} placeholder="Describe the flavour" className={`${inputClass} mt-2`} />
              )}
            </div>

            <div>
              <label className={labelClass}>Filling</label>
              <Pills options={FILLINGS} value={filling} onChange={setFilling} />
              {filling === 'Custom' && (
                <input value={customFilling} onChange={(e) => setCustomFilling(e.target.value)} placeholder="Describe the filling" className={`${inputClass} mt-2`} />
              )}
            </div>

            <div>
              <label className={labelClass}>Colour</label>
              <ColourPicker value={colour} onChange={setColour} />
            </div>

            <div>
              <label className={labelClass}>Message on Cake</label>
              <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Happy Birthday Emma ❤️" className={inputClass} />
              {messageText && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <select value={messageFont} onChange={(e) => setMessageFont(e.target.value)} className={`${inputClass} bg-white`}>
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select value={messagePlacement} onChange={(e) => setMessagePlacement(e.target.value)} className={`${inputClass} bg-white`}>
                    {PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <div className="col-span-2 flex items-center gap-3">
                    <span className="text-xs text-espresso/50">Message colour</span>
                    <input type="color" value={messageColor} onChange={(e) => setMessageColor(e.target.value)} className="w-8 h-8 border border-espresso/20 cursor-pointer" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Occasion</label>
              <select value={occasion} onChange={(e) => { setOccasion(e.target.value); setOccasionFields({}); }} className={`${inputClass} bg-white`}>
                {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <div className="mt-3">
                <OccasionFields occasion={occasion} fields={occasionFields} onChange={setOccasionFields} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Decorations</label>
              <div className="flex flex-wrap gap-2">
                {DECORATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDecoration(d)}
                    className={`px-3.5 py-1.5 text-xs border transition-colors ${
                      decorations.includes(d) ? 'bg-gold text-ivory border-gold' : 'border-espresso/20 text-espresso/70 hover:border-espresso/50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Other Requirements</label>
              <textarea rows={3} value={otherRequirements} onChange={(e) => setOtherRequirements(e.target.value)} className={inputClass} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Quantity</label>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Delivery Date</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Delivery Time</label>
                <input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className={inputClass} />
              </div>
            </div>

            <button
              onClick={handleAddCustomized}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-espresso text-champagne px-8 py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
            >
              {added ? <><Check size={15} /> Added</> : 'Add Custom Design to Cart'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
