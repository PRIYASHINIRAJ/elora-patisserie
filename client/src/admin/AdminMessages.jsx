import { useEffect, useRef, useState } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { messagingService } from '../services/messagingService';

const STATUSES = ['new', 'in_progress', 'replied', 'completed'];
const statusStyles = {
  new: 'bg-gold/20 text-mocha',
  in_progress: 'bg-champagne text-mocha',
  replied: 'bg-green-100 text-green-800',
  completed: 'bg-espresso/10 text-espresso/50',
};

export default function AdminMessages() {
  const [conversations, setConversations] = useState(null);
  const [filter, setFilter] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadConversations = () => {
    messagingService.adminList(filter || undefined).then((d) => setConversations(d.conversations));
  };

  useEffect(loadConversations, [filter]);

  useEffect(() => {
    if (!activeId) return;
    messagingService.adminGetConversation(activeId).then(setThread);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply && !imageFile) return;
    setSending(true);
    try {
      await messagingService.adminReply(activeId, reply, imageFile);
      setReply('');
      setImageFile(null);
      const d = await messagingService.adminGetConversation(activeId);
      setThread(d);
      loadConversations();
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status) => {
    await messagingService.adminSetStatus(activeId, status);
    const d = await messagingService.adminGetConversation(activeId);
    setThread(d);
    loadConversations();
  };

  return (
    <div className="px-8 py-10 lg:px-12">
      <h1 className="font-display text-4xl text-espresso mb-6">Messages</h1>

      <div className="flex gap-2 mb-6">
        {['', ...STATUSES].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-[11px] tracking-wide-cap uppercase border ${
              filter === s ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/60'
            }`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {!conversations ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : conversations.length === 0 ? (
        <div className="border border-dashed border-espresso/20 bg-white p-12 text-center max-w-xl">
          <p className="text-espresso/60 text-sm">No conversations here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-espresso/10 divide-y divide-espresso/10 max-h-[650px] overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left p-4 ${activeId === c.id ? 'bg-champagne/30' : 'hover:bg-champagne/10'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-display text-lg truncate">{c.customer?.full_name || 'Guest'}</p>
                  <span className={`text-[10px] tracking-wide-cap uppercase px-2 py-0.5 rounded-full shrink-0 ${statusStyles[c.status] || ''}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-espresso/50 truncate">{c.subject}</p>
                {c.cake && <p className="text-[11px] text-gold mt-0.5">Re: {c.cake.name}</p>}
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 bg-white border border-espresso/10 flex flex-col h-[650px]">
            {!thread ? (
              <div className="flex-1 flex items-center justify-center text-espresso/40 text-sm">Select a conversation</div>
            ) : (
              <>
                <div className="border-b border-espresso/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg truncate">{thread.conversation.customer?.full_name || 'Guest'}</p>
                    <p className="text-xs text-espresso/50 truncate">{thread.conversation.customer?.email}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatus(s)}
                        className={`text-[10px] tracking-wide-cap uppercase px-2.5 py-1 border ${
                          thread.conversation.status === s ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/50'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {thread.messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 text-sm ${m.sender_type === 'admin' ? 'bg-espresso text-champagne' : 'bg-cream text-espresso'}`}>
                        {m.image_url && <img src={m.image_url} alt="" className="w-full mb-2 max-h-48 object-cover" />}
                        {m.body && <p>{m.body}</p>}
                        <p className={`text-[10px] mt-1 ${m.sender_type === 'admin' ? 'text-champagne/50' : 'text-espresso/40'}`}>
                          {new Date(m.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleReply} className="border-t border-espresso/10 p-4 flex items-end gap-3">
                  <label className="text-espresso/40 hover:text-espresso cursor-pointer shrink-0">
                    <ImageIcon size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                  </label>
                  <textarea
                    rows={1}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={imageFile ? `Image attached: ${imageFile.name}` : 'Type a reply…'}
                    className="flex-1 border border-espresso/20 px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="bg-espresso text-champagne w-10 h-10 flex items-center justify-center hover:bg-mocha disabled:opacity-50 shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
