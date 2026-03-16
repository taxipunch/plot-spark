import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Trope } from '../types/plot';

interface TropePickerProps {
    genre: string;
    actionLabel: string;
    onGenerate: (tropes: Trope[]) => void;
    onClose: () => void;
    loading?: boolean;
}

export function TropePicker({ genre, actionLabel, onGenerate, onClose, loading = false }: TropePickerProps) {
    const [tropes, setTropes] = useState<Trope[]>([]);
    const [selected, setSelected] = useState<Trope[]>([]);
    const [query, setQuery] = useState('');

    useEffect(() => {
        async function fetchTropes() {
            const genreFilter = genre.toUpperCase().includes('ROMANCE') ? 'romance' : 'adventure';
            const { data } = await supabase
                .from('tropes')
                .select('*')
                .or(`genre.eq.${genreFilter},genre.eq.both`)
                .order('name', { ascending: true });
            if (data) setTropes(data as Trope[]);
        }
        fetchTropes();
    }, [genre]);

    const filtered = tropes.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase())
    );

    function toggleTrope(trope: Trope) {
        setSelected(prev => {
            if (prev.find(t => t.id === trope.id)) return prev.filter(t => t.id !== trope.id);
            if (prev.length >= 2) return prev; // max 2
            return [...prev, trope];
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col gap-3"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-zinc-400 tracking-widest">STEER WITH TROPES</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Pick up to 2 — they shape the output</p>
                </div>
                <button onClick={onClose} className="text-zinc-300 hover:text-zinc-500 transition-colors">
                    <X size={16} />
                </button>
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selected.map(t => (
                        <button
                            key={t.id}
                            onClick={() => toggleTrope(t)}
                            className="flex items-center gap-1 text-xs font-bold text-white bg-zinc-800 px-3 py-1.5 rounded-full"
                        >
                            {t.name} <X size={10} />
                        </button>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search tropes..."
                    className="w-full bg-white border border-zinc-100 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-700 placeholder:text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-200"
                />
            </div>

            {/* List */}
            <div className="max-h-48 overflow-y-auto hide-scrollbar flex flex-col gap-1">
                {tropes.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4">
                        No tropes in library yet — seed it from the library drawer
                    </p>
                ) : filtered.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4">No matches</p>
                ) : (
                    filtered.map(trope => {
                        const isSelected = selected.some(t => t.id === trope.id);
                        const isDisabled = !isSelected && selected.length >= 2;
                        return (
                            <button
                                key={trope.id}
                                onClick={() => toggleTrope(trope)}
                                disabled={isDisabled}
                                className={`text-left px-3 py-2.5 rounded-xl transition-colors ${
                                    isSelected
                                        ? 'bg-zinc-800 text-white'
                                        : isDisabled
                                        ? 'opacity-40 cursor-not-allowed text-zinc-500'
                                        : 'hover:bg-white text-zinc-700'
                                }`}
                            >
                                <p className="text-xs font-bold">{trope.name}</p>
                                <p className={`text-xs mt-0.5 line-clamp-1 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                                    {trope.description}
                                </p>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Action */}
            <button
                onClick={() => onGenerate(selected)}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold tracking-wider transition-colors"
            >
                {loading ? (
                    'GENERATING...'
                ) : (
                    <><Zap size={12} /> {actionLabel}{selected.length > 0 ? ` WITH ${selected.length} TROPE${selected.length > 1 ? 'S' : ''}` : ' FREELY'}</>
                )}
            </button>
        </motion.div>
    );
}
