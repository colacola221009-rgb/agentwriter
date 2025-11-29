import React, { useEffect, useRef } from 'react';
import { AgentTask, TaskStatus } from '../types';
import { Check, Circle, Loader2, ArrowRight } from 'lucide-react';

interface PlanListProps {
  tasks: AgentTask[];
  currentTaskId: string | null;
}

export const PlanList: React.FC<PlanListProps> = ({ tasks, currentTaskId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the active task
  useEffect(() => {
    if (currentTaskId && scrollRef.current) {
        // Simple logic to keep view centered if list is long
    }
  }, [currentTaskId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 bg-black rounded-full"></span>
          Execution Plan
        </h2>
        <span className="text-xs text-gray-400 font-mono">
           {tasks.filter(t => t.status === TaskStatus.COMPLETED).length} / {tasks.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2" ref={scrollRef}>
        {tasks.map((task) => {
          const isPending = task.status === TaskStatus.PENDING;
          const isInProgress = task.status === TaskStatus.IN_PROGRESS;
          const isCompleted = task.status === TaskStatus.COMPLETED;
          const isActive = task.id === currentTaskId;

          return (
            <div 
              key={task.id}
              className={`
                relative p-3 rounded-lg transition-all duration-300 border
                ${isActive ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-transparent hover:bg-gray-50'}
                ${isCompleted ? 'opacity-70' : 'opacity-100'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isCompleted && (
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                  {isInProgress && (
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center animate-spin-slow">
                      <Loader2 size={12} className="text-blue-600 animate-spin" />
                    </div>
                  )}
                  {isPending && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className={`text-sm font-medium leading-tight ${isCompleted ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-800'}`}>
                    {task.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};