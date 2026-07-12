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
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  ShoppingCart,
  Tags,
  Database,
  GitMerge,
  Package,
  UserCircle,
  Truck
} from 'lucide-react';

export default function Sidebar() {
  const { pages, currentWorkspace, tasks } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Helper for standard vibrant link styling
  const navLinkClasses = ({ isActive }: { isActive: boolean }) => cn(
    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative",
    isActive 
      ? "bg-indigo-50 text-indigo-700 font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-indigo-600 before:rounded-r-md" 
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  );

  // Helper to assign the perfect icon to each department
  const getDepartmentIcon = (dept: string, isActive: boolean) => {
    const iconClass = isActive ? "shrink-0 text-indigo-600" : "shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors";
    const size = 18;
    
    switch (dept) {
      case "Team Workspace": return <Users size={size} className={iconClass} />;
      case "Bizom": return <Briefcase size={size} className={iconClass} />;
      case "Primary Sales": return <TrendingUp size={size} className={iconClass} />;
      case "Secondary Sales": return <ShoppingCart size={size} className={iconClass} />;
      case "Tertiary Sales": return <Tags size={size} className={iconClass} />;
      case "MIS Executive": return <Database size={size} className={iconClass} />;
      case "Process Coordinator": return <GitMerge size={size} className={iconClass} />;
      case "Warehouse": return <Package size={size} className={iconClass} />;
      case "HR": return <UserCircle size={size} className={iconClass} />;
      case "Logistics": return <Truck size={size} className={iconClass} />;
      default: return <Building2 size={size} className={iconClass} />;
    }
  };

  // Calculate how many active team tasks belong to the user
  const myPendingTasksCount = tasks.filter(t => 
    !t.isPrivate && 
    (t.assignee || '').toLowerCase().includes((user?.email || '').toLowerCase()) && 
    (t.status || '').toLowerCase() !== 'done'
  ).length;


  return (
    <aside className="w-64 bg-slate-50/50 border-r border-slate-200 h-screen flex flex-col flex-shrink-0 select-none">
      
      {/* Header */}
      <div className="p-5 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200 mb-2">
        <div className="flex items-center gap-3 font-semibold text-sm text-slate-800">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white w-7 h-7 rounded-md flex items-center justify-center text-sm shadow-sm">
            {user?.email?.charAt(0).toUpperCase() || 'M'}
          </div>
          <span className="truncate">{currentWorkspace?.name || 'Workspace'}</span>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar">
        
        {/* Company Section */}
        <div className="px-5 mt-4 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Company
        </div>
        <div className="px-3 space-y-1">
          <NavLink to="/notice-board" className={navLinkClasses}>
            {({ isActive }) => (
              <>
                <Megaphone size={18} className={isActive ? "text-indigo-600" : "text-amber-500 opacity-90 group-hover:text-amber-600"} /> 
                Notice Board
              </>
            )}
          </NavLink>
          <NavLink to="/document-hub" className={navLinkClasses}>
            {({ isActive }) => (
              <>
                <FolderOpen size={18} className={isActive ? "text-indigo-600" : "text-blue-500 opacity-90 group-hover:text-blue-600"} /> 
                Document Hub
              </>
            )}
          </NavLink>
        </div>

        {/* Global Views Section */}
        <div className="px-5 mt-8 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Views
        </div>
        <div className="px-3 space-y-1">
          <NavLink to="/tasks" className={navLinkClasses}>
            {({ isActive }) => (
              <>
                <CheckCircle2 size={18} className={isActive ? "text-indigo-600" : "text-emerald-500 opacity-90 group-hover:text-emerald-600"} /> 
                <span className="flex-1">My Tasks</span>
                
                {/* UPDATED: Solid Red Badge Counter */}
                {myPendingTasksCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm bg-red-500 text-white">
                    {myPendingTasksCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
          <NavLink to="/by-status" className={navLinkClasses}>
             {({ isActive }) => (
              <>
                <BarChart3 size={18} className={isActive ? "text-indigo-600" : "text-purple-500 opacity-90 group-hover:text-purple-600"} /> 
                By Status
              </>
            )}
          </NavLink>
        </div>

        {/* Private Pages & Tasks */}
        <div className="flex items-center justify-between px-5 mt-8 mb-2 group cursor-pointer" onClick={handleCreatePage}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Private Space</span>
          <Plus size={14} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 rounded-full p-0.5" />
        </div>
        <div className="px-3 space-y-1">
          <NavLink to="/private-tasks" className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative",
            isActive 
              ? "bg-slate-800 text-white font-semibold shadow-md" 
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          )}>
            {({ isActive }) => (
              <>
                <Lock size={18} className={isActive ? "text-indigo-300" : "text-slate-500"} /> 
                My Private Tasks
              </>
            )}
          </NavLink>
          
          {pages.map((page) => (
            <NavLink key={page.id} to={`/page/${page.id}`} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  <FileText 
                    size={18} 
                    className={isActive ? "shrink-0 text-indigo-600" : "shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors"} 
                  />
                  <span className="truncate flex-1">{page.title || 'Untitled'}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Teamspaces (Task Tables) */}
        <div className="px-5 mt-8 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Departments
        </div>
        <div className="px-3 space-y-1">
          {departments.map((dept) => {
            const urlSafeDept = dept.toLowerCase().replace(/\s+/g, '-');
            return (
              <NavLink key={dept} to={`/tracker/${urlSafeDept}`} className={navLinkClasses}>
                {({ isActive }) => (
                  <>
                    {getDepartmentIcon(dept, isActive)}
                    <span className="truncate flex-1">{dept}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

      </div>
    </aside>
  );
}