/**
 * Bali Catering Service — Database Seed
 * -------------------------------------------------
 * Popula a base de dados com os dados iniciais do restaurante:
 *  - Configurações do Bali (Tete, Nuras – Hotel Estrela)
 *  - 7 categorias
 *  - 20 ingredientes
 *  - 20 produtos com fichas técnicas (recipes)
 *  - Utilizadores (admin + vendedores)
 *  - Caixa registadora padrão
 *
 * Reutiliza a connection de server/database.js (getDb).
 * Idempotente: só insere se as tabelas estiverem vazias.
 *
 * Executa standalone:  node server/database/seed.js
 */

const { getDb, closeDb } = require('../database.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const NOW = new Date().toISOString();
const uuid = () => crypto.randomUUID ? crypto.randomUUID() : ('x-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10));

function hashPassword(plain) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(plain, salt);
  return { salt, hash };
}

// ---------------------------------------------------------------------------
// Configurações do restaurante
// ---------------------------------------------------------------------------
const SETTINGS = {
  name: 'Bali Catering Service',
  tagline: 'Sabor autêntico, excelência em catering e grelhados em Tete',
  location: 'Tete, Nuras – Hotel Estrela, Moçambique',
  location_details:
    'Localizado no complexo Nuras, junto ao Hotel Estrela. Atendimento no local, take-away, entregas em toda a cidade de Tete e serviço de catering completo para eventos.',
  phones: JSON.stringify(['+258 872 022 777', '+258 874 660 777', '+258 844 660 771']),
  whatsapp_primary: '258872022777',
  whatsapp_secondary: '258874660777',
  email: 'contacto@balicatering.co.mz',
  currency: 'MT',
  default_delivery_fee: '100',
  opening_hours_weekday: 'Segunda a Sábado: 07:30 – 22:30',
  opening_hours_weekend: 'Domingo e Feriados: 08:00 – 22:00',
  special_notice:
    'Especial aos Domingos e Segundas: Dobrada tradicional com Feijão Branco. Experimente também a nossa autêntica Mousse de Malambe.',
};

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { id: 'cat-sanduiches', name: 'Sanduíches & Tostas', slug: 'sanduiches-tostas', icon_name: 'Sandwich', description: 'Preparadas na hora com pão fresco e ingredientes selecionados', display_order: 1 },
  { id: 'cat-hamburgueres', name: 'Hambúrgueres Especiais', slug: 'hamburgueres', icon_name: 'Flame', description: 'Hambúrgueres artesanais suculentos grelhados no ponto certo', display_order: 2 },
  { id: 'cat-pratos', name: 'Grelhados & Pratos', slug: 'pratos-principais', icon_name: 'UtensilsCrossed', description: 'O famoso frango assado no carvão de Tete e carnes nobres', display_order: 3 },
  { id: 'cat-especialidades', name: 'Especialidades & Tradicionais', slug: 'especialidades', icon_name: 'Sparkles', description: 'Pratos típicos e receitas icónicas da nossa casa', display_order: 4 },
  { id: 'cat-sobremesas', name: 'Sobremesas & Malambe', slug: 'sobremesas', icon_name: 'IceCream', description: 'Doces artesanais e a autêntica mousse natural de malambe', display_order: 5 },
  { id: 'cat-bebidas', name: 'Bebidas & Sumos Naturais', slug: 'bebidas', icon_name: 'Coffee', description: 'Sumos frescos naturais, refrigerantes e águas minerais bem geladas', display_order: 6 },
  { id: 'cat-servicos', name: 'Catering & Alugueres', slug: 'servicos-eventos', icon_name: 'PartyPopper', description: 'Buffets para eventos e aluguer de máquinas de gelados e pipocas', display_order: 7 },
];

