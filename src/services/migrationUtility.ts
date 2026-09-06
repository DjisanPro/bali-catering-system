/**
 * BALI CATERING SERVICE - DATA MIGRATION UTILITY
 * Migrates existing localStorage state into Firestore Cloud collections
 * with idempotency, safety checks, and non-destructive merge.
 */

import { firestoreService } from './firestoreService';
import { storageEngine } from '../engine';

export interface MigrationReport {
  timestamp: string;
  success: boolean;
  productsMigrated: number;
  ordersMigrated: number;
  customersMigrated: number;
  siteSettingsMigrated: boolean;
  errors: string[];
}

export const migrationUtility = {
  /**
   * Performs an idempotent migration of local data to Cloud Firestore.
   */
  async runFullMigration(): Promise<MigrationReport> {
    const report: MigrationReport = {
      timestamp: new Date().toISOString(),
      success: true,
      productsMigrated: 0,
      ordersMigrated: 0,
      customersMigrated: 0,
      siteSettingsMigrated: false,
      errors: [],
    };

    try {
      // 1. Migrate Products
      const localProducts = storageEngine.loadProducts();
      for (const product of localProducts) {
        try {
          const success = await firestoreService.saveProduct(product);
          if (success) report.productsMigrated += 1;
        } catch (err: any) {
          report.errors.push(`Produto ${product.name}: ${err?.message || 'Erro'}`);
        }
      }

      // 2. Migrate Orders
      const localOrders = storageEngine.loadOrders();
      for (const order of localOrders) {
        try {
          const success = await firestoreService.saveOrder(order);
          if (success) report.ordersMigrated += 1;
        } catch (err: any) {
          report.errors.push(`Pedido ${order.orderNumber}: ${err?.message || 'Erro'}`);
        }
      }

      // 3. Migrate Customers
      const localCustomers = storageEngine.loadCustomers();
      for (const customer of localCustomers) {
        try {
          const success = await firestoreService.saveCustomer(customer);
          if (success) report.customersMigrated += 1;
        } catch (err: any) {
          report.errors.push(`Cliente ${customer.name}: ${err?.message || 'Erro'}`);
        }
      }

      // 4. Migrate Site Settings / Config
      const localConfig = storageEngine.loadConfig();
      if (localConfig) {
        try {
          await firestoreService.saveSiteSettings({
            id: 'main_config',
            companyName: localConfig.name || 'Bali Catering Service',
            tagline: localConfig.tagline || 'A Excelência da Gastronomia Grelhada no Carvão em Tete',
            slogan: localConfig.tagline || 'A Excelência da Gastronomia Grelhada no Carvão em Tete',
            whatsapp: localConfig.whatsappPrimary || '+258843936605',
            whatsappNumber: localConfig.whatsappPrimary || '+258843936605',
            phone: localConfig.phones?.[0] || '+258843936605',
            primaryPhone: localConfig.phones?.[0] || '+258843936605',
            email: localConfig.email || 'contacto@balicateringservice.co.mz',
            location: localConfig.location || 'Nuras – Hotel Estrela, Cidade de Tete',
            address: localConfig.location || 'Nuras – Hotel Estrela, Cidade de Tete',
            locationDetails: localConfig.locationDetails || 'Nuras – Hotel Estrela',
            city: 'Tete',
            province: 'Tete',
            country: 'Moçambique',
            openingHoursWeekday: localConfig.openingHoursWeekday || 'Segunda a Domingo: 10:00 às 22:30',
            openingHoursWeekend: localConfig.openingHoursWeekend || 'Sábado e Domingo: 10:00 às 23:00',
            businessHours: localConfig.openingHoursWeekday || 'Segunda a Domingo: 10:00 às 22:30',
            aboutUs: 'Referência em grelhados no carvão e catering na cidade de Tete.',
            footerText: `© ${new Date().getFullYear()} Bali Catering Service. Todos os direitos reservados.`,
            updatedAt: new Date().toISOString(),
          });
          report.siteSettingsMigrated = true;
        } catch (err: any) {
          report.errors.push(`Definições do Site: ${err?.message || 'Erro'}`);
        }
      }
    } catch (globalErr: any) {
      report.errors.push(`Falha Geral de Migração: ${globalErr?.message || 'Erro Desconhecido'}`);
    }

    report.success = report.errors.length === 0;
    return report;
  },
};
