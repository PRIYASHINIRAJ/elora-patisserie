import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-xs tracking-wide-cap uppercase text-gold mb-4">404</p>
      <h1 className="font-display text-5xl mb-6">This page hasn't been baked yet.</h1>
      <Link to="/" className="text-sm tracking-wide-cap uppercase underline text-espresso/60 hover:text-espresso">
        Return Home
      </Link>
    </div>
  );
}
