import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import NewTaskModal from './NewTaskModal';
import EditTaskModal from './EditTaskModal';
import ImportCsvModal from './ImportCsvModal';
import type { Task } from '@/types/task';
import { Paperclip } from 'lucide-react';

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
    if (s.includes('done') || s.includes('resolved')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (s.includes('progress') || s.includes('suggested')) return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (s.includes('blocked') || s.includes('awaiting')) return 'bg-rose-100 text-rose-800 border border-rose-200';
    if (s.includes('partially')) return 'bg-orange-100 text-orange-800 border border-orange-200';
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  // Helper function to color-code priority badges
  const getPriorityStyle = (priority: string) => {
    const p = (priority || '').toLowerCase();
    if (p === 'high') return 'bg-red-100 text-red-800 border border-red-200';
    if (p === 'medium') return 'bg-amber-100 text-amber-800 border border-amber-200';
    return 'bg-slate-100 text-slate-600 border border-slate-200';
  };

  // 1. Identify the current route
  const isPrivateSpace = location.pathname === '/private-tasks';
  const isMyTasksRoute = location.pathname === '/tasks';
  const isByStatusRoute = location.pathname === '/by-status';

  // 2. Filter tasks
  let filteredTasks = tasks.filter((t) => {
    if (isPrivateSpace) {
      return t.isPrivate === true && (t.assignee || '').toLowerCase().includes(user?.email?.toLowerCase() || '');
    } else {
      if (t.isPrivate === true) return false;
    }

    const urlDeptMatches = department 
      ? (t.department || '').toLowerCase().replace(/\s+/g, '-') === department 
      : true;

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

  // 3. Sort the tasks
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
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {location.pathname === '/private-tasks' ? 'My Private Tasks' : 
           location.pathname === '/by-status' ? 'My Tasks By Status' : 
           location.pathname === '/tasks' ? 'My Tasks' : 
           department ? department.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
           'All Tasks'}
        </h1>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCsvModalOpen(true)}
            className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-sm"
          >
            Import CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition-all"
          >
            New Task
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm flex-1">
        <table className="w-full border-collapse text-left text-[13px] whitespace-nowrap">
          <thead className="bg-indigo-50/70 text-indigo-950 sticky top-0 z-10 backdrop-blur-sm">
            <tr className="border-b border-indigo-100">
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
            
            <tr className="border-b border-indigo-100 bg-white/50">
              <th className="p-2 px-3">
                <input type="text" placeholder="Filter..." value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)} className="w-full p-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow" />
              </th>
              <th className="p-2 px-3">
                <input type="text" placeholder="Filter..." value={filters.taskName} onChange={(e) => handleFilterChange('taskName', e.target.value)} className="w-full p-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow" />
              </th>
              <th className="p-2 px-3">
                <input type="text" placeholder="Filter..." value={filters.createdBy} onChange={(e) => handleFilterChange('createdBy', e.target.value)} className="w-full p-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow" />
              </th>
              <th className="p-2 px-3">
                <input type="text" placeholder="Filter..." value={filters.assignee} onChange={(e) => handleFilterChange('assignee', e.target.value)} className="w-full p-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow" />
              </th>
              <th className="p-2 px-3">
                <input type="text" placeholder="Filter..." value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)} className="w-full p-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow" />
              </th>
              <th className="p-2 px-3"></th>
              <th className="p-2 px-3"></th>
              <th className="p-2 px-3">
                <input type="text" placeholder="Filter..." value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full p-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow" />
              </th>
              <th className="p-2 px-3"></th>
              <th className="p-2 px-3"></th>
              <th className="p-2 px-3"></th>
              <th className="p-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-12 text-center text-slate-400 italic">
                  No tasks match your filters.
                </td>
              </tr>
            ) : (
              filteredTasks.map((t) => (
                <tr 
                  key={t.id} 
                  onClick={() => setSelectedTask(t)}
                  className="border-b border-slate-100 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                >
                  <td className="p-3">
                    <span className="bg-slate-100 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-600 border border-slate-200">
                      {t.department}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800 max-w-[200px] truncate" title={t.taskName}>
                    {t.taskName}
                  </td>
                  <td className="p-3 text-slate-500 max-w-[150px] truncate" title={t.createdBy}>
                    {t.createdBy ? t.createdBy.split('@')[0] : '-'}
                  </td>
                  <td className="p-3 text-slate-600 max-w-[150px] truncate font-medium" title={t.assignee}>
                    <span className="text-indigo-400 mr-1">👤</span>{(t.assignee || '').split(',')[0] || 'Unassigned'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${getPriorityStyle(t.priority)}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 font-medium">
                    {t.startDate ? new Date(t.startDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-3 text-slate-500 font-medium">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${getStatusStyle(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 max-w-[200px] truncate" title={t.remark}>
                    {t.remark || '-'}
                  </td>
                  <td className="p-3 text-slate-500 max-w-[150px] truncate" title={t.lastEditedBy}>
                    {t.lastEditedBy ? t.lastEditedBy.split('@')[0] : '-'}
                  </td>
                  <td className="p-3 text-slate-400 text-xs">
                    {t.updatedAt 
                      ? new Date(t.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                      : '-'}
                  </td>
                  <td className="p-3 text-center">
                    {t.attachmentUrl ? (
                      <div className="flex justify-center text-indigo-500 hover:text-indigo-700 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <a href={t.attachmentUrl} target="_blank" rel="noopener noreferrer" title="View Attachment">
                          <Paperclip size={18} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditTaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      <ImportCsvModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} />
    </div>
  );
}