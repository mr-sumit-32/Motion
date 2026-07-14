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
        
        // Clean up quotes and split by rows and commas
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
        
        if (rows.length < 2) {
          setError('CSV must contain a header row and at least one data row.');
          setIsUploading(false);
          return;
        }

        // 1. SMART HEADER PARSING: Read the first row and convert to lowercase for easy matching
        const headers = rows[0].map(h => h.toLowerCase());
        
        // 2. FIND COLUMN INDICES (Returns -1 if the column doesn't exist in this specific CSV)
        const taskNameIdx = headers.findIndex(h => h.includes('task name') || h.includes('title'));
        const deptIdx = headers.findIndex(h => h.includes('department'));
        const moduleIdx = headers.findIndex(h => h === 'module' || h.includes('module task')); // Finds Bizom's Module column!
        const priorityIdx = headers.findIndex(h => h.includes('priority'));
        const assigneeIdx = headers.findIndex(h => h.includes('assignee'));
        const statusIdx = headers.findIndex(h => h.includes('status'));

        let count = 0;
        
        // 3. LOOP THROUGH DATA ROWS
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row.join('')) continue; // Skip completely empty rows

          if (currentWorkspace && user?.email) {
            // 4. SAFELY EXTRACT DATA: If index is > -1, grab the data. Otherwise, use a default.
            const taskName = taskNameIdx > -1 && row[taskNameIdx] ? row[taskNameIdx] : 'Untitled Task';
            const department = deptIdx > -1 && row[deptIdx] ? row[deptIdx] : 'Team Workspace';
            const moduleTask = moduleIdx > -1 && row[moduleIdx] ? row[moduleIdx] : ''; // Saves empty string if column is missing
            const priority = priorityIdx > -1 && row[priorityIdx] ? (row[priorityIdx] as TaskPriority) : 'Medium';
            const assignee = assigneeIdx > -1 && row[assigneeIdx] ? row[assigneeIdx] : '';
            const status = statusIdx > -1 && row[statusIdx] ? (row[statusIdx] as TaskStatus) : 'Not started';

            await createTask(currentWorkspace.id, {
              taskName,
              department,
              moduleTask, // New dynamic field mapped perfectly!
              priority,
              createdBy: user.email,
              assignee,
              status,
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
        setError('Failed to parse CSV. Please check the file format.');
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
            <p className="text-xs text-muted-foreground mb-4">Dynamically maps: Task Name, Department, Module, Priority, Assignee, Status</p>
            
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