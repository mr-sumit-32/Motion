import { db } from './firebase'; // Ensure this points to your actual firebase config file
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import type { Workspace, Page } from '@/types/workspace';
import type { Task } from '@/types/task';
import type { Notice, CompanyDoc } from '@/types/company';
import { limit } from 'firebase/firestore'; // Make sure to add 'limit' to your firestore imports at the top!
// ==========================================
// WORKSPACE MANAGEMENT
// ==========================================

export async function getUserWorkspace(userId: string): Promise<Workspace | null> {
  // Instead of looking for the user's personal workspace, 
  // we just grab the very first workspace in the entire database (The Company Workspace)
  const q = query(collection(db, 'workspaces'), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() } as Workspace;
}

export async function createWorkspace(userId: string, name: string = "My Workspace"): Promise<Workspace> {
  const workspaceRef = doc(collection(db, 'workspaces'));
  
  const newWorkspace = { 
    name, 
    ownerId: userId 
  };
  
  await setDoc(workspaceRef, newWorkspace);
  
  return { id: workspaceRef.id, ...newWorkspace } as Workspace;
}

// ==========================================
// PAGE (DOCUMENT) MANAGEMENT
// ==========================================

/**
 * Creates a new blank page in the workspace.
 */
export async function createPage(workspaceId: string, title: string = "Untitled"): Promise<Page> {
  const pageRef = doc(collection(db, `workspaces/${workspaceId}/pages`));
  
  const newPage = {
    title,
    content: "", // Initialized to satisfy TypeScript and the rich text editor
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await setDoc(pageRef, newPage);
  
  return {
    id: pageRef.id,
    ...newPage
  } as Page;
}

/**
 * Listens for real-time updates to all pages in a workspace.
 */
export function subscribeToPages(workspaceId: string, onUpdate: (pages: Page[]) => void) {
  const pagesRef = collection(db, `workspaces/${workspaceId}/pages`);
  
  const unsubscribe = onSnapshot(pagesRef, (snapshot) => {
    const pages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "Untitled",
        content: data.content || "", // Fallback empty string to satisfy TypeScript Page type
        parentId: data.parentId || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Page;
    });
    
    onUpdate(pages);
  });

  return unsubscribe;
}

/**
 * Updates the title and content of a specific page.
 */
export async function updatePage(workspaceId: string, pageId: string, title: string, content: string) {
  const pageRef = doc(db, `workspaces/${workspaceId}/pages/${pageId}`);
  
  await updateDoc(pageRef, {
    title,
    content,
    updatedAt: new Date()
  });
}

/**
 * Deletes a page completely from the database.
 */
export async function deletePage(workspaceId: string, pageId: string) {
  const pageRef = doc(db, `workspaces/${workspaceId}/pages/${pageId}`);
  await deleteDoc(pageRef);
}

// ==========================================
// TASK MANAGEMENT ENGINE
// ==========================================

/**
 * Creates a new task in the workspace.
 */
export async function createTask(workspaceId: string, taskData: Omit<Task, 'id' | 'lastEditedTime'>): Promise<Task> {
  const taskRef = doc(collection(db, `workspaces/${workspaceId}/tasks`));
  
  const newTask = {
    ...taskData,
    id: taskRef.id,
    lastEditedTime: new Date(),
  };

  await setDoc(taskRef, newTask);
  return newTask as Task;
}

/**
 * Listens for real-time updates to all tasks in a workspace.
 */
export function subscribeToTasks(workspaceId: string, onUpdate: (tasks: Task[]) => void) {
  const tasksRef = collection(db, `workspaces/${workspaceId}/tasks`);
  
  const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        startDate: data.startDate?.toDate() || null,
        dueDate: data.dueDate?.toDate() || null,
        lastEditedTime: data.lastEditedTime?.toDate() || new Date(),
      } as Task;
    });
    
    onUpdate(tasks);
  });

  return unsubscribe;
}

/**
 * Updates an existing task (e.g., status changes, assignee updates).
 */
export async function updateTask(workspaceId: string, taskId: string, updates: Partial<Task>, userEmail: string) {
  const taskRef = doc(db, `workspaces/${workspaceId}/tasks/${taskId}`);
  
  await updateDoc(taskRef, {
    ...updates,
    lastEditedBy: userEmail,
    lastEditedTime: new Date()
  });
}

/**
 * Deletes a task completely from the database.
 */
export async function deleteTask(workspaceId: string, taskId: string) {
  const taskRef = doc(db, `workspaces/${workspaceId}/tasks/${taskId}`);
  await deleteDoc(taskRef);
}
/**
 * Helper function to initialize a new user with a workspace and a welcome page.
 */
export async function createDefaultWorkspace(userId: string): Promise<Workspace> {
  // 1. Create the default workspace
  const workspace = await createWorkspace(userId, "My Workspace");
  
  // 2. Add a default page so their sidebar isn't empty
  await createPage(workspace.id, "Untitled");
  
  return workspace;
}
// ==========================================
// COMPANY: NOTICE BOARD
// ==========================================

export async function createNotice(workspaceId: string, title: string, message: string, author: string): Promise<void> {
  const noticeRef = doc(collection(db, `workspaces/${workspaceId}/notices`));
  await setDoc(noticeRef, {
    title,
    message,
    author,
    createdAt: new Date()
  });
}

export function subscribeToNotices(workspaceId: string, onUpdate: (notices: Notice[]) => void) {
  const noticesRef = collection(db, `workspaces/${workspaceId}/notices`);
  // Query ordered by newest first
  const q = query(noticesRef); 
  
  return onSnapshot(q, (snapshot) => {
    const notices = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        author: data.author,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Notice;
    });
    // Sort descending by date locally
    notices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    onUpdate(notices);
  });
}
// ==========================================
// COMPANY: DOCUMENT HUB
// ==========================================

export async function createCompanyDoc(workspaceId: string, name: string, link: string, author: string): Promise<void> {
  const docRef = doc(collection(db, `workspaces/${workspaceId}/companyDocs`));
  
  await setDoc(docRef, {
    name,
    link,
    author,
    createdAt: new Date()
  });
}

export function subscribeToCompanyDocs(workspaceId: string, onUpdate: (docs: CompanyDoc[]) => void) {
  const docsRef = collection(db, `workspaces/${workspaceId}/companyDocs`);
  
  return onSnapshot(docsRef, (snapshot) => {
    const docs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        link: data.link,
        author: data.author,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as CompanyDoc;
    });
    
    // Sort descending by date locally
    docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    onUpdate(docs);
  });
}