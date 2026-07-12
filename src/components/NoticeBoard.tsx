import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { createNotice, subscribeToNotices } from '@/lib/db';
import type { Notice } from '@/types/company';
import { Loader2, X, Megaphone, Send } from 'lucide-react';

export default function NoticeBoard() {
  const { currentWorkspace } = useStore();
  const { user } = useAuth();
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch notices in real-time
  useEffect(() => {
    if (!currentWorkspace) return;
    
    setIsLoading(true);
    const unsubscribe = subscribeToNotices(currentWorkspace.id, (fetchedNotices) => {
      setNotices(fetchedNotices);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentWorkspace]);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !user?.email || !title || !message) return;
    
    setIsSubmitting(true);
    try {
      await createNotice(currentWorkspace.id, title, message, user.email);
      setTitle('');
      setMessage('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to post notice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl shadow-sm">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Notice Board</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Company-wide announcements and updates.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition-all"
        >
          Post Notice
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Megaphone size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No announcements yet</h3>
            <p className="text-sm text-slate-500 mt-1">Be the first to post a company update.</p>
          </div>
        ) : (
          <div className="grid gap-5 max-w-4xl">
            {notices.map((notice) => (
              <div key={notice.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{notice.title}</h3>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md tracking-wide border border-indigo-100">
                    {notice.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-600 mb-5">
                  {notice.message}
                </p>
                <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-600 shadow-sm">
                    {notice.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Posted by <span className="text-slate-700">{notice.author.split('@')[0]}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Post Company Notice</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5">
              <form id="notice-form" onSubmit={handlePostNotice} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Announcement Title</label>
                  <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Q4 Townhall Meeting" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Message</label>
                  <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement here..." className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm resize-none"></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 shrink-0 flex justify-end gap-3 bg-slate-50/80">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                Cancel
              </button>
              <button type="submit" form="notice-form" disabled={isSubmitting} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-sm font-semibold hover:shadow-md hover:opacity-95 transition-all flex items-center gap-2">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Post Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}