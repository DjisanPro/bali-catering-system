import React from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { useScrollReveal } from './hooks/useScrollReveal';
import { AdminLayout } from './components/admin/AdminLayout';
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
import { AdminAuthModal } from './components/common/AdminAuthModal';
import { AuthorizedActionModal } from './components/common/AuthorizedActionModal';

function MainApp() {
  const {
    activeView,
    currentUser,
    isCartOpen,
    setIsCartOpen,
    setIsAuthModalOpen,
    adminSubView,
  } = useRestaurant();

  // Global scroll reveal — observa todas as seções .reveal/.stagger
  useScrollReveal();

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {activeView === 'public' || !currentUser ? (
        <div>
          {/* 0. Header / Navigation */}
          <PublicHeader
            onOpenCart={() => setIsCartOpen(true)}
            onAdminClick={() => setIsAuthModalOpen(true)}
          />

          <main>
            {/* 1. Hero */}
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

      {/* Global modals (auth + authorized actions) */}
      <AdminAuthModal />
      <AuthorizedActionModal />
    </div>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <MainApp />
    </RestaurantProvider>
  );
}