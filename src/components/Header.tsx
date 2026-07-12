import { useState } from 'react';
import { Search, Bell, Menu, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function Header({ toggleSidebar, isSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Extract the first letter of the email for the avatar, default to 'U'
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  const handleLogout = async () => {
    try {
      await logout();
      // The ProtectedRoute will automatically catch the state change and redirect to /login
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0 relative z-50">
      <div className="flex items-center gap-4 flex-1">
        {!isSidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        
        {/* Global Search */}
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search Motion..." 
            className="w-full bg-muted/50 border border-transparent hover:border-border focus:border-border focus:bg-background rounded-md pl-9 pr-4 py-1.5 text-sm outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors relative">
          <Bell size={18} />
          {/* Notification indicator dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
        </button>
        
        {/* User Profile Dropdown Container */}
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:ring-2 ring-primary/20 transition-all font-medium text-sm text-secondary-foreground"
          >
            {userInitial}
          </button>

          {/* Invisible overlay to close dropdown when clicking outside */}
          {isProfileOpen && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsProfileOpen(false)} 
            />
          )}

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-md shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200 py-1">
              <div className="px-4 py-3 border-b border-border mb-1">
                <p className="text-sm font-medium leading-none mb-1 text-foreground">Signed in as</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              
              <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors">
                <User size={16} className="text-muted-foreground" />
                Profile Settings
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}