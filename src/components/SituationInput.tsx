import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { SituationInput as SituationInputType } from '../types/plot';

interface SituationInputProps {
    onSituationCreated: () => void;
}

const GENRES = ['ROMANCE', 'ADVENTURE', 'HAREM'];
const SUGGESTED_TAGS = ['First Meeting', 'Confrontation', 'Quiet Tension', 'Revelation', 'Power Shift', 'Aftermath', 'Forbidden Proximity', 'Betrayal', 'The Ask', 'Last Chance'];

export function SituationInput({ onSituationCreated }: SituationInputProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [genre, setGenre] = useState(GENRES[0]);
    const [tags, setTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleTag = (tag: string) => {
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);

        const payload: SituationInputType = {
            content: content.trim(),
            genre,
            tags: [...tags],
        };

        if (title.trim()) payload.title = title.trim();

        const { error } = await supabase.from('situations').insert([payload]);

        setIsSubmitting(false);

        if (!error) {
            setContent('');
            setTitle('');
            setTags([]);
            setGenre(GENRES[0]);
            onSituationCreated();
        } else {
            console.error('Error adding situation:', error);
        }
    };

    return (
        <div className="bg-white rounded-t-[2.5rem] p-6 pb-20 shadow-sm flex flex-col h-full overflow-y-auto hide-scrollbar">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 tracking-widest">SCENE TITLE</label>
                    <input
                        type="text"
                        placeholder="Name this scene..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 border-none outline-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-violet-100 transition-shadow"
                    />
                </div>

                <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-400 mb-2 tracking-widest">THE SITUATION</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Two people in a room. What's charged? What's unspoken? What happens?"
                        className="w-full bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 border-none outline-none rounded-3xl px-4 py-4 focus:ring-2 focus:ring-violet-100 resize-none h-40 transition-shadow"
                        required
                    />
                </div>

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
                                    ? 'bg-violet-400 text-white shadow-sm'
                                    : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                                }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 tracking-widest">SCENE TYPE</label>
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

                <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="w-full bg-violet-400 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors mt-4 mb-20 shadow-sm"
                >
                    {isSubmitting ? 'SAVING...' : 'SAVE SCENE'}
                </button>

            </form>
        </div>
    );
}
