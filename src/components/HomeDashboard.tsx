import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToNotices } from '@/lib/db';
import type { Notice } from '@/types/company';
import { Megaphone, CheckCircle2, ArrowRight, Clock } from 'lucide-react';

export default function HomeDashboard() {
  const { user } = useAuth();
  const { tasks, currentWorkspace } = useStore();
  const [latestNotice, setLatestNotice] = useState<Notice | null>(null);

  // Extract a display name from the user's email
  const displayName = user?.email?.split('@')[0] || 'Team Member';
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

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

  // Helper to color-code status dots
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('progress')) return 'bg-blue-500';
    if (s.includes('blocked')) return 'bg-red-500';
    return 'bg-gray-400';
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Good morning, {capitalizedName}.
        </h1>
        <p className="text-muted-foreground">
          Here is an overview of your workspace today. You have <span className="font-medium text-foreground">{myPendingTasks.length} pending tasks</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Content: Tasks */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 size={18} className="text-primary" />
                My Priority Tasks
              </div>
              <Link to="/tasks" className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="p-0 flex-1">
              {topTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <CheckCircle2 size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">You are all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {topTasks.map(task => (
                    <div key={task.id} className="p-4 hover:bg-muted/50 transition-colors flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${getStatusColor(task.status)}`} />
                        <div>
                          <p className="font-medium text-sm">{task.taskName}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                              {task.department}
                            </span>
                            <span>{task.status}</span>
                          </div>
                        </div>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 bg-orange-500/10 text-orange-600 px-2 py-1 rounded-md font-medium">
                          <Clock size={12} />
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Content: Notices */}
        <div className="space-y-6">
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-blue-500/10 flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400">
              <Megaphone size={18} />
              Latest Announcement
            </div>
            <div className="p-5 flex-1">
              {latestNotice ? (
                <div>
                  <h3 className="font-semibold text-sm mb-2">{latestNotice.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed mb-4">
                    {latestNotice.message}
                  </p>
                  <div className="text-xs text-muted-foreground flex justify-between items-center mt-auto">
                    <span>By {latestNotice.author.split('@')[0]}</span>
                    <Link to="/notice-board" className="text-blue-600 hover:underline font-medium">Read more</Link>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No recent announcements.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}