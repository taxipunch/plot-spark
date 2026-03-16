import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Loader2, GitFork, Zap, ChevronRight, Clapperboard, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Situation, PlotIdeaOutput } from '../types/plot';
import { developSituation, generateSituationVariations } from '../lib/gemini';

interface SituationDetailProps {
    situation: Situation;
    onSituationUpdated: (updated: Situation) => void;
}

type LoadingState = 'idle' | 'variations' | 'developing';

function getGenre(situation: Situation): string {
    if (situation.genre) return situation.genre;
    const tag = situation.tags?.find(t => ['ROMANCE', 'ADVENTURE'].includes(t.toUpperCase()));
    return tag || 'ROMANCE';
}

export function SituationDetail({ situation, onSituationUpdated }: SituationDetailProps) {
    const [local, setLocal] = useState<Situation>(situation);
    const [variations, setVariations] = useState<Situation[]>([]);
    const [linkedSparks, setLinkedSparks] = useState<Pick<PlotIdeaOutput, 'id' | 'title' | 'content'>[]>([]);
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [developingVariationId, setDevelopingVariationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const genre = getGenre(local);
    const isDeveloped = Boolean(local.setting_atmosphere);
    const isLoading = loadingState !== 'idle';

    useEffect(() => {
        async function loadRelated() {
            // Variations
            const { data: varData } = await supabase
                .from('situations')
                .select('*')
                .eq('parent_situation_id', local.id)
                .order('created_at', { ascending: true });
            if (varData) setVariations(varData as Situation[]);

            // Linked sparks
            const { data: assocData } = await supabase
                .from('spark_situation_associations')
                .select('spark_id')
                .eq('situation_id', local.id);

            if (assocData && assocData.length > 0) {
                const ids = assocData.map((r: { spark_id: string }) => r.spark_id);
                const { data: sparkData } = await supabase
                    .from('plots')
                    .select('id, title, content')
                    .in('id', ids);
                if (sparkData) setLinkedSparks(sparkData as Pick<PlotIdeaOutput, 'id' | 'title' | 'content'>[]);
            }
        }
        loadRelated();
    }, [local.id]);

    async function handleStarToggle() {
        const newVal = !local.is_starred;
        const updated = { ...local, is_starred: newVal };
        setLocal(updated);
        onSituationUpdated(updated);
        await supabase.from('situations').update({ is_starred: newVal }).eq('id', local.id);
    }

    async function handleGenerateVariations() {
        setError(null);
        setLoadingState('variations');
        try {
            const varTexts = await generateSituationVariations(local.content, genre);
            const rows = varTexts.map(content => ({
                content,
                title: null,
                genre,
                tags: local.tags || [],
                spark_type: 'variation',
                parent_situation_id: local.id,
            }));
            const { data, error: insertErr } = await supabase.from('situations').insert(rows).select();
            if (insertErr) throw insertErr;
            if (data) setVariations(data as Situation[]);
        } catch (e) {
            setError('Failed to generate variations. Check your Gemini API key.');
            console.error(e);
        } finally {
            setLoadingState('idle');
        }
    }

    async function handleDevelopSituation(target: Situation) {
        setError(null);
        if (target.id === local.id) {
            setLoadingState('developing');
        } else {
            setDevelopingVariationId(target.id);
        }
        try {
            const result = await developSituation(target.content, genre);
            const { data, error: updateErr } = await supabase
                .from('situations')
                .update(result)
                .eq('id', target.id)
                .select()
                .single();
            if (updateErr) throw updateErr;
            if (data) {
                const updated = data as Situation;
                if (target.id === local.id) {
                    setLocal(updated);
                    onSituationUpdated(updated);
                } else {
                    setVariations(prev => prev.map(v => v.id === updated.id ? updated : v));
                }
            }
        } catch (e) {
            setError('Failed to develop scene. Check your Gemini API key.');
            console.error(e);
        } finally {
            setLoadingState('idle');
            setDevelopingVariationId(null);
        }
    }

    return (
        <div className="bg-white rounded-t-[2.5rem] p-6 pb-28 shadow-sm flex flex-col gap-6 overflow-y-auto hide-scrollbar h-full">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clapperboard size={14} className="text-violet-400" />
                    <span className="text-xs font-bold text-zinc-400 tracking-widest">{genre}</span>
                    {local.spark_type === 'variation' && (
                        <span className="text-xs font-bold text-violet-400 tracking-widest bg-violet-50 px-2 py-0.5 rounded-full">VARIATION</span>
                    )}
                </div>
                <button
                    onClick={handleStarToggle}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-50 transition-colors"
                >
                    <Star
                        size={20}
                        className={local.is_starred ? 'text-violet-400 fill-violet-400' : 'text-zinc-300'}
                    />
                </button>
            </div>

            {local.title && (
                <h2 className="text-2xl font-extrabold text-zinc-900 font-serif leading-tight">
                    {local.title}
                </h2>
            )}

            {/* The Situation */}
            <div>
                <p className="text-xs font-bold text-zinc-400 tracking-widest mb-2">THE SITUATION</p>
                <p className="text-zinc-700 leading-relaxed">{local.content}</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">{error}</div>
            )}

            {/* ── Developed Scene ── */}
            <AnimatePresence>
                {isDeveloped && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-4 bg-violet-50/60 rounded-2xl p-5"
                    >
                        <p className="text-xs font-bold text-zinc-400 tracking-widest">SCENE ANATOMY</p>

                        {([
                            ['SETTING & ATMOSPHERE', local.setting_atmosphere],
                            ['EMOTIONAL TEMPERATURE', local.emotional_temperature],
                            ['CHARACTER POSITIONS', local.character_positions],
                            ['SCENE FUNCTION', local.scene_function],
                            ['THE MOMENT', local.the_moment],
                        ] as [string, string | null][]).map(([label, value]) => value && (
                            <div key={label}>
                                <p className="text-xs font-bold text-violet-500 tracking-widest mb-1">{label}</p>
                                <p className="text-sm text-zinc-700 leading-relaxed">{value}</p>
                            </div>
                        ))}

                        {local.exit_states && local.exit_states.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-violet-500 tracking-widest mb-2">EXIT STATES</p>
                                <div className="flex flex-col gap-2">
                                    {local.exit_states.map((state, i) => (
                                        <div key={i} className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <p className="text-sm text-zinc-700 leading-relaxed">{state}</p>
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
                        onClick={() => handleDevelopSituation(local)}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 w-full bg-violet-400 hover:bg-violet-500 disabled:opacity-50 text-white py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors shadow-sm"
                    >
                        {loadingState === 'developing' ? (
                            <><Loader2 size={16} className="animate-spin" /> DEVELOPING SCENE...</>
                        ) : (
                            <><Zap size={16} /> DEVELOP SCENE <ChevronRight size={16} /></>
                        )}
                    </button>
                )}

                {local.spark_type !== 'variation' && (
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
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
                                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-500 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                    {v.setting_atmosphere && <span className="text-xs font-bold text-green-500 tracking-widest">DEVELOPED</span>}
                                </div>
                                <p className="text-sm text-zinc-700 leading-relaxed">{v.content}</p>
                                {!v.setting_atmosphere && (
                                    <button
                                        onClick={() => handleDevelopSituation(v)}
                                        disabled={isLoading}
                                        className="flex items-center gap-1.5 bg-violet-400 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors w-fit"
                                    >
                                        {developingVariationId === v.id ? (
                                            <><Loader2 size={12} className="animate-spin" /> DEVELOPING...</>
                                        ) : (
                                            <><Zap size={12} /> DEVELOP THIS ONE <ChevronRight size={12} /></>
                                        )}
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Linked Sparks ── */}
            {linkedSparks.length > 0 && (
                <div className="flex flex-col gap-3">
                    <p className="text-xs font-bold text-zinc-400 tracking-widest">LINKED SPARKS</p>
                    {linkedSparks.map(spark => (
                        <div key={spark.id} className="bg-orange-50/60 border border-orange-100/60 rounded-2xl p-4 flex items-start gap-3">
                            <Sparkles size={14} className="text-orange-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-zinc-700">{spark.title || 'Untitled Spark'}</p>
                                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{spark.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
