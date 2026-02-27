import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbcwvtkstdxdbvygpwzr.supabase.co';
const supabaseAnonKey = 'sb_publishable_IjR8OiP63nKeumq_LxsPBA_7DNKnZT8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
