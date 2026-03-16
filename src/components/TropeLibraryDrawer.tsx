import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Plus, Link, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Trope } from '../types/plot';
import { TropeCard } from './TropeCard';
import { seedTropeLibrary, importTropesFromText } from '../lib/gemini';

interface TropeLibraryDrawerProps {
    open: boolean;
    onClose: () => void;
}

type GenreFilter = 'all' | 'romance' | 'adventure' | 'harem' | 'both';

type DrawerLoadingState = 'idle' | 'seeding' | 'fetching-url' | 'saving-import';

export function TropeLibraryDrawer({ open, onClose }: TropeLibraryDrawerProps) {
    const [tropes, setTropes] = useState<Trope[]>([]);
    const [genreFilter, setGenreFilter] = useState<GenreFilter>('all');
    const [loadingState, setLoadingState] = useState<DrawerLoadingState>('idle');
    const [error, setError] = useState<string | null>(null);

    // URL import state
    const [urlImportOpen, setUrlImportOpen] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [parsedTropes, setParsedTropes] = useState<Partial<Omit<Trope, 'id' | 'created_at'>>[]>([]);
    const [selectedForImport, setSelectedForImport] = useState<Set<number>>(new Set());

    // Add trope form state
    const [addFormOpen, setAddFormOpen] = useState(false);
    const [newTrope, setNewTrope] = useState({ name: '', description: '', genre: 'both' as Trope['genre'], dramatic_function: '', signature_beat: '' });

    useEffect(() => {
        if (open) fetchTropes();
    }, [open]);

    async function fetchTropes() {
        const { data } = await supabase.from('tropes').select('*').order('name', { ascending: true });
        if (data) setTropes(data as Trope[]);
    }

    const filtered = tropes.filter(t => genreFilter === 'all' ? true : t.genre === genreFilter);

    // ── Seeding ──────────────────────────────────────────────────────────────

    async function handleSeed() {
        setError(null);
        setLoadingState('seeding');
        try {
            const [romanceTropes, adventureTropes, haremTropes] = await Promise.all([
                seedTropeLibrary('romance'),
                seedTropeLibrary('adventure'),
                seedTropeLibrary('harem'),
            ]);
            const all = [...romanceTropes, ...adventureTropes, ...haremTropes];
            const { error: insertErr } = await supabase.from('tropes').insert(all);
            if (insertErr) throw insertErr;
            await fetchTropes();
        } catch (e) {
            setError('Failed to seed library. Check your Gemini API key.');
            console.error(e);
        } finally {
            setLoadingState('idle');
        }
    }

    // ── URL Import ───────────────────────────────────────────────────────────

    async function handleFetchUrl() {
        if (!importUrl.trim()) return;
        setError(null);
        setLoadingState('fetching-url');
        setParsedTropes([]);
        setSelectedForImport(new Set());
        try {
            const res = await fetch(importUrl);
            const html = await res.text();
            // Strip HTML tags to plain text
            const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const extracted = await importTropesFromText(text);
            setParsedTropes(extracted);
            setSelectedForImport(new Set(extracted.map((_, i) => i)));
        } catch (e) {
            setError('Failed to fetch or parse URL. Check the address and try again.');
            console.error(e);
        } finally {
            setLoadingState('idle');
        }
    }

    async function handleSaveImport() {
        const toSave = parsedTropes
            .filter((_, i) => selectedForImport.has(i))
            .map(t => ({ name: t.name || 'Unnamed', description: t.description || '', genre: t.genre || 'both', dramatic_function: t.dramatic_function || null, signature_beat: t.signature_beat || null, pairs_well_with: [] }));
        if (!toSave.length) return;
        setLoadingState('saving-import');
        try {
            const { error: insertErr } = await supabase.from('tropes').insert(toSave);
            if (insertErr) throw insertErr;
            await fetchTropes();
            setParsedTropes([]);
            setSelectedForImport(new Set());
            setImportUrl('');
            setUrlImportOpen(false);
        } catch (e) {
            setError('Failed to save tropes.');
            console.error(e);
        } finally {
            setLoadingState('idle');
        }
    }

    function toggleImportSelection(i: number) {
        setSelectedForImport(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    }

    // ── Add Trope Form ───────────────────────────────────────────────────────

    async function handleAddTrope() {
        if (!newTrope.name.trim() || !newTrope.description.trim()) return;
        try {
            const { error: insertErr } = await supabase.from('tropes').insert({
                name: newTrope.name.trim(),
                description: newTrope.description.trim(),
                genre: newTrope.genre,
                dramatic_function: newTrope.dramatic_function.trim() || null,
                signature_beat: newTrope.signature_beat.trim() || null,
                pairs_well_with: [],
            });
            if (insertErr) throw insertErr;
            await fetchTropes();
            setNewTrope({ name: '', description: '', genre: 'both', dramatic_function: '', signature_beat: '' });
            setAddFormOpen(false);
        } catch (e) {
            setError('Failed to save trope.');
            console.error(e);
        }
    }

    const isLoading = loadingState !== 'idle';
    const canSeed = tropes.length < 10;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-beige-50 rounded-t-3xl z-50 flex flex-col"
                        style={{ height: '88vh' }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-zinc-200 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3">
                            <h2 className="text-lg font-extrabold text-zinc-900 font-serif">Trope Library</h2>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Genre filter */}
                        <div className="px-5 pb-3">
                            <div className="bg-white rounded-full shadow-sm p-1 flex gap-1">
                                {(['all', 'romance', 'adventure', 'harem', 'both'] as GenreFilter[]).map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setGenreFilter(g)}
                                        className={`relative flex-1 py-2 rounded-full text-xs font-bold tracking-wide transition-colors z-10 ${genreFilter === g ? 'text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        {genreFilter === g && (
                                            <motion.div layoutId="tropeGenreFilter" className="absolute inset-0 bg-zinc-800 rounded-full -z-10" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
                                        )}
                                        {g.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tools */}
                        <div className="px-5 pb-3 flex flex-col gap-2">
                            {error && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600">{error}</div>
                            )}

                            {/* Seed button */}
                            {canSeed && (
                                <button
                                    onClick={handleSeed}
                                    disabled={isLoading}
                                    className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white py-3 rounded-2xl text-xs font-bold tracking-wider transition-colors"
                                >
                                    {loadingState === 'seeding' ? (
                                        <><Loader2 size={13} className="animate-spin" /> SEEDING LIBRARY...</>
                                    ) : (
                                        <>SEED LIBRARY WITH AI <ChevronRight size={13} /></>
                                    )}
                                </button>
                            )}

                            {/* Tool buttons row */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setUrlImportOpen(o => !o); setAddFormOpen(false); }}
                                    className="flex items-center gap-1.5 flex-1 justify-center bg-white border border-zinc-100 hover:bg-zinc-50 text-zinc-600 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors"
                                >
                                    <Link size={12} /> IMPORT URL
                                </button>
                                <button
                                    onClick={() => { setAddFormOpen(o => !o); setUrlImportOpen(false); }}
                                    className="flex items-center gap-1.5 flex-1 justify-center bg-white border border-zinc-100 hover:bg-zinc-50 text-zinc-600 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors"
                                >
                                    <Plus size={12} /> ADD TROPE
                                </button>
                            </div>

                            {/* URL import form */}
                            <AnimatePresence>
                                {urlImportOpen && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="bg-white border border-zinc-100 rounded-2xl p-4 flex flex-col gap-3">
                                            <p className="text-xs font-bold text-zinc-400 tracking-widest">IMPORT FROM URL</p>
                                            <div className="flex gap-2">
                                                <input
                                                    value={importUrl}
                                                    onChange={e => setImportUrl(e.target.value)}
                                                    placeholder="https://tvtropes.org/..."
                                                    className="flex-1 bg-zinc-50 rounded-xl px-3 py-2 text-xs text-zinc-700 placeholder:text-zinc-300 outline-none border border-zinc-100 focus:ring-1 focus:ring-zinc-200"
                                                />
                                                <button
                                                    onClick={handleFetchUrl}
                                                    disabled={isLoading || !importUrl.trim()}
                                                    className="bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors whitespace-nowrap"
                                                >
                                                    {loadingState === 'fetching-url' ? <Loader2 size={12} className="animate-spin" /> : 'FETCH'}
                                                </button>
                                            </div>

                                            {parsedTropes.length > 0 && (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs text-zinc-500">{parsedTropes.length} tropes found — select to import</p>
                                                        <button onClick={() => setSelectedForImport(new Set(parsedTropes.map((_, i) => i)))} className="text-xs text-zinc-400 underline">Select all</button>
                                                    </div>
                                                    <div className="max-h-36 overflow-y-auto hide-scrollbar flex flex-col gap-1">
                                                        {parsedTropes.map((t, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => toggleImportSelection(i)}
                                                                className={`text-left flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${selectedForImport.has(i) ? 'bg-zinc-800 text-white' : 'bg-zinc-50 text-zinc-700'}`}
                                                            >
                                                                {selectedForImport.has(i) && <Check size={10} className="shrink-0" />}
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold truncate">{t.name}</p>
                                                                    <p className={`text-xs truncate ${selectedForImport.has(i) ? 'text-zinc-300' : 'text-zinc-400'}`}>{t.description}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={handleSaveImport}
                                                        disabled={isLoading || selectedForImport.size === 0}
                                                        className="bg-zinc-800 text-white py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                                                    >
                                                        {loadingState === 'saving-import' ? 'SAVING...' : `SAVE ${selectedForImport.size} TROPES`}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Add trope form */}
                            <AnimatePresence>
                                {addFormOpen && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="bg-white border border-zinc-100 rounded-2xl p-4 flex flex-col gap-3">
                                            <p className="text-xs font-bold text-zinc-400 tracking-widest">ADD TROPE</p>
                                            <input value={newTrope.name} onChange={e => setNewTrope(p => ({ ...p, name: e.target.value }))} placeholder="Trope name..." className="bg-zinc-50 rounded-xl px-3 py-2 text-xs text-zinc-700 placeholder:text-zinc-300 outline-none border border-zinc-100 focus:ring-1 focus:ring-zinc-200" />
                                            <textarea value={newTrope.description} onChange={e => setNewTrope(p => ({ ...p, description: e.target.value }))} placeholder="What tension does this create?" className="bg-zinc-50 rounded-xl px-3 py-2 text-xs text-zinc-700 placeholder:text-zinc-300 outline-none border border-zinc-100 focus:ring-1 focus:ring-zinc-200 resize-none h-16" />
                                            <div className="flex gap-2">
                                                {(['romance', 'adventure', 'harem', 'both'] as Trope['genre'][]).map(g => (
                                                    <button key={g} onClick={() => setNewTrope(p => ({ ...p, genre: g }))} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${newTrope.genre === g ? 'bg-zinc-800 text-white' : 'bg-zinc-50 text-zinc-400'}`}>
                                                        {g.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                            <input value={newTrope.signature_beat} onChange={e => setNewTrope(p => ({ ...p, signature_beat: e.target.value }))} placeholder="Signature beat (optional)..." className="bg-zinc-50 rounded-xl px-3 py-2 text-xs text-zinc-700 placeholder:text-zinc-300 outline-none border border-zinc-100 focus:ring-1 focus:ring-zinc-200" />
                                            <button onClick={handleAddTrope} disabled={!newTrope.name.trim() || !newTrope.description.trim()} className="bg-zinc-800 text-white py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors">
                                                SAVE TROPE
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Trope list */}
                        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-10">
                            {tropes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center">
                                    <p className="text-zinc-400 font-medium text-sm">Library is empty</p>
                                    <p className="text-zinc-300 text-xs mt-1">Seed it with AI or add tropes manually</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs text-zinc-400 mb-1">{filtered.length} trope{filtered.length !== 1 ? 's' : ''}</p>
                                    {filtered.map(trope => (
                                        <TropeCard key={trope.id} trope={trope} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
