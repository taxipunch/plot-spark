export type PlotIdeaInput = {
    title?: string;
    content: string;
    tags?: string[];
    status?: 'draft' | 'developing' | 'completed';
};

export type PlotIdeaOutput = {
    id: string;
    created_at: string;
    title: string;
    content: string;
    tags: string[];
    status: string;
};
