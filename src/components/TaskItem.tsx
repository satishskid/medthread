import React from 'react';
import { Task } from '../store/useStore';
import { CheckIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface TaskItemProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'routine':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'emergent':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'urgent':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <CheckIcon className="h-4 w-4" />;
    }
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    onUpdate({ 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : undefined
    });
  };

  return (
    <div className={`border rounded-lg p-3 ${getUrgencyColor(task.urgency)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {getUrgencyIcon(task.urgency)}
            <h4 className="font-medium text-sm">{task.title}</h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              task.urgency === 'emergent' ? 'bg-red-100 text-red-800' :
              task.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {task.urgency}
            </span>
          </div>
          
          {task.description && (
            <p className="text-xs opacity-75 mb-2">{task.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-xs opacity-50">
              Created: {task.createdAt.toLocaleDateString()}
              {task.completedAt && (
                <span className="ml-2">
                  Completed: {task.completedAt.toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="ml-3">
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
            className="select select-xs border-0 bg-transparent focus:bg-white"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      {task.assignedTo && (
        <div className="mt-2 text-xs">
          <span className="opacity-75">Assigned to:</span> {task.assignedTo}
        </div>
      )}
    </div>
  );
};