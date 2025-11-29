import React, { useState, useCallback } from 'react';
import { AgentTask, AppState, TaskStatus } from './types';
import { generatePlan, executeStepStream } from './geminiService';
import { PlanList } from './components/PlanList';
import { ContentFeed } from './components/ContentFeed';
import { Send, StopCircle, RefreshCw, LayoutTemplate } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('How to transition into an AI career in 2025');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper to generate unique IDs
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleStart = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setAppState(AppState.PLANNING);
    setTasks([]);
    setCurrentTaskId(null);

    try {
      // 1. Generate Plan
      const plan = await generatePlan(prompt);
      
      const newTasks: AgentTask[] = plan.tasks.map(t => ({
        id: generateId(),
        title: t.title,
        description: t.description,
        status: TaskStatus.PENDING,
        resultContent: ''
      }));

      setTasks(newTasks);
      setAppState(AppState.EXECUTING);
      
      // 2. Start Execution Loop
      await executeTasks(newTasks);
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setAppState(AppState.IDLE);
    }
  };

  const executeTasks = async (initialTasks: AgentTask[]) => {
    // We work with a local copy for the loop, but update state for UI
    let currentTasks = [...initialTasks];

    for (let i = 0; i < currentTasks.length; i++) {
      const task = currentTasks[i];
      setCurrentTaskId(task.id);

      // Update task status to IN_PROGRESS
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.IN_PROGRESS } : t));
      
      try {
        // Stream the execution
        const stream = await executeStepStream(task, currentTasks, prompt);
        
        let accumulatedText = "";
        
        for await (const chunk of stream) {
            const c = chunk as GenerateContentResponse;
            const textPart = c.text;
            if (textPart) {
                accumulatedText += textPart;
                // Update state incrementally for streaming effect
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, resultContent: accumulatedText } : t));
            }
        }

        // Mark as COMPLETED
        setTasks(prev => {
            const updated = prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.COMPLETED, resultContent: accumulatedText } : t);
            currentTasks = updated; // Update local ref for next iteration context
            return updated;
        });

      } catch (e) {
        console.error("Task failed", e);
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.FAILED } : t));
        break; // Stop execution on failure
      }
    }

    setAppState(AppState.FINISHED);
    setCurrentTaskId(null);
  };

  const handleStop = () => {
    // simple reload to reset for this demo, in prod we would use AbortController
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-slate-900">
      
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-lg">
              <LayoutTemplate size={20} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">AgentWriter</h1>
          </div>
          <div className="flex items-center gap-4">
             {appState === AppState.FINISHED && (
                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                   All Tasks Completed
                </span>
             )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Plan & Status */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 h-[calc(100vh-7rem)] sticky top-24">
            
            {/* Input Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Topic / Request
                </label>
                <textarea 
                  className="w-full text-sm p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-black focus:ring-0 outline-none resize-none transition-colors"
                  rows={3}
                  placeholder="e.g., A comprehensive guide to starting a coffee shop..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={appState === AppState.EXECUTING || appState === AppState.PLANNING}
                />
                
                <div className="mt-3 flex gap-2">
                   {appState === AppState.IDLE || appState === AppState.FINISHED ? (
                     <button 
                       onClick={handleStart}
                       disabled={!prompt.trim()}
                       className="flex-1 bg-black text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       <Send size={16} />
                       Start Agent
                     </button>
                   ) : (
                     <button 
                       onClick={handleStop}
                       className="flex-1 bg-red-50 text-red-600 border border-red-100 text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                     >
                       <StopCircle size={16} />
                       Stop
                     </button>
                   )}
                </div>
            </div>

            {/* Plan List */}
            {tasks.length > 0 && (
                <div className="flex-1 min-h-0">
                    <PlanList tasks={tasks} currentTaskId={currentTaskId} />
                </div>
            )}
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}
        </aside>

        {/* Right Column: Content Output */}
        <section className="lg:col-span-8 xl:col-span-9 h-full">
           <ContentFeed tasks={tasks} isThinking={appState === AppState.PLANNING} />
           
           {/* Bottom Floating Action Bar (Mobile only or specific controls) */}
           {appState === AppState.EXECUTING && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-3 lg:hidden">
                 <RefreshCw className="animate-spin" size={18} />
                 <span className="text-sm font-medium">Agent is working...</span>
              </div>
           )}
        </section>

      </main>
    </div>
  );
};

export default App;