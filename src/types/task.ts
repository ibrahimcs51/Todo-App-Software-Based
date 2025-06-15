
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  order: number;
}

export interface TaskFilter {
  status: 'all' | 'active' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  tag?: string;
  sortBy: 'dueDate' | 'priority' | 'created' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
  tags: string[];
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  completed?: boolean;
  order?: number;
}
