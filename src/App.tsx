import { useState } from 'react';
import { PlotInput } from './components/PlotInput';
import { PlotFeed } from './components/PlotFeed';
import { SparkDetail } from './components/SparkDetail';
import { SituationFeed } from './components/SituationFeed';
import { SituationInput } from './components/SituationInput';
import { SituationDetail } from './components/SituationDetail';
import { Search, Bell, Plus, ArrowLeft, Zap, Clapperboard, BookOpen } from 'lucide-react';
import { PlotIdeaOutput, Situation } from './types/plot';
import { TropeLibraryDrawer } from './components/TropeLibraryDrawer';

type View = 'feed' | 'create' | 'detail';
type Mode = 'sparks' | 'situations';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tropeDrawerOpen, setTropeDrawerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('feed');
  const [mode, setMode] = useState<Mode>('sparks');
  const [selectedSpark, setSelectedSpark] = useState<PlotIdeaOutput | null>(null);
  const [selectedSituation, setSelectedSituation] = useState<Situation | null>(null);

  const handlePlotCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView('feed');
  };

  const handleSituationCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView('feed');
  };

  const handleCardClick = (plot: PlotIdeaOutput) => {
    setSelectedSpark(plot);
    setCurrentView('detail');
  };

  const handleSituationClick = (situation: Situation) => {
    setSelectedSituation(situation);
    setCurrentView('detail');
  };

  const handleSparkUpdated = (updated: PlotIdeaOutput) => {
    setSelectedSpark(updated);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSituationUpdated = (updated: Situation) => {
    setSelectedSituation(updated);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNavigateToSpark = (spark: PlotIdeaOutput) => {
    setSelectedSpark(spark);
  };

  const handleNavigateToSituation = (situation: Situation) => {
    setMode('situations');
    setSelectedSituation(situation);
    setCurrentView('detail');
  };

  const handleBack = () => {
    setCurrentView('feed');
    setSelectedSpark(null);
    setSelectedSituation(null);
  };

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    setCurrentView('feed');
    setSelectedSpark(null);
    setSelectedSituation(null);
  };

  const isDetail = currentView === 'detail';
  const detailTitle = mode === 'sparks'
    ? (selectedSpark?.title || 'Spark Detail')
    : (selectedSituation?.title || 'Scene Detail');

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center bg-beige-50">
      <div className="relative z-10 w-full max-w-md px-4 py-8 flex flex-col flex-1 pb-24 h-screen">

        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isDetail ? (
              <>
                <button
                  onClick={handleBack}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-900 hover:bg-zinc-50"
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 font-serif truncate max-w-[180px]">
                  {detailTitle}
                </h1>
              </>
            ) : (
              /* Mode toggle pill */
              <div className="bg-white rounded-full shadow-sm p-1 flex items-center gap-1">
                <button
                  onClick={() => handleModeSwitch('sparks')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                    mode === 'sparks'
                      ? 'bg-orange-400 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  <Zap size={12} /> SPARKS
                </button>
                <button
                  onClick={() => handleModeSwitch('situations')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                    mode === 'situations'
                      ? 'bg-violet-400 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  <Clapperboard size={12} /> SCENES
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTropeDrawerOpen(true)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              <BookOpen size={20} />
            </button>
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-900 hover:bg-zinc-50 transition-colors">
              <Search size={20} />
            </button>
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-900 hover:bg-zinc-50 transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 w-full flex flex-col h-full overflow-y-auto hide-scrollbar">
          {currentView === 'feed' && mode === 'sparks' && (
            <PlotFeed refreshTrigger={refreshTrigger} onCardClick={handleCardClick} />
          )}
          {currentView === 'feed' && mode === 'situations' && (
            <SituationFeed refreshTrigger={refreshTrigger} onCardClick={handleSituationClick} />
          )}
          {currentView === 'create' && mode === 'sparks' && (
            <PlotInput onPlotCreated={handlePlotCreated} />
          )}
          {currentView === 'create' && mode === 'situations' && (
            <SituationInput onSituationCreated={handleSituationCreated} />
          )}
          {currentView === 'detail' && mode === 'sparks' && selectedSpark && (
            <SparkDetail
              spark={selectedSpark}
              onSparkUpdated={handleSparkUpdated}
              onNavigateToSpark={handleNavigateToSpark}
              onNavigateToSituation={handleNavigateToSituation}
            />
          )}
          {currentView === 'detail' && mode === 'situations' && selectedSituation && (
            <SituationDetail
              situation={selectedSituation}
              onSituationUpdated={handleSituationUpdated}
            />
          )}
        </main>

      </div>

      <TropeLibraryDrawer open={tropeDrawerOpen} onClose={() => setTropeDrawerOpen(false)} />

      {/* FAB — hidden on detail view */}
      {!isDetail && (
        <div className="fixed bottom-6 w-[90%] max-w-sm flex justify-center z-50 pointer-events-none">
          <div className="bg-[#1c1c1c] rounded-full p-2 flex items-center justify-center w-full shadow-2xl pointer-events-auto h-20">
            <button
              onClick={() => setCurrentView(currentView === 'feed' ? 'create' : 'feed')}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all text-white ${
                mode === 'situations' ? 'bg-violet-400' : 'bg-orange-500'
              }`}
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
