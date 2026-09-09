import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { DashboardView } from './DashboardView';
import { POSView } from './POSView';
import { OrdersView } from './OrdersView';
import { ProductsView } from './ProductsView';
import { RecipesView } from './RecipesView';
import { IngredientsView } from './IngredientsView';
import { StockControlView } from './StockControlView';
import { PaymentsView } from './PaymentsView';
import { CustomersView } from './CustomersView';
import { UsersView } from './UsersView';
import { AuditLogsView } from './AuditLogsView';
import { SettingsView } from './SettingsView';
// CMSView abaixo temporariamente desativado: o arquivo de origem está
// estruturalmente incompleto (refere estado não declarado). Será reconstruído
// numa fase própria de QA/CMS e depois re-habilitado.
import { MediaLibraryView } from './MediaLibraryView';
import { ExpensesView } from './ExpensesView';

export const AdminLayout: React.FC = () => {
  const { adminSubView } = useRestaurant();

  const renderCurrentSubView = () => {
    switch (adminSubView) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <POSView />;
      case 'orders':
        return <OrdersView />;
      case 'products':
        return <ProductsView />;
      case 'recipes':
        return <RecipesView />;
      case 'ingredients':
        return <IngredientsView />;
      case 'stock':
        return <StockControlView />;
      case 'payments':
              return <PaymentsView />;
            case 'expenses':
              return <ExpensesView />;
      case 'customers':
        return <CustomersView />;
      case 'users':
        return <UsersView />;
      case 'logs':
        return <AuditLogsView />;
      case 'settings':
        return <SettingsView />;
      // case 'cms': (desativado — CMSView em reconstrução)
      case 'media':
        return <MediaLibraryView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden font-sans text-slate-800">
      {/* Left Navigation Sidebar */}
      <AdminSidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <AdminHeader />

        {/* Dynamic Subview Body */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {renderCurrentSubView()}
          </div>
        </main>
      </div>
    </div>
  );
};
