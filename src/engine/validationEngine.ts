import {
  Product,
  Category,
  Customer,
  Order,
  OrderItem,
  Ingredient,
  RecipeIngredient,
  StockMovementType,
  PaymentMethod,
  OrderStatus,
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validationEngine = {
  validateProduct(product: Partial<Product>, categories?: Category[]): ValidationResult {
    const errors: string[] = [];

    if (!product.name || !product.name.trim()) {
      errors.push('O nome do produto é obrigatório.');
    } else if (product.name.trim().length < 2) {
      errors.push('O nome do produto deve ter pelo menos 2 caracteres.');
    }

    if (product.price === undefined || product.price === null || isNaN(product.price)) {
      errors.push('O preço de venda é obrigatório.');
    } else if (product.price < 0) {
      errors.push('O preço de venda não pode ser negativo.');
    }

    if (product.costPrice !== undefined && product.costPrice !== null && product.costPrice < 0) {
      errors.push('O custo de CMV estimado não pode ser negativo.');
    }

    if (product.preparationTimeMinutes !== undefined && product.preparationTimeMinutes < 0) {
      errors.push('O tempo de preparo não pode ser negativo.');
    }

    if (!product.categoryId || !product.categoryId.trim()) {
      errors.push('A categoria do produto é obrigatória.');
    } else if (categories && categories.length > 0) {
      const exists = categories.some((c) => c.id === product.categoryId);
      if (!exists) {
        errors.push('A categoria selecionada é inválida.');
      }
    }

    if (product.ingredients && Array.isArray(product.ingredients)) {
      for (let i = 0; i < product.ingredients.length; i++) {
        const item = product.ingredients[i];
        if (!item.ingredientId) {
          errors.push(`O insumo na linha ${i + 1} da ficha técnica não possui identificador.`);
        }
        if (item.quantity === undefined || item.quantity <= 0) {
          errors.push(`A quantidade do insumo "${item.ingredientName || 'Insumo'}" deve ser maior que zero.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateCustomer(customer: Partial<Customer>): ValidationResult {
    const errors: string[] = [];

    if (!customer.name || !customer.name.trim()) {
      errors.push('O nome do cliente é obrigatório.');
    } else if (customer.name.trim().length < 2) {
      errors.push('O nome do cliente deve ter pelo menos 2 caracteres.');
    }

    if (!customer.phone || !customer.phone.trim()) {
      errors.push('O contacto telefónico/WhatsApp é obrigatório.');
    } else {
      const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
      if (cleanPhone.length < 8) {
        errors.push('O número de telefone deve conter no mínimo 8 dígitos válidos.');
      }
    }

    if (customer.email && customer.email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(customer.email.trim())) {
        errors.push('O formato do email introduzido é inválido.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateOrderItem(item: OrderItem, itemIndex: number): string[] {
    const errors: string[] = [];
    if (!item.productId) {
      errors.push(`Item ${itemIndex + 1}: Produto inválido ou sem identificador.`);
    }
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      errors.push(`Item "${item.productName || itemIndex + 1}": Quantidade deve ser um número inteiro maior que 0.`);
    }
    if (item.price === undefined || item.price < 0) {
      errors.push(`Item "${item.productName || itemIndex + 1}": Preço unitário não pode ser negativo.`);
    }
    return errors;
  },

  validateOrder(order: Partial<Order>): ValidationResult {
    const errors: string[] = [];

    if (!order.items || order.items.length === 0) {
      errors.push('O pedido deve conter pelo menos 1 item selecionado.');
    } else {
      order.items.forEach((item, index) => {
        errors.push(...this.validateOrderItem(item, index));
      });
    }

    if (!order.customerName || !order.customerName.trim()) {
      errors.push('O nome do cliente é obrigatório para registrar o pedido.');
    }

    if (!order.customerPhone || !order.customerPhone.trim()) {
      errors.push('O telefone do cliente é obrigatório para registar o pedido.');
    }

    if (order.total === undefined || order.total < 0) {
      errors.push('O valor total do pedido não pode ser negativo.');
    }

    if (order.deliveryFee !== undefined && order.deliveryFee < 0) {
      errors.push('A taxa de entrega não pode ser negativa.');
    }

    if (order.discount !== undefined && order.discount < 0) {
      errors.push('O desconto não pode ser negativo.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateStockMovement(
    ingredient: Ingredient | undefined,
    type: StockMovementType,
    quantity: number,
    reason: string,
    allowNegativeStock = false
  ): ValidationResult {
    const errors: string[] = [];

    if (!ingredient) {
      errors.push('Insumo/ingrediente não encontrado no sistema de estoque.');
      return { isValid: false, errors };
    }

    if (quantity === undefined || isNaN(quantity) || quantity <= 0) {
      errors.push('A quantidade movimentada deve ser um número maior que zero.');
    }

    if (!reason || !reason.trim()) {
      errors.push('O motivo da movimentação de estoque é obrigatório para fins de auditoria.');
    } else if (reason.trim().length < 3) {
      errors.push('O motivo informado é muito curto. Descreva a razão da movimentação.');
    }

    if (!allowNegativeStock) {
      if (type === 'EXIT_ORDER' || type === 'EXIT_WASTE') {
        if (ingredient.currentStock - quantity < 0) {
          errors.push(
            `Estoque insuficiente para "${ingredient.name}". Disponível: ${ingredient.currentStock} ${ingredient.unit}, Solicitado: ${quantity} ${ingredient.unit}.`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validatePayment(amount: number, method: PaymentMethod, order?: Order): ValidationResult {
    const errors: string[] = [];

    if (amount === undefined || isNaN(amount) || amount <= 0) {
      errors.push('O montante de pagamento deve ser superior a zero MT.');
    }

    if (order) {
      if (order.status === 'CANCELLED') {
        errors.push('Não é permitido registrar pagamentos para pedidos já cancelados.');
      }
      if (order.paymentStatus === 'PAID') {
        errors.push(`O pedido ${order.orderNumber} já se encontra totalmente pago.`);
      }
    }

    const validMethods: PaymentMethod[] = ['CASH', 'MPESA', 'EMOLA', 'POS_CARD', 'BANK_TRANSFER'];
    if (!validMethods.includes(method)) {
      errors.push('Forma de pagamento não reconhecida pelo sistema.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateIngredient(ingredient: Partial<Ingredient>): ValidationResult {
    const errors: string[] = [];
    if (!ingredient.name || !ingredient.name.trim()) {
      errors.push('O nome do ingrediente/insumo é obrigatório.');
    }
    if (!ingredient.unit || !ingredient.unit.trim()) {
      errors.push('A unidade de medida (ex: kg, L, un) é obrigatória.');
    }
    if (ingredient.costPerUnit === undefined || ingredient.costPerUnit < 0) {
      errors.push('O custo unitário de compra não pode ser negativo.');
    }
    if (ingredient.minimumStock === undefined || ingredient.minimumStock < 0) {
      errors.push('O estoque mínimo de alerta não pode ser negativo.');
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateRecipe(recipe: RecipeIngredient[], availableIngredients: Ingredient[]): ValidationResult {
    const errors: string[] = [];
    if (!recipe || !Array.isArray(recipe)) {
      errors.push('A ficha técnica fornecida é inválida.');
      return { isValid: false, errors };
    }
    const ingMap = new Map(availableIngredients.map((i) => [i.id, i]));
    for (let i = 0; i < recipe.length; i++) {
      const item = recipe[i];
      if (!item.ingredientId) {
        errors.push(`Linha ${i + 1}: Selecione um ingrediente válido.`);
      } else if (!ingMap.has(item.ingredientId)) {
        errors.push(`Linha ${i + 1}: O ingrediente selecionado não existe no inventário.`);
      }
      if (item.quantity === undefined || item.quantity <= 0) {
        errors.push(`Linha ${i + 1}: A quantidade do ingrediente deve ser maior que zero.`);
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};
