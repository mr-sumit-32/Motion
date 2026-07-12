import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import NewTaskModal from './NewTaskModal';
import EditTaskModal from './EditTaskModal';
import ImportCsvModal from './ImportCsvModal';
import type { Task } from '@/types/task';
import { Paperclip } from 'lucide-react'; // Added for the attachment icon

export default function TaskTable() {
  const { tasks } = useStore();
  const { department } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  
  // State to hold the value of each inline filter
  const [filters, setFilters] = useState({
    department: '',
    taskName: '',
    priority: '',
    assignee: '',
    status: '',
    createdBy: '',
  });

  // Helper function to color-code status badges
  const getStatusStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('done') || s.includes('resolved')) return 'bg-[#e1f3ed] text-[#0f7b6c]';
    if (s.includes('progress') || s.includes('suggested')) return 'bg-[#e3f2fd] text-[#1976d2]';
    if (s.includes('blocked') || s.includes('awaiting')) return 'bg-[#ffebee] text-[#c62828]';
    if (s.includes('partially')) return 'bg-[#fff3e0] text-[#e65100]';
    return 'bg-[#efefed] text-[#787774]';
  };

  // Helper function to color-code priority badges
  const getPriorityStyle = (priority: string) => {
    const p = (priority || '').toLowerCase();
    if (p === 'high') return 'bg-[#ffebee] text-[#e03e3e]';
    if (p === 'medium') return 'bg-[#fff8e1] text-[#d9730d]';
    return 'bg-[#f4f5f5] text-[#787774]';
  };

  // 1. Identify the current route
  const isPrivateSpace = location.pathname === '/private-tasks';
  const isMyTasksRoute = location.pathname === '/tasks';
  const isByStatusRoute = location.pathname === '/by-status';

  // 2. Filter tasks by Route Rules, URL Department, and inline text filters
  let filteredTasks = tasks.filter((t) => {
    
    // ISOLATE PRIVATE TASKS
    if (isPrivateSpace) {
      return t.isPrivate === true && (t.assignee || '').toLowerCase().includes(user?.email?.toLowerCase() || '');
    } else {
      // If we are NOT in the private space, hide ALL private tasks
      if (t.isPrivate === true) return false;
    }

    // Convert DB department string to URL format
    const urlDeptMatches = department 
      ? (t.department || '').toLowerCase().replace(/\s+/g, '-') === department 
      : true;

    // Check if we are on a route that strictly requires the task to belong to the logged-in user
    const mustBeMine = isMyTasksRoute || isByStatusRoute;
    const isAssignedToMe = mustBeMine && user?.email 
      ? (t.assignee || '').toLowerCase().includes(user.email.toLowerCase())
      : true;

    return (
      urlDeptMatches &&
      isAssignedToMe &&
      (t.department || '').toLowerCase().includes(filters.department.toLowerCase()) &&
      (t.taskName || '').toLowerCase().includes(filters.taskName.toLowerCase()) &&
      (t.priority || '').toLowerCase().includes(filters.priority.toLowerCase()) &&
      (t.assignee || '').toLowerCase().includes(filters.assignee.toLowerCase()) &&
      (t.status || '').toLowerCase().includes(filters.status.toLowerCase()) &&
      (t.createdBy || '').toLowerCase().includes(filters.createdBy.toLowerCase())
    );
  });

  // 3. Sort the tasks if we are on the "By Status" view
  if (isByStatusRoute) {
    const statusOrder: Record<string, number> = {
      'Not started': 1,
      'In progress': 2,
      'Blocked': 3,
      'Done': 4
    };

    filteredTasks.sort((a, b) => {
      const orderA = statusOrder[a.status] || 5;
      const orderB = statusOrder[b.status] || 5;
      return orderA - orderB;
    });
  }

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {location.pathname === '/private-tasks' ? 'My Private Tasks' : 
           location.pathname === '/by-status' ? 'My Tasks By Status' : 
           location.pathname === '/tasks' ? 'My Tasks' : 
           department ? department.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
           'All Tasks'}
        </h1>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCsvModalOpen(true)}
            className="bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
          >
            Import CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            New Task
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-background border border-border rounded-lg shadow-sm flex-1">
        <table className="w-full border-collapse text-left text-[13px] whitespace-nowrap">
          <thead className="bg-muted/30 sticky top-0 z-10">
            {/* Headers exactly as requested */}
            <tr className="border-b border-border text-muted-foreground">
              <th className="p-3 font-semibold">Department</th>
              <th className="p-3 font-semibold">Task Name</th>
              <th className="p-3 font-semibold">Created By</th>
              <th className="p-3 font-semibold">Assignee</th>
              <th className="p-3 font-semibold">Priority</th>
              <th className="p-3 font-semibold">Start Date</th>
              <th className="p-3 font-semibold">Due Date</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Remark</th>
              <th className="p-3 font-semibold">Last Edited By</th>
              <th className="p-3 font-semibold">Last Edited Time</th>
              <th className="p-3 font-semibold text-center">Attachment</th>
            </tr>
            
            {/* Inline Filters Row */}
            <tr className="border-b border-border bg-background">
              <th className="p-1.5 px-3">
                <input type="text" placeholder="Filter..." value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)} className="w-full p-1.5 text-xs border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
              </th>
              <th className="p-1.5 px-3">
                <input type="text" placeholder="Filter..." value={filters.taskName} onChange={(e) => handleFilterChange('taskName', e.target.value)} className="w-full p-1.5 text-xs border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
              </th>
              <th className="p-1.5 px-3">
                <input type="text" placeholder="Filter..." value={filters.createdBy} onChange={(e) => handleFilterChange('createdBy', e.target.value)} className="w-full p-1.5 text-xs border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
              </th>
              <th className="p-1.5 px-3">
                <input type="text" placeholder="Filter..." value={filters.assignee} onChange={(e) => handleFilterChange('assignee', e.target.value)} className="w-full p-1.5 text-xs border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
              </th>
              <th className="p-1.5 px-3">
                <input type="text" placeholder="Filter..." value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)} className="w-full p-1.5 text-xs border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
              </th>
              <th className="p-1.5 px-3"></th> {/* Start Date (No text filter) */}
              <th className="p-1.5 px-3"></th> {/* Due Date (No text filter) */}
              <th className="p-1.5 px-3">
                <input type="text" placeholder="Filter..." value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full p-1.5 text-xs border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
              </th>
              <th className="p-1.5 px-3"></th> {/* Remark */}
              <th className="p-1.5 px-3"></th> {/* Last Edited By */}
              <th className="p-1.5 px-3"></th> {/* Last Edited Time */}
              <th className="p-1.5 px-3"></th> {/* Attachment */}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-muted-foreground italic">
                  No tasks found.
                </td>
              </tr>
            ) : (
              filteredTasks.map((t) => (
                <tr 
                  key={t.id} 
                  onClick={() => setSelectedTask(t)}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  {/* 1. Department */}
                  <td className="p-3">
                    <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground">
                      {t.department}
                    </span>
                  </td>
                  
                  {/* 2. Task Name */}
                  <td className="p-3 font-medium max-w-[200px] truncate" title={t.taskName}>
                    {t.taskName}
                  </td>

                  {/* 3. Created By */}
                  <td className="p-3 text-muted-foreground max-w-[150px] truncate" title={t.createdBy}>
                    {t.createdBy ? t.createdBy.split('@')[0] : '-'}
                  </td>
                  
                  {/* 4. Assignee */}
                  <td className="p-3 text-muted-foreground max-w-[150px] truncate" title={t.assignee}>
                    👤 {(t.assignee || '').split(',')[0] || 'Unassigned'}
                  </td>

                  {/* 5. Priority */}
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getPriorityStyle(t.priority)}`}>
                      {t.priority}
                    </span>
                  </td>
                  
                  {/* 6. Start Date */}
                  <td className="p-3 text-muted-foreground">
                    {t.startDate ? new Date(t.startDate).toLocaleDateString() : '-'}
                  </td>

                  {/* 7. Due Date */}
                  <td className="p-3 text-muted-foreground">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                  </td>

                  {/* 8. Status */}
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusStyle(t.status)}`}>
                      {t.status}
                    </span>
                  </td>

                  {/* 9. Remark */}
                  <td className="p-3 text-muted-foreground max-w-[200px] truncate" title={t.remark}>
                    {t.remark || '-'}
                  </td>

                  {/* 10. Last Edited By */}
                  <td className="p-3 text-muted-foreground max-w-[150px] truncate" title={t.lastEditedBy}>
                    {t.lastEditedBy ? t.lastEditedBy.split('@')[0] : '-'}
                  </td>

                  {/* 11. Last Edited Time (Assuming Firebase standard updatedAt or falling back to creation time/dash) */}
                  <td className="p-3 text-muted-foreground">
                    {t.updatedAt 
                      ? new Date(t.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                      : '-'}
                  </td>

                  {/* 12. Attachment */}
                  <td className="p-3 text-center">
                    {t.attachmentUrl ? (
                      <div className="flex justify-center text-blue-500 hover:text-blue-700" onClick={(e) => e.stopPropagation()}>
                        <a href={t.attachmentUrl} target="_blank" rel="noopener noreferrer" title="View Attachment">
                          <Paperclip size={16} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Creation Modal */}
      <NewTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Edit Modal */}
      <EditTaskModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />

      {/* Import CSV Modal */}
      <ImportCsvModal 
        isOpen={isCsvModalOpen} 
        onClose={() => setIsCsvModalOpen(false)} 
      />
    </div>
  );
}