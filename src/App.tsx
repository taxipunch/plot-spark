import { useState } from 'react';
import { PlotInput } from './components/PlotInput';
import { PlotFeed } from './components/PlotFeed';
import { SparkDetail } from './components/SparkDetail';
import { Search, Bell, Sparkles, Plus, ArrowLeft } from 'lucide-react';
import { PlotIdeaOutput } from './types/plot';

type View = 'feed' | 'create' | 'detail';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentView, setCurrentView] = useState<View>('feed');
  const [selectedSpark, setSelectedSpark] = useState<PlotIdeaOutput | null>(null);

  const handlePlotCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView('feed');
  };

  const handleCardClick = (plot: PlotIdeaOutput) => {
    setSelectedSpark(plot);
    setCurrentView('detail');
  };

  const handleSparkUpdated = (updated: PlotIdeaOutput) => {
    setSelectedSpark(updated);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNavigateToSpark = (spark: PlotIdeaOutput) => {
    setSelectedSpark(spark);
  };

  const handleBack = () => {
    setCurrentView('feed');
    setSelectedSpark(null);
  };

  const headerTitle = currentView === 'feed' ? 'Sparks' : currentView === 'create' ? 'New Spark' : (selectedSpark?.title || 'Spark Detail');

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center bg-beige-50">
      <div className="relative z-10 w-full max-w-md px-4 py-8 flex flex-col flex-1 pb-24 h-screen">

        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {currentView === 'feed' ? (
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Sparkles size={24} className="text-orange-500 fill-orange-500" />
              </div>
            ) : (
              <button
                onClick={handleBack}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-900 hover:bg-zinc-50"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 font-serif truncate max-w-[180px]">
              {headerTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-900 hover:bg-zinc-50 transition-colors">
              <Search size={20} />
            </button>
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-900 hover:bg-zinc-50 transition-colors relative">
              <Bell size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 w-full flex flex-col h-full overflow-y-auto hide-scrollbar">
          {currentView === 'feed' && (
            <PlotFeed refreshTrigger={refreshTrigger} onCardClick={handleCardClick} />
          )}
          {currentView === 'create' && (
            <PlotInput onPlotCreated={handlePlotCreated} />
          )}
          {currentView === 'detail' && selectedSpark && (
            <SparkDetail
              spark={selectedSpark}
              onSparkUpdated={handleSparkUpdated}
              onNavigateToSpark={handleNavigateToSpark}
            />
          )}
        </main>

      </div>

      {/* Floating Action Navigation — hide on detail view */}
      {currentView !== 'detail' && (
        <div className="fixed bottom-6 w-[90%] max-w-sm flex justify-center z-50 pointer-events-none">
          <div className="bg-[#1c1c1c] rounded-full p-2 flex items-center justify-center w-full shadow-2xl pointer-events-auto h-20">
            <button
              onClick={() => setCurrentView(currentView === 'feed' ? 'create' : 'feed')}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-orange-500 text-white"
            >
              <Plus size={32} className={currentView === 'create' ? 'rotate-45 transition-transform' : 'transition-transform'} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
