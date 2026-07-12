import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { createNotice, subscribeToNotices } from '@/lib/db';
import type { Notice } from '@/types/company';
import { Loader2, X, Megaphone } from 'lucide-react';

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
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
            <p className="text-sm text-muted-foreground">Company-wide announcements and updates.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Post Notice
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg bg-muted/10">
            <Megaphone size={32} className="mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium">No announcements yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Be the first to post a company update.</p>
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl">
            {notices.map((notice) => (
              <div key={notice.id} className="bg-background border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{notice.title}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {notice.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 mb-4">
                  {notice.message}
                </p>
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] text-secondary-foreground">
                    {notice.author.charAt(0).toUpperCase()}
                  </div>
                  Posted by {notice.author.split('@')[0]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h2 className="text-lg font-semibold tracking-tight">Post Company Notice</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <form id="notice-form" onSubmit={handlePostNotice} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Announcement Title</label>
                  <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Message</label>
                  <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-border shrink-0 flex justify-end gap-3 bg-muted/20">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-input bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" form="notice-form" disabled={isSubmitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                {isSubmitting && <Loader2 size={16} className="animate-spin" />} Post Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}