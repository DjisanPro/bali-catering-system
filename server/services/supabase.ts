import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Lazy init gracioso quando as variáveis de ambiente ainda não foram definidas pelo usuário
      return null;
    }

    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.warn('Falha ao inicializar o cliente Supabase:', err);
      return null;
    }
  }

  return supabaseClient;
}

export const supabaseService = {
  isConfigured(): boolean {
    return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const client = getSupabase();
    if (!client) {
      return {
        success: false,
        message: 'Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas no ambiente.',
      };
    }

    try {
      const { data, error } = await client.from('products').select('count', { count: 'exact', head: true });
      if (error) {
        return { success: false, message: `Erro ao conectar com tabela no Supabase: ${error.message}` };
      }
      return { success: true, message: 'Conexão com PostgreSQL Supabase estabelecida com sucesso.' };
    } catch (err: any) {
      return { success: false, message: `Exceção de rede no Supabase: ${err.message}` };
    }
  },

  async syncProducts(products: any[]) {
    const client = getSupabase();
    if (!client) return { success: false, reason: 'unconfigured' };

    const { data, error } = await client.from('products').upsert(products, { onConflict: 'id' });
    if (error) throw error;
    return { success: true, data };
  },

  async syncOrders(orders: any[]) {
    const client = getSupabase();
    if (!client) return { success: false, reason: 'unconfigured' };

    const { data, error } = await client.from('orders').upsert(orders, { onConflict: 'id' });
    if (error) throw error;
    return { success: true, data };
  },

  async syncCashShifts(shifts: any[]) {
    const client = getSupabase();
    if (!client) return { success: false, reason: 'unconfigured' };

    const { data, error } = await client.from('cash_shifts').upsert(shifts, { onConflict: 'id' });
    if (error) throw error;
    return { success: true, data };
  },
};
