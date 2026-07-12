import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { createPage } from '@/lib/db';
import { 
  Plus, 
  FileText,
  Megaphone,
  FolderOpen,
  CheckCircle2,
  BarChart3,
  Lock,
  Building2
} from 'lucide-react';

export default function Sidebar() {
  const { pages, currentWorkspace } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  // UPDATED: Removed Assigning Tracker, Renamed Wakanda Tracker to Team Workspace
  const departments = [
    "Team Workspace", 
    "Bizom", 
    "Primary Sales", 
    "Secondary Sales", 
    "Tertiary Sales", 
    "MIS Executive", 
    "Process Coordinator", 
    "Warehouse", 
    "HR", 
    "Logistics"
  ];

  const handleCreatePage = async () => {
    if (!currentWorkspace) return;
    try {
      const newPage = await createPage(currentWorkspace.id, "Untitled");
      navigate(`/page/${newPage.id}`);
    } catch (error) {
      console.error("Failed to create new page:", error);
    }
  };

  return (
    <aside className="w-64 bg-[#fbfbfa] border-r border-border h-screen flex flex-col flex-shrink-0 select-none">
      
      {/* Header */}
      <div className="p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border mb-2">
        <div className="flex items-center gap-2 font-medium text-sm">
          <div className="bg-primary text-primary-foreground w-5 h-5 rounded flex items-center justify-center text-xs">
            {user?.email?.charAt(0).toUpperCase() || 'M'}
          </div>
          <span className="truncate">{currentWorkspace?.name || 'Workspace'}</span>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto pb-4">
        
        {/* Company Section */}
        <div className="px-4 mt-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Company
        </div>
        <div className="px-2 space-y-0.5">
          <NavLink to="/notice-board" className={({ isActive }) => cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
            isActive ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <Megaphone size={16} /> Notice Board
          </NavLink>
          <NavLink to="/document-hub" className={({ isActive }) => cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
            isActive ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <FolderOpen size={16} /> Document Hub
          </NavLink>
        </div>

        {/* Global Views Section */}
        <div className="px-4 mt-6 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Views
        </div>
        <div className="px-2 space-y-0.5">
          <NavLink to="/tasks" className={({ isActive }) => cn(
            "flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors",
            isActive ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} /> My Tasks
            </div>
          </NavLink>
          <NavLink to="/by-status" className={({ isActive }) => cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
            isActive ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <BarChart3 size={16} /> By Status
          </NavLink>
        </div>

        {/* Private Pages & Tasks */}
        <div className="flex items-center justify-between px-4 mt-6 mb-1 group cursor-pointer" onClick={handleCreatePage}>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Private Space</span>
          <Plus size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="px-2 space-y-0.5">
          {/* NEW: Dedicated Private Tasks Route */}
          <NavLink to="/private-tasks" className={({ isActive }) => cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-blue-600 bg-blue-50/50 hover:bg-blue-100",
            isActive ? "bg-blue-100 font-medium" : ""
          )}>
            <Lock size={16} /> My Private Tasks
          </NavLink>
          
          {pages.map((page) => (
            <NavLink
              key={page.id}
              to={`/page/${page.id}`}
              className={({ isActive }) => cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors group",
                isActive ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <FileText size={16} className="shrink-0" />
              <span className="truncate flex-1">{page.title || 'Untitled'}</span>
            </NavLink>
          ))}
        </div>

        {/* Teamspaces (Task Tables) */}
        <div className="px-4 mt-6 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Departments
        </div>
        <div className="px-2 space-y-0.5">
          {departments.map((dept) => {
            const urlSafeDept = dept.toLowerCase().replace(/\s+/g, '-');
            return (
              <NavLink
                key={dept}
                to={`/tracker/${urlSafeDept}`}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors group",
                  isActive ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Building2 size={16} className="shrink-0" />
                <span className="truncate flex-1">{dept}</span>
              </NavLink>
            );
          })}
        </div>

      </div>
    </aside>
  );
}