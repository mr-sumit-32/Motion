export type TaskStatus = 'Not started' | 'In progress' | 'Partially Completed' | 'Awaiting Update' | 'Suggested' | 'Blocked' | 'Resolved' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  taskName: string;
  department: string;
  priority: TaskPriority;
  createdBy: string;
  assignee: string; // Comma-separated emails
  startDate: Date | null;
  dueDate: Date | null;
  status: TaskStatus;
  remark: string;
  lastEditedBy: string;
  lastEditedTime: Date;
  attachmentUrl: string;
  isPrivate: boolean;
  moduleTask?: string;
  updatedAt?: string | Date | null;
}