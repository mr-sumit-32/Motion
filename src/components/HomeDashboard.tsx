import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToNotices } from '@/lib/db';
import type { Notice } from '@/types/company';
import { 
  Megaphone, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Sun, 
  Moon, 
  SunMedium,
  Plus
} from 'lucide-react';
import { useUserDirectory } from '@/hooks/useUserDirectory';

export default function HomeDashboard() {
  const { user } = useAuth();
  const { tasks, currentWorkspace } = useStore();
  const { getDisplayName } = useUserDirectory();
  const [latestNotice, setLatestNotice] = useState<Notice | null>(null);

  // Extract a display name from the user's email
  const displayName = getDisplayName(user?.email) || 'Team Member';
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  
  // Time-aware greeting logic
  const currentHour = new Date().getHours();
  let greeting = 'Good evening';
  let GreetingIcon = Moon;
  let iconColor = 'text-indigo-400';

  if (currentHour < 12) {
    greeting = 'Good morning';
    GreetingIcon = Sun;
    iconColor = 'text-amber-500';
  } else if (currentHour < 18) {
    greeting = 'Good afternoon';
    GreetingIcon = SunMedium;
    iconColor = 'text-orange-500';
  }

  // Filter tasks to show only pending ones assigned to the logged-in user
  const myPendingTasks = tasks.filter((t) => {
    const isAssignedToMe = user?.email && t.assignee.toLowerCase().includes(user.email.toLowerCase());
    const isNotDone = !t.status.toLowerCase().includes('done') && !t.status.toLowerCase().includes('resolved');
    return isAssignedToMe && isNotDone;
  });

  // Sort by due date (if exists) and take the top 5
  const topTasks = myPendingTasks
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  // Fetch the latest notice
  useEffect(() => {
    if (!currentWorkspace) return;
    
    const unsubscribe = subscribeToNotices(currentWorkspace.id, (notices) => {
      if (notices.length > 0) {
        setLatestNotice(notices[0]); // Grab the newest one
      } else {
        setLatestNotice(null);
      }
    });

    return () => unsubscribe();
  }, [currentWorkspace]);

  // Enhanced color-coding for status dots with subtle glowing shadows
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('progress')) return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
    if (s.includes('blocked')) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
    if (s.includes('not started')) return 'bg-slate-400';
    return 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]';
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <GreetingIcon size={28} className={`${iconColor} animate-in zoom-in duration-700`} />
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {greeting}, {capitalizedName}.
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">
            Here is your workspace overview. You have <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mx-1">{myPendingTasks.length}</span> pending tasks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content: Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5 font-bold text-slate-800">
                <CheckCircle2 size={20} className="text-indigo-600" />
                My Priority Tasks
              </div>
              <div className="flex items-center gap-4">
                <Link to="/tasks" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            
            <div className="p-0 flex-1">
              {topTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50/30">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-emerald-500 opacity-80" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">You are all caught up!</p>
                  <p className="text-xs mt-1 text-slate-400">Enjoy your free time or grab a new task.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {topTasks.map(task => (
                    <div key={task.id} className="p-5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4 group">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${getStatusColor(task.status)}`} />
                        <div>
                          <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{task.taskName}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold border border-slate-200">
                              {task.department}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-md font-bold shadow-sm">
                            <Clock size={14} />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Content: Notices */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative">
            
            {/* Decorative background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16 blur-2xl pointer-events-none"></div>

            <div className="px-6 py-4 border-b border-blue-100/50 flex items-center gap-2.5 font-bold text-blue-800 relative z-10">
              <div className="bg-blue-100 p-1.5 rounded-md text-blue-600">
                <Megaphone size={16} />
              </div>
              Latest Announcement
            </div>
            
            <div className="p-6 flex-1 flex flex-col relative z-10">
              {latestNotice ? (
                <div className="flex flex-col h-full">
                  <h3 className="font-extrabold text-slate-900 text-base mb-3 leading-snug">{latestNotice.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed mb-6 font-medium">
                    {latestNotice.message}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                        {getDisplayName(latestNotice.author).charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{getDisplayName(latestNotice.author)}</span>
                    </div>
                    <Link to="/notice-board" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                      Read full notice
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Megaphone size={24} className="text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-500">No recent announcements</p>
                  <p className="text-xs text-slate-400 mt-1">Your notice board is clear.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}