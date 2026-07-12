export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
}

export interface Page {
  id: string;
  title: string;
  icon?: string;
  content: string; // <-- Add this line
  coverImage?: string;
  parentId: string | null; // For nested sub-pages
  updatedAt: Date;
}

export type BlockType = 'h1' | 'h2' | 'paragraph' | 'todo' | 'image' | 'bullet-list';

export interface Block {
  id: string;
  type: BlockType;
  content: string;      // The text content or image URL
  orderIndex: number;   // To keep blocks sorted correctly
  properties?: {
    checked?: boolean;  // For todo blocks
  };
}