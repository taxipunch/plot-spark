export type PlotIdeaInput = {
    title?: string;
    content: string;
    tags?: string[];
    genre?: string;
    status?: 'draft' | 'developing' | 'completed';
    spark_type?: 'original' | 'variation';
    parent_spark_id?: string;
};

export type BeatArc = {
    beat1: string;
    beat2: string;
    beat3: string;
};

export type PlotIdeaOutput = {
    id: string;
    created_at: string;
    title: string;
    content: string;
    tags: string[];
    status: string;
    is_starred: boolean;
    genre: string | null;
    logline: string | null;
    core_tension: string | null;
    hook: string | null;
    central_twist: string | null;
    beat_arc: BeatArc | null;
    parent_spark_id: string | null;
    spark_type: 'original' | 'variation';
};

export type BPlot = {
    id: string;
    created_at: string;
    title: string | null;
    content: string;
    independent_stakes: string | null;
    cost_to_a_plot: string | null;
    climax_collision: string | null;
    genre: string | null;
    tags: string[];
};
