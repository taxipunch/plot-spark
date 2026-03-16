import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Loader2, GitFork, Zap, ChevronRight, GitBranch } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlotIdeaOutput, BPlot } from '../types/plot';
import { generateVariations, developSpark, generateBPlot } from '../lib/gemini';
import { BPlotCard } from './BPlotCard';

interface SparkDetailProps {
    spark: PlotIdeaOutput;
    onSparkUpdated: (updated: PlotIdeaOutput) => void;
    onNavigateToSpark: (spark: PlotIdeaOutput) => void;
}

type LoadingState = 'idle' | 'variations' | 'developing' | 'bplot';

function getGenre(spark: PlotIdeaOutput): string {
    if (spark.genre) return spark.genre;
    const genreTag = spark.tags?.find(t =>
        ['ROMANCE', 'ADVENTURE', 'FANTASY', 'SCI-FI', 'MYSTERY'].includes(t.toUpperCase())
    );
    return genreTag || 'ROMANCE';
}

export function SparkDetail({ spark, onSparkUpdated, onNavigateToSpark }: SparkDetailProps) {
    const [localSpark, setLocalSpark] = useState<PlotIdeaOutput>(spark);
    const [variations, setVariations] = useState<PlotIdeaOutput[]>([]);
    const [bplots, setBplots] = useState<BPlot[]>([]);
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [developingVariationId, setDevelopingVariationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const genre = getGenre(localSpark);
    const isDeveloped = Boolean(localSpark.logline);

    // Load existing variations and b-plots on mount
    useEffect(() => {
        async function loadRelated() {
            // Load variations (child sparks)
            const { data: varData } = await supabase
                .from('plots')
                .select('*')
                .eq('parent_spark_id', localSpark.id)
                .order('created_at', { ascending: true });
            if (varData) setVariations(varData as PlotIdeaOutput[]);

            // Load associated b-plots
            const { data: assocData } = await supabase
                .from('spark_bplot_associations')
                .select('bplot_id')
                .eq('spark_id', localSpark.id);

            if (assocData && assocData.length > 0) {
                const ids = assocData.map((r: { bplot_id: string }) => r.bplot_id);
                const { data: bplotData } = await supabase
                    .from('b_plots')
                    .select('*')
                    .in('id', ids);
                if (bplotData) setBplots(bplotData as BPlot[]);
            }
        }
        loadRelated();
    }, [localSpark.id]);

    async function handleStarToggle() {
        const newVal = !localSpark.is_starred;
        const updated = { ...localSpark, is_starred: newVal };
        setLocalSpark(updated);
        onSparkUpdated(updated);
        await supabase.from('plots').update({ is_starred: newVal }).eq('id', localSpark.id);
    }

    async function handleGenerateVariations() {
        setError(null);
        setLoadingState('variations');
        try {
            const varTexts = await generateVariations(localSpark.content, genre);
            const rows = varTexts.map(content => ({
                content,
                title: null,
                tags: localSpark.tags || [],
                genre,
                status: 'draft',
                spark_type: 'variation',
                parent_spark_id: localSpark.id,
            }));
            const { data, error: insertErr } = await supabase
                .from('plots')
                .insert(rows)
                .select();
            if (insertErr) throw insertErr;
            if (data) setVariations(data as PlotIdeaOutput[]);
        } catch (e) {
            setError('Failed to generate variations. Check your Gemini API key.');
            console.error(e);
        } finally {
            setLoadingState('idle');
        }
    }

    async function handleDevelopSpark(targetSpark: PlotIdeaOutput, onDone?: (updated: PlotIdeaOutput) => void) {
        setError(null);
        if (targetSpark.id === localSpark.id) {
            setLoadingState('developing');
        } else {
            setDevelopingVariationId(targetSpark.id);
        }
        try {
            const result = await developSpark(targetSpark.content, genre);
            const { data, error: updateErr } = await supabase
                .from('plots')
                .update(result)
                .eq('id', targetSpark.id)
                .select()
                .single();
            if (updateErr) throw updateErr;
            if (data) {
                const updated = data as PlotIdeaOutput;
                if (targetSpark.id === localSpark.id) {
                    setLocalSpark(updated);
                    onSparkUpdated(updated);
                } else {
                    setVariations(prev => prev.map(v => v.id === updated.id ? updated : v));
                    onDone?.(updated);
                }
            }
        } catch (e) {
            setError('Failed to develop spark. Check your Gemini API key.');
            console.error(e);
        } finally {
            setLoadingState('idle');
            setDevelopingVariationId(null);
        }
    }

    async function handleGenerateBPlot() {
        setError(null);
        setLoadingState('bplot');
        try {
            const result = await generateBPlot(localSpark.content, genre);
            const { data: bplotRow, error: insertErr } = await supabase
                .from('b_plots')
                .insert({ ...result, genre, tags: [] })
                .select()
                .single();
            if (insertErr) throw insertErr;
            if (bplotRow) {
                await supabase.from('spark_bplot_associations').insert({
                    spark_id: localSpark.id,
                    bplot_id: bplotRow.id,
                });
                setBplots(prev => [...prev, bplotRow as BPlot]);
            }
        } catch (e) {
            setError('Failed to generate B-plot. Check your Gemini API key.');
            console.error(e);
        } finally {
            setLoadingState('idle');
        }
    }

    const isLoading = loadingState !== 'idle';

    return (
        <div className="bg-white rounded-t-[2.5rem] p-6 pb-28 shadow-sm flex flex-col gap-6 overflow-y-auto hide-scrollbar h-full">

            {/* Header: genre + star */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 tracking-widest">{genre}</span>
                    {localSpark.spark_type === 'variation' && (
                        <span className="text-xs font-bold text-orange-400 tracking-widest bg-orange-50 px-2 py-0.5 rounded-full">VARIATION</span>
                    )}
                </div>
                <button
                    onClick={handleStarToggle}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-50 transition-colors"
                >
                    <Star
                        size={20}
                        className={localSpark.is_starred ? 'text-orange-400 fill-orange-400' : 'text-zinc-300'}
                    />
                </button>
            </div>

            {/* Title */}
            {localSpark.title && (
                <h2 className="text-2xl font-extrabold text-zinc-900 font-serif leading-tight">
                    {localSpark.title}
                </h2>
            )}

            {/* The Spark */}
            <div>
                <p className="text-xs font-bold text-zinc-400 tracking-widest mb-2">THE SPARK</p>
                <p className="text-zinc-700 leading-relaxed">{localSpark.content}</p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* ── Developed Premise ── */}
            <AnimatePresence>
                {isDeveloped && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-4 bg-zinc-50 rounded-2xl p-5"
                    >
                        <p className="text-xs font-bold text-zinc-400 tracking-widest">FULL PREMISE</p>

                        {localSpark.logline && (
                            <div>
                                <p className="text-xs font-bold text-orange-400 tracking-widest mb-1">LOGLINE</p>
                                <p className="text-sm text-zinc-700 leading-relaxed">{localSpark.logline}</p>
                            </div>
                        )}
                        {localSpark.core_tension && (
                            <div>
                                <p className="text-xs font-bold text-orange-400 tracking-widest mb-1">CORE TENSION</p>
                                <p className="text-sm text-zinc-700 leading-relaxed">{localSpark.core_tension}</p>
                            </div>
                        )}
                        {localSpark.hook && (
                            <div>
                                <p className="text-xs font-bold text-orange-400 tracking-widest mb-1">THE HOOK</p>
                                <p className="text-sm text-zinc-700 leading-relaxed">{localSpark.hook}</p>
                            </div>
                        )}
                        {localSpark.central_twist && (
                            <div>
                                <p className="text-xs font-bold text-orange-400 tracking-widest mb-1">CENTRAL TWIST</p>
                                <p className="text-sm text-zinc-700 leading-relaxed">{localSpark.central_twist}</p>
                            </div>
                        )}
                        {localSpark.beat_arc && (
                            <div>
                                <p className="text-xs font-bold text-orange-400 tracking-widest mb-2">3-BEAT ARC</p>
                                <div className="flex flex-col gap-2">
                                    {(['beat1', 'beat2', 'beat3'] as const).map((key, i) => (
                                        <div key={key} className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <p className="text-sm text-zinc-700 leading-relaxed">{localSpark.beat_arc![key]}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Action Buttons ── */}
            <div className="flex flex-col gap-3">
                {/* Develop directly (if not yet developed, and no variations OR is a variation itself) */}
                {!isDeveloped && (
                    <button
                        onClick={() => handleDevelopSpark(localSpark)}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 w-full bg-orange-400 hover:bg-orange-500 disabled:opacity-50 text-white py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors shadow-sm"
                    >
                        {loadingState === 'developing' ? (
                            <><Loader2 size={16} className="animate-spin" /> DEVELOPING...</>
                        ) : (
                            <><Zap size={16} /> DEVELOP <ChevronRight size={16} /></>
                        )}
                    </button>
                )}

                {/* Generate Variations (only for originals that aren't yet developed) */}
                {localSpark.spark_type !== 'variation' && (
                    <button
                        onClick={handleGenerateVariations}
                        disabled={isLoading || variations.length > 0}
                        className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors"
                    >
                        {loadingState === 'variations' ? (
                            <><Loader2 size={16} className="animate-spin" /> GENERATING...</>
                        ) : variations.length > 0 ? (
                            <><GitFork size={16} /> {variations.length} VARIATIONS GENERATED</>
                        ) : (
                            <><GitFork size={16} /> GENERATE VARIATIONS <ChevronRight size={16} /></>
                        )}
                    </button>
                )}
            </div>

            {/* ── Variations ── */}
            <AnimatePresence>
                {variations.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-3"
                    >
                        <p className="text-xs font-bold text-zinc-400 tracking-widest">VARIATIONS</p>
                        {variations.map((v, i) => (
                            <motion.div
                                key={v.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-zinc-50 rounded-2xl p-4 flex flex-col gap-3"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-500 text-xs font-bold flex items-center justify-center shrink-0">
                                        {i + 1}
                                    </span>
                                    {v.logline && (
                                        <span className="text-xs font-bold text-green-500 tracking-widest">DEVELOPED</span>
                                    )}
                                </div>
                                <p className="text-sm text-zinc-700 leading-relaxed">{v.content}</p>
                                <div className="flex gap-2">
                                    {!v.logline ? (
                                        <button
                                            onClick={() => handleDevelopSpark(v)}
                                            disabled={isLoading}
                                            className="flex items-center gap-1.5 bg-orange-400 hover:bg-orange-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors"
                                        >
                                            {developingVariationId === v.id ? (
                                                <><Loader2 size={12} className="animate-spin" /> DEVELOPING...</>
                                            ) : (
                                                <><Zap size={12} /> DEVELOP THIS ONE <ChevronRight size={12} /></>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onNavigateToSpark(v)}
                                            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors"
                                        >
                                            VIEW PREMISE <ChevronRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── B-Plot Section ── */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-400 tracking-widest">B-PLOT STRAND</p>
                </div>

                <button
                    onClick={handleGenerateBPlot}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors"
                >
                    {loadingState === 'bplot' ? (
                        <><Loader2 size={16} className="animate-spin" /> GENERATING B-PLOT...</>
                    ) : (
                        <><GitBranch size={16} /> GENERATE B-PLOT <ChevronRight size={16} /></>
                    )}
                </button>

                <AnimatePresence>
                    {bplots.map(bp => (
                        <BPlotCard key={bp.id} bplot={bp} />
                    ))}
                </AnimatePresence>
            </div>

        </div>
    );
}
