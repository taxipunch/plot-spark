import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Clapperboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Situation } from '../types/plot';
import { SituationCard } from './SituationCard';

interface SituationFeedProps {
    refreshTrigger: number;
    onCardClick: (situation: Situation) => void;
}

const CATEGORIES = ['ALL', 'STARRED', 'DEVELOPED', 'VARIATIONS', 'ROMANCE', 'ADVENTURE', 'HAREM'];

export function SituationFeed({ refreshTrigger, onCardClick }: SituationFeedProps) {
    const [situations, setSituations] = useState<Situation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('ALL');

    useEffect(() => {
        async function fetchSituations() {
            setLoading(true);
            const { data, error } = await supabase
                .from('situations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching situations:', error);
            } else {
                setSituations((data as Situation[]) || []);
            }
            setLoading(false);
        }

        fetchSituations();
    }, [refreshTrigger]);

    function handleCardUpdated(updated: Situation) {
        setSituations(prev => prev.map(s => s.id === updated.id ? updated : s));
    }

    const filtered = situations.filter((s: Situation) => {
        if (activeCategory === 'ALL') return true;
        if (activeCategory === 'STARRED') return s.is_starred;
        if (activeCategory === 'DEVELOPED') return Boolean(s.setting_atmosphere);
        if (activeCategory === 'VARIATIONS') return s.spark_type === 'variation';
        return s.genre?.toUpperCase() === activeCategory || s.tags?.some((t: string) => t.toUpperCase() === activeCategory);
    });

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Filter Bar */}
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
                                    layoutId="activeSituationCategory"
                                    className="absolute inset-0 bg-violet-400 rounded-full -z-10 shadow-sm"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="animate-spin text-violet-400" size={32} />
                </div>
            ) : situations.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-4 text-center mt-20"
                >
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                        <Clapperboard className="text-zinc-300" size={40} />
                    </div>
                    <p className="text-zinc-400 font-medium text-lg">No scenes yet</p>
                    <p className="text-zinc-300 text-sm mt-1">Create a situation or develop a spark to generate scenes</p>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-4 pb-20">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((situation: Situation) => (
                            <SituationCard
                                key={situation.id}
                                situation={situation}
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
