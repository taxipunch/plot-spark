# UI Components Data Flow SOP

## Context
Plot Spark App uses a React + Tailwind + Vite architecture. The data source is Supabase.

## Data Models
`PlotIdea` Model:
- `id`: UUID
- `title`: string | optional
- `content`: string | required
- `tags`: string[] | default []
- `status`: string | default 'draft'

## Flow
1. User enters text in `<PlotInput />`.
2. On submit, validate `content` != empty.
3. `<PlotInput />` invokes a `savePlot(data)` action mapping to `tools/db_ops.py` concepts (in the browser context this translates to `supabase.from('plots').insert()`).
4. `<PlotFeed />` listens for updates or pulls immediately after submit, fetching `plots` ordered by `created_at` descending.
5. Plots render sequentially inside `<PlotCard />` components.

## Golden Rule
If data models change in `gemini.md`, this SOP updates to reflect the new component state handling.
