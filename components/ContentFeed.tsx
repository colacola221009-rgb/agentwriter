import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AgentTask, TaskStatus } from '../types';
import { Bot, FileText, CheckCircle2, Loader2, Sparkles, BookOpen, PenTool, Layout } from 'lucide-react';

interface ContentFeedProps {
  tasks: AgentTask[];
  isThinking: boolean;
}

export const ContentFeed: React.FC<ContentFeedProps> = ({ tasks, isThinking }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tasks, isThinking]);

  // Only show tasks that have started or are planning
  const visibleTasks = tasks.filter(t => t.status !== TaskStatus.PENDING);

  // Helper to get icon based on task title
  const getTaskIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('research')) return <BookOpen size={18} />;
    if (t.includes('write') || t.includes('draft')) return <PenTool size={18} />;
    if (t.includes('outline') || t.includes('brief')) return <Layout size={18} />;
    return <Bot size={18} />;
  };

  if (visibleTasks.length === 0 && !isThinking) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 relative">
             <Sparkles size={32} className="text-blue-500" />
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Agent Awaiting Instructions</h3>
        <p className="text-gray-500 max-w-sm mx-auto mb-6">
          Enter a topic on the left to start. The agent will decompose your request into a research plan and execute it step-by-step.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Planning Phase Loading State */}
      {isThinking && visibleTasks.length === 0 && (
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 rounded-full bg-gray-200"></div>
               <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="space-y-3">
               <div className="h-3 bg-gray-100 rounded w-3/4"></div>
               <div className="h-3 bg-gray-100 rounded w-full"></div>
               <div className="h-3 bg-gray-100 rounded w-5/6"></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
               <Loader2 size={14} className="animate-spin" />
               <span>Analyzing request and building workflow...</span>
            </div>
         </div>
      )}

      {visibleTasks.map((task) => {
        const isCompleted = task.status === TaskStatus.COMPLETED;
        const isInProgress = task.status === TaskStatus.IN_PROGRESS;

        return (
          <div key={task.id} className="group animate-fade-in-up">
            
            {/* Step Header */}
            <div className="flex items-center gap-3 mb-3 pl-1">
               <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                 {getTaskIcon(task.title)}
               </div>
               <div className="flex-1">
                 <h3 className="text-base font-semibold text-gray-900 leading-none">
                    {task.title}
                 </h3>
                 <span className="text-xs text-gray-500 mt-1 inline-block">
                    {isCompleted ? 'Completed' : 'Processing...'}
                 </span>
               </div>
               {isCompleted && <CheckCircle2 size={18} className="text-green-500" />}
            </div>

            {/* Content Card */}
            <div className={`bg-white rounded-2xl border transition-all duration-500 overflow-hidden shadow-sm ${isInProgress ? 'border-blue-200 shadow-blue-50 ring-4 ring-blue-50/50' : 'border-gray-200'}`}>
              
              <div className="px-6 py-6 prose prose-slate max-w-none 
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900
                prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-4
                prose-p:leading-relaxed prose-p:text-gray-600
                prose-li:text-gray-600 prose-strong:text-gray-800
                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-4
                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-4
                prose-blockquote:border-l-4 prose-blockquote:border-blue-200 prose-blockquote:bg-blue-50/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r
                ">
                 {task.resultContent ? (
                   <ReactMarkdown>{task.resultContent}</ReactMarkdown>
                 ) : (
                   <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-60">
                      <Loader2 size={24} className="animate-spin text-blue-500" />
                      <p className="text-sm font-medium text-gray-500">Generating content...</p>
                   </div>
                 )}
              </div>
              
              {/* Footer status for task */}
              <div className="bg-gray-50 px-6 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-mono uppercase tracking-wider">
                 <span>ID: {task.id.substring(0,6)}</span>
                 <span>{task.resultContent?.length || 0} chars</span>
              </div>
            </div>
          </div>
        );
      })}
      
      <div ref={endRef} className="h-8" />
    </div>
  );
};
