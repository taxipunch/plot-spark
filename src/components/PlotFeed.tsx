import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlotIdeaOutput } from '../types/plot';
import { PlotCard } from './PlotCard';

interface PlotFeedProps {
    refreshTrigger: number;
    onCardClick: (plot: PlotIdeaOutput) => void;
}

const CATEGORIES = ['ALL', 'STARRED', 'DEVELOPED', 'VARIATIONS', 'ROMANCE', 'ADVENTURE', 'FANTASY', 'SCI-FI', 'MYSTERY'];

export function PlotFeed({ refreshTrigger, onCardClick }: PlotFeedProps) {
    const [plots, setPlots] = useState<PlotIdeaOutput[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('ALL');

    useEffect(() => {
        async function fetchPlots() {
            setLoading(true);
            const { data, error } = await supabase
                .from('plots')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching plots:', error);
            } else {
                setPlots((data as PlotIdeaOutput[]) || []);
            }
            setLoading(false);
        }

        fetchPlots();
    }, [refreshTrigger]);

    function handleCardUpdated(updated: PlotIdeaOutput) {
        setPlots(prev => prev.map(p => p.id === updated.id ? updated : p));
    }

    const filteredPlots = plots.filter((plot: PlotIdeaOutput) => {
        if (activeCategory === 'ALL') return true;
        if (activeCategory === 'STARRED') return plot.is_starred;
        if (activeCategory === 'DEVELOPED') return Boolean(plot.logline);
        if (activeCategory === 'VARIATIONS') return plot.spark_type === 'variation';
        return plot.tags?.some((tag: string) => tag.toUpperCase() === activeCategory);
    });

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Horizontal Filter Bar */}
            <div className="w-full bg-white rounded-full shadow-sm mb-6 px-1 py-1 sticky top-0 z-10">
              <div className="flex items-center overflow-x-auto hide-scrollbar gap-1 relative">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`relative px-5 py-2.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-colors z-10 ${
                      activeCategory === category 
                        ? 'text-white' 
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    {activeCategory === category && (
                      <motion.div 
                        layoutId="activeCategory"
                        className="absolute inset-0 bg-orange-400 rounded-full -z-10 shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="animate-spin text-orange-400" size={32} />
                </div>
            ) : plots.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-4 text-center mt-20"
                >
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                        <Sparkles className="text-zinc-300" size={40} />
                    </div>
                    <p className="text-zinc-400 font-medium text-lg">
                        No sparks found
                    </p>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-4 pb-20">
                    <AnimatePresence mode="popLayout">
                        {filteredPlots.map((plot: PlotIdeaOutput) => (
                            <PlotCard
                                key={plot.id}
                                plot={plot}
                                onClick={onCardClick}
                                onUpdated={handleCardUpdated}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
