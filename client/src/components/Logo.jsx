export default function Logo({ light = false, compact = false }) {
  const color = light ? 'text-champagne' : 'text-espresso';
  const size = compact ? 24 : 30;
  return (
    <div className={`flex items-center gap-3 ${color} transition-all duration-500`}>
      <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="14" stroke="currentColor" strokeWidth="1" />
        <text
          x="15"
          y="20.5"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', serif"
          fontSize="16"
          fill="currentColor"
        >
          É
        </text>
      </svg>
      <span className={`font-display tracking-wide leading-none transition-all duration-500 ${compact ? 'text-lg' : 'text-xl'}`}>
        Élora <span className="italic font-normal">Patisserie</span>
      </span>
    </div>
  );
}
