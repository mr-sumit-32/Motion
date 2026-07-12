import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { getUserWorkspace, subscribeToPages, subscribeToTasks } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { Loader2 } from 'lucide-react';


export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();
  
  // Bring in our global state actions
  const {  setCurrentWorkspace, setPages, setTasks } = useStore();
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);

  useEffect(() => {
    if (!user) return;

    let unsubscribePages: (() => void) | null = null;
    let unsubscribeTasks: (() => void) | null = null;

    async function loadWorkspace() {
      try {
        const workspace = await getUserWorkspace(user!.uid);
        setCurrentWorkspace(workspace);

        if (workspace) {
          // Listen to Pages
          unsubscribePages = subscribeToPages(workspace.id, (fetchedPages) => {
            setPages(fetchedPages);
          });
          
          // Listen to Tasks
          unsubscribeTasks = subscribeToTasks(workspace.id, (fetchedTasks) => {
            setTasks(fetchedTasks);
          });
        }
      } catch (error) {
        console.error("Failed to load workspace:", error);
      } finally {
        setIsLoadingWorkspace(false);
      }
    }

    loadWorkspace();

    // Clean up both listeners when the component unmounts
    return () => {
      if (unsubscribePages) unsubscribePages();
      if (unsubscribeTasks) unsubscribeTasks();
    };
  }, [user, setCurrentWorkspace, setPages, setTasks]);

  if (isLoadingWorkspace) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}