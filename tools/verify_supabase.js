import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("Connecting to:", supabaseUrl);
    try {
        const { data, error } = await supabase.from('plots').select('*').limit(1);

        if (error) {
            console.log("❌ Supabase connection error:", error.message);
            process.exit(1);
        }

        console.log("✅ Successfully connected to Supabase 'plots' table.");
        console.log("Data:", data);
    } catch (err) {
        console.log("❌ Connection failed.", err);
    }
}

verify();
