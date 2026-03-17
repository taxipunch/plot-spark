import {
    StyleProfile,
    DEFAULT_STYLE_PROFILE,
    STORAGE_KEY,
    TONE_LEVELS,
    ARC_LEVELS,
    DYNAMIC_LEVELS,
    EXPLICIT_LEVELS,
} from '../types/style';

function getGenreKey(genre: string): 'romance' | 'adventure' | 'harem' {
    const g = genre.toUpperCase();
    if (g.includes('ROMANCE')) return 'romance';
    if (g.includes('HAREM')) return 'harem';
    return 'adventure';
}

export function buildStyleContext(profile: StyleProfile, genre: string): string {
    const genreKey = getGenreKey(genre);
    const tone    = TONE_LEVELS[profile.tone];
    const arc     = ARC_LEVELS[profile.arc];
    const dynamic = DYNAMIC_LEVELS[profile.dynamic];
    const explicit = EXPLICIT_LEVELS[profile.explicit];

    const arcLine = genreKey === 'romance'
        ? `Her arc: ${arc.her} His arc (complementary): ${arc.his}`
        : genreKey === 'harem'
        ? `Cast arcs: ${arc.harem}`
        : `His arc: ${arc.his} Her arc (complementary): ${arc.her}`;

    return `
Creative style parameters — let these shape register, emotional temperature, obstacles, and how directly sexual dynamics enter the plot:
- TONE: ${tone.label} (calibrated to the register of "${tone.ref}")
- CHARACTER ARCS: ${arcLine}
- INTERACTION DYNAMIC: ${dynamic.label} — ${dynamic.description}
- EXPLICIT THEME LEVEL: ${explicit.label} — ${explicit.description}`;
}

export function loadStyleProfile(): StyleProfile {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? { ...DEFAULT_STYLE_PROFILE, ...JSON.parse(stored) } : DEFAULT_STYLE_PROFILE;
    } catch {
        return DEFAULT_STYLE_PROFILE;
    }
}

export function saveStyleProfile(profile: StyleProfile): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
