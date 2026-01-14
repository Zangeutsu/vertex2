import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumn() {
    const { data, error } = await supabase
        .from('job_orders')
        .select('city')
        .limit(1);

    if (error) {
        if (error.message.includes('column "city" does not exist')) {
            console.log("CONFIRMADO: A coluna 'city' NÃO existe na base de dados.");
        } else {
            console.log("Erro ao verificar coluna:", error.message);
        }
    } else {
        console.log("A coluna 'city' EXISTE na base de dados.");
    }
}

checkColumn();
