import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://kbcwvtkstdxdbvygpwzr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY3d2dGtzdGR4ZGJ2eWdwd3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjE1MDEsImV4cCI6MjA4NzYzNzUwMX0.CQ32p0s3S1O8FfSoW_7S-mEsSsTmYgjJl-7fCAldfeE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: empresas, error } = await supabase.from('empresas').select('*');
    if (error) {
        console.error("Error consultando:", error);
        return;
    }
    fs.writeFileSync('empresas_dump.json', JSON.stringify(empresas, null, 2));
    console.log("Dumped", empresas.length, "empresas.");
}
main();
