const DECORATION_GLYPH = {
  'Fresh Flowers': '🌸',
  'Gold Leaf': '✨',
  'Macarons': '🟤',
  'Fresh Fruit': '🍓',
  'Sprinkles': '❋',
  'Piped Florals': '❁',
  'Edible Pearls': '⚬',
  'Chocolate Shards': '◆',
};

const SIZE_TIERS = {
  '6"': 1,
  '8"': 2,
  '10"': 3,
  '12"': 3,
  Custom: 2,
};

const FONT_STACK = {
  'Cormorant Garamond (Elegant)': "'Cormorant Garamond', serif",
  'Playfair Display (Classic)': "'Playfair Display', serif",
  'Manrope (Modern)': "'Manrope', sans-serif",
  'Script (Handwritten)': "'Cormorant Garamond', serif",
};

export default function CakePreview({ size, colourHex, message, decorations = [] }) {
  const tiers = SIZE_TIERS[size] || 2;
  const widths = [58, 44, 32]; // percentages, bottom to top
  const messagePlacement = message?.placement || 'Front Center';

  const isTop = messagePlacement === 'Top Tier';
  const isBoard = messagePlacement === 'Cake Board';
  const isSide = messagePlacement === 'Side Tier';

  return (
    <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-cream to-beige flex flex-col items-center justify-end pb-10 overflow-hidden">
      {/* decorative glyphs scattered around */}
      <div className="absolute inset-0 pointer-events-none">
        {decorations.slice(0, 6).map((d, i) => (
          <span
            key={d}
            className="absolute text-lg opacity-80"
            style={{
              left: `${15 + ((i * 27) % 70)}%`,
              top: `${12 + ((i * 19) % 55)}%`,
            }}
          >
            {DECORATION_GLYPH[d] || '•'}
          </span>
        ))}
      </div>

      {/* cake board */}
      <div className="w-[70%] h-3 bg-espresso/15 rounded-full mb-1 relative z-10">
        {isBoard && message?.text && (
          <span
            className="absolute -bottom-6 inset-x-0 text-center text-xs truncate px-2"
            style={{ color: message.color || '#2B2019', fontFamily: FONT_STACK[message.font] || 'inherit' }}
          >
            {message.text}
          </span>
        )}
      </div>

      {/* tiers, bottom to top */}
      <div className="flex flex-col-reverse items-center relative z-10">
        {Array.from({ length: tiers }).map((_, i) => (
          <div
            key={i}
            className="relative rounded-[6px] shadow-sm border border-black/5"
            style={{
              width: `${widths[i] || 30}%`,
              height: tiers === 1 ? 120 : 56,
              backgroundColor: colourHex || '#EFE1C6',
              marginBottom: i === 0 ? 0 : 4,
            }}
          >
            {isSide && i === 0 && message?.text && (
              <span
                className="absolute inset-0 flex items-center justify-center text-xs px-2 text-center"
                style={{ color: message.color || '#2B2019', fontFamily: FONT_STACK[message.font] || 'inherit' }}
              >
                {message.text}
              </span>
            )}
            {isTop && i === tiers - 1 && message?.text && (
              <span
                className="absolute -top-6 inset-x-0 text-center text-xs truncate px-1"
                style={{ color: message.color || '#2B2019', fontFamily: FONT_STACK[message.font] || 'inherit' }}
              >
                {message.text}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* front-center message (default) */}
      {messagePlacement === 'Front Center' && message?.text && (
        <div
          className="absolute bottom-16 inset-x-6 text-center text-sm z-20 leading-snug"
          style={{ color: message.color || '#2B2019', fontFamily: FONT_STACK[message.font] || 'inherit' }}
        >
          {message.text}
        </div>
      )}

      <p className="absolute top-3 left-3 text-[9px] tracking-wide-cap uppercase text-espresso/30">
        Design Preview
      </p>
    </div>
  );
}
