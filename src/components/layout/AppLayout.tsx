import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#F4F5F7] text-[#171A21] font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:shrink-0 relative z-20">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="mobile-drawer-backdrop"
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl border-r border-[#E2E8F0]"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Control Center Glass Dock Navigation */}
        <MobileBottomNav onOpenSearch={() => {
          const trigger = document.getElementById('global-search-trigger');
          if (trigger) trigger.click();
        }} />
      </div>
    </div>
  );
};
