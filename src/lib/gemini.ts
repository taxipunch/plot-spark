import { BeatArc } from '../types/plot';

async function callGemini(prompt: string): Promise<string> {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        throw new Error(`Failed to generate content: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || '';
}

function parseJSON<T>(raw: string): T {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
}

// ─── Generate 4 Variations ───────────────────────────────────────────────────

export async function generateVariations(content: string, genre: string): Promise<string[]> {
    const isRomance = genre.toUpperCase().includes('ROMANCE');

    const focus = isRomance
        ? 'Each variation should explore a different type of forbidden or emotionally charged dynamic: power imbalance, rivals-to-lovers, secret identity, second chance, or class divide. Vary the emotional stakes and the nature of the obstacle.'
        : 'Each variation should explore a different adventure context: espionage/covert ops, survival/wilderness, heist/infiltration, or war/conflict. Vary the competence fantasy and the nature of the threat.';

    const prompt = `You are a genre fiction story development expert.

Given this raw plot spark, generate exactly 4 distinct variations that each take the seed in a different direction.
${focus}

Raw spark: "${content}"

Return ONLY a valid JSON array of exactly 4 strings — no explanation, no markdown fences, no extra text.
Each string is a vivid 2-3 sentence variation premise.

Example format:
["Variation one premise here.", "Variation two premise here.", "Variation three premise here.", "Variation four premise here."]`;

    const raw = await callGemini(prompt);
    return parseJSON<string[]>(raw);
}

// ─── Full Spark Development ───────────────────────────────────────────────────

export type DevelopedSpark = {
    logline: string;
    core_tension: string;
    hook: string;
    central_twist: string;
    beat_arc: BeatArc;
};

export async function developSpark(content: string, genre: string): Promise<DevelopedSpark> {
    const isRomance = genre.toUpperCase().includes('ROMANCE');

    const genreGuide = isRomance
        ? `Genre context — EROTIC/EMOTIONAL ROMANCE:
- Logline: Foreground the emotional/forbidden dimension and what it costs the heroine.
- Core tension: The specific incompatibility that makes the attraction dangerous, not just uncomfortable.
- Hook: The charged first encounter that establishes the power dynamic.
- Central twist: A revelation that raises the emotional stakes — a secret, a betrayal, a prior claim.
- Beat arc: Beat 1 = desire ignites against better judgment. Beat 2 = the cost of wanting becomes real. Beat 3 = the impossible choice that forces surrender or sacrifice.`
        : `Genre context — MEN'S ADVENTURE FICTION:
- Logline: Foreground competence, high stakes, and the specific threat.
- Core tension: The mission objective in direct collision with the personal relationship.
- Hook: The opening action beat that establishes the protagonist's capability and the danger level.
- Central twist: An intelligence failure or betrayal that recontextualises the mission.
- Beat arc: Beat 1 = mission engagement, first contact with ally/target. Beat 2 = the mission complicates — loyalty fractures. Beat 3 = the climax forces the protagonist to choose between the mission and something that matters more.`;

    const prompt = `You are a genre fiction story development expert.

Develop this raw spark into a full story premise. Be specific, vivid, and dramatically sharp.

${genreGuide}

Raw spark: "${content}"

Return ONLY valid JSON in this exact shape — no markdown, no extra keys:
{
  "logline": "One sentence. Character + desire + obstacle + stakes.",
  "core_tension": "2-3 sentences on the central dramatic incompatibility.",
  "hook": "2-3 sentences on the opening scene/moment that hooks the reader.",
  "central_twist": "2-3 sentences on the revelation that escalates everything.",
  "beat_arc": {
    "beat1": "Act 1 shape: setup and ignition.",
    "beat2": "Act 2 shape: escalation and cost.",
    "beat3": "Act 3 shape: climax and resolution."
  }
}`;

    const raw = await callGemini(prompt);
    return parseJSON<DevelopedSpark>(raw);
}

// ─── B-Plot Generation ────────────────────────────────────────────────────────

export type GeneratedBPlot = {
    title: string;
    content: string;
    independent_stakes: string;
    cost_to_a_plot: string;
    climax_collision: string;
};

export async function generateBPlot(content: string, genre: string): Promise<GeneratedBPlot> {
    const isRomance = genre.toUpperCase().includes('ROMANCE');

    const genreGuide = isRomance
        ? `B-plot for ROMANCE — the heroine needs an independent agenda that has NOTHING to do with desire but would be destroyed if she falls for him. Examples: she's investigating him (journalist/spy/whistleblower), she needs something he controls (inheritance, evidence, a person), she has a prior loyalty his world threatens. The B-plot should make every step toward him a step away from the thing she came for. The climax must force a real choice — not just emotional surrender.`
        : `B-plot for ADVENTURE — the mission and the relationship must be in direct tension. The woman he's drawn to is either the asset he can't afford to want, or she's connected to the threat. The B-plot should NOT resolve before the romantic payoff — the two strands must braid and collide in the same climactic scene. The reader must be genuinely unsure which he'll choose right until he chooses both.`;

    const prompt = `You are a structural story expert specialising in genre fiction B-plots.

Core principle: The B-plot creates a genuine COST for pursuing the A-plot (the attraction) — not just an obstacle, a real cost. Something that makes the reader unsure which the protagonist should choose, right until they choose both in a way that feels earned.

${genreGuide}

A-plot spark: "${content}"

Generate a B-plot that:
1. Has genuine independent stakes (it would matter even if the two leads never touched)
2. Creates direct cost for pursuing the romantic/attraction line
3. Has a natural climax collision point with the A-plot

Return ONLY valid JSON — no markdown:
{
  "title": "Short B-plot name (5-8 words)",
  "content": "2-3 sentences describing the B-plot strand.",
  "independent_stakes": "1-2 sentences: what's at stake in the B-plot independent of the attraction.",
  "cost_to_a_plot": "1-2 sentences: the specific cost — what pursuing the A-plot destroys or risks in the B-plot.",
  "climax_collision": "2-3 sentences: how these two strands collide in the same climactic scene, forcing the impossible choice that resolves as one event."
}`;

    const raw = await callGemini(prompt);
    return parseJSON<GeneratedBPlot>(raw);
}

// ─── Situations for Spark ─────────────────────────────────────────────────────

export type GeneratedSituation = {
    title: string;
    content: string;
};

export async function generateSituationsForSpark(sparkContent: string, genre: string): Promise<GeneratedSituation[]> {
    const isRomance = genre.toUpperCase().includes('ROMANCE');

    const genreGuide = isRomance
        ? `Generate 4 charged interpersonal scenes: the ignition (first moment the attraction becomes undeniable), the escalation (a scene where desire costs something real), the confrontation/revelation (a secret or wound surfaces), and the aftermath (the quiet charged moment after everything shifts).`
        : `Generate 4 high-stakes operational scenes: the first contact (protagonist meets the key player/asset under pressure), the complication (the mission changes or a loyalty fractures), the confrontation (the central threat or betrayal becomes direct), and the pivot (the moment the protagonist makes the choice that defines the story).`;

    const prompt = `You are a scene-level story development expert.

Given this story spark premise, generate exactly 4 charged scene situations that naturally live inside this story.
${genreGuide}

Each situation should be a specific, vivid, concrete moment — not a summary. Make them feel like real scenes, not plot summaries.

Spark premise: "${sparkContent}"

Return ONLY valid JSON — no markdown fences, no explanation:
[
  {"title": "Short scene title (4-6 words)", "content": "2-3 sentences describing the scene, its charge, and the specific tension in the room."},
  {"title": "...", "content": "..."},
  {"title": "...", "content": "..."},
  {"title": "...", "content": "..."}
]`;

    const raw = await callGemini(prompt);
    return parseJSON<GeneratedSituation[]>(raw);
}

// ─── Situation Variations ─────────────────────────────────────────────────────

export async function generateSituationVariations(situationContent: string, genre: string): Promise<string[]> {
    const isRomance = genre.toUpperCase().includes('ROMANCE');

    const axes = isRomance
        ? 'Vary across: emotional register (hostile / tender / ambiguous / darkly comic), who holds the power and how it shifts, what each character is hiding, and what would happen if the scene ended differently.'
        : 'Vary across: threat level (cold operational / openly hostile / morally ambiguous / grudging alliance), who has tactical advantage, what information is missing, and what the protagonist risks losing.';

    const prompt = `You are a scene development expert.

Given this scene situation, generate exactly 4 distinct variations — each takes the same core dynamic in a different direction.
${axes}

Scene: "${situationContent}"

Return ONLY a valid JSON array of exactly 4 strings — no markdown, no explanation.
Each string is a vivid 2-3 sentence variation of the scene.

["Variation 1 here.", "Variation 2 here.", "Variation 3 here.", "Variation 4 here."]`;

    const raw = await callGemini(prompt);
    return parseJSON<string[]>(raw);
}

// ─── Situation Development ────────────────────────────────────────────────────

export type DevelopedSituation = {
    setting_atmosphere: string;
    emotional_temperature: string;
    character_positions: string;
    scene_function: string;
    the_moment: string;
    exit_states: string[];
};

export async function developSituation(situationContent: string, genre: string): Promise<DevelopedSituation> {
    const isRomance = genre.toUpperCase().includes('ROMANCE');

    const genreGuide = isRomance
        ? `Genre: ROMANCE/EROTIC. Focus on: the physical proximity and what it costs to maintain composure, the thing neither character will say, the specific sensory detail that makes the attraction undeniable, what each character came into this scene wanting and what they leave wanting instead.`
        : `Genre: ADVENTURE. Focus on: the tactical situation and what it demands, the operational risk of feeling anything, the specific competence or vulnerability that changes the dynamic, what the protagonist came in to achieve and what he's now not sure he can afford to lose.`;

    const prompt = `You are a scene-level story craft expert.

Develop this scene situation into its full dramatic anatomy.
${genreGuide}

Scene: "${situationContent}"

Return ONLY valid JSON — no markdown:
{
  "setting_atmosphere": "Where this happens. Time of day, physical space, sensory texture. What the environment is doing to the characters.",
  "emotional_temperature": "The charge between the characters before anyone speaks. What's been unsaid. What the air feels like.",
  "character_positions": "What each character wants from this scene, what they're protecting, and what they're pretending not to feel.",
  "scene_function": "What this scene does in the story — reveals, escalates, turns, or resets? What the reader learns here that changes everything.",
  "the_moment": "The specific beat — a gesture, a line, a silence — that makes this scene unforgettable. The thing the reader will remember.",
  "exit_states": ["How this scene could end — option 1 and where it leaves both characters.", "Option 2 and its emotional aftermath.", "Option 3 — the unexpected resolution."]
}`;

    const raw = await callGemini(prompt);
    return parseJSON<DevelopedSituation>(raw);
}
