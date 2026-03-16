import { GoogleGenAI } from '@google/genai';
import { BeatArc } from '../types/plot';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MODEL = 'gemini-2.0-flash';

async function callGemini(prompt: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
    });
    return response.text ?? '';
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
