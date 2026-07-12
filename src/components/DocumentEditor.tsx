import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useStore } from '@/store/useStore';
import { updatePage } from '@/lib/db';
import { Loader2 } from 'lucide-react';

export default function DocumentEditor() {
  const { pageId } = useParams();
  const { pages, currentWorkspace } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  // Fixed: Replaced NodeJS.Timeout namespace with browser-compatible wrapper
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find the current page from our global store
  const currentPage = pages.find((p) => p.id === pageId);

  // Initialize the Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Press '/' for commands, or start typing...",
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: currentPage?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-full min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(currentPage?.title || 'Untitled', editor.getHTML());
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
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);

    // Set a new timeout for the save operation
    saveTimeoutRef.current = setTimeout(async () => {
      if (!currentWorkspace || !pageId) return;
      try {
        await updatePage(currentWorkspace.id, pageId, title, content);
      } catch (error) {
        console.error("Failed to save page:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Wait 1 second after user stops typing
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
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-8 animate-in fade-in duration-500 relative">
      
      {/* Auto-save indicator */}
      <div className="absolute top-4 right-8 text-xs text-muted-foreground font-medium">
        {isSaving ? 'Saving...' : 'Saved'}
      </div>

      {/* Document Title Input */}
      <input
        type="text"
        value={currentPage.title}
        onChange={(e) => debouncedSave(e.target.value, editor?.getHTML() || '')}
        placeholder="Untitled"
        className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/30 mb-8"
      />

      {/* Rich Text Editor Body */}
      <EditorContent editor={editor} />
      
    </div>
  );
}