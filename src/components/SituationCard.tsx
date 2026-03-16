import { useState } from 'react';
import { motion } from 'motion/react';
import { Tag, Clock, Star, ChevronRight, GitFork, CheckCircle, Clapperboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Situation } from '../types/plot';

interface SituationCardProps {
    situation: Situation;
    onClick: (situation: Situation) => void;
    onUpdated?: (updated: Situation) => void;
}

export function SituationCard({ situation, onClick, onUpdated }: SituationCardProps) {
    const [isStarred, setIsStarred] = useState(situation.is_starred ?? false);

    async function handleStarToggle(e: React.MouseEvent) {
        e.stopPropagation();
        const newVal = !isStarred;
        setIsStarred(newVal);
        await supabase.from('situations').update({ is_starred: newVal }).eq('id', situation.id);
        onUpdated?.({ ...situation, is_starred: newVal });
    }

    const isDeveloped = Boolean(situation.setting_atmosphere);
    const isVariation = situation.spark_type === 'variation';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => onClick(situation)}
            className="bg-white/60 backdrop-blur-md border border-violet-100/60 rounded-2xl p-5 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Clapperboard size={14} className="text-violet-400 shrink-0" />
                    {situation.title ? (
                        <h3 className="text-xl font-bold text-zinc-900 group-hover:text-violet-500 transition-colors truncate">
                            {situation.title}
                        </h3>
                    ) : (
                        <span className="text-zinc-400 italic text-sm truncate">Untitled Scene</span>
                    )}
                    {isVariation && (
                        <span className="flex items-center gap-1 text-xs font-bold text-violet-400 bg-violet-50 px-2 py-0.5 rounded-full shrink-0">
                            <GitFork size={10} /> VAR
                        </span>
                    )}
                    {isDeveloped && (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                            <CheckCircle size={10} /> DEV
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
                        <Clock size={12} />
                        {new Date(situation.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                        })}
                    </span>
                    <button
                        onClick={handleStarToggle}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-50 transition-colors"
                    >
                        <Star
                            size={16}
                            className={isStarred ? 'text-violet-400 fill-violet-400' : 'text-zinc-300 group-hover:text-zinc-400 transition-colors'}
                        />
                    </button>
                </div>
            </div>

            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
                {situation.content}
            </p>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-violet-50">
                <div className="flex flex-wrap gap-1.5">
                    {situation.tags && situation.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                            <Tag size={10} />
                            {tag}
                        </span>
                    ))}
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-violet-400 shrink-0">
                    {isDeveloped ? 'VIEW' : 'DEVELOP'} <ChevronRight size={12} />
                </span>
            </div>
        </motion.div>
    );
}
