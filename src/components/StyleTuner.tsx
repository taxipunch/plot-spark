import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import {
    StyleProfile,
    TONE_LEVELS,
    ARC_LEVELS,
    DYNAMIC_LEVELS,
    EXPLICIT_LEVELS,
    DialLevel,
} from '../types/style';
import { saveStyleProfile } from '../lib/style';

interface StyleTunerProps {
    open: boolean;
    onClose: () => void;
    profile: StyleProfile;
    onChange: (profile: StyleProfile) => void;
    genre?: string;
}

type DialDef = {
    key: keyof StyleProfile;
    label: string;
    levels: DialLevel[];
};

function getArcSubtitle(level: DialLevel, genre: string): string {
    const g = genre.toUpperCase();
    if (g.includes('HAREM'))   return level.harem ?? '';
    if (g.includes('ROMANCE')) return level.her   ?? '';
    return level.his ?? '';
}

export function StyleTuner({ open, onClose, profile, onChange, genre = 'ROMANCE' }: StyleTunerProps) {
    const [saved, setSaved] = useState(false);

    const g = genre.toUpperCase();
    const arcLabel = g.includes('HAREM') ? 'CAST ARCS' : g.includes('ROMANCE') ? 'HER ARC' : 'HIS ARC';

    const dials: DialDef[] = [
        { key: 'tone',     label: 'TONE',          levels: TONE_LEVELS },
        { key: 'arc',      label: arcLabel,         levels: ARC_LEVELS },
        { key: 'dynamic',  label: 'DYNAMIC',        levels: DYNAMIC_LEVELS },
        { key: 'explicit', label: 'EXPLICIT THEME', levels: EXPLICIT_LEVELS },
    ];

    function getSubtitle(dial: DialDef): string {
        const level = dial.levels[profile[dial.key]];
        if (dial.key === 'tone')     return level.ref ? `ref: ${level.ref}` : '';
        if (dial.key === 'arc')      return getArcSubtitle(level, genre);
        return level.description ?? '';
    }

    function handleSave() {
        saveStyleProfile(profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 z-40"
                    />

                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 flex flex-col"
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-zinc-200 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3">
                            <div>
                                <h2 className="text-lg font-extrabold text-zinc-900">Fine-Tune Style</h2>
                                <p className="text-xs text-zinc-400 mt-0.5">Shapes every AI generation for this genre</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Dials */}
                        <div className="px-5 pb-6 flex flex-col gap-5 overflow-y-auto hide-scrollbar">
                            {dials.map(dial => (
                                <div key={dial.key}>
                                    <p className="text-xs font-bold text-zinc-400 tracking-widest mb-2">{dial.label}</p>
                                    <div className="flex gap-1.5 mb-1.5">
                                        {dial.levels.map((level, i) => (
                                            <button
                                                key={i}
                                                onClick={() => onChange({ ...profile, [dial.key]: i })}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors ${
                                                    profile[dial.key] === i
                                                        ? 'bg-zinc-800 text-white shadow-sm'
                                                        : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                                                }`}
                                            >
                                                {level.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-zinc-400 italic leading-relaxed min-h-[1rem]">
                                        {getSubtitle(dial)}
                                    </p>
                                </div>
                            ))}

                            <button
                                onClick={handleSave}
                                className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold tracking-wider transition-all ${
                                    saved
                                        ? 'bg-teal-400 text-white'
                                        : 'bg-orange-400 hover:bg-orange-500 text-white'
                                }`}
                            >
                                {saved
                                    ? <><Check size={14} /> SAVED AS DEFAULT</>
                                    : 'SAVE AS DEFAULT'
                                }
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
