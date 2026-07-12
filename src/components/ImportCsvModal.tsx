import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { createTask } from '@/lib/db';
import { X, Loader2, UploadCloud } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '@/types/task';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportCsvModal({ isOpen, onClose }: ImportCsvModalProps) {
  const { currentWorkspace } = useStore();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setError('');
    setSuccessCount(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Basic CSV Parser: Split by newlines, then by commas
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
        
        // Assuming CSV format: TaskName, Department, Priority, Assignee, Status
        // Skip header row (index 0)
        let count = 0;
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 5) continue; // Skip empty or incomplete rows

          if (currentWorkspace && user?.email) {
            await createTask(currentWorkspace.id, {
              taskName: row[0] || 'Untitled Task',
              department: row[1] || 'Team Workspace',
              priority: (row[2] as TaskPriority) || 'Medium',
              createdBy: user.email,
              assignee: row[3] || '',
              status: (row[4] as TaskStatus) || 'Not started',
              startDate: null,
              dueDate: null,
              remark: 'Imported via CSV',
              attachmentUrl: '',
              isPrivate: false,
              lastEditedBy: user.email,
            });
            count++;
          }
        }
        setSuccessCount(count);
      } catch (err) {
        setError('Failed to parse CSV. Ensure it has columns: TaskName, Department, Priority, Assignee, Status.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold tracking-tight">Import Tasks via CSV</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 text-center">
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          {successCount > 0 && <div className="text-green-600 text-sm mb-4 font-medium">Successfully imported {successCount} tasks!</div>}
          
          <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center bg-muted/10">
            <UploadCloud size={40} className="text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-2">Upload your CSV file here</p>
            <p className="text-xs text-muted-foreground mb-4">Format: Task Name, Department, Priority, Assignee, Status</p>
            
            <label className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Select File'}
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}