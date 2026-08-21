import { Ingredient, Product, Order, StockMovement, StockMovementType, RecipeIngredient, EngineResult } from '../types';

export interface StockAvailabilityCheck {
  isAvailable: boolean;
  missingIngredients: Array<{
    ingredientId: string;
    name: string;
    required: number;
    available: number;
    unit: string;
  }>;
}

export const stockEngine = {
  calculateRecipeCost(
    productOrRecipe: Product | RecipeIngredient[],
    ingredients: Ingredient[]
  ): number {
    const recipeItems = Array.isArray(productOrRecipe)
      ? productOrRecipe
      : productOrRecipe.ingredients || [];

    if (recipeItems.length === 0) {
      return Array.isArray(productOrRecipe) ? 0 : productOrRecipe.costPrice || 0;
    }
    const ingMap = new Map(ingredients.map((i) => [i.id, i.costPerUnit]));
    const total = recipeItems.reduce((acc, item) => {
      const unitCost = ingMap.get(item.ingredientId) || 0;
      return acc + unitCost * item.quantity;
    }, 0);
    return Math.round(total);
  },

  calculateGrossMargin(price: number, cost: number): number {
    if (price <= 0) return 0;
    return Math.round(((price - cost) / price) * 100);
  },

  checkStockAvailability(
    order: Order,
    products: Product[],
    ingredients: Ingredient[]
  ): StockAvailabilityCheck {
    const requiredMap = new Map<string, { name: string; unit: string; required: number }>();
    const ingMap = new Map(ingredients.map((i) => [i.id, i]));

    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.ingredients) continue;

      for (const recipeItem of product.ingredients) {
        const ing = ingMap.get(recipeItem.ingredientId);
        if (!ing) continue;

        const needed = Number((recipeItem.quantity * item.quantity).toFixed(3));
        const currentReq = requiredMap.get(ing.id) || { name: ing.name, unit: ing.unit, required: 0 };
        currentReq.required = Number((currentReq.required + needed).toFixed(3));
        requiredMap.set(ing.id, currentReq);
      }
    }

    const missingIngredients: Array<{
      ingredientId: string;
      name: string;
      required: number;
      available: number;
      unit: string;
    }> = [];

    requiredMap.forEach((req, ingredientId) => {
      const ing = ingMap.get(ingredientId);
      const available = ing ? ing.currentStock : 0;
      if (available < req.required) {
        missingIngredients.push({
          ingredientId,
          name: req.name,
          required: req.required,
          available,
          unit: req.unit,
        });
      }
    });

    return {
      isAvailable: missingIngredients.length === 0,
      missingIngredients,
    };
  },

  processOrderStockDeduction(
    order: Order,
    products: Product[],
    ingredients: Ingredient[],
    allowNegativeStock = false
  ): {
    success: boolean;
    error?: string;
    updatedIngredients: Ingredient[];
    generatedMovements: StockMovement[];
  } {
    if (!allowNegativeStock) {
      const check = this.checkStockAvailability(order, products, ingredients);
      if (!check.isAvailable) {
        const details = check.missingIngredients
          .map((m) => `${m.name} (Precisa: ${m.required}${m.unit}, Disponível: ${m.available}${m.unit})`)
          .join('; ');
        return {
          success: false,
          error: `Estoque insuficiente para preparar o pedido: ${details}`,
          updatedIngredients: ingredients,
          generatedMovements: [],
        };
      }
    }

    const updatedMap = new Map<string, Ingredient>(ingredients.map((i) => [i.id, { ...i }]));
    const movements: StockMovement[] = [];
    const now = new Date().toISOString();

    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.ingredients || product.ingredients.length === 0) continue;

      for (const recipeItem of product.ingredients) {
        const ing = updatedMap.get(recipeItem.ingredientId);
        if (!ing) continue;

        const totalDeduction = Number((recipeItem.quantity * item.quantity).toFixed(3));
        const prevStock = ing.currentStock;
        let newStock = Number((prevStock - totalDeduction).toFixed(3));

        if (!allowNegativeStock && newStock < 0) {
          newStock = 0;
        }

        ing.currentStock = newStock;
        ing.lastUpdated = now;
        updatedMap.set(ing.id, ing);

        movements.push({
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ingredientId: ing.id,
          ingredientName: ing.name,
          unit: ing.unit,
          type: 'EXIT_ORDER',
          quantity: totalDeduction,
          previousStock: prevStock,
          newStock: newStock,
          reason: `Consumo automático ficha técnica - Pedido ${order.orderNumber} (${item.quantity}x ${item.productName})`,
          referenceOrderId: order.id,
          referenceOrderNumber: order.orderNumber,
          performedBy: 'Motor de Ficha Técnica',
          createdAt: now,
        });
      }
    }

    return {
      success: true,
      updatedIngredients: Array.from(updatedMap.values()),
      generatedMovements: movements,
    };
  },

  processOrderStockReversal(
    order: Order,
    products: Product[],
    ingredients: Ingredient[],
    reason = 'Estorno automático por cancelamento de pedido'
  ): {
    updatedIngredients: Ingredient[];
    generatedMovements: StockMovement[];
  } {
    const updatedMap = new Map<string, Ingredient>(ingredients.map((i) => [i.id, { ...i }]));
    const movements: StockMovement[] = [];
    const now = new Date().toISOString();

    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.ingredients || product.ingredients.length === 0) continue;

      for (const recipeItem of product.ingredients) {
        const ing = updatedMap.get(recipeItem.ingredientId);
        if (!ing) continue;

        const totalRestore = Number((recipeItem.quantity * item.quantity).toFixed(3));
        const prevStock = ing.currentStock;
        const newStock = Number((prevStock + totalRestore).toFixed(3));

        ing.currentStock = newStock;
        ing.lastUpdated = now;
        updatedMap.set(ing.id, ing);

        movements.push({
          id: `mov-rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ingredientId: ing.id,
          ingredientName: ing.name,
          unit: ing.unit,
          type: 'ENTRY',
          quantity: totalRestore,
          previousStock: prevStock,
          newStock: newStock,
          reason: `${reason} - Pedido ${order.orderNumber} (${item.quantity}x ${item.productName})`,
          referenceOrderId: order.id,
          referenceOrderNumber: order.orderNumber,
          performedBy: 'Motor de Estorno de Estoque',
          createdAt: now,
        });
      }
    }

    return {
      updatedIngredients: Array.from(updatedMap.values()),
      generatedMovements: movements,
    };
  },

  restoreOrderStock(
    order: Order,
    products: Product[],
    ingredients: Ingredient[],
    reason?: string
  ) {
    return this.processOrderStockReversal(order, products, ingredients, reason);
  },

  createManualMovement(
    ingredient: Ingredient,
    type: StockMovementType,
    quantity: number,
    reason: string,
    performedBy = 'Administrador',
    allowNegativeStock = false,
    authorizedBy?: string
  ): {
    success: boolean;
    error?: string;
    updatedIngredient: Ingredient;
    movement: StockMovement;
  } {
    const prevStock = ingredient.currentStock;
    let newStock = prevStock;
    const cleanQty = Math.abs(quantity);

    if (type === 'ENTRY') {
      newStock = prevStock + cleanQty;
    } else if (type === 'EXIT_WASTE' || type === 'EXIT_ORDER') {
      newStock = prevStock - cleanQty;
      if (!allowNegativeStock && newStock < 0) {
        return {
          success: false,
          error: `Operação resultaria em estoque negativo (${newStock} ${ingredient.unit}). O estoque disponível é de ${prevStock} ${ingredient.unit}.`,
          updatedIngredient: ingredient,
          movement: null as any,
        };
      }
    } else if (type === 'ADJUSTMENT') {
      newStock = cleanQty;
    }

    newStock = Number(newStock.toFixed(3));
    const now = new Date().toISOString();

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      unit: ingredient.unit,
      type,
      quantity: type === 'ADJUSTMENT' ? Number(Math.abs(newStock - prevStock).toFixed(3)) : cleanQty,
      previousStock: prevStock,
      newStock,
      reason: reason.trim() || 'Ajuste manual de estoque',
      performedBy: performedBy.trim(),
      authorizedBy: authorizedBy?.trim(),
      createdAt: now,
    };

    const updatedIngredient: Ingredient = {
      ...ingredient,
      currentStock: newStock,
      lastUpdated: now,
    };

    return {
      success: true,
      updatedIngredient,
      movement,
    };
  },

  getLowStockWarnings(ingredients: Ingredient[]): Ingredient[] {
    return ingredients.filter((i) => i.currentStock <= i.minimumStock);
  },

  calculateInventoryValuation(ingredients: Ingredient[]): {
    totalValue: number;
    totalItems: number;
    lowStockCount: number;
  } {
    const totalValue = ingredients.reduce((acc, i) => acc + i.currentStock * i.costPerUnit, 0);
    const lowStockCount = ingredients.filter((i) => i.currentStock <= i.minimumStock).length;
    return {
      totalValue: Math.round(totalValue),
      totalItems: ingredients.length,
      lowStockCount,
    };
  },
};
