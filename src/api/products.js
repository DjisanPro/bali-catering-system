/**
 * Products API — Supabase backed.
 */
import { supabase } from '../lib/supabase';

export async function getAll() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug, icon_name)')
      .order('is_featured', { ascending: false })
      .order('name');

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getById(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('id', id)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function create(product) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        category_id: product.categoryId,
        description: product.description || '',
        short_description: product.shortDescription,
        price: product.price,
        promotional_price: product.promotionalPrice,
        cost_price: product.costPrice || 0,
        image_url: product.imageUrl || '/placeholder.svg',
        gallery_images: product.galleryImages || [],
        is_available: product.isAvailable !== false,
        status: product.status || 'ACTIVE',
        is_specialty: product.isSpecialty || false,
        is_featured: product.isFeatured || product.featured || false,
        is_seasonal: product.isSeasonal || false,
        availability_days: product.availabilityDays || [],
        preparation_time_minutes: product.preparationTimeMinutes || 15,
        additional_info: product.additionalInfo,
        display_order: product.displayOrder || 0,
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
    if (updates.categoryId !== undefined) mapped.category_id = updates.categoryId;
    if (updates.description !== undefined) mapped.description = updates.description;
    if (updates.shortDescription !== undefined) mapped.short_description = updates.shortDescription;
    if (updates.price !== undefined) mapped.price = updates.price;
    if (updates.promotionalPrice !== undefined) mapped.promotional_price = updates.promotionalPrice;
    if (updates.costPrice !== undefined) mapped.cost_price = updates.costPrice;
    if (updates.imageUrl !== undefined) mapped.image_url = updates.imageUrl;
    if (updates.galleryImages !== undefined) mapped.gallery_images = updates.galleryImages;
    if (updates.isAvailable !== undefined) mapped.is_available = updates.isAvailable;
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.isSpecialty !== undefined) mapped.is_specialty = updates.isSpecialty;
    if (updates.isFeatured !== undefined) mapped.is_featured = updates.isFeatured;
    if (updates.isSeasonal !== undefined) mapped.is_seasonal = updates.isSeasonal;
    if (updates.availabilityDays !== undefined) mapped.availability_days = updates.availabilityDays;
    if (updates.preparationTimeMinutes !== undefined) mapped.preparation_time_minutes = updates.preparationTimeMinutes;
    if (updates.additionalInfo !== undefined) mapped.additional_info = updates.additionalInfo;
    if (updates.displayOrder !== undefined) mapped.display_order = updates.displayOrder;
    mapped.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('products')
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
      .from('products')
      .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Alias for AppContext compatibility
export const patchUpdate = update;
