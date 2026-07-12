import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { createTask } from '@/lib/db';
import { Loader2, X } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '@/types/task';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewTaskModal({ isOpen, onClose }: NewTaskModalProps) {
  const { currentWorkspace } = useStore();
  const { user } = useAuth();
  const location = useLocation();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Determine if the user is currently in the Private Tasks space
  const isPrivateSpace = location.pathname === '/private-tasks';

  // Form State[cite: 1]
  const [taskName, setTaskName] = useState('');
  const [department, setDepartment] = useState('Team Workspace');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Not started');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [remark, setRemark] = useState('');

  // Reset form when opened, and auto-fill if in Private Space
  useEffect(() => {
    if (isOpen) {
      if (isPrivateSpace) {
        setDepartment('Private');
        setAssignee(user?.email || '');
      } else {
        setDepartment('Team Workspace');
        setAssignee('');
      }
      setTaskName('');
      setPriority('Medium');
      setStatus('Not started');
      setStartDate('');
      setDueDate('');
      setRemark('');
      setError('');
    }
  }, [isOpen, isPrivateSpace, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !user || !user.email) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      await createTask(currentWorkspace.id, {
        taskName,
        department,
        priority,
        createdBy: user.email,
        assignee,
        status,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        remark,
        attachmentUrl: '', //[cite: 1]
        isPrivate: isPrivateSpace, // Automatically private if created in the private space
        lastEditedBy: user.email,  //[cite: 1]
        updatedAt: new Date().toISOString(),
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold tracking-tight">
            {isPrivateSpace ? 'Create Private Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-500/10 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-500/20">
              {error}
            </div>
          )}

          <form id="new-task-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Task Name</label>
              <input 
                required 
                type="text" 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="What needs to be done?" 
                className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Only show Department selector if NOT in the private space */}
              {!isPrivateSpace ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Department / Tracker</label>
                  <select 
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="" disabled>Select Department</option>
                    <option value="Team Workspace">Team Workspace</option>
                    <option value="Bizom">Bizom</option>
                    <option value="Primary Sales">Primary Sales</option>
                    <option value="Secondary Sales">Secondary Sales</option>
                    <option value="Tertiary Sales">Tertiary Sales</option>
                    <option value="MIS Executive">MIS Executive</option>
                    <option value="Process Coordinator">Process Coordinator</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="HR">HR</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                   <label className="text-xs font-medium text-muted-foreground">Department / Tracker</label>
                   <input 
                      disabled
                      value="Private Space"
                      className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground text-sm cursor-not-allowed"
                   />
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Assignee (Email)</label>
                <input 
                  required
                  type="text" 
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  disabled={isPrivateSpace}
                  placeholder="user1@company.com, user2@..." 
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Not started">Not started</option>
                  <option value="In progress">In progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Remarks</label>
              <textarea 
                rows={3} 
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add details..." 
                className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              ></textarea>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border shrink-0 flex justify-end gap-3 bg-muted/20">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border border-input bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="new-task-form"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Save Task
          </button>
        </div>

      </div>
    </div>
  );
}