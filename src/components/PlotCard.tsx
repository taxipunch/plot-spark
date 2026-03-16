import React from 'react';
import { motion } from 'motion/react';
import { Tag, Clock, FileText } from 'lucide-react';
import { PlotIdeaOutput } from '../types/plot';

interface PlotCardProps {
    plot: PlotIdeaOutput;
}

export function PlotCard({ plot }: PlotCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-5 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 group"
        >
            <div className="flex justify-between items-start mb-3">
                {plot.title ? (
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {plot.title}
                    </h3>
                ) : (
                    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 italic">
                        <FileText size={16} />
                        <span>Untitled Spark</span>
                    </div>
                )}

                <span className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
                    <Clock size={12} />
                    {new Date(plot.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
            </div>

            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {plot.content}
            </p>

            {plot.tags && plot.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                    {plot.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded-md">
                            <Tag size={10} />
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
