
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, TaskFilter, CreateTaskRequest, UpdateTaskRequest } from '@/types/task';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { todoService } from '@/services/todoService';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  filter: TaskFilter;
  filteredTasks: Task[];
  createTask: (task: CreateTaskRequest) => Promise<void>;
  updateTask: (id: string, updates: UpdateTaskRequest) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  reorderTasks: (startIndex: number, endIndex: number) => void;
  setFilter: (filter: Partial<TaskFilter>) => void;
  getAllTags: () => string[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilterState] = useState<TaskFilter>({
    status: 'all',
    sortBy: 'created',
    sortOrder: 'desc'
  });

  // Load tasks from localStorage on mount
  useEffect(() => {
  const fetchTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allTasks = await todoService.getTodos();
      setTasks(allTasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast({
        title: "Error",
        description: "Could not load tasks from server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  fetchTasks();
}, [user]);


  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (user && tasks.length >= 0) {
      localStorage.setItem(`tasks_${user.id}`, JSON.stringify(tasks));
    }
  }, [tasks, user,
    
  ]);

  const createTask = async (taskData: CreateTaskRequest) => {
  if (!user) return;

  try {
    setLoading(true);

    const newTask = await todoService.createTodo({
      ...taskData,
      userId: user.id,
    });

    setTasks(prev => [...prev, newTask]);

    toast({
      title: "Task created",
      description: "Your task has been added successfully",
    });
  } catch (error) {
    console.error("Create Task Error:", error);
    toast({
      title: "Error",
      description: "Failed to create task",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


const updateTask = async (id: string, updates: UpdateTaskRequest) => {
  try {
    setLoading(true);

    const updated = await todoService.updateTodo(id, updates);

    // ✅ Normalize the response: convert _id to id
    const updatedNormalized = {
      ...updated,
      id: updated._id, // from MongoDB
    };

    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, ...updatedNormalized } : task
      )
    );

    toast({
      title: "Task updated",
      description: "Your changes have been saved",
    });
  } catch (error) {
    console.error("Update Task Error:", error);
    toast({
      title: "Error",
      description: "Failed to update task",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};




const deleteTask = async (id: string) => {
  if (!id) {
    console.error("❌ deleteTask called with invalid id:", id);
    return;
  }

  try {
    setLoading(true);
    await todoService.deleteTodo(id);
    setTasks(prev => prev.filter(task => task._id !== id)); // 👈 depends on whether you're using _id
    toast({ title: "Task deleted", description: "Task has been removed" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    toast({
      title: "Error",
      description: "Failed to delete task",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  const toggleTask = async (id: string) => {
  const task = tasks.find(t => t._id === id);
  if (!task) return;

  const updatedFields = { completed: !task.completed };

  await updateTask(id, updatedFields); // ✅ send correct field
};


  const reorderTasks = (startIndex: number, endIndex: number) => {
    const result = Array.from(filteredTasks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Update order for all tasks
    const reorderedTasks = result.map((task, index) => ({
      ...task,
      order: index
    }));
    
    setTasks(prev => {
      const otherTasks = prev.filter(task => !filteredTasks.some(ft => ft.id === task.id));
      return [...otherTasks, ...reorderedTasks];
    });
  };

  const setFilter = (newFilter: Partial<TaskFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  };

  const getAllTags = () => {
    const allTags = tasks.flatMap(task => task.tags);
    return Array.from(new Set(allTags));
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      if (filter.status === 'active' && task.completed) return false;
      if (filter.status === 'completed' && !task.completed) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.tag && !task.tags.includes(filter.tag)) return false;
      return true;
    })
.sort((a, b) => {
  let comparison = 0;

  switch (filter.sortBy) {
    case 'title':
      comparison = a.title.localeCompare(b.title);
      break;

    case 'dueDate':
      if (!a.dueDate && !b.dueDate) comparison = 0;
      else if (!a.dueDate) comparison = 1;
      else if (!b.dueDate) comparison = -1;
      else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      break;

    case 'priority':
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
      break;

    case 'created':
    default:
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      break;
  }

  return filter.sortOrder === 'asc' ? comparison : -comparison;
});


  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      filter,
      filteredTasks,
      createTask,
      updateTask,
      deleteTask,
      toggleTask,
      reorderTasks,
      setFilter,
      getAllTags
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
