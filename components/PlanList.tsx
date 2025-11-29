import React, { useEffect, useRef } from 'react';
import { AgentTask, TaskStatus } from '../types';
import { Check, Loader2, Circle, Clock, ArrowDown } from 'lucide-react';

interface PlanListProps {
  tasks: AgentTask[];
  currentTaskId: string | null;
}

export const PlanList: React.FC<PlanListProps> = ({ tasks, currentTaskId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTaskId && scrollRef.current) {
        // Optional: scroll logic
    }
  }, [currentTaskId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-semibold text-gray-800 flex items-center justify-between">
          <span>Workflow Steps</span>
          <span className="text-xs font-normal text-gray-500 bg-gray-200/50 px-2 py-1 rounded-full">
             {tasks.filter(t => t.status === TaskStatus.COMPLETED).length} / {tasks.length} Done
          </span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-0" ref={scrollRef}>
        {tasks.map((task, index) => {
          const isPending = task.status === TaskStatus.PENDING;
          const isInProgress = task.status === TaskStatus.IN_PROGRESS;
          const isCompleted = task.status === TaskStatus.COMPLETED;
          const isFailed = task.status === TaskStatus.FAILED;
          const isLast = index === tasks.length - 1;

          return (
            <div key={task.id} className="relative pl-2">
              {/* Connector Line */}
              {!isLast && (
                <div className="absolute left-[19px] top-8 bottom-[-16px] w-0.5 bg-gray-100 z-0"></div>
              )}

              <div className={`relative flex items-start gap-4 p-3 rounded-lg transition-all duration-300 z-10 ${isInProgress ? 'bg-blue-50/60 ring-1 ring-blue-100' : 'hover:bg-gray-50'}`}>
                
                {/* Icon Marker */}
                <div className="shrink-0 mt-0.5 relative bg-white">
                  {isCompleted && (
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                  {isInProgress && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm ring-4 ring-blue-50">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  )}
                  {isPending && (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center">
                      <Circle size={8} className="fill-gray-100 text-transparent" />
                    </div>
                  )}
                  {isFailed && (
                     <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                       <span className="font-bold text-xs">!</span>
                     </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium leading-tight ${isCompleted ? 'text-gray-900' : 'text-gray-700'}`}>
                    {task.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {task.description}
                  </p>
                  
                  {isInProgress && (
                     <div className="mt-2 text-xs font-medium text-blue-600 flex items-center gap-1.5 animate-pulse">
                        Working on it...
                     </div>
                  )}
                </div>
              </div>
              
              {/* Spacer for connector line continuity visual */}
              {!isLast && <div className="h-2"></div>}
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="text-center py-10 px-4 text-gray-400">
             <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 mx-auto flex items-center justify-center mb-3">
               <Clock size={20} className="text-gray-300" />
             </div>
             <p className="text-sm">Tasks will appear here once you start.</p>
          </div>
        )}
      </div>
    </div>
  );
};
