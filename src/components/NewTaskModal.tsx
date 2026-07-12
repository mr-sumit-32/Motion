import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { createTask } from '@/lib/db';
import { db } from '@/lib/firebase'; // (Or whatever the correct path to your firebase.ts file is!)
import { collection, getDocs, } from 'firebase/firestore';
import { Loader2, X, Link as LinkIcon } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '@/types/task';
import { sendTaskNotification } from '@/lib/email';

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
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  // Determine if the user is currently in the Private Tasks space
  const isPrivateSpace = location.pathname === '/private-tasks';

  // Form State
  const [taskName, setTaskName] = useState('');
  const [department, setDepartment] = useState('Team Workspace');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Not started');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [remark, setRemark] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Fetch users for the assignee dropdown suggestions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users')); 
        const emails = snapshot.docs.map(doc => doc.data().email).filter(Boolean);
        setAvailableUsers(emails);
      } catch (err) {
        console.error("Could not fetch users", err);
      }
    };
    if (isOpen) fetchUsers();
  }, [isOpen]);

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
      setAttachmentUrl('');
      setError('');
      setIsSubmitting(false); // Fix for infinite loader
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
        attachmentUrl,
        isPrivate: isPrivateSpace,
        lastEditedBy: user.email,
        updatedAt: new Date().toISOString(),
      });
      // TRIGGER THE EMAIL NOTIFICATION
      // We only send if there is an assignee and it's not a private task
      if (assignee && !isPrivateSpace) {
        sendTaskNotification(assignee, taskName, user.email, priority);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false); // Fix for infinite loader
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
          <h2 className="text-lg font-bold tracking-wide">
            {isPrivateSpace ? 'Create Private Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">
              {error}
            </div>
          )}

          <form id="new-task-form" onSubmit={handleSubmit} className="space-y-5 text-gray-800">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Task Name</label>
              <input 
                required 
                type="text" 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="What needs to be done?" 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              {!isPrivateSpace ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Department / Tracker</label>
                  <select 
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
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
                   <label className="text-sm font-semibold text-gray-700">Department / Tracker</label>
                   <input 
                      disabled
                      value="Private Space"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                   />
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Assignee (Email)</label>
                <input 
                  required
                  type="text" 
                  list="new-task-users"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  disabled={isPrivateSpace}
                  placeholder="Type an email..." 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 shadow-sm"
                />
                <datalist id="new-task-users">
                  {availableUsers.map((email, idx) => (
                    <option key={idx} value={email} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-400 mt-1">Separate multiple emails with commas</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                >
                  <option value="Not started">Not started</option>
                  <option value="In progress">In progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Due Date</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <LinkIcon size={14} /> Attachment Link (Optional)
              </label>
              <input 
                type="url" 
                placeholder="Paste Google Drive link here..." 
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Remarks</label>
              <textarea 
                rows={3} 
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add details..." 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
              ></textarea>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-200 shrink-0 flex justify-end gap-3 bg-white">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="new-task-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Task'}
          </button>
        </div>

      </div>
    </div>
  );
}