import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/contexts/TaskContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Award, Calendar, CheckCircle, Clock, Edit, File, FileText, Filter, Image, LogOut, Moon, Plus, Search, Sun, Tag, Target, Trash, TrendingUp, Upload, X, Zap } from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';

interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

const TaskDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    filteredTasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    filter,
    setFilter,
    getAllTags
  } = useTasks();

  const [newTask, setNewTask] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('work');
  const [newTaskTags, setNewTaskTags] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskFiles, setNewTaskFiles] = useState<FileWithPreview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const categories = ['work', 'personal', 'health', 'learning', 'shopping', 'finance', 'travel'];

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreview = acceptedFiles.map(file => {
      const fileWithPreview = Object.assign(file, {
        id: uuidv4(),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      });
      return fileWithPreview;
    });
    setNewTaskFiles(prev => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const removeFile = (id: string) => {
    setNewTaskFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      newTaskFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [newTaskFiles]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      const tags = newTaskTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      await createTask({
        title: newTask,
        description: newTaskDescription || undefined,
        priority: newTaskPriority,
        category: newTaskCategory,
        tags: tags,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate) : undefined,
        attachments: newTaskFiles
      });
      setNewTask('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskCategory('work');
      setNewTaskTags('');
      setNewTaskDueDate('');
      setNewTaskFiles([]);
      setIsAddingTask(false);
    }
  };

 const handleEditTask = (task: any) => {
  console.log(task);
  setEditingTask({
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
    attachments: task.attachments || []
  });
  setIsEditDialogOpen(true);
};


  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      const tags = editingTask.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      await updateTask(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        category: editingTask.category,
        tags: tags,
        dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : undefined,
        attachments: editingTask.attachments
      });
      setIsEditDialogOpen(false);
      setEditingTask(null);
    }
  };

  const handleToggleTask = async (id: string) => {
     console.log("🔁 handleToggleTask called with id:", id);
    const task = filteredTasks.find(t => t.id === id);
    if (task && !task.completed) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    await toggleTask(id);
  };

  const handleDeleteTask = async (id: string) => {
    console.log("🗑️ handleDeleteTask called with id:", id);
    await deleteTask(id);
  };

  // Filter tasks based on search term and other filters
  const displayTasks = (filteredTasks ?? []).filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 shadow-red-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-yellow-100';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 shadow-green-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 shadow-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      work: 'bg-blue-100 text-blue-800 border-blue-200 shadow-blue-100',
      personal: 'bg-purple-100 text-purple-800 border-purple-200 shadow-purple-100',
      health: 'bg-green-100 text-green-800 border-green-200 shadow-green-100',
      learning: 'bg-orange-100 text-orange-800 border-orange-200 shadow-orange-100',
      shopping: 'bg-pink-100 text-pink-800 border-pink-200 shadow-pink-100',
      finance: 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-emerald-100',
      travel: 'bg-cyan-100 text-cyan-800 border-cyan-200 shadow-cyan-100'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200 shadow-gray-100';
  };

  // Calculate statistics from actual tasks
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = filteredTasks.filter(task =>
    task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
  ).length;
  const todayTasks = filteredTasks.filter(task =>
    task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()
  ).length;
  const highPriorityTasks = filteredTasks.filter(task => task.priority === 'high' && !task.completed).length;

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getTasksByCategory = () => {
    const categoryStats = categories.map(category => ({
      name: category,
      total: filteredTasks.filter(task => task.category === category).length,
      completed: filteredTasks.filter(task => task.category === category && task.completed).length
    })).filter(stat => stat.total > 0);
    return categoryStats;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-5 w-5" />;
    } else {
      return <File className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TaskFlow Pro
                </h1>
              </div>
              <Badge variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors duration-300">
                Welcome, {user?.name}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transform hover:scale-105 transition-all duration-300"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                onClick={logout}
                className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transform hover:scale-105 transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Tasks</p>
                  <p className="text-3xl font-bold">{totalTasks}</p>
                </div>
                <Target className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold">{completedTasks}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Progress</p>
                  <p className="text-3xl font-bold">{completionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Overdue</p>
                  <p className="text-3xl font-bold">{overdueTasks}</p>
                </div>
                <Clock className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Due Today</p>
                  <p className="text-3xl font-bold">{todayTasks}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium">High Priority</p>
                  <p className="text-3xl font-bold">{highPriorityTasks}</p>
                </div>
                <Zap className="h-8 w-8 text-pink-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section with Animation */}
        <Card className="mb-6 bg-white/60 backdrop-blur-sm border-white/20 transform hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Achievement Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Completion</span>
                  <span className="font-semibold">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3 bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${completionRate}%` }}
                  />
                </Progress>
              </div>

              {getTasksByCategory().map((category, index) => (
                <div key={category.name} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{category.name}</span>
                    <span>{category.completed}/{category.total}</span>
                  </div>
                  <Progress
                    value={(category.completed / category.total) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Add Task Form */}
        <Card className="mb-6 bg-white/60 backdrop-blur-sm border-white/20 transform hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create New Task</span>
              </div>
              {!isAddingTask && (
                <Button
                  onClick={() => setIsAddingTask(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          {isAddingTask && (
            <CardContent className="animate-fade-in">
              <form onSubmit={handleAddTask} className="space-y-4">
                <Input
                  placeholder="What needs to be accomplished?"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="bg-white/70 border-white/30 focus:bg-white transition-all duration-300"
                />
                <Textarea
                  placeholder="Add detailed description (optional)"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="bg-white/70 border-white/30 focus:bg-white transition-all duration-300"
                  rows={3}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Select value={newTaskPriority} onValueChange={(value: any) => setNewTaskPriority(value)}>
                    <SelectTrigger className="bg-white/70 border-white/30 focus:bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low Priority</SelectItem>
                      <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                      <SelectItem value="high">🔴 High Priority</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                    <SelectTrigger className="bg-white/70 border-white/30 focus:bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="bg-white/70 border-white/30 focus:bg-white"
                  />

                  <Input
                    placeholder="Tags (comma separated)"
                    value={newTaskTags}
                    onChange={(e) => setNewTaskTags(e.target.value)}
                    className="bg-white/70 border-white/30 focus:bg-white"
                  />
                </div>

                {/* File Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${isDragActive
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                    }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {isDragActive ?
                        'Drop the files here...' :
                        'Drag & drop files here, or click to select files'}
                    </p>
                    <p className="text-xs text-gray-500">Supports images, PDFs, and text files (max 5MB)</p>
                  </div>
                </div>

                {/* Preview selected files */}
                {newTaskFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Attachments:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {newTaskFiles.map(file => (
                        <div key={file.id} className="relative group border rounded-md p-2 flex items-center space-x-2 bg-white/80">
                          {file.preview ? (
                            <div className="relative h-12 w-12 flex-shrink-0">
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="h-full w-full object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded">
                              {getFileIcon(file.type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(file.id);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : '✨ Create Task'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddingTask(false);
                      setNewTaskFiles([]);
                    }}
                    className="bg-white/70 border-white/30 hover:bg-white transform hover:scale-105 transition-all duration-300"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        {/* Enhanced Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="🔍 Search tasks, descriptions, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90 transition-all duration-300"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={filter.status} onValueChange={(value: any) => setFilter({ status: value })}>
              <SelectTrigger className="w-full sm:w-40 bg-white/70 backdrop-blur-sm border-white/20">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="active">Active Tasks</SelectItem>
                <SelectItem value="completed">Completed Tasks</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.priority || 'all'} onValueChange={(value: any) => setFilter({ priority: value === 'all' ? undefined : value })}>
              <SelectTrigger className="w-full sm:w-40 bg-white/70 backdrop-blur-sm border-white/20">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enhanced Tasks List */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tasks ({displayTasks.length})</span>
              {displayTasks.length > 0 && (
                <div className="flex space-x-2">
                  <Badge variant="outline" className="bg-white/50">
                    {displayTasks.filter(t => !t.completed).length} active
                  </Badge>
                  {completionRate > 0 && (
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                      {completionRate}% complete
                    </Badge>
                  )}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <CheckCircle className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-xl mb-2 font-medium">
                  {searchTerm ? 'No tasks match your search.' : 'Ready to be productive?'}
                </p>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your filters or search terms.' : 'Create your first task above and start achieving your goals!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayTasks.map((task, index) => (
                  <div
                    key={task._id}
                    className={`group relative p-6 rounded-2xl border transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-fade-in ${task.completed
                        ? 'bg-gray-50/90 dark:bg-gray-800/60 opacity-75 border-gray-200/50 transform scale-95'
                        : 'bg-white/90 dark:bg-gray-700/90 border-white/40 hover:bg-white/95 shadow-lg'
                      }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <button
                        onClick={() => handleToggleTask(task._id)}
                        className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${task.completed
                            ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 text-white shadow-lg'
                            : 'border-gray-300 hover:border-green-400 hover:shadow-md'
                          }`}
                      >
                        {task.completed && <CheckCircle className="w-4 h-4 m-0.5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`font-semibold text-xl transition-all duration-300 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                            }`}>
                            {task.title}
                          </h3>

                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-blue-600 transform hover:scale-110 transition-all duration-200"
                              onClick={() => handleEditTask(task)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task._id)}
                              className="text-gray-400 hover:text-red-600 transform hover:scale-110 transition-all duration-200"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {task.description && (
                          <p className={`text-sm mb-4 leading-relaxed ${task.completed ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'
                            }`}>
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`text-xs font-medium border shadow-sm ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
                          </Badge>

                          {task.category && (
                            <Badge className={`text-xs font-medium border shadow-sm ${getCategoryColor(task.category)}`}>
                              📁 {task.category}
                            </Badge>
                          )}

                          {task.dueDate && (
                            <Badge
                              variant="outline"
                              className={`text-xs shadow-sm ${new Date(task.dueDate) < new Date() && !task.completed
                                  ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                                  : new Date(task.dueDate).toDateString() === new Date().toDateString()
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(task.dueDate)}
                            </Badge>
                          )}

                          {(task.tags ?? []).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border-gray-200 shadow-sm"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}

                        </div>

                        {/* Display attachments if they exist */}
                        {/* {task.attachments && task.attachments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-xs font-medium text-gray-500 mb-2">ATTACHMENTS</h4>
                            <div className="flex flex-wrap gap-2">
                              {task.attachments.map((file: FileWithPreview) => (
                                <a 
                                  key={file.id} 
                                  href={file.preview || '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-200"
                                >
                                  {file.preview ? (
                                    <img 
                                      src={file.preview} 
                                      alt={file.name} 
                                      className="h-6 w-6 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="h-6 w-6 flex items-center justify-center bg-gray-200 rounded">
                                      {getFileIcon(file.type)}
                                    </div>
                                  )}
                                  <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                                    {file.name}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )} */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Enhanced Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">✏️ Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to your task details below.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <Input
                placeholder="Task title"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="bg-white/70 border-white/30 focus:bg-white"
              />
              <Textarea
                placeholder="Description (optional)"
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                rows={3}
                className="bg-white/70 border-white/30 focus:bg-white"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  value={editingTask.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    setEditingTask({ ...editingTask, priority: value })
                  }
                >
                  <SelectTrigger className="bg-white/70 border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low Priority</SelectItem>
                    <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                    <SelectItem value="high">🔴 High Priority</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={editingTask.category || 'work'}
                  onValueChange={(value) => setEditingTask({ ...editingTask, category: value })}
                >
                  <SelectTrigger className="bg-white/70 border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                type="date"
                value={editingTask.dueDate}
                onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                className="bg-white/70 border-white/30 focus:bg-white"
              />

              <Input
                placeholder="Tags (comma separated)"
                value={editingTask.tags}
                onChange={(e) => setEditingTask({ ...editingTask, tags: e.target.value })}
                className="bg-white/70 border-white/30 focus:bg-white"
              />

              {/* Display existing attachments */}
              {editingTask.attachments && editingTask.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-2">CURRENT ATTACHMENTS</h4>
                  <div className="flex flex-wrap gap-2">
                    {editingTask.attachments.map((file: FileWithPreview) => (
                      <div
                        key={file.id}
                        className="relative group flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-md"
                      >
                        {file.preview ? (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="h-6 w-6 object-cover rounded"
                          />
                        ) : (
                          <div className="h-6 w-6 flex items-center justify-center bg-gray-200 rounded">
                            {getFileIcon(file.type)}
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask({
                              ...editingTask,
                              attachments: editingTask.attachments.filter((f: FileWithPreview) => f.id !== file.id)
                            });
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="h-2.5 w-2.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="transform hover:scale-105 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
                >
                  {loading ? 'Updating...' : '💾 Update Task'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskDashboard;