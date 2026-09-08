/**
 * Inventory/Stock API — Supabase backed.
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

export async function addMovement(movement) {
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

    // Update ingredient stock
    const { error: updateError } = await supabase
      .from('ingredients')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', movement.ingredientId);

    if (updateError) return { success: false, error: updateError.message };

    // Record movement
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
        reason: movement.reason,
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
}

export async function getMovements(filters = {}) {
  try {
    let query = supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.ingredientId) query = query.eq('ingredient_id', filters.ingredientId);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getLowStock() {
  try {
    const { data: all, error: allError } = await supabase
      .from('ingredients')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('name');

    if (allError) return { success: false, error: allError.message };
    const low = (all || []).filter(i => Number(i.current_stock) <= Number(i.minimum_stock));
    return { success: true, data: low };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Deduct stock based on recipes when an order is confirmed.
 * Accepts either an order ID (fetches order items from DB) or an items array.
 * @param {string|Array} orderIdOrItems - order id OR array of {productId, quantity}
 * @param {string} performedBy - who performed the deduction
 */
export async function deductStock(orderIdOrItems, performedBy = 'Sistema') {
  try {
    let items = orderIdOrItems;

    // If given an order ID, fetch the order items from the database
    if (typeof orderIdOrItems === 'string' || typeof orderIdOrItems === 'number') {
      const orderId = String(orderIdOrItems);
      const { data: orderItems, error: oiErr } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (oiErr) return { success: false, error: oiErr.message };

      items = (orderItems || []).map(oi => ({
        productId: oi.product_id,
        quantity: oi.quantity,
      }));
    }

    if (!items || items.length === 0) return { success: true };

    // Fetch all products to get their recipes
    const productIds = items.map(i => i.productId);
    const { data: products, error: pErr } = await supabase
      .from('products')
      .select('id')
      .in('id', productIds);

    if (pErr) return { success: false, error: pErr.message };

    // Get all recipes for these products
    const { data: recipes, error: rErr } = await supabase
      .from('recipes')
      .select('*')
      .in('product_id', productIds);

    if (rErr) return { success: false, error: rErr.message };

    // Group recipes by product
    const recipesByProduct = {};
    for (const r of (recipes || [])) {
      if (!recipesByProduct[r.product_id]) recipesByProduct[r.product_id] = [];
      recipesByProduct[r.product_id].push(r);
    }

    // Calculate required ingredients
    const required = {};
    for (const item of items) {
      const itemRecipes = recipesByProduct[item.productId] || [];
      const qty = Number(item.quantity || 1);
      for (const r of itemRecipes) {
        const ingredientId = r.ingredient_id;
        const need = Number(r.quantity) * qty;
        if (!required[ingredientId]) required[ingredientId] = 0;
        required[ingredientId] += need;
      }
    }

    // Deduct from each ingredient
    for (const [ingredientId, qty] of Object.entries(required)) {
      const { data: ing, error: iErr } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', ingredientId)
        .single();

      if (iErr || !ing) continue;

      const prev = Number(ing.current_stock);
      const newStock = Math.max(0, prev - qty);

      await supabase
        .from('ingredients')
        .update({ current_stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', ingredientId);

      await supabase
        .from('stock_movements')
        .insert({
          ingredient_id: ingredientId,
          ingredient_name: ing.name,
          unit: ing.unit,
          type: 'EXIT_ORDER',
          quantity: qty,
          previous_stock: prev,
          new_stock: newStock,
          reason: 'Baixa por venda',
          performed_by: performedBy,
        });
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
