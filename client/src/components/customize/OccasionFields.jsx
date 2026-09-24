const inputClass = 'w-full border border-espresso/20 px-3 py-2 text-sm focus:outline-none focus:border-gold';
const labelClass = 'block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-1.5';

export default function OccasionFields({ occasion, fields, onChange }) {
  const set = (key) => (e) => onChange({ ...fields, [key]: e.target.value });

  if (occasion === 'Birthday') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Name</label>
          <input value={fields.name || ''} onChange={set('name')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Age</label>
          <input value={fields.age || ''} onChange={set('age')} className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Theme</label>
          <input value={fields.theme || ''} onChange={set('theme')} placeholder="e.g. Safari, Princess, Formula 1" className={inputClass} />
        </div>
      </div>
    );
  }

  if (occasion === 'Anniversary') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>Names</label>
          <input value={fields.names || ''} onChange={set('names')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Anniversary Date</label>
          <input type="date" value={fields.date || ''} onChange={set('date')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Years Together</label>
          <input value={fields.years || ''} onChange={set('years')} className={inputClass} />
        </div>
      </div>
    );
  }

  if (occasion === 'Wedding' || occasion === 'Engagement') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>Couple Names</label>
          <input value={fields.coupleNames || ''} onChange={set('coupleNames')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{occasion === 'Wedding' ? 'Wedding Date' : 'Engagement Date'}</label>
          <input type="date" value={fields.eventDate || ''} onChange={set('eventDate')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Colour Theme</label>
          <input value={fields.colourTheme || ''} onChange={set('colourTheme')} className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Design Preferences</label>
          <textarea rows={3} value={fields.designPreferences || ''} onChange={set('designPreferences')} className={inputClass} />
        </div>
      </div>
    );
  }

  // Generic fallback for Graduation, Baby Shower, Corporate, Valentine's, Mother's/Father's Day, Other
  return (
    <div>
      <label className={labelClass}>Details</label>
      <textarea
        rows={3}
        value={fields.details || ''}
        onChange={set('details')}
        placeholder="Any names, dates, or specifics for this occasion"
        className={inputClass}
      />
    </div>
  );
}
