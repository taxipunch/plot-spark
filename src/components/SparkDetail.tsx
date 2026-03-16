import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Loader2, GitFork, Zap, ChevronRight, GitBranch, Clapperboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlotIdeaOutput, BPlot, Situation } from '../types/plot';
import { generateVariations, developSpark, generateBPlot, generateSituationsForSpark } from '../lib/gemini';
import { BPlotCard } from './BPlotCard';

interface SparkDetailProps {
    spark: PlotIdeaOutput;
    onSparkUpdated: (updated: PlotIdeaOutput) => void;
    onNavigateToSpark: (spark: PlotIdeaOutput) => void;
    onNavigateToSituation: (situation: Situation) => void;
}

type LoadingState = 'idle' | 'variations' | 'developing' | 'bplot' | 'situations';

function getGenre(spark: PlotIdeaOutput): string {
    if (spark.genre) return spark.genre;
    const genreTag = spark.tags?.find(t =>
        ['ROMANCE', 'ADVENTURE', 'FANTASY', 'SCI-FI', 'MYSTERY'].includes(t.toUpperCase())
    );
    return genreTag || 'ROMANCE';
}

export function SparkDetail({ spark, onSparkUpdated, onNavigateToSpark, onNavigateToSituation }: SparkDetailProps) {
    const [localSpark, setLocalSpark] = useState<PlotIdeaOutput>(spark);
    const [variations, setVariations] = useState<PlotIdeaOutput[]>([]);
    const [bplots, setBplots] = useState<BPlot[]>([]);
    const [linkedSituations, setLinkedSituations] = useState<Situation[]>([]);
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [developingVariationId, setDevelopingVariationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const genre = getGenre(localSpark);
    const isDeveloped = Boolean(localSpark.logline);

    useEffect(() => {
        async function loadRelated() {
            const { data: varData } = await supabase
                .from('plots')
                .select('*')
                .eq('parent_spark_id', localSpark.id)
                .order('created_at', { ascending: true });
            if (varData) setVariations(varData as PlotIdeaOutput[]);

            const { data: bplotAssoc } = await supabase
                .from('spark_bplot_associations')
                .select('bplot_id')
                .eq('spark_id', localSpark.id);
            if (bplotAssoc && bplotAssoc.length > 0) {
                const ids = bplotAssoc.map((r: { bplot_id: string }) => r.bplot_id);
                const { data: bplotData } = await supabase.from('b_plots').select('*').in('id', ids);
                if (bplotData) setBplots(bplotData as BPlot[]);
            }

            const { data: sitAssoc } = await supabase
                .from('spark_situation_associations')
                .select('situation_id')
                .eq('spark_id', localSpark.id);
            if (sitAssoc && sitAssoc.length > 0) {
                const ids = sitAssoc.map((r: { situation_id: string }) => r.situation_id);
                const { data: sitData } = await supabase.from('situations').select('*').in('id', ids);
                if (sitData) setLinkedSituations(sitData as Situation[]);
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
            const { data, error: insertErr } = await supabase.from('plots').insert(rows).select();
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
        const isPrimary = targetSpark.id === localSpark.id;
        if (isPrimary) {
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
                if (isPrimary) {
                    setLocalSpark(updated);
                    onSparkUpdated(updated);

                    // Auto-generate 4 situations after developing the primary spark
                    setLoadingState('situations');
                    try {
                        const generatedSits = await generateSituationsForSpark(targetSpark.content, genre);
                        const sitRows = generatedSits.map(s => ({
                            title: s.title,
                            content: s.content,
                            genre,
                            tags: [],
                        }));
                        const { data: sitData, error: sitErr } = await supabase
                            .from('situations')
                            .insert(sitRows)
                            .select();
                        if (!sitErr && sitData) {
                            const newSituations = sitData as Situation[];
                            const assocRows = newSituations.map(s => ({
                                spark_id: targetSpark.id,
                                situation_id: s.id,
                                auto_generated: true,
                            }));
                            await supabase.from('spark_situation_associations').insert(assocRows);
                            setLinkedSituations(newSituations);
                        }
                    } catch (sitError) {
                        console.error('Failed to auto-generate situations:', sitError);
                        // Non-fatal — spark development succeeded
                    }
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

            {localSpark.title && (
                <h2 className="text-2xl font-extrabold text-zinc-900 font-serif leading-tight">
                    {localSpark.title}
                </h2>
            )}

            <div>
                <p className="text-xs font-bold text-zinc-400 tracking-widest mb-2">THE SPARK</p>
                <p className="text-zinc-700 leading-relaxed">{localSpark.content}</p>
            </div>

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
                {!isDeveloped && (
                    <button
                        onClick={() => handleDevelopSpark(localSpark)}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 w-full bg-orange-400 hover:bg-orange-500 disabled:opacity-50 text-white py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors shadow-sm"
                    >
                        {loadingState === 'developing' ? (
                            <><Loader2 size={16} className="animate-spin" /> DEVELOPING PREMISE...</>
                        ) : loadingState === 'situations' ? (
                            <><Loader2 size={16} className="animate-spin" /> GENERATING SCENES...</>
                        ) : (
                            <><Zap size={16} /> DEVELOP <ChevronRight size={16} /></>
                        )}
                    </button>
                )}

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

            {/* ── Linked Situations ── */}
            <AnimatePresence>
                {linkedSituations.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-3"
                    >
                        <p className="text-xs font-bold text-zinc-400 tracking-widest">SCENES</p>
                        {linkedSituations.map((sit, i) => (
                            <motion.div
                                key={sit.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-violet-50/60 border border-violet-100/60 rounded-2xl p-4 flex flex-col gap-2"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clapperboard size={12} className="text-violet-400 shrink-0" />
                                        <span className="text-xs font-bold text-violet-500 truncate">
                                            {sit.title || 'Untitled Scene'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onNavigateToSituation(sit)}
                                        className="flex items-center gap-1 text-xs font-bold text-violet-400 hover:text-violet-600 transition-colors shrink-0"
                                    >
                                        OPEN <ChevronRight size={10} />
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">{sit.content}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── B-Plot Section ── */}
            <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-zinc-400 tracking-widest">B-PLOT STRAND</p>

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
