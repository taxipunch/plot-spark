import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, GitBranch } from 'lucide-react';
import { BPlot } from '../types/plot';

interface BPlotCardProps {
    bplot: BPlot;
}

export function BPlotCard({ bplot }: BPlotCardProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <GitBranch size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span className="text-xs font-bold text-indigo-400 tracking-widest">B-PLOT</span>
                </div>
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="text-indigo-300 hover:text-indigo-500 transition-colors"
                >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {bplot.title && (
                <h4 className="text-sm font-bold text-zinc-800 mt-2 mb-1">{bplot.title}</h4>
            )}
            <p className="text-sm text-zinc-600 leading-relaxed">{bplot.content}</p>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 flex flex-col gap-3 pt-3 border-t border-indigo-100">
                            {bplot.independent_stakes && (
                                <div>
                                    <p className="text-xs font-bold text-indigo-400 tracking-widest mb-1">INDEPENDENT STAKES</p>
                                    <p className="text-sm text-zinc-600 leading-relaxed">{bplot.independent_stakes}</p>
                                </div>
                            )}
                            {bplot.cost_to_a_plot && (
                                <div>
                                    <p className="text-xs font-bold text-indigo-400 tracking-widest mb-1">COST TO A-PLOT</p>
                                    <p className="text-sm text-zinc-600 leading-relaxed">{bplot.cost_to_a_plot}</p>
                                </div>
                            )}
                            {bplot.climax_collision && (
                                <div>
                                    <p className="text-xs font-bold text-indigo-400 tracking-widest mb-1">CLIMAX COLLISION</p>
                                    <p className="text-sm text-zinc-600 leading-relaxed">{bplot.climax_collision}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
