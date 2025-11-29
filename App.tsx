import React, { useState } from 'react';
import { AgentTask, AppState, TaskStatus } from './types';
import { generatePlan, executeStepStream } from './geminiService';
import { PlanList } from './components/PlanList';
import { ContentFeed } from './components/ContentFeed';
import { Send, StopCircle, Bot, Sparkles, Command } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('How to transition into an AI career in 2025');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleStart = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setAppState(AppState.PLANNING);
    setTasks([]);
    setCurrentTaskId(null);

    try {
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
      
      await executeTasks(newTasks);
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
      setAppState(AppState.IDLE);
    }
  };

  const executeTasks = async (initialTasks: AgentTask[]) => {
    let currentTasks = [...initialTasks];

    for (let i = 0; i < currentTasks.length; i++) {
      const task = currentTasks[i];
      setCurrentTaskId(task.id);

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.IN_PROGRESS } : t));
      
      try {
        const stream = await executeStepStream(task, currentTasks, prompt);
        let accumulatedText = "";
        
        for await (const chunk of stream) {
            const c = chunk as GenerateContentResponse;
            const textPart = c.text;
            if (textPart) {
                accumulatedText += textPart;
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, resultContent: accumulatedText } : t));
            }
        }

        setTasks(prev => {
            const updated = prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.COMPLETED, resultContent: accumulatedText } : t);
            currentTasks = updated;
            return updated;
        });

      } catch (e) {
        console.error("Task failed", e);
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.FAILED } : t));
        break;
      }
    }

    setAppState(AppState.FINISHED);
    setCurrentTaskId(null);
  };

  const handleStop = () => {
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-900 font-sans selection:bg-blue-100">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 h-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Bot size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Gemini Agent</h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Workflow Automation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {appState !== AppState.IDLE && (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                  {appState === AppState.PLANNING && <span className="animate-pulse">Planning...</span>}
                  {appState === AppState.EXECUTING && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Executing</span>}
                  {appState === AppState.FINISHED && <span className="text-green-600">Finished</span>}
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: Controls & Plan */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 sticky top-24 max-h-[calc(100vh-8rem)]">
            
            {/* Input Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <Command size={16} className="text-gray-400" />
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Project Goal
                  </label>
                </div>
                
                <textarea 
                  className="w-full text-sm p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-gray-400"
                  rows={4}
                  placeholder="Describe what you want to research or write..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={appState === AppState.EXECUTING || appState === AppState.PLANNING}
                />
                
                <div className="mt-4">
                   {appState === AppState.IDLE || appState === AppState.FINISHED ? (
                     <button 
                       onClick={handleStart}
                       disabled={!prompt.trim()}
                       className="w-full bg-black hover:bg-gray-800 text-white text-sm font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.98]"
                     >
                       <Sparkles size={16} />
                       Start Workflow
                     </button>
                   ) : (
                     <button 
                       onClick={handleStop}
                       className="w-full bg-white border-2 border-red-100 hover:border-red-200 hover:bg-red-50 text-red-600 text-sm font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                     >
                       <StopCircle size={16} />
                       Stop Agent
                     </button>
                   )}
                </div>
            </div>

            {/* Plan List Container */}
            <div className="flex-1 min-h-[400px]">
                <PlanList tasks={tasks} currentTaskId={currentTaskId} />
            </div>
            
            {/* Error Toast */}
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                <strong>Error:</strong> {error}
              </div>
            )}
        </aside>

        {/* Right Main Content */}
        <section className="lg:col-span-8 xl:col-span-9 min-h-[500px]">
           <ContentFeed tasks={tasks} isThinking={appState === AppState.PLANNING} />
        </section>

      </main>
    </div>
  );
};

export default App;
