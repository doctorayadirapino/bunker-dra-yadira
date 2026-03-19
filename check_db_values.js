
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbcwvtkstdxdbvygpwzr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY3d2dGtzdGR4ZGJ2eWdwd3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjE1MDEsImV4cCI6MjA4NzYzNzUwMX0.CQ32p0s3S1O8FfSoW_7S-mEsSsTmYgjJl-7fCAldfeE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
