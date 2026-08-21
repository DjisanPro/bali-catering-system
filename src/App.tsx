import React from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { PublicHeader } from './components/public/PublicHeader';
import { PublicHero } from './components/public/PublicHero';
import { PublicHighlightsBar } from './components/public/PublicHighlightsBar';
import { PublicMenu } from './components/public/PublicMenu';
import { PublicSpotlightProduct } from './components/public/PublicSpotlightProduct';
import { PublicDobradaPromo } from './components/public/PublicDobradaPromo';
import { PublicEditorialGallery } from './components/public/PublicEditorialGallery';
import { PublicSpecialServices } from './components/public/PublicSpecialServices';
import { PublicAboutLocation } from './components/public/PublicAboutLocation';
import { PublicFooter } from './components/public/PublicFooter';
import { PublicCartDrawer } from './components/public/PublicCartDrawer';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminAuthModal } from './components/common/AdminAuthModal';
import { AuthorizedActionModal } from './components/common/AuthorizedActionModal';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useRestaurant();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full space-y-2 pointer-events-none font-sans">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
            case 'error':
              return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />;
            default:
              return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
          }
        };

        const getBorder = () => {
          switch (toast.type) {
            case 'success':
              return 'border-emerald-200 bg-white/95 text-emerald-950 shadow-emerald-500/10';
            case 'warning':
              return 'border-amber-200 bg-white/95 text-amber-950 shadow-amber-500/10';
            case 'error':
              return 'border-red-200 bg-white/95 text-red-950 shadow-red-500/10';
            default:
              return 'border-blue-200 bg-white/95 text-blue-950 shadow-blue-500/10';
          }
        };

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`p-4 rounded-2xl border shadow-xl backdrop-blur-xs flex items-start gap-3 pointer-events-auto transition-all animate-in slide-in-from-top-3 duration-300 ${getBorder()}`}
          >
            {getIcon()}
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-xs leading-tight">{toast.title}</h5>
              {toast.message && (
                <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">{toast.message}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MainApp: React.FC = () => {
  const {
    activeView,
    currentUser,
    isCartOpen,
    setIsCartOpen,
    setIsAuthModalOpen,
  } = useRestaurant();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-zinc-900 selection:bg-[#E86319] selection:text-white flex flex-col font-sans">
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* User Login & Authentication Modal */}
      <AdminAuthModal />

      {/* Elevated Admin Permission Modal */}
      <AuthorizedActionModal />

      {activeView === 'public' || !currentUser ? (
        /* Public Editorial Gastronomic Website */
        <div className="flex-1 flex flex-col">
          <PublicHeader onOpenCart={() => setIsCartOpen(true)} />
          <main className="flex-1">
            {/* 1. Hero Section */}
            <PublicHero
              onExploreMenu={() => {
                const el = document.getElementById('menu');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 2. Highlights Strip */}
            <PublicHighlightsBar />

            {/* 3. Primary Menu */}
            <PublicMenu onOpenCart={() => setIsCartOpen(true)} />

            {/* 4. Product Spotlight Feature */}
            <PublicSpotlightProduct />

            {/* 5. Dia de Dobrada Promo */}
            <PublicDobradaPromo />

            {/* 6. Featured Editorial Gallery with Lazy Loading */}
            <PublicEditorialGallery />

            {/* 7. Special Services & Equipment Rental */}
            <PublicSpecialServices />

            {/* 8. About & Location in Tete */}
            <PublicAboutLocation />
          </main>

          {/* 9. Minimalist Editorial Footer */}
          <PublicFooter onAdminClick={() => setIsAuthModalOpen(true)} />

          {/* Cart Drawer */}
          <PublicCartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
      ) : (
        /* Protected Management & POS Backoffice */
        <AdminLayout />
      )}
    </div>
  );
};

export default function App() {
  return (
    <RestaurantProvider>
      <MainApp />
    </RestaurantProvider>
  );
}
