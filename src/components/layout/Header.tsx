import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Bell,
  Menu,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatDateDisplay, getTodayISO } from '../../lib/dateUtils';
import { GlobalSearchModal } from './GlobalSearchModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearchExternal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenSearchExternal }) => {
  const { subscriptions, isSupabaseLive } = useData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [areNotificationsCleared, setAreNotificationsCleared] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Notification calculations
  const expiringSoonCount = subscriptions.filter((s) => s.status === 'EXPIRING_SOON').length;
  const expiredCount = subscriptions.filter((s) => s.status === 'EXPIRED').length;
  const pendingPaymentsCount = subscriptions.filter((s) => (s.outstanding_balance || 0) > 0).length;

  const rawTotal = expiringSoonCount + expiredCount + pendingPaymentsCount;
  const totalNotifications = areNotificationsCleared ? 0 : rawTotal;

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {/* Right Side: Today Date, Database Engine Pill, Notification Bell */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Current Date Badge */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-[#687080] bg-[#F7F8FA] border border-[#E7E9EE] px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-[#5B5CE2]" />
            <span>Today: <strong className="font-semibold text-[#171A21]">{formatDateDisplay(getTodayISO())}</strong></span>
          </div>

          {/* Notification Center */}
          <div className="relative" ref={notifRef}>
            <button
              id="notification-bell-btn"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="relative p-2 text-[#687080] hover:text-[#171A21] rounded-xl hover:bg-[#F7F8FA] transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {totalNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#D94B63] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {totalNotifications}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  id="notifications-dropdown"
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-2xl p-2 z-50 overflow-hidden border border-[#E7E9EE] shadow-lg"
                >
                  <div className="px-4 py-2.5 border-b border-[#E7E9EE] flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#171A21] uppercase tracking-wider">
                      Notifications
                    </h4>
                    {rawTotal > 0 && !areNotificationsCleared && (
                      <button
                        onClick={() => setAreNotificationsCleared(true)}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-[#E7E9EE] max-h-72 overflow-y-auto py-1">
                    {!areNotificationsCleared && expiringSoonCount > 0 && (
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          navigate('/renewals');
                        }}
                        className="w-full text-left p-3 hover:bg-[#F7F8FA] rounded-xl flex items-start gap-3 transition-colors"
                      >
                        <Clock className="w-4 h-4 text-[#D99000] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-[#171A21]">
                            {expiringSoonCount} subscriptions expiring soon
                          </p>
                          <p className="text-[11px] text-[#687080] mt-0.5">
                            Review renewals within the next 30 days.
                          </p>
                        </div>
                      </button>
                    )}

                    {!areNotificationsCleared && expiredCount > 0 && (
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          navigate('/renewals');
                        }}
                        className="w-full text-left p-3 hover:bg-[#F7F8FA] rounded-xl flex items-start gap-3 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4 text-[#D94B63] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-[#171A21]">
                            {expiredCount} expired subscriptions
                          </p>
                          <p className="text-[11px] text-[#687080] mt-0.5">
                            Require immediate renewal follow-up.
                          </p>
                        </div>
                      </button>
                    )}

                    {!areNotificationsCleared && pendingPaymentsCount > 0 && (
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          navigate('/payments');
                        }}
                        className="w-full text-left p-3 hover:bg-[#F7F8FA] rounded-xl flex items-start gap-3 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#5B5CE2] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-[#171A21]">
                            {pendingPaymentsCount} pending subscription balances
                          </p>
                          <p className="text-[11px] text-[#687080] mt-0.5">
                            Partial payments with balance outstanding.
                          </p>
                        </div>
                      </button>
                    )}

                    {(totalNotifications === 0 || areNotificationsCleared) && (
                      <div className="p-4 text-center text-xs text-[#9AA2B1]">
                        {areNotificationsCleared ? 'Notifications cleared!' : 'All subscriptions and payments are up to date!'}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
