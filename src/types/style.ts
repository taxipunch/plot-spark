export type StyleProfile = {
    tone: number;
    arc: number;
    dynamic: number;
    explicit: number;
};

export const DEFAULT_STYLE_PROFILE: StyleProfile = {
    tone: 2,
    arc: 2,
    dynamic: 2,
    explicit: 2,
};

export const STORAGE_KEY = 'plotSeedVault.styleDefaults';

export type DialLevel = {
    label: string;
    ref?: string;
    description?: string;
    her?: string;
    his?: string;
    harem?: string;
};

export const TONE_LEVELS: DialLevel[] = [
    { label: 'FROTHY',    ref: 'The Hating Game' },
    { label: 'WARM',      ref: 'Outlander' },
    { label: 'SENSUAL',   ref: 'Fifty Shades of Grey' },
    { label: 'DARK',      ref: 'Corrupt' },
    { label: 'OBSESSIVE', ref: 'Haunting Adeline' },
];

export const ARC_LEVELS: DialLevel[] = [
    {
        label: 'AWAKENED',
        her:   'Emotional awakening only — she falls in love but faces no real sexual challenge.',
        his:   'He learns to see her as a full person — respect precedes desire.',
        harem: 'Each interest is emotionally awakened but remains within her archetype.',
    },
    {
        label: 'WILLING',
        her:   'She opens to romantic love — desire is present but not destabilising.',
        his:   'He opens to vulnerability — allows himself to be chosen.',
        harem: 'The interests begin to cross archetype lines — each softened by proximity.',
    },
    {
        label: 'OPEN',
        her:   "She becomes willing — desire surfaces against her better judgment (Anna's arc).",
        his:   "He learns to love, not just want — surrenders emotional distance (Christian's arc).",
        harem: 'Each interest is genuinely challenged — the dynamic reshapes all of them.',
    },
    {
        label: 'LIBERATED',
        her:   'She embraces a broader sexual identity — her arc is one of genuine liberation.',
        his:   'He surrenders his control patterns — gives her the lead.',
        harem: 'Each interest crosses deeply into unfamiliar territory; hierarchies dissolve.',
    },
    {
        label: 'TRANSFORMED',
        her:   'She is fundamentally remade by desire — her old self could not have chosen this.',
        his:   'He is unmade and rebuilt — love costs him everything he was.',
        harem: 'The entire cast is transformed — no one exits the dynamic unchanged.',
    },
];

export const DYNAMIC_LEVELS: DialLevel[] = [
    { label: 'MEET-CUTE',  description: 'Playful, flirty, light-touch chemistry. The charm is in the sweetness.' },
    { label: 'SLOW BURN',  description: 'Warm tension, loaded silences, the pull before anything is named.' },
    { label: 'BANTER',     description: 'Sex-charged wit. Every exchange carries a double meaning.' },
    { label: 'SPARRING',   description: 'Sharp-tongued woman vs. difficult man. Conflict is the foreplay.' },
    { label: 'COMBUSTION', description: "Irascible rogue, defiant heroine. They fight like they'll never stop." },
];

export const EXPLICIT_LEVELS: DialLevel[] = [
    { label: 'OFFSTAGE',     description: 'Sexual tension only — nothing depicted. The charge lives in restraint.' },
    { label: 'CLOSED DOOR',  description: 'Sex implied and present — the reader knows, no details given.' },
    { label: 'OPEN DOOR',    description: 'Sex scenes depicted but secondary to the emotional plot.' },
    { label: 'PLOT-CENTRAL', description: 'Explicit scenes are major turning points — sexual decisions carry real narrative weight.' },
    { label: 'CORE ENGINE',  description: "The protagonist's sexual journey IS the plot. Every key decision runs through it." },
];
