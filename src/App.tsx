import React, { useState } from 'react';
import { PlotInput } from './components/PlotInput';
import { PlotFeed } from './components/PlotFeed';
import { LibraryBig } from 'lucide-react';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePlotCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-pink-50 dark:from-indigo-950 dark:via-zinc-950 dark:to-zinc-950 animate-pulse-slow"></div>

      {/* Decorative Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-400/20 dark:bg-pink-600/10 blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      <div className="relative z-10 w-full max-w-2xl px-4 py-8 md:py-16 flex flex-col flex-1">

        <header className="mb-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 mb-6 group hover:scale-105 transition-transform">
            <LibraryBig size={32} className="text-indigo-600 dark:text-indigo-400 group-hover:text-pink-500 transition-colors" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            <span className="gradient-text">Plot Spark</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg max-w-md">
            Capture your creative sparks on the go.
          </p>
        </header>

        <main className="flex-1 w-full flex flex-col">
          <section className="mb-8">
            <PlotInput onPlotCreated={handlePlotCreated} />
          </section>

          <section className="flex-1">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
                Recent Ideas
              </h2>
            </div>
            <PlotFeed refreshTrigger={refreshTrigger} />
          </section>
        </main>

      </div>
    </div>
  );
}

export default App;
