
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcvfsbxfpjlnqrugmsrm.supabase.co';
const supabaseKey = 'sb_publishable_emSpIDkRTiVeW03uLEzHmQ_8GKTGZ5c';

export const supabase = createClient(supabaseUrl, supabaseKey);
