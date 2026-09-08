/**
 * Settings API — Supabase backed (key-value store).
 */
import { supabase } from '../lib/supabase';

const DEFAULT_SETTINGS = {
  name: 'Bali Catering Service',
  tagline: 'Sabor Moçambicano com Amor',
  location: 'Tete, Moçambique',
  locationDetails: 'Bairro 24 de Julho, Av. Eduardo Mondlane',
  phones: '+2588482051465,+258820239848',
  whatsappPrimary: '+2588482051465',
  whatsappSecondary: '+258820239848',
  email: 'info@balicatering.co.mz',
  currency: 'MT',
  defaultDeliveryFee: '100',
  openingHoursWeekday: '07:00 - 20:00',
  openingHoursWeekend: '08:00 - 18:00',
  autoDeductStockOnConfirm: 'true',
  specialNotice: 'Bem-vindo ao Bali Catering Service!',
};

export async function get() {
  try {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('key, value');

    if (error) return { success: false, error: error.message };

    const settings = {};
    for (const row of (data || [])) {
      settings[row.key] = row.value;
    }

    // Merge with defaults for any missing keys
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      if (!settings[key]) settings[key] = value;
    }

    return { success: true, data: settings };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function update(settingsObj) {
  try {
    const rows = [];
    for (const [key, value] of Object.entries(settingsObj)) {
      rows.push({ key, value: String(value), updated_at: new Date().toISOString() });
    }

    const { error } = await supabase
      .from('restaurant_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getPublic() {
  return get();
}

// Aliases for AppContext compatibility
export const getConfig = get;
export const updateConfig = update;
