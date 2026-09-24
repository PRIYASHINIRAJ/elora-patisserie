import { useEffect, useRef, useState } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { messagingService } from '../services/messagingService';

const statusLabel = { new: 'New', in_progress: 'In Progress', replied: 'Replied', completed: 'Completed' };

export default function Messages() {
  const [conversations, setConversations] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const bottomRef = useRef(null);

  const loadConversations = () => {
    messagingService.mine().then((d) => {
      setConversations(d.conversations);
      if (!activeId && d.conversations.length > 0) setActiveId(d.conversations[0].id);
    });
  };

  useEffect(loadConversations, []);

  useEffect(() => {
    if (!activeId) return;
    messagingService.getConversation(activeId).then((d) => setThread(d));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply && !imageFile) return;
    setSending(true);
    try {
      await messagingService.reply(activeId, reply, imageFile);
      setReply('');
      setImageFile(null);
      const d = await messagingService.getConversation(activeId);
      setThread(d);
      loadConversations();
    } finally {
      setSending(false);
    }
  };

  const handleStartNew = async (e) => {
    e.preventDefault();
    if (!newBody) return;
    const { conversationId } = await messagingService.start({ subject: newSubject || 'General Enquiry', body: newBody });
    setNewSubject('');
    setNewBody('');
    setShowNew(false);
    loadConversations();
    setActiveId(conversationId);
  };

  if (!conversations) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-espresso/50 text-sm">Loading…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">My Account</p>
          <h1 className="font-display text-5xl">Messages</h1>
        </div>
        <button
          onClick={() => setShowNew((s) => !s)}
          className="text-xs tracking-wide-cap uppercase border border-espresso/30 px-5 py-2.5 hover:border-espresso"
        >
          New Conversation
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleStartNew} className="border border-espresso/15 bg-cream/50 p-6 mb-10 space-y-3">
          <input
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="w-full border border-espresso/20 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
          <textarea
            required
            rows={3}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="How can we help?"
            className="w-full border border-espresso/20 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
          <button type="submit" className="bg-espresso text-champagne px-6 py-2.5 text-xs tracking-wide-cap uppercase hover:bg-mocha">
            Send
          </button>
        </form>
      )}

      {conversations.length === 0 ? (
        <div className="border border-dashed border-espresso/20 p-12 text-center">
          <p className="font-display text-2xl mb-3">No conversations yet.</p>
          <p className="text-espresso/50 text-sm">Start one above, or ask a question from any cake page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="divide-y divide-espresso/10 border border-espresso/10">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left p-4 ${activeId === c.id ? 'bg-cream' : 'hover:bg-cream/50'}`}
              >
                <p className="font-display text-lg truncate">{c.subject}</p>
                {c.cake && <p className="text-xs text-gold">Re: {c.cake.name}</p>}
                <p className="text-[11px] text-espresso/40 mt-1">{statusLabel[c.status] || c.status}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 border border-espresso/10 flex flex-col h-[600px]">
            {!thread ? (
              <div className="flex-1 flex items-center justify-center text-espresso/40 text-sm">Select a conversation</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {thread.messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 text-sm ${m.sender_type === 'customer' ? 'bg-espresso text-champagne' : 'bg-cream text-espresso'}`}>
                        {m.image_url && <img src={m.image_url} alt="" className="w-full mb-2 max-h-48 object-cover" />}
                        {m.body && <p>{m.body}</p>}
                        <p className={`text-[10px] mt-1 ${m.sender_type === 'customer' ? 'text-champagne/50' : 'text-espresso/40'}`}>
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
                    placeholder={imageFile ? `Image attached: ${imageFile.name}` : 'Type a message…'}
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
