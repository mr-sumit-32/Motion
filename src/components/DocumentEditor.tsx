import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useStore } from '@/store/useStore';
import { updatePage, deletePage } from '@/lib/db'; 
import { 
  Loader2, Trash2, Bold, Italic, Strikethrough, 
  List, ListOrdered, CheckSquare 
} from 'lucide-react';

export default function DocumentEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { pages, currentWorkspace } = useStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [title, setTitle] = useState('');
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPage = pages.find((p) => p.id === pageId);

  useEffect(() => {
    if (currentPage?.title) {
      setTitle(currentPage.title);
    }
  }, [currentPage?.id]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Start typing your notes or create a checklist...",
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: currentPage?.content || '',
    editorProps: {
      attributes: {
        // Reduced max-w-none so it uses full width if needed, and removed generic prose list margins
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none min-h-[400px] mt-4',
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(title || 'Untitled Note', editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && currentPage && editor.getHTML() !== currentPage.content) {
      editor.commands.setContent(currentPage.content || '');
    }
  }, [pageId, currentPage, editor]);

  const debouncedSave = (newTitle: string, content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);

    saveTimeoutRef.current = setTimeout(async () => {
      if (!currentWorkspace || !pageId) return;
      try {
        await updatePage(currentWorkspace.id, pageId, newTitle, content);
      } catch (error) {
        console.error("Failed to save page:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); 
  };

  const handleDelete = async () => {
    if (!currentWorkspace || !pageId) return;
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    setIsDeleting(true);
    try {
      await deletePage(currentWorkspace.id, pageId);
      navigate('/document-hub'); 
    } catch (error) {
      console.error("Failed to delete note:", error);
      setIsDeleting(false);
    }
  };

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
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          debouncedSave(e.target.value, editor?.getHTML() || '');
        }}
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
          
          <div className="w-px h-5 bg-gray-300 mx-2" />
          
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleTaskList().run()} 
            isActive={editor.isActive('taskList')} 
            icon={<CheckSquare size={18} />} 
          />
        </div>
      )}

      {/* Required CSS overrides for Tiptap Task Lists to override Tailwind Prose */}
      <style>{`
        ul[data-type="taskList"] {
          list-style: none !important;
          padding-left: 0 !important;
        }
        ul[data-type="taskList"] li {
          display: flex !important;
          align-items: flex-start;
          margin-bottom: 0.5rem !important;
        }
        ul[data-type="taskList"] li > label {
          margin-right: 0.5rem;
          margin-top: 0.2rem;
          user-select: none;
        }
        ul[data-type="taskList"] li > div {
          flex: 1;
        }
        ul[data-type="taskList"] li p {
          margin: 0 !important;
        }
        ul[data-type="taskList"] input[type="checkbox"] {
          cursor: pointer;
          width: 1rem;
          height: 1rem;
          accent-color: #4f46e5;
        }
      `}</style>

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