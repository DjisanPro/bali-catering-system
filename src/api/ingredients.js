/**
 * Ingredients API — Supabase backed.
 */
import { supabase } from '../lib/supabase';

export async function getAll() {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name');

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function create(ingredient) {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .insert({
        name: ingredient.name,
        category: ingredient.category || 'Geral',
        unit: ingredient.unit || 'kg',
        current_stock: ingredient.currentStock || 0,
        minimum_stock: ingredient.minimumStock || 0,
        cost_per_unit: ingredient.costPerUnit || 0,
        supplier: ingredient.supplier,
        status: ingredient.status || 'ACTIVE',
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function update(id, updates) {
  try {
    const mapped = {};
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.category !== undefined) mapped.category = updates.category;
    if (updates.unit !== undefined) mapped.unit = updates.unit;
    if (updates.currentStock !== undefined) mapped.current_stock = updates.currentStock;
    if (updates.minimumStock !== undefined) mapped.minimum_stock = updates.minimumStock;
    if (updates.costPerUnit !== undefined) mapped.cost_per_unit = updates.costPerUnit;
    if (updates.supplier !== undefined) mapped.supplier = updates.supplier;
    if (updates.status !== undefined) mapped.status = updates.status;
    mapped.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('ingredients')
      .update(mapped)
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function remove(id) {
  try {
    const { error } = await supabase
      .from('ingredients')
      .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Alias for AppContext — record a stock movement (ENTRY/EXIT/ADJUSTMENT)
export const addMovement = async (movement) => {
  try {
    // Get current stock
    const { data: ingredient, error: fetchError } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', movement.ingredientId)
      .single();

    if (fetchError || !ingredient) return { success: false, error: 'Ingrediente não encontrado' };

    const currentStock = Number(ingredient.current_stock);
    const qty = Number(movement.quantity);
    let newStock = currentStock;

    if (movement.type === 'ENTRY' || movement.type === 'ADJUSTMENT') {
      newStock = movement.type === 'ADJUSTMENT' ? qty : currentStock + qty;
    } else {
      newStock = Math.max(0, currentStock - qty);
    }

    const { error: updateError } = await supabase
      .from('ingredients')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', movement.ingredientId);

    if (updateError) return { success: false, error: updateError.message };

    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        ingredient_id: movement.ingredientId,
        ingredient_name: ingredient.name,
        unit: ingredient.unit,
        type: movement.type,
        quantity: qty,
        previous_stock: currentStock,
        new_stock: newStock,
        reason: movement.reason || 'Ajuste manual',
        reference_order_id: movement.referenceOrderId,
        reference_order_number: movement.referenceOrderNumber,
        performed_by: movement.performedBy || 'Sistema',
        authorized_by: movement.authorizedBy,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
