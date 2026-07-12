import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { updateTask, deleteTask } from '@/lib/db';
import { sendTaskNotification } from '@/lib/email'; // IMPORT EMAIL SYSTEM
import { Loader2, X, Trash2, Save, Share } from 'lucide-react'; // ADD SHARE ICON
import type { Task, TaskPriority, TaskStatus } from '@/types/task';

interface EditTaskModalProps {
  task: Task | null;
  onClose: () => void;
}

const DEPARTMENTS = [
  "Team Workspace", "Bizom", "Primary Sales", "Secondary Sales", 
  "Tertiary Sales", "MIS Executive", "Process Coordinator", 
  "Warehouse", "HR", "Logistics"
];

export default function EditTaskModal({ task, onClose }: EditTaskModalProps) {
  const { currentWorkspace } = useStore();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form State
  const [status, setStatus] = useState<TaskStatus>('Not started');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assignee, setAssignee] = useState('');
  const [remark, setRemark] = useState('');
  const [department, setDepartment] = useState(''); // NEW DEPARTMENT STATE

  // Pre-fill form when a task is selected
  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setPriority(task.priority);
      setAssignee(task.assignee || '');
      setRemark(task.remark || '');
      setDepartment(task.department || 'Team Workspace');
    }
  }, [task]);

  if (!task) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !user || !user.email) return;
    
    setIsSubmitting(true);
    try {
      await updateTask(currentWorkspace.id, task.id, {
        status,
        priority,
        assignee,
        remark,
        lastEditedBy: user.email,
        updatedAt: new Date().toISOString()
      }, user.email);
      onClose();
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW FUNCTION: Handles moving a private task to a team space and emailing them
  const handleShare = async () => {
    if (!currentWorkspace || !user || !user.email) return;
    setIsSubmitting(true);
    try {
      await updateTask(currentWorkspace.id, task.id, {
        status,
        priority,
        assignee,
        remark,
        department,        // Assign it to the chosen department
        isPrivate: false,  // Remove the private lock
        lastEditedBy: user.email,
        updatedAt: new Date().toISOString()
      }, user.email);

      // Trigger emails to all assigned users
      if (assignee) {
        sendTaskNotification(assignee, task.taskName, user.email, priority);
      }
      onClose();
    } catch (err) {
      console.error("Failed to share task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentWorkspace || !confirm("Are you sure you want to delete this task?")) return;
    setIsDeleting(true);
    try {
      await deleteTask(currentWorkspace.id, task.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{task.taskName}</h2>
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              Created by <span className="text-slate-700 font-bold">{task.createdBy.split('@')[0]}</span> in <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">{task.department}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="edit-task-form" onSubmit={handleUpdate} className="space-y-5">
            
            {/* NEW: Share Configuration Box (Only shows for private tasks) */}
            {task.isPrivate && (
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3 mb-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Share to Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-2.5 border border-blue-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm">
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-blue-600 font-medium">Add multiple emails in the Assignee box below, separated by commas, to alert the team.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm">
                  <option value="Not started">Not started</option>
                  <option value="In progress">In progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assignee</label>
              <input type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remarks</label>
              <textarea rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm resize-none"></textarea>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:border-rose-200 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete Task
          </button>
          
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
              Cancel
            </button>

            {/* NEW: Dedicated Blue Share Button */}
            {task.isPrivate && (
              <button type="button" onClick={handleShare} disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Share size={16} />}
                Share
              </button>
            )}

            <button type="submit" form="edit-task-form" disabled={isSubmitting} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-sm font-semibold hover:shadow-md hover:opacity-95 transition-all flex items-center gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}