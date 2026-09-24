import { createContext, useContext, useState, useCallback } from 'react';

const WhatsAppContext = createContext(null);

export function WhatsAppContextProvider({ children }) {
  const [context, setContext] = useState(null); // { cakeName, summary }

  const setWhatsAppContext = useCallback((ctx) => setContext(ctx), []);
  const clearWhatsAppContext = useCallback(() => setContext(null), []);

  return (
    <WhatsAppContext.Provider value={{ context, setWhatsAppContext, clearWhatsAppContext }}>
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsAppContext() {
  const ctx = useContext(WhatsAppContext);
  if (!ctx) throw new Error('useWhatsAppContext must be used within WhatsAppContextProvider');
  return ctx;
}
