import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { createCompanyDoc, subscribeToCompanyDocs } from '@/lib/db';
import type { CompanyDoc } from '@/types/company';
import { Loader2, X, FolderOpen, ExternalLink, FileText } from 'lucide-react';

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
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-sm">
            <FolderOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Document Hub</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Centralized repository for important company links and assets.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition-all"
        >
          Add Document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No documents yet</h3>
            <p className="text-sm text-slate-500 mt-1">Start by adding a link to your company resources.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-left text-[13px] whitespace-nowrap">
              <thead className="bg-indigo-50/70 text-indigo-950">
                <tr className="border-b border-indigo-100">
                  <th className="p-4 font-bold tracking-wide">Document Name</th>
                  <th className="p-4 font-bold tracking-wide">Added By</th>
                  <th className="p-4 font-bold tracking-wide">Date Added</th>
                  <th className="p-4 font-bold tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-indigo-50/40 transition-colors">
                    <td className="p-4 font-semibold text-slate-800 flex items-center gap-3">
                      <FileText size={16} className="text-indigo-400" /> 
                      {doc.name}
                    </td>
                    <td className="p-4 font-medium text-slate-600">{doc.author.split('@')[0]}</td>
                    <td className="p-4 font-medium text-slate-500">
                      {doc.createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 text-right">
                      <a 
                        href={doc.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Add to Document Hub</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5">
              <form id="doc-form" onSubmit={handleSaveDocument} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Document Name</label>
                  <input required type="text" placeholder="e.g., Q3 Marketing Assets" value={docName} onChange={(e) => setDocName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Link (Google Drive, URL, etc.)</label>
                  <input required type="url" placeholder="https://..." value={docLink} onChange={(e) => setDocLink(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm" />
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 shrink-0 flex justify-end gap-3 bg-slate-50/80">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                Cancel
              </button>
              <button type="submit" form="doc-form" disabled={isSubmitting} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-sm font-semibold hover:shadow-md hover:opacity-95 transition-all flex items-center gap-2">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
                Save Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}