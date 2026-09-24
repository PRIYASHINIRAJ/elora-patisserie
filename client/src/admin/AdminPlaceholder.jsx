export default function AdminPlaceholder({ title, description }) {
  return (
    <div className="px-8 py-10 lg:px-12">
      <h1 className="font-display text-4xl text-espresso mb-4">{title}</h1>
      <div className="border border-dashed border-espresso/20 bg-white p-12 text-center max-w-xl">
        <p className="text-espresso/60 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