// ---------------------------------------------------------------------------
// Ingredientes
// ---------------------------------------------------------------------------
const INGREDIENTS = [
  { id: 'ing-carne-bovina', name: 'Carne Bovina (Alcatra/Chã)', category: 'Carnes', unit: 'kg', current_stock: 28.5, minimum_stock: 10, cost_per_unit: 420, supplier: 'Talho Central de Tete' },
  { id: 'ing-frango-inteiro', name: 'Frango Fresco Inteiro (1.2kg)', category: 'Aves', unit: 'un', current_stock: 35, minimum_stock: 15, cost_per_unit: 260, supplier: 'Avícola do Zambeze' },
  { id: 'ing-peito-frango', name: 'Peito de Frango Desossado', category: 'Aves', unit: 'kg', current_stock: 18.0, minimum_stock: 8, cost_per_unit: 340, supplier: 'Avícola do Zambeze' },
  { id: 'ing-dobrada', name: 'Dobrada Bovina Limpa', category: 'Carnes', unit: 'kg', current_stock: 14.0, minimum_stock: 5, cost_per_unit: 220, supplier: 'Matadouro Municipal' },
  { id: 'ing-feijao-branco', name: 'Feijão Branco de Qualidade', category: 'Grãos & Secos', unit: 'kg', current_stock: 22.0, minimum_stock: 8, cost_per_unit: 110, supplier: 'Armazém Estrela' },
  { id: 'ing-pao-baguete', name: 'Pão Baguete Fresco', category: 'Padaria', unit: 'un', current_stock: 45, minimum_stock: 20, cost_per_unit: 25, supplier: 'Padaria Moderna de Tete' },
  { id: 'ing-pao-burger', name: 'Pão de Hambúrguer com Sésamo', category: 'Padaria', unit: 'un', current_stock: 50, minimum_stock: 20, cost_per_unit: 30, supplier: 'Padaria Moderna de Tete' },
  { id: 'ing-pao-forma', name: 'Pão de Forma Especial', category: 'Padaria', unit: 'un', current_stock: 16, minimum_stock: 6, cost_per_unit: 70, supplier: 'Padaria Moderna de Tete' },
  { id: 'ing-queijo-cheddar', name: 'Queijo Cheddar Fatiado', category: 'Laticínios', unit: 'kg', current_stock: 6.5, minimum_stock: 3, cost_per_unit: 680, supplier: 'Distribuidora Luso-Moçambicana' },
  { id: 'ing-queijo-mozzarella', name: 'Queijo Mozzarella / Flamengo', category: 'Laticínios', unit: 'kg', current_stock: 7.2, minimum_stock: 3.5, cost_per_unit: 580, supplier: 'Distribuidora Luso-Moçambicana' },
  { id: 'ing-fiambre', name: 'Fiambre Fatiado', category: 'Charcutaria', unit: 'kg', current_stock: 5.0, minimum_stock: 2.5, cost_per_unit: 480, supplier: 'Distribuidora Luso-Moçambicana' },
  { id: 'ing-bacon', name: 'Bacon Defumado Fatiado', category: 'Charcutaria', unit: 'kg', current_stock: 4.8, minimum_stock: 2, cost_per_unit: 750, supplier: 'Distribuidora Luso-Moçambicana' },
  { id: 'ing-ovos', name: 'Ovos Frescos', category: 'Frescos', unit: 'un', current_stock: 110, minimum_stock: 40, cost_per_unit: 12, supplier: 'Avícola do Zambeze' },
  { id: 'ing-malambe-polpa', name: 'Polpa de Malambe (Embondeiro/Baobab)', category: 'Frutas & Tradicionais', unit: 'kg', current_stock: 12.0, minimum_stock: 4, cost_per_unit: 250, supplier: 'Produtores Locais de Changara' },
  { id: 'ing-maracuja-polpa', name: 'Polpa de Maracujá Fresco', category: 'Frutas & Tradicionais', unit: 'kg', current_stock: 10.0, minimum_stock: 4, cost_per_unit: 220, supplier: 'Mercado 1º de Maio' },
  { id: 'ing-leite-condensado', name: 'Leite Condensado (Lata 395g)', category: 'Mercearia', unit: 'un', current_stock: 24, minimum_stock: 10, cost_per_unit: 95, supplier: 'Armazém Estrela' },
  { id: 'ing-creme-leite', name: 'Creme de Leite (200ml)', category: 'Mercearia', unit: 'un', current_stock: 30, minimum_stock: 12, cost_per_unit: 65, supplier: 'Armazém Estrela' },
  { id: 'ing-batatas', name: 'Batata Fresca para Fritar', category: 'Hortícolas', unit: 'kg', current_stock: 45.0, minimum_stock: 20, cost_per_unit: 60, supplier: 'Mercado 1º de Maio' },
  { id: 'ing-tomate-alface', name: 'Tomate e Alface Frescos (Mix)', category: 'Hortícolas', unit: 'kg', current_stock: 15.0, minimum_stock: 6, cost_per_unit: 90, supplier: 'Mercado 1º de Maio' },
  { id: 'ing-refrigerante-lata', name: 'Refrigerante Lata 330ml (Coca/Fanta/Sprite)', category: 'Bebidas Prontas', unit: 'un', current_stock: 96, minimum_stock: 30, cost_per_unit: 42, supplier: 'Depósito Coca-Cola Tete' },
  { id: 'ing-agua-500', name: 'Água Mineral 500ml', category: 'Bebidas Prontas', unit: 'un', current_stock: 120, minimum_stock: 40, cost_per_unit: 25, supplier: 'Distribuidora Água Vumba' },
];

