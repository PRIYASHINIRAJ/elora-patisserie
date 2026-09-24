import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { useWhatsAppContext } from '../context/WhatsAppMessageContext';

export default function WhatsAppButton() {
  const [number, setNumber] = useState(null);
  const { context } = useWhatsAppContext();

  useEffect(() => {
    settingsService
      .public()
      .then((d) => setNumber(d.settings.whatsapp_number))
      .catch(() => setNumber(null));
  }, []);

  if (!number) return null;

  const defaultMessage = "Hi ÉLORA, I'd love to find out more about your cakes.";
  const message = context?.summary
    ? `Hi ÉLORA, I'm interested in this cake. ${context.summary}`
    : defaultMessage;

  const cleanNumber = number.replace(/[^\d]/g, '');
  const href = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
    >
      <MessageCircle size={26} fill="white" strokeWidth={0} />
    </a>
  );
}
