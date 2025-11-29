import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AgentTask, TaskStatus } from '../types';
import { Bot, FileText, Sparkles, Terminal } from 'lucide-react';

interface ContentFeedProps {
  tasks: AgentTask[];
  isThinking: boolean;
}

export const ContentFeed: React.FC<ContentFeedProps> = ({ tasks, isThinking }) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tasks, isThinking]);

  // Only show tasks that have started
  const visibleTasks = tasks.filter(t => t.status !== TaskStatus.PENDING);

  if (visibleTasks.length === 0 && !isThinking) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-white/50 rounded-xl border border-dashed border-gray-200">
        <Sparkles size={48} className="mb-4 text-gray-200" />
        <p className="text-sm">Ready to generate content.</p>
        <p className="text-xs mt-1">Enter a topic to start the agent.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {visibleTasks.map((task) => (
        <div key={task.id} className="group animate-fade-in-up">
          {/* Header for the section */}
          <div className="flex items-center gap-2 mb-2 px-1">
             <div className="p-1.5 bg-gray-100 rounded text-gray-600">
               {task.title.toLowerCase().includes('research') ? <Terminal size={14} /> : 
                task.title.toLowerCase().includes('outline') ? <FileText size={14} /> : <Bot size={14} />}
             </div>
             <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
               {task.status === TaskStatus.IN_PROGRESS ? 'Generating...' : 'Completed'}
             </span>
          </div>

          {/* Card Content */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Title Bar */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{task.title}</h3>
            </div>
            
            {/* Markdown Content */}
            <div className="px-6 py-5 prose prose-sm max-w-none text-gray-700 prose-headings:font-bold prose-headings:text-gray-900 prose-p:leading-relaxed prose-a:text-blue-600">
               {task.resultContent ? (
                 <ReactMarkdown>{task.resultContent}</ReactMarkdown>
               ) : (
                 <div className="flex items-center gap-2 text-gray-400 italic">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Thinking...
                 </div>
               )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Invisible element to scroll to */}
      <div ref={endRef} />
    </div>
  );
};