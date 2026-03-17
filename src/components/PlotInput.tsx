import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlotIdeaInput } from '../types/plot';
import { StyleProfile, TONE_LEVELS, ARC_LEVELS, DYNAMIC_LEVELS, EXPLICIT_LEVELS } from '../types/style';
import { loadStyleProfile } from '../lib/style';
import { StyleTuner } from './StyleTuner';

interface PlotInputProps {
    onPlotCreated: () => void;
}

const GENRES = ['ROMANCE', 'ADVENTURE', 'HAREM'];
const SUGGESTED_TAGS = ['Power Dynamic', 'Forbidden', 'Revenge', 'Mistaken Identity', 'Rivals', 'Survival', 'Conspiracy', 'Second Chance', 'Reluctant Alliance', 'Dark Secret'];

export function PlotInput({ onPlotCreated }: PlotInputProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [genre, setGenre] = useState(GENRES[0]);
    const [tags, setTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profile, setProfile] = useState<StyleProfile>(() => loadStyleProfile());
    const [tunerOpen, setTunerOpen] = useState(false);

    const toggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);

        const payload: PlotIdeaInput = {
            content: content.trim(),
            tags: [...tags, genre], // storing genre as a tag for now based on previous schema
            status: 'draft'
        };

        if (title.trim()) {
            payload.title = title.trim();
        }

        const { error } = await supabase.from('plots').insert([payload]);

        setIsSubmitting(false);

        if (!error) {
            setContent('');
            setTitle('');
            setTags([]);
            setGenre(GENRES[0]);
            onPlotCreated();
        } else {
            console.error('Error adding plot:', error);
        }
    };

    return (
        <div className="bg-white rounded-t-[2.5rem] p-6 pb-20 shadow-sm flex flex-col h-full overflow-y-auto hide-scrollbar">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Title Section */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 tracking-widest">TITLE</label>
                    <input
                        type="text"
                        placeholder="Enter spark title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 border-none outline-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-orange-100 transition-shadow"
                    />
                </div>

                {/* Content Section */}
                <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-400 mb-2 tracking-widest">THE SPARK</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describe the raw idea..."
                        className="w-full bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 border-none outline-none rounded-3xl px-4 py-4 focus:ring-2 focus:ring-orange-100 resize-none h-40 transition-shadow"
                        required
                    />
                </div>

                {/* Genre Section */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 tracking-widest">GENRE</label>
                    <div className="flex gap-2">
                        {GENRES.map(g => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setGenre(g)}
                                className={`flex-1 py-3 rounded-2xl text-xs font-bold tracking-wide transition-colors ${
                                    genre === g 
                                    ? 'bg-orange-400 text-white shadow-sm' 
                                    : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                                }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fine-Tune Button */}
                <button
                    type="button"
                    onClick={() => setTunerOpen(true)}
                    className="flex items-center gap-2 w-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 text-zinc-500 px-4 py-3 rounded-2xl transition-colors text-left"
                >
                    <SlidersHorizontal size={13} className="shrink-0 text-zinc-400" />
                    <span className="text-xs font-bold tracking-wide text-zinc-400">FINE-TUNE</span>
                    <span className="text-xs text-zinc-300 ml-1">
                        {TONE_LEVELS[profile.tone].label} · {ARC_LEVELS[profile.arc].label} · {DYNAMIC_LEVELS[profile.dynamic].label} · {EXPLICIT_LEVELS[profile.explicit].label}
                    </span>
                </button>

                {/* Tags Section */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 tracking-widest">TAGS</label>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_TAGS.map(tag => {
                            const isActive = tags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                                        isActive 
                                        ? 'bg-zinc-800 text-white' 
                                        : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                                    }`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className={`w-full py-4 rounded-2xl text-sm font-bold tracking-wider transition-all mt-4 mb-20 shadow-sm text-white ${content.trim() ? 'bg-orange-400 hover:bg-orange-500 cursor-pointer' : 'bg-[#fde1cb] opacity-50 cursor-not-allowed'}`}
                >
                    {isSubmitting ? 'SAVING...' : 'SAVE SPARK'}
                </button>

            </form>
        <StyleTuner
            open={tunerOpen}
            onClose={() => setTunerOpen(false)}
            profile={profile}
            onChange={setProfile}
            genre={genre}
        />
        </div>
    );
}
