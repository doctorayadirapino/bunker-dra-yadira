import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('No keys found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function purge() {
    console.log('Iniciando limpieza de Fisiatría...');

    // Primero borramos recetas (tienen Foreign Key a consultas)
    console.log('Borrando fisiatria_recipes...');
    const { error: rErr } = await supabase.from('fisiatria_recipes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (rErr) console.error('Error recetas:', rErr.message);
    else console.log('✅ Recetas borradas.');

    console.log('Borrando fisiatria_consultas...');
    const { error: cErr } = await supabase.from('fisiatria_consultas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (cErr) console.error('Error consultas:', cErr.message);
    else console.log('✅ Consultas borradas.');

    console.log('Limpieza Completada');
}

purge();
