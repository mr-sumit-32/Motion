import { create } from 'zustand';
import type { Workspace, Page } from '@/types/workspace';
import type { Task } from '@/types/task'; // Add this import

interface AppState {
  currentWorkspace: Workspace | null;
  pages: Page[];
  tasks: Task[]; // Add tasks array
  activePageId: string | null;
  
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setPages: (pages: Page[]) => void;
  setTasks: (tasks: Task[]) => void; // Add task setter
  setActivePageId: (pageId: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  currentWorkspace: null,
  pages: [],
  tasks: [],
  activePageId: null,

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setPages: (pages) => set({ pages }),
  setTasks: (tasks) => set({ tasks }),
  setActivePageId: (pageId) => set({ activePageId: pageId }),
}));