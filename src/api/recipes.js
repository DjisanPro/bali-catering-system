/**
 * Recipes API — Supabase backed. Product ↔ ingredient associations.
 */
import { supabase } from '../lib/supabase';

export async function getAll(productId) {
  try {
    let query = supabase
      .from('recipes')
      .select('*, ingredients(name, unit)');

    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Update (replace) the recipe for a product.
 * @param {string} productId
 * @param {Array} recipeItems — [{ingredientId, quantity, unit}]
 */
export async function updateRecipe(productId, recipeItems) {
  try {
    // Delete existing recipes for this product
    const { error: delError } = await supabase
      .from('recipes')
      .delete()
      .eq('product_id', productId);

    if (delError) return { success: false, error: delError.message };

    if (recipeItems && recipeItems.length > 0) {
      const rows = recipeItems.map(item => ({
        product_id: productId,
        ingredient_id: item.ingredientId,
        quantity: item.quantity,
        unit: item.unit || 'kg',
        notes: item.notes,
      }));

      const { error: insError } = await supabase
        .from('recipes')
        .insert(rows);

      if (insError) return { success: false, error: insError.message };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
