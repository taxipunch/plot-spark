import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Trope } from '../types/plot';

interface TropeCardProps {
    trope: Trope;
}

const GENRE_STYLES: Record<string, string> = {
    romance: 'bg-orange-50 text-orange-500 border-orange-100',
    adventure: 'bg-violet-50 text-violet-500 border-violet-100',
    both: 'bg-teal-50 text-teal-500 border-teal-100',
};

export function TropeCard({ trope }: TropeCardProps) {
    const [expanded, setExpanded] = useState(false);
    const genreStyle = GENRE_STYLES[trope.genre] ?? GENRE_STYLES.both;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-zinc-100 rounded-2xl p-4"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-bold text-zinc-900">{trope.name}</h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${genreStyle}`}>
                            {trope.genre.toUpperCase()}
                        </span>
                        {trope.dramatic_function && (
                            <span className="text-xs text-zinc-400 font-medium">{trope.dramatic_function}</span>
                        )}
                    </div>
                    <p className={`text-xs text-zinc-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                        {trope.description}
                    </p>
                </div>
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="text-zinc-300 hover:text-zinc-500 transition-colors shrink-0 mt-0.5"
                >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 pt-3 border-t border-zinc-50 flex flex-col gap-3">
                            {trope.signature_beat && (
                                <div>
                                    <p className="text-xs font-bold text-zinc-400 tracking-widest mb-1">SIGNATURE BEAT</p>
                                    <p className="text-xs text-zinc-600 leading-relaxed">{trope.signature_beat}</p>
                                </div>
                            )}
                            {trope.pairs_well_with && trope.pairs_well_with.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-zinc-400 tracking-widest mb-2">PAIRS WITH</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {trope.pairs_well_with.map(name => (
                                            <span
                                                key={name}
                                                className="text-xs font-medium text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-1 rounded-lg"
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
