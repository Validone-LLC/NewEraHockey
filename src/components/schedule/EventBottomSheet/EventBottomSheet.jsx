import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, X } from 'lucide-react';
import {
  formatEventDateTime,
  categorizeEvent,
  getMultiDateDisplay,
} from '@utils/eventCategorization';
import {
  getFormattedPrice,
  getRegistrationButtonText,
  canRegister,
  getEventCustomText,
  getEventWarningText,
} from '@/services/calendarService';
import { isRegistrationEnabledForEventType } from '@/config/featureFlags';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Get type-specific styles
const getTypeStyles = eventType => {
  switch (eventType) {
    case 'camps':
      return {
        headerBg: 'bg-gradient-to-r from-red-500/20 to-red-700/10',
        badge: 'bg-red-500',
        label: 'Camp',
      };
    case 'smallGroup':
      return {
        headerBg: 'bg-gradient-to-r from-cyan-500/20 to-cyan-700/10',
        badge: 'bg-cyan-500',
        label: 'Small Group',
      };
    case 'privateSkating':
      return {
        headerBg: 'bg-gradient-to-r from-green-500/20 to-green-700/10',
        badge: 'bg-green-500',
        label: 'Private Skating',
      };
    case 'at-home':
      return {
        headerBg: 'bg-gradient-to-r from-orange-500/20 to-orange-700/10',
        badge: 'bg-orange-500',
        label: 'At Home',
      };
    default:
      return {
        headerBg: 'bg-gradient-to-r from-blue-500/20 to-blue-700/10',
        badge: 'bg-blue-500',
        label: 'Event',
      };
  }
};

const EventBottomSheet = ({ isOpen, onClose, event, eventType }) => {
  const sheetRef = useRef(null);
  const previousFocusRef = useRef(null);
  const dragControls = useDragControls();

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const raf = requestAnimationFrame(() => {
      const firstFocusable = sheetRef.current?.querySelector(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();
    });

    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusableEls = sheetRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!focusableEls || focusableEls.length === 0) return;

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!event) return null;

  // Determine event type for styling
  const actualEventType = categorizeEvent(event);
  const displayEventType =
    eventType ||
    (actualEventType === 'at_home_training'
      ? 'at-home'
      : actualEventType === 'camp'
        ? 'camps'
        : actualEventType === 'mt_vernon_skating'
          ? 'privateSkating'
          : actualEventType === 'small_group'
            ? 'smallGroup'
            : 'lessons');

  const typeStyles = getTypeStyles(displayEventType);
  const { date, time } = formatEventDateTime(event);
  const multiDateData = getMultiDateDisplay(event);
  const buttonText = getRegistrationButtonText(event);
  const eligible = canRegister(event);
  const customText = getEventCustomText(event);
  const warningText = getEventWarningText(event);
  const price = getFormattedPrice(event);
  const registrationEnabled = isRegistrationEnabledForEventType(actualEventType);
  const isAtHomeTraining = actualEventType === 'at_home_training';

  // Handle drag end - close if dragged down enough
  const handleDragEnd = (_, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={event.summary || 'Event details'}
            className="fixed bottom-0 left-0 right-0 z-50 bg-primary-dark rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* Grab Handle */}
            <div
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
              onPointerDown={e => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 bg-neutral-dark rounded-full" />
            </div>

            {/* Header */}
            <div className={`px-5 pb-4 ${typeStyles.headerBg}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold text-white mb-2 ${typeStyles.badge}`}
                  >
                    {typeStyles.label}
                  </span>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {event.summary || 'Untitled Event'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-light hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="px-5 py-4 overflow-y-auto max-h-[50vh] space-y-4">
              {/* Date & Time */}
              {multiDateData ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-neutral-light">
                    <Calendar className="w-5 h-5 text-teal-500 flex-shrink-0" />
                    <span className="font-medium text-white">{multiDateData.dateRange}</span>
                    <span className="text-sm text-neutral-light/70">
                      ({multiDateData.sessionCount} sessions)
                    </span>
                  </div>
                  <div className="pl-8 space-y-2 border-l-2 border-neutral-dark">
                    {multiDateData.sessions.map((session, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-neutral-light">
                        <span className="text-teal-400 font-medium w-10">{session.dayOfWeek}</span>
                        <span>{session.date}</span>
                        <span className="text-neutral-dark">—</span>
                        <span>
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 text-neutral-light">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-500" />
                    <span>{date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-500" />
                    <span>{time}</span>
                  </div>
                </div>
              )}

              {/* Location */}
              {event.location && !isAtHomeTraining && (
                <div className="flex items-start gap-2 text-neutral-light">
                  <MapPin className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span>{event.location}</span>
                </div>
              )}

              {/* Price */}
              {price && (
                <div className="flex items-center gap-2 text-neutral-light">
                  <DollarSign className="w-5 h-5 text-teal-500" />
                  <span className="text-white font-medium">{price}</span>
                  <span className="text-sm text-neutral-light/70">per player</span>
                </div>
              )}

              {/* Custom Text */}
              {customText && (
                <div className="pt-3 border-t border-neutral-dark/50">
                  <p className="text-neutral-light/80 text-sm italic">{customText}</p>
                </div>
              )}

              {/* Warning Text */}
              {warningText &&
                (displayEventType === 'camps' || displayEventType === 'privateSkating') && (
                  <div className="flex items-start gap-2 text-amber-400 text-sm">
                    <span>⚠️</span>
                    <span>{warningText}</span>
                  </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-4 border-t border-neutral-dark flex gap-3 bg-primary-dark">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-primary border border-neutral-dark text-neutral-light rounded-xl font-medium hover:border-neutral-light/50 transition-colors"
              >
                Close
              </button>
              {eligible && registrationEnabled ? (
                <Link
                  to={isAtHomeTraining ? `/register/at-home/${event.id}` : `/register/${event.id}`}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r ${
                    isAtHomeTraining ? 'from-orange-500 to-orange-600' : 'from-teal-500 to-teal-600'
                  } text-white font-semibold rounded-xl text-center transition-all active:scale-[0.98]`}
                  onClick={onClose}
                >
                  {buttonText}
                </Link>
              ) : buttonText === 'Contact' ? (
                <Link
                  to={`/contact?event=${encodeURIComponent(JSON.stringify({ id: event.id, summary: event.summary, date, time, location: event.location }))}`}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl text-center transition-all active:scale-[0.98]"
                  onClick={onClose}
                >
                  {buttonText}
                </Link>
              ) : (
                <button
                  disabled
                  className="flex-1 px-4 py-3 bg-neutral-dark text-neutral-light font-semibold rounded-xl cursor-not-allowed"
                >
                  {buttonText}
                </button>
              )}
            </div>

            {/* Safe area padding for iOS */}
            <div className="h-safe-area-inset-bottom bg-primary-dark" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventBottomSheet;
