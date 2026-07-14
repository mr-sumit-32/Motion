import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { createTask } from '@/lib/db';
import { X, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '@/types/task';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Temporary type for our preview data
type PreviewTask = {
  taskName: string;
  department: string;
  moduleTask: string;
  priority: TaskPriority;
  assignee: string;
  status: TaskStatus;
};

export default function ImportCsvModal({ isOpen, onClose }: ImportCsvModalProps) {
  const { currentWorkspace } = useStore();
  const { user } = useAuth();
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  
  // NEW: State to hold the data for preview before uploading to Firebase
  const [previewTasks, setPreviewTasks] = useState<PreviewTask[] | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError('');
    setSuccessCount(0);
    setPreviewTasks(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
        
        if (rows.length < 2) {
          setError('CSV must contain a header row and at least one data row.');
          return;
        }

        const headers = rows[0].map(h => h.toLowerCase());
        
        const taskNameIdx = headers.findIndex(h => h.includes('task name') || h.includes('title'));
        const deptIdx = headers.findIndex(h => h.includes('department'));
        const moduleIdx = headers.findIndex(h => h === 'module' || h.includes('module task'));
        const priorityIdx = headers.findIndex(h => h.includes('priority'));
        const assigneeIdx = headers.findIndex(h => h.includes('assignee'));
        const statusIdx = headers.findIndex(h => h.includes('status'));

        const parsedTasks: PreviewTask[] = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row.join('')) continue; 

          parsedTasks.push({
            taskName: taskNameIdx > -1 && row[taskNameIdx] ? row[taskNameIdx] : 'Untitled Task',
            department: deptIdx > -1 && row[deptIdx] ? row[deptIdx] : 'Team Workspace',
            moduleTask: moduleIdx > -1 && row[moduleIdx] ? row[moduleIdx] : '',
            priority: priorityIdx > -1 && row[priorityIdx] ? (row[priorityIdx] as TaskPriority) : 'Medium',
            assignee: assigneeIdx > -1 && row[assigneeIdx] ? row[assigneeIdx] : '',
            status: statusIdx > -1 && row[statusIdx] ? (row[statusIdx] as TaskStatus) : 'Not started',
          });
        }
        
        // Instead of uploading instantly, we set the preview data!
        setPreviewTasks(parsedTasks);
      } catch (err) {
        setError('Failed to parse CSV. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const confirmAndImport = async () => {
    if (!previewTasks || !currentWorkspace || !user?.email) return;
    
    setIsUploading(true);
    let count = 0;

    try {
      for (const task of previewTasks) {
        await createTask(currentWorkspace.id, {
          taskName: task.taskName,
          department: task.department,
          moduleTask: task.moduleTask,
          priority: task.priority,
          createdBy: user.email,
          assignee: task.assignee,
          status: task.status,
          startDate: null,
          dueDate: null,
          remark: 'Imported via CSV',
          attachmentUrl: '',
          isPrivate: false,
          lastEditedBy: user.email,
        });
        count++;
      }
      setSuccessCount(count);
      setPreviewTasks(null); // Clear preview on success
    } catch (err) {
      setError('An error occurred while saving to the database.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setPreviewTasks(null);
    setError('');
    setSuccessCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Import Tasks via CSV</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && <div className="p-3 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg mb-4">{error}</div>}
          
          {successCount > 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-emerald-600">
              <CheckCircle2 size={48} className="mb-3 opacity-80" />
              <div className="text-lg font-bold">Import Successful!</div>
              <div className="text-sm font-medium text-emerald-700/80 mb-6">Successfully imported {successCount} tasks into your workspace.</div>
              <button onClick={onClose} className="px-6 py-2 bg-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-200 transition-colors">
                Done
              </button>
            </div>
          )}
          
          {/* STEP 1: UPLOAD STATE */}
          {!previewTasks && successCount === 0 && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
              <UploadCloud size={48} className="text-indigo-400 mb-4" />
              <p className="text-base font-bold text-slate-700 mb-1">Select your CSV file</p>
              <p className="text-xs font-medium text-slate-500 mb-6">Dynamically maps: Task Name, Department, Module, Priority, Assignee, Status</p>
              
              <label className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-700 hover:shadow-md transition-all">
                Choose File
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}

          {/* STEP 2: PREVIEW STATE */}
          {previewTasks && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-700">
                  Found <span className="text-indigo-600">{previewTasks.length}</span> tasks to import. Please review:
                </p>
                <button onClick={resetModal} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel & Choose Different File</button>
              </div>
              
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-bold text-slate-600">Task Name</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Department</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Module</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Assignee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewTasks.slice(0, 50).map((task, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-medium text-slate-800 truncate max-w-[200px]">{task.taskName}</td>
                          <td className="px-4 py-2.5 text-slate-600">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{task.department}</span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{task.moduleTask || '-'}</td>
                          <td className="px-4 py-2.5 text-slate-500">{task.assignee || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewTasks.length > 50 && (
                    <div className="text-center py-3 text-xs font-semibold text-slate-500 bg-slate-50 border-t border-slate-100">
                      + {previewTasks.length - 50} more tasks not shown in preview
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={resetModal}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmAndImport}
                  disabled={isUploading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-md rounded-lg transition-all flex items-center gap-2"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Import Data'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}