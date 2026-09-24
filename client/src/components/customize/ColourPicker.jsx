const PRESETS = [
  { label: 'Ivory', hex: '#FAF6EE' },
  { label: 'Champagne', hex: '#EFE1C6' },
  { label: 'Sage Green', hex: '#9CAF88' },
  { label: 'Dusty Rose', hex: '#C9A79A' },
  { label: 'Espresso', hex: '#2B2019' },
  { label: 'Gold', hex: '#B08A4E' },
  { label: 'Blush', hex: '#E8C4C4' },
  { label: 'Charcoal', hex: '#3A3A3A' },
];

export default function ColourPicker({ value, onChange }) {
  const isHexValid = /^#[0-9A-Fa-f]{6}$/.test(value?.hex || '');

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map((p) => (
          <button
            key={p.hex}
            type="button"
            onClick={() => onChange({ label: p.label, hex: p.hex })}
            title={p.label}
            className={`w-8 h-8 rounded-full border-2 transition-transform ${
              value?.hex === p.hex ? 'border-gold scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: p.hex }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={isHexValid ? value.hex : '#EFE1C6'}
          onChange={(e) => onChange({ label: 'Custom', hex: e.target.value })}
          className="w-9 h-9 border border-espresso/20 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value?.hex || ''}
          onChange={(e) => onChange({ label: 'Custom', hex: e.target.value })}
          placeholder="#RRGGBB"
          className="w-28 border border-espresso/20 px-3 py-1.5 text-sm focus:outline-none focus:border-gold"
        />
        {value?.label && <span className="text-xs text-espresso/50">{value.label}</span>}
      </div>
    </div>
  );
}
