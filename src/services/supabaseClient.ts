import { createClient } from '@supabase/supabase-js'

// Utiliza `import.meta.env` para acessar as variáveis de ambiente do Vite de forma segura.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem ser fornecidas.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Usa sessionStorage para que a sessão seja limpa quando a aba do navegador for fechada.
        storage: window.sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});