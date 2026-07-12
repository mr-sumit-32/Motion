import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { createCompanyDoc, subscribeToCompanyDocs } from '@/lib/db';
import type { CompanyDoc } from '@/types/company';
import { Loader2, X, FolderOpen, ExternalLink } from 'lucide-react';

export default function DocumentHub() {
  const { currentWorkspace } = useStore();
  const { user } = useAuth();
  
  const [docs, setDocs] = useState<CompanyDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [docName, setDocName] = useState('');
  const [docLink, setDocLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch documents in real-time
  useEffect(() => {
    if (!currentWorkspace) return;
    
    setIsLoading(true);
    const unsubscribe = subscribeToCompanyDocs(currentWorkspace.id, (fetchedDocs) => {
      setDocs(fetchedDocs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentWorkspace]);

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !user?.email || !docName || !docLink) return;
    
    setIsSubmitting(true);
    try {
      await createCompanyDoc(currentWorkspace.id, docName, docLink, user.email);
      setDocName('');
      setDocLink('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save document:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg">
            <FolderOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Document Hub</h1>
            <p className="text-sm text-muted-foreground">Centralized repository for important company links and assets.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Add Document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg bg-muted/10">
            <FolderOpen size={32} className="mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium">No documents yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Start by adding a link to your company resources.</p>
          </div>
        ) : (
          <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="p-4 font-semibold">Document Name</th>
                  <th className="p-4 font-semibold">Added By</th>
                  <th className="p-4 font-semibold">Date Added</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium flex items-center gap-2">
                      📄 {doc.name}
                    </td>
                    <td className="p-4 text-muted-foreground">{doc.author.split('@')[0]}</td>
                    <td className="p-4 text-muted-foreground">
                      {doc.createdAt.toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <a 
                        href={doc.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        Open <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h2 className="text-lg font-semibold tracking-tight">Add to Document Hub</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <form id="doc-form" onSubmit={handleSaveDocument} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Document Name</label>
                  <input required type="text" placeholder="e.g., Q3 Marketing Assets" value={docName} onChange={(e) => setDocName(e.target.value)} className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Link (Google Drive, URL, etc.)</label>
                  <input required type="url" placeholder="https://..." value={docLink} onChange={(e) => setDocLink(e.target.value)} className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-border shrink-0 flex justify-end gap-3 bg-muted/20">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-input bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" form="doc-form" disabled={isSubmitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                {isSubmitting && <Loader2 size={16} className="animate-spin" />} Save Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}