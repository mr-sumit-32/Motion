import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { updateTask, deleteTask } from '@/lib/db';
import { Loader2, X, Trash2 } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '@/types/task';

interface EditTaskModalProps {
  task: Task | null;
  onClose: () => void;
}

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

  // Pre-fill form when a task is selected
  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setPriority(task.priority);
      setAssignee(task.assignee);
      setRemark(task.remark || '');
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
        
        // ADD THESE TWO LINES RIGHT HERE:
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl flex flex-col">
        
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold">{task.taskName}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Created by {task.createdBy.split('@')[0]} in {task.department}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="edit-task-form" onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm">
                  <option value="Not started">Not started</option>
                  <option value="In progress">In progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Assignee</label>
              <input type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Remarks</label>
              <textarea rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm resize-none"></textarea>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-border flex justify-between bg-muted/20">
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="px-3 py-2 text-red-600 hover:bg-red-500/10 rounded-md text-sm font-medium flex items-center gap-2">
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete Task
          </button>
          
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-input bg-background rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" form="edit-task-form" disabled={isSubmitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-90">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}