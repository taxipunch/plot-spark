import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlotIdeaOutput } from '../types/plot';
import { PlotCard } from './PlotCard';

interface PlotFeedProps {
    refreshTrigger: number;
}

export function PlotFeed({ refreshTrigger }: PlotFeedProps) {
    const [plots, setPlots] = useState<PlotIdeaOutput[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-indigo-500 z-10" size={32} />
            </div>
        );
    }

    if (plots.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 px-4 text-center"
            >
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-full mb-4">
                    <PlusCircle className="text-indigo-400 dark:text-indigo-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                    No plots yet
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
                    Your creative sparks will appear here once you save your first plot idea.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col gap-4 mt-8">
            <AnimatePresence mode="popLayout">
                {plots.map((plot) => (
                    <PlotCard key={plot.id} plot={plot} />
                ))}
            </AnimatePresence>
        </div>
    );
}