// ---------------------------------------------------------------------------
// Produtos (com receitas). ingredients = [{ id, quantity, unit }]
// ---------------------------------------------------------------------------
const PRODUCTS = [
  { id: 'prod-sandes-carne-assada', categoryId: 'cat-sanduiches', name: 'Sandes de Carne Assada', description: 'Pão baguete fresco e estaladiço, recheado com generosas tiras de carne bovina marinada e assada lentamente, tomate fresco, alface crocante e molho especial da casa.', price: 250, costPrice: 110, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80', isFeatured: 1, prep: 12, ingredients: [{ id: 'ing-pao-baguete', quantity: 1, unit: 'un' }, { id: 'ing-carne-bovina', quantity: 0.16, unit: 'kg' }, { id: 'ing-tomate-alface', quantity: 0.05, unit: 'kg' }] },
  { id: 'prod-sandes-frango', categoryId: 'cat-sanduiches', name: 'Sandes de Frango Grelhado', description: 'Peito de frango grelhado e desfiado com tempero aromático de ervas finas, maionese temperada, rodelas de tomate e alface fresca no pão baguete tostado.', price: 220, costPrice: 95, imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&auto=format&fit=crop&q=80', prep: 12, ingredients: [{ id: 'ing-pao-baguete', quantity: 1, unit: 'un' }, { id: 'ing-peito-frango', quantity: 0.15, unit: 'kg' }, { id: 'ing-tomate-alface', quantity: 0.05, unit: 'kg' }] },
  { id: 'prod-sandes-omelete', categoryId: 'cat-sanduiches', name: 'Sandes de Omelete com Queijo', description: 'Omelete fofinha feita na hora com dois ovos frescos, queijo derretido, ervas e recheada no pão levemente tostado.', price: 180, costPrice: 65, imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80', prep: 10, ingredients: [{ id: 'ing-pao-baguete', quantity: 1, unit: 'un' }, { id: 'ing-ovos', quantity: 2, unit: 'un' }, { id: 'ing-queijo-mozzarella', quantity: 0.04, unit: 'kg' }] },
  { id: 'prod-tosta-mista', categoryId: 'cat-sanduiches', name: 'Tosta Mista Tradicional', description: 'Fatias generosas de queijo mozzarella e fiambre selecionado em pão de forma tostado com manteiga até dourar.', price: 150, costPrice: 60, imageUrl: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&auto=format&fit=crop&q=80', prep: 8, ingredients: [{ id: 'ing-pao-forma', quantity: 0.2, unit: 'un' }, { id: 'ing-queijo-mozzarella', quantity: 0.05, unit: 'kg' }, { id: 'ing-fiambre', quantity: 0.04, unit: 'kg' }] },
  { id: 'prod-tosta-queijo-tomate', categoryId: 'cat-sanduiches', name: 'Tosta de Queijo e Tomate com Orégano', description: 'Queijo derretido, rodelas de tomate fresco suculento e um toque aromático de orégano.', price: 130, costPrice: 50, imageUrl: 'https://images.unsplash.com/photo-1621800043295-a73fe2f76e2c?w=800&auto=format&fit=crop&q=80', prep: 8, ingredients: [{ id: 'ing-pao-forma', quantity: 0.2, unit: 'un' }, { id: 'ing-queijo-mozzarella', quantity: 0.06, unit: 'kg' }, { id: 'ing-tomate-alface', quantity: 0.04, unit: 'kg' }] },
  { id: 'prod-burger-bali-especial', categoryId: 'cat-hamburgueres', name: 'Bali Burger Especial', description: 'O carro-chefe da casa! Hambúrguer artesanal de 180g de carne bovina nobre, queijo cheddar cremoso derretido, tiras de bacon crocante, ovo estrelado, cebola caramelizada, alface, tomate e molho exclusivo Bali.', price: 350, costPrice: 155, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80', isSpecialty: 1, isFeatured: 1, prep: 18, ingredients: [{ id: 'ing-pao-burger', quantity: 1, unit: 'un' }, { id: 'ing-carne-bovina', quantity: 0.18, unit: 'kg' }, { id: 'ing-queijo-cheddar', quantity: 0.04, unit: 'kg' }, { id: 'ing-bacon', quantity: 0.04, unit: 'kg' }, { id: 'ing-ovos', quantity: 1, unit: 'un' }, { id: 'ing-tomate-alface', quantity: 0.04, unit: 'kg' }] },
  { id: 'prod-burger-classic', categoryId: 'cat-hamburgueres', name: 'Classic Cheeseburger', description: 'Hambúrguer de 150g de pura carne bovina grelhada na chapa com queijo cheddar duplo, alface, tomate fresco e molho clássico no pão com sésamo tostado.', price: 280, costPrice: 115, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80', prep: 15, ingredients: [{ id: 'ing-pao-burger', quantity: 1, unit: 'un' }, { id: 'ing-carne-bovina', quantity: 0.15, unit: 'kg' }, { id: 'ing-queijo-cheddar', quantity: 0.04, unit: 'kg' }, { id: 'ing-tomate-alface', quantity: 0.04, unit: 'kg' }] },
  { id: 'prod-burger-crispy-chicken', categoryId: 'cat-hamburgueres', name: 'Chicken Crispy Burger', description: 'Peito de frango crocante empanado em crosta dourada e temperada, queijo derretido, molho de ervas e salada fresca.', price: 270, costPrice: 105, imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80', prep: 15, ingredients: [{ id: 'ing-pao-burger', quantity: 1, unit: 'un' }, { id: 'ing-peito-frango', quantity: 0.16, unit: 'kg' }, { id: 'ing-queijo-cheddar', quantity: 0.03, unit: 'kg' }, { id: 'ing-tomate-alface', quantity: 0.04, unit: 'kg' }] },
  { id: 'prod-frango-assado-inteiro', categoryId: 'cat-pratos', name: 'Frango Assado Inteiro no Carvão', description: 'O autêntico sabor de Tete. Frango inteiro marinado com alho, limão e especiarias moçambicanas, grelhado lentamente no carvão. Acompanha porção de batata frita e salada fresca.', price: 650, costPrice: 320, imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80', isSpecialty: 1, isFeatured: 1, prep: 25, ingredients: [{ id: 'ing-frango-inteiro', quantity: 1, unit: 'un' }, { id: 'ing-batatas', quantity: 0.4, unit: 'kg' }, { id: 'ing-tomate-alface', quantity: 0.1, unit: 'kg' }] },
  { id: 'prod-meio-frango-assado', categoryId: 'cat-pratos', name: 'Meio Frango Assado com Acompanhamento', description: 'Meia porção do nosso frango no carvão, suculento e dourado, servido com batata frita ou arroz e molho piripiri à parte.', price: 380, costPrice: 190, imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&auto=format&fit=crop&q=80', prep: 20, ingredients: [{ id: 'ing-frango-inteiro', quantity: 0.5, unit: 'un' }, { id: 'ing-batatas', quantity: 0.25, unit: 'kg' }, { id: 'ing-tomate-alface', quantity: 0.06, unit: 'kg' }] },
  { id: 'prod-bife-vaca', categoryId: 'cat-pratos', name: 'Bife à Bali com Molho Especial', description: 'Bife de alcatra tenro grelhado na manteiga e ervas, coberto com molho cremoso de pimenta preta, acompanhado de batatas fritas e salada.', price: 450, costPrice: 220, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80', prep: 20, ingredients: [{ id: 'ing-carne-bovina', quantity: 0.25, unit: 'kg' }, { id: 'ing-batatas', quantity: 0.25, unit: 'kg' }, { id: 'ing-tomate-alface', quantity: 0.05, unit: 'kg' }] },
  { id: 'prod-dobrada-especial', categoryId: 'cat-especialidades', name: 'Dobrada Especial com Feijão Branco', description: 'Prato servido aos Domingos e Segundas. Dobrada bovina limpa e cozida em lume brando com feijão branco cremoso e temperos tradicionais moçambicanos.', price: 350, costPrice: 140, imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80', isSpecialty: 1, isFeatured: 1, isSeasonal: 1, availabilityDays: JSON.stringify(['Domingo', 'Segunda']), prep: 15, ingredients: [{ id: 'ing-dobrada', quantity: 0.22, unit: 'kg' }, { id: 'ing-feijao-branco', quantity: 0.12, unit: 'kg' }] },
  { id: 'prod-mousse-malambe', categoryId: 'cat-sobremesas', name: 'Mousse de Malambe Tradicional', description: 'Elaborada com polpa 100% natural do fruto do embondeiro (baobab), leite condensado e natas. Equilíbrio perfeito entre cremosidade e frescura cítrica.', price: 180, costPrice: 70, imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80', isSpecialty: 1, isFeatured: 1, prep: 5, ingredients: [{ id: 'ing-malambe-polpa', quantity: 0.08, unit: 'kg' }, { id: 'ing-leite-condensado', quantity: 0.2, unit: 'un' }, { id: 'ing-creme-leite', quantity: 0.2, unit: 'un' }] },
  { id: 'prod-pudim-leite', categoryId: 'cat-sobremesas', name: 'Pudim de Leite Condensado Caseiro', description: 'Pudim aveludado com calda de caramelo dourada, receita tradicional caseira.', price: 150, costPrice: 60, imageUrl: 'https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?w=800&auto=format&fit=crop&q=80', prep: 5, ingredients: [{ id: 'ing-leite-condensado', quantity: 0.25, unit: 'un' }, { id: 'ing-ovos', quantity: 1, unit: 'un' }] },
  { id: 'prod-sumo-malambe', categoryId: 'cat-bebidas', name: 'Sumo Natural de Malambe (500ml)', description: 'Sumo natural rico em vitamina C, preparado a frio com polpa pura de embondeiro.', price: 100, costPrice: 40, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80', isSpecialty: 1, prep: 5, ingredients: [{ id: 'ing-malambe-polpa', quantity: 0.1, unit: 'kg' }] },
  { id: 'prod-sumo-maracuja', categoryId: 'cat-bebidas', name: 'Sumo Natural de Maracujá Fresco (500ml)', description: 'Sumo 100% natural feito com fruta fresca, servido bem gelado.', price: 100, costPrice: 45, imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop&q=80', prep: 5, ingredients: [{ id: 'ing-maracuja-polpa', quantity: 0.1, unit: 'kg' }] },
  { id: 'prod-refrigerante', categoryId: 'cat-bebidas', name: 'Refrigerante Lata 330ml', description: 'Coca-Cola, Fanta Laranja, Sprite ou Schweppes bem gelados.', price: 60, costPrice: 42, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80', prep: 2, ingredients: [{ id: 'ing-refrigerante-lata', quantity: 1, unit: 'un' }] },
  { id: 'prod-agua-mineral', categoryId: 'cat-bebidas', name: 'Água Mineral sem Gás 500ml', description: 'Água mineral natural pura e fresca.', price: 40, costPrice: 25, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80', prep: 2, ingredients: [{ id: 'ing-agua-500', quantity: 1, unit: 'un' }] },
  { id: 'prod-aluguer-maquina-gelados', categoryId: 'cat-servicos', name: 'Aluguer de Máquina de Gelados Soft Profissional', description: 'Para festas de aniversário, casamentos, eventos escolares e corporativos em Tete. Inclui transporte, montagem, operador treinado e consumíveis sob consulta.', price: 3500, costPrice: 800, imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&auto=format&fit=crop&q=80', isSpecialty: 1, isFeatured: 1, prep: 60, ingredients: [] },
  { id: 'prod-aluguer-maquina-pipocas', categoryId: 'cat-servicos', name: 'Aluguer de Máquina de Pipocas Estilo Cinema', description: 'Máquina profissional de pipocas quentes doces ou salgadas para eventos infantis, feiras e comemorações.', price: 2500, costPrice: 500, imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80', isSpecialty: 1, prep: 45, ingredients: [] },
  { id: 'prod-servico-catering-completo', categoryId: 'cat-servicos', name: 'Serviço de Buffet & Catering para Eventos', description: 'Solução completa gastronómica para casamentos, conferências, coffee breaks e jantares de gala em Tete.', price: 850, costPrice: 400, imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80', isSpecialty: 1, isFeatured: 1, prep: 120, ingredients: [] },
];

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------
function seed() {
  const db = getDb();

  // Idempotência: sair se já houver produtos
  const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (count > 0) {
    console.log('ℹ Base já possui dados. Seed ignorado (idempotente).');
    closeDb();
    return;
  }

  const ts = NOW;

  db.exec('BEGIN');
  try {
    // 1. Configurações
    const insSetting = db.prepare(`INSERT OR IGNORE INTO restaurant_settings (key, value, updated_at) VALUES (?, ?, ?)`);
    Object.entries(SETTINGS).forEach(([k, v]) => insSetting.run(k, String(v), ts));

    // 2. Categorias
    const insCat = db.prepare(`INSERT INTO categories (id, name, slug, icon_name, description, display_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`);
    CATEGORIES.forEach(c => insCat.run(c.id, c.name, c.slug, c.icon_name, c.description, c.display_order, ts, ts));

    // 3. Ingredientes
    const insIng = db.prepare(`INSERT INTO ingredients (id, name, category, unit, current_stock, minimum_stock, cost_per_unit, supplier, status, last_updated) VALUES (?,?,?,?,?,?,?,?,'ACTIVE',?)`);
    INGREDIENTS.forEach(i => insIng.run(i.id, i.name, i.category, i.unit, i.current_stock, i.minimum_stock, i.cost_per_unit, i.supplier, ts));

    // 4. Produtos + receitas
    const insProd = db.prepare(`INSERT INTO products (id, category_id, name, description, price, cost_price, image_url, is_available, status, is_specialty, is_featured, is_seasonal, availability_days, preparation_time_minutes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,1,'ACTIVE',?,?,?,?,?,?,?)`);
    const insRecipe = db.prepare(`INSERT INTO recipes (id, product_id, created_at, updated_at) VALUES (?,?,?,?)`);
    const insRecipeItem = db.prepare(`INSERT INTO recipe_items (id, recipe_id, ingredient_id, quantity, unit) VALUES (?,?,?,?,?)`);

    PRODUCTS.forEach(p => {
      insProd.run(
        p.id, p.categoryId, p.name, p.description, p.price, p.costPrice, p.imageUrl,
        p.isSpecialty || 0, p.isFeatured || 0, p.isSeasonal || 0, p.availabilityDays || null,
        p.prep, ts, ts
      );
      const recipeId = uuid();
      insRecipe.run(recipeId, p.id, ts, ts);
      if (p.ingredients && p.ingredients.length) {
        p.ingredients.forEach(ii => {
          insRecipeItem.run(uuid(), recipeId, ii.id, ii.quantity, ii.unit);
        });
      }
    });

    // 5. Utilizadores (admin + vendedores SELLER_1, SELLER_2, SELLER_3)
    const admin = hashPassword('admin123');
    const s1 = hashPassword('1234');
    const s2 = hashPassword('1234');
    const s3 = hashPassword('1234');
    const insUser = db.prepare(`INSERT INTO users (id, name, username, role, status, password_hash, salt, created_at, last_activity, created_by_id, failed_login_attempts) VALUES (?,?,?,?,?,?,?,?,?,?,0)`);

    const adminId = 'USR-ADMIN-01';
    insUser.run(adminId, 'Administrador Principal (Boss)', 'admin', 'ADMIN', 'ACTIVE', admin.hash, admin.salt, ts, ts, null);
    insUser.run('USR-VEND-01', 'Carlos Mateus (Balcão)', 'carlos.vendedor', 'SELLER', 'ACTIVE', s1.hash, s1.salt, ts, ts, adminId);
    insUser.run('USR-VEND-02', 'Joana Chimoio (Atendimento)', 'joana.vendedora', 'SELLER', 'ACTIVE', s2.hash, s2.salt, ts, ts, adminId);
    insUser.run('USR-VEND-03', 'Armando Miguel (Entregas)', 'armando.vendedor', 'SELLER', 'ACTIVE', s3.hash, s3.salt, ts, ts, adminId);

    // 6. Caixa registadora padrão
    const insReg = db.prepare(`INSERT INTO cash_registers (id, name, status, created_at) VALUES (?,?,?,?)`);
    insReg.run('REG-01', 'Caixa Principal', 'ACTIVE', ts);

    db.exec('COMMIT');

    console.log('✓ Seed aplicado com sucesso:');
    console.log(`  - ${CATEGORIES.length} categorias`);
    console.log(`  - ${INGREDIENTS.length} ingredientes`);
    console.log(`  - ${PRODUCTS.length} produtos (com fichas técnicas)`);
    console.log(`  - 4 utilizadores (1 admin + 3 vendedores)`);
    console.log(`  - 1 caixa registadora`);
    console.log('');
    console.log('Credenciais iniciais (ALTERAR no primeiro login):');
    console.log('  admin            / admin123   (Administrador)');
    console.log('  carlos.vendedor  / 1234       (Vendedor 1)');
    console.log('  joana.vendedora  / 1234       (Vendedor 2)');
    console.log('  armando.vendedor / 1234       (Vendedor 3)');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('✗ Seed falhou:', err.message);
    closeDb();
    process.exit(1);
  }

  closeDb();
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
