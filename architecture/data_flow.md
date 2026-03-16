# Data Flow
Primary data storage is Supabase.

Data flows from: React Component `->` Supabase client `->` Supabase Project.

Since this is a client application without a middle tier node server, Supabase RLS is fully used to control data access directly from the browser.

`tools/` provide CLI alternatives for automated data operations mapped to the component logic.
