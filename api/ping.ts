import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Missing Supabase env vars" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from("problems").select("id").limit(1);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
}
