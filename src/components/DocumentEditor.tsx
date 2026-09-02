import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
// Task list extension removed — package may not be installed in this environment
import { useStore } from '@/store/useStore';
import { updatePage, deletePage } from '@/lib/db'; 
import { 
  Loader2, Trash2, Bold, Italic, Strikethrough, 
  List, ListOrdered 
} from 'lucide-react';

export default function DocumentEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { pages, currentWorkspace } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find the current page from our global store
  const currentPage = pages.find((p) => p.id === pageId);

  // Initialize the Tiptap Editor with Checklist capabilities
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing your notes or create a checklist...",
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: currentPage?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-full min-h-[400px] mt-4',
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(currentPage?.title || 'Untitled Note', editor.getHTML());
    },
  });

  // Keep editor in sync if we click a different page in the sidebar
  useEffect(() => {
    if (editor && currentPage && editor.getHTML() !== currentPage.content) {
      editor.commands.setContent(currentPage.content || '');
    }
  }, [pageId, currentPage, editor]);

  // Debounced auto-save function
  const debouncedSave = (title: string, content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);

    saveTimeoutRef.current = setTimeout(async () => {
      if (!currentWorkspace || !pageId) return;
      try {
        await updatePage(currentWorkspace.id, pageId, title, content);
      } catch (error) {
        console.error("Failed to save page:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); 
  };

  // Delete current note
  const handleDelete = async () => {
    if (!currentWorkspace || !pageId) return;
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    setIsDeleting(true);
    try {
      await deletePage(currentWorkspace.id, pageId);
      navigate('/document-hub'); // Redirect after successful deletion
    } catch (error) {
      console.error("Failed to delete note:", error);
      setIsDeleting(false);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 md:px-12 animate-in fade-in duration-500 relative bg-white min-h-screen border-x border-gray-100 shadow-sm">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
          {isSaving ? 'Saving changes...' : 'All changes saved'}
        </div>
        
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Delete Note
        </button>
      </div>

      {/* Note Title */}
      <input
        type="text"
        value={currentPage.title}
        onChange={(e) => debouncedSave(e.target.value, editor?.getHTML() || '')}
        placeholder="Note Title"
        className="w-full text-3xl font-extrabold text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-300 mb-6"
      />

      {/* Formatting Toolbar */}
      {editor && (
        <div className="flex items-center gap-1 mb-4 p-1.5 bg-gray-50 border border-gray-200 rounded-lg sticky top-0 z-10 shadow-sm">
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            isActive={editor.isActive('bold')} 
            icon={<Bold size={18} />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            isActive={editor.isActive('italic')} 
            icon={<Italic size={18} />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleStrike().run()} 
            isActive={editor.isActive('strike')} 
            icon={<Strikethrough size={18} />} 
          />
          
          <div className="w-px h-5 bg-gray-300 mx-2" />
          
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            isActive={editor.isActive('bulletList')} 
            icon={<List size={18} />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            isActive={editor.isActive('orderedList')} 
            icon={<ListOrdered size={18} />} 
          />
          
          
        </div>
      )}

      {/* Rich Text Editor Body */}
      <div className="min-h-[500px] cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
      
    </div>
  );
}

// Helper Component for Toolbar Buttons
function ToolbarButton({ onClick, isActive, icon }: { onClick: () => void, isActive: boolean, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-indigo-100 text-indigo-700 font-bold' 
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      {icon}
    </button>
  );
}