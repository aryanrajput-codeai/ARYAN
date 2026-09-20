import React, { useState } from 'react';
import { Search, Menu, Calendar } from 'lucide-react';
import { formatDateDisplay, getTodayISO } from '../../lib/dateUtils';
import { GlobalSearchModal } from './GlobalSearchModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearchExternal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header
        id="app-header"
        className="h-16 bg-white border-b border-[#E7E9EE] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none"
      >
        {/* Left Side: Mobile Menu Toggle & Search Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            id="mobile-menu-toggle"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-[#687080] hover:text-[#171A21] rounded-xl hover:bg-[#F7F8FA] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            id="global-search-trigger"
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-[#687080] input-search focus:border-[#5B5CE2] transition-all group"
          >
            <span className="flex items-center gap-2 text-[#9299A7] group-hover:text-[#687080] transition-colors">
              <Search className="w-3.5 h-3.5 text-[#5B5CE2]" />
              <span className="truncate">Search clients, plans, receipts...</span>
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-[#5B5CE2] bg-[#EEF0FF] border border-[#E7E9EE] rounded-lg">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side: Today Date */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Current Date Badge */}
          <div className="flex items-center gap-2 text-xs text-[#687080] bg-[#F7F8FA] border border-[#E7E9EE] px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-[#5B5CE2]" />
            <span>Today: <strong className="font-semibold text-[#171A21]">{formatDateDisplay(getTodayISO())}</strong></span>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
