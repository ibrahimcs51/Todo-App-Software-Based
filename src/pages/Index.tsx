
import { useState, useEffect } from 'react';
import { TaskProvider } from '@/contexts/TaskContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import TodoApp from '@/components/TodoApp';

const Index = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <TodoApp />
          </div>
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Index;
