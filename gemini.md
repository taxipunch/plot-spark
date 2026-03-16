# Project Constitution (gemini.md)

## 1. Discovery
**North Star:** A functional and attractive app to use on the go whenever getting a plot idea.
**Integrations:** GitHub, Vercel, Supabase (via MCP).
**Source of Truth:** Supabase.
**Delivery Payload:** App on GitHub, hosted on Vercel.
**Behavioral Rules:** Effective, efficient, and casual tone.

## 2. Data Schema (Data-First Rule)
**Input Shape (`PlotIdeaInput`):**
```json
{
  "title": "string (optional)",
  "content": "string (required, the plot idea)",
  "tags": ["string"]
}
```

**Output Shape (`PlotIdeaOutput` / Supabase Table `plots`):**
```json
{
  "id": "uuid",
  "created_at": "timestamp",
  "title": "string",
  "content": "string",
  "tags": ["string"],
  "status": "string (e.g., 'draft', 'developing', 'completed')"
}
```

## 3. Behavioral Rules
- Prioritize reliability over speed.
- Deterministic business logic.
- 3-Layer Architecture enforced.
- Tone: Effective, efficient, casual.

## 4. Architectural Invariants
- UI: React, Tailwind CSS, Lucide Icons, Framer Motion.
- Backend/DB: Supabase (via MCP).
- Hosting: Vercel.
- The `tools/` folder contains atomic Python/execution scripts as needed.
- The `architecture/` folder contains SOPs.
