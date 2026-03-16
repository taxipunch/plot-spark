import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenTool, CheckCircle, Tag, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlotIdeaInput } from '../types/plot';

interface PlotInputProps {
    onPlotCreated: () => void;
}

export function PlotInput({ onPlotCreated }: PlotInputProps) {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim().toLowerCase()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);

        // Convert undefined title to null or empty
        const payload: PlotIdeaInput = {
            content: content.trim(),
            tags,
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
            setIsExpanded(false);
            onPlotCreated();
        } else {
            console.error('Error adding plot:', error);
        }
    };

    return (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 md:p-6 shadow-xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                <Sparkles size={120} className="text-indigo-500" />
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <input
                                type="text"
                                placeholder="Title (Optional)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-transparent text-lg md:text-xl font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 border-none outline-none focus:ring-0 mb-4 px-2"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    placeholder="What's the spark of your next plot?"
                    rows={isExpanded ? 4 : 2}
                    className="w-full bg-transparent text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 border-none outline-none focus:ring-0 resize-none text-base md:text-lg px-2 transition-all duration-300"
                    required
                />

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800"
                        >

                            <div className="flex flex-wrap gap-2 px-2">
                                {tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                                        #{tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-900 dark:hover:text-indigo-100 focus:outline-none">
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2 flex-1">
                                    <Tag size={16} className="text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Add tags... (Press Enter)"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        className="bg-transparent text-sm w-full outline-none text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400"
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsExpanded(false);
                                            setContent('');
                                            setTitle('');
                                            setTags([]);
                                        }}
                                        className="px-4 py-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !content.trim()}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/30"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <PenTool size={16} />}
                                        Save Plot
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>

            </form>
        </div>
    );
}
