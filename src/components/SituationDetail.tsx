import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Loader2, GitFork, Zap, ChevronRight, Clapperboard, Sparkles, BookOpen, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Situation, PlotIdeaOutput, Trope } from '../types/plot';
import { developSituation, generateSituationVariations, extractTropeFromSituation } from '../lib/gemini';
import { loadStyleProfile } from '../lib/style';
import { TropePicker } from './TropePicker';

interface SituationDetailProps {
    situation: Situation;
    onSituationUpdated: (updated: Situation) => void;
}

type LoadingState = 'idle' | 'variations' | 'developing';

function getGenre(situation: Situation): string {
    if (situation.genre) return situation.genre;
    const tag = situation.tags?.find(t => ['ROMANCE', 'ADVENTURE', 'HAREM'].includes(t.toUpperCase()));
    return tag || 'ROMANCE';
}

export function SituationDetail({ situation, onSituationUpdated }: SituationDetailProps) {
    const [local, setLocal] = useState<Situation>(situation);
    const [variations, setVariations] = useState<Situation[]>([]);
    const [linkedSparks, setLinkedSparks] = useState<Pick<PlotIdeaOutput, 'id' | 'title' | 'content'>[]>([]);
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [developingVariationId, setDevelopingVariationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activePicker, setActivePicker] = useState<'variations' | 'develop' | null>(null);
    const [tropeFormOpen, setTropeFormOpen] = useState(false);
    const [tropeForm, setTropeForm] = useState<Partial<Omit<Trope, 'id' | 'created_at'>>>({});
    const [savingTrope, setSavingTrope] = useState(false);

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

    async function handleGenerateVariations(tropes: Trope[] = [], direction: string = '') {
        setError(null);
        setActivePicker(null);
        setLoadingState('variations');
        try {
            const varTexts = await generateSituationVariations(local.content, genre, tropes, direction, loadStyleProfile());
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

    async function handleDevelopSituation(target: Situation, tropes: Trope[] = []) {
        setError(null);
        setActivePicker(null);
        if (target.id === local.id) {
            setLoadingState('developing');
        } else {
            setDevelopingVariationId(target.id);
        }
        try {
            const result = await developSituation(target.content, genre, tropes, loadStyleProfile());
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

    async function handleOpenTropeForm() {
        const extracted = await extractTropeFromSituation(local);
        setTropeForm({ genre: genre.toLowerCase() as Trope['genre'], ...extracted });
        setTropeFormOpen(true);
    }

    async function handleSaveTrope() {
        if (!tropeForm.name || !tropeForm.description) return;
        setSavingTrope(true);
        try {
            await supabase.from('tropes').insert({
                name: tropeForm.name,
                description: tropeForm.description,
                genre: tropeForm.genre ?? 'both',
                dramatic_function: tropeForm.dramatic_function ?? null,
                signature_beat: tropeForm.signature_beat ?? null,
                pairs_well_with: [],
            });
            setTropeFormOpen(false);
        } finally {
            setSavingTrope(false);
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
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDevelopSituation(local, [])}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 flex-1 bg-violet-400 hover:bg-violet-500 disabled:opacity-50 text-white py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors shadow-sm"
                            >
                                {loadingState === 'developing' ? (
                                    <><Loader2 size={16} className="animate-spin" /> DEVELOPING...</>
                                ) : (
                                    <><Zap size={16} /> DEVELOP</>
                                )}
                            </button>
                            <button
                                onClick={() => setActivePicker(p => p === 'develop' ? null : 'develop')}
                                disabled={isLoading}
                                className={`flex items-center gap-1.5 px-4 py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors border-2 ${
                                    activePicker === 'develop'
                                        ? 'border-violet-400 bg-violet-50 text-violet-600'
                                        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                                }`}
                            >
                                <BookOpen size={14} /> WITH TROPES
                            </button>
                        </div>
                        <AnimatePresence>
                            {activePicker === 'develop' && (
                                <TropePicker
                                    genre={genre}
                                    actionLabel="DEVELOP"
                                    onGenerate={(tropes) => handleDevelopSituation(local, tropes)}
                                    onClose={() => setActivePicker(null)}
                                    loading={loadingState === 'developing'}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {local.spark_type !== 'variation' && variations.length === 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleGenerateVariations([])}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors"
                            >
                                {loadingState === 'variations' ? (
                                    <><Loader2 size={16} className="animate-spin" /> GENERATING...</>
                                ) : (
                                    <><GitFork size={16} /> VARIATIONS</>
                                )}
                            </button>
                            <button
                                onClick={() => setActivePicker(p => p === 'variations' ? null : 'variations')}
                                disabled={isLoading}
                                className={`flex items-center gap-1.5 px-4 py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors border-2 ${
                                    activePicker === 'variations'
                                        ? 'border-zinc-800 bg-zinc-100 text-zinc-800'
                                        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                                }`}
                            >
                                <BookOpen size={14} /> WITH TROPES
                            </button>
                        </div>
                        <AnimatePresence>
                            {activePicker === 'variations' && (
                                <TropePicker
                                    genre={genre}
                                    actionLabel="GENERATE VARIATIONS"
                                    onGenerate={handleGenerateVariations}
                                    onClose={() => setActivePicker(null)}
                                    loading={loadingState === 'variations'}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {local.spark_type !== 'variation' && variations.length > 0 && (
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 tracking-widest">
                        <GitFork size={14} /> {variations.length} VARIATIONS GENERATED
                    </div>
                )}

                {/* Save as Trope */}
                {isDeveloped && (
                    <button
                        onClick={handleOpenTropeForm}
                        disabled={tropeFormOpen}
                        className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-zinc-200 hover:border-zinc-300 text-zinc-400 hover:text-zinc-600 py-3 rounded-2xl text-xs font-bold tracking-wider transition-colors"
                    >
                        <BookOpen size={13} /> SAVE AS TROPE
                    </button>
                )}

                {/* Trope form */}
                <AnimatePresence>
                    {tropeFormOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col gap-3"
                        >
                            <p className="text-xs font-bold text-zinc-400 tracking-widest">ABSTRACT AS TROPE</p>
                            <input
                                value={tropeForm.name ?? ''}
                                onChange={e => setTropeForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Trope name"
                                className="w-full bg-white border border-zinc-100 rounded-xl px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-200"
                            />
                            <textarea
                                value={tropeForm.description ?? ''}
                                onChange={e => setTropeForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Description"
                                rows={2}
                                className="w-full bg-white border border-zinc-100 rounded-xl px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-200 resize-none"
                            />
                            <input
                                value={tropeForm.dramatic_function ?? ''}
                                onChange={e => setTropeForm(f => ({ ...f, dramatic_function: e.target.value }))}
                                placeholder="Dramatic function (optional)"
                                className="w-full bg-white border border-zinc-100 rounded-xl px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-200"
                            />
                            <input
                                value={tropeForm.signature_beat ?? ''}
                                onChange={e => setTropeForm(f => ({ ...f, signature_beat: e.target.value }))}
                                placeholder="Signature beat (optional)"
                                className="w-full bg-white border border-zinc-100 rounded-xl px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-200"
                            />
                            <div className="flex gap-2">
                                {(['romance', 'adventure', 'harem', 'both'] as const).map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setTropeForm(f => ({ ...f, genre: g }))}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors ${
                                            tropeForm.genre === g
                                                ? g === 'romance' ? 'bg-orange-400 text-white' : g === 'adventure' ? 'bg-violet-400 text-white' : g === 'harem' ? 'bg-red-400 text-white' : 'bg-teal-400 text-white'
                                                : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                                        }`}
                                    >
                                        {g.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTropeFormOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleSaveTrope}
                                    disabled={savingTrope || !tropeForm.name || !tropeForm.description}
                                    className="flex items-center justify-center gap-1.5 flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors"
                                >
                                    {savingTrope ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    SAVE TROPE
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
