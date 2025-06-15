
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from './AuthForm';
import TaskDashboard from './TaskDashboard';
import { Skeleton } from '@/components/ui/skeleton';

const TodoApp = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return <TaskDashboard />;
};

export default TodoApp;
