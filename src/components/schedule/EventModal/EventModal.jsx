import { HiX, HiCalendar, HiClock, HiLocationMarker, HiCurrencyDollar } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
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

const EventModal = ({ isOpen, onClose, event }) => {
  if (!event) return null;

  // Determine actual event type from event data (not the passed eventType which might be 'all')
  const actualEventType = categorizeEvent(event); // Returns: 'camp', 'lesson', 'at_home_training', or 'other'
  const displayEventType =
    actualEventType === 'at_home_training'
      ? 'at-home'
      : actualEventType === 'camp'
        ? 'camps'
        : 'lessons';

  const { date, time } = formatEventDateTime(event);
  const multiDateData = getMultiDateDisplay(event);
  const buttonText = getRegistrationButtonText(event);
  const eligible = canRegister(event);
  const customText = getEventCustomText(event);
  const warningText = getEventWarningText(event);

  // Check if registration is enabled for this event type
  const registrationEnabled = isRegistrationEnabledForEventType(actualEventType);

  // For At Home Training, navigate to dedicated page
  const isAtHomeTraining = actualEventType === 'at_home_training';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                className="relative bg-primary-dark border border-neutral-dark rounded-lg shadow-2xl w-full max-w-2xl"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  className={`px-6 py-4 border-b border-neutral-dark flex items-start justify-between ${
                    displayEventType === 'camps'
                      ? 'bg-gradient-to-r from-red-500/20 to-red-700/20'
                      : displayEventType === 'at-home'
                        ? 'bg-gradient-to-r from-orange-500/20 to-orange-700/20'
                        : 'bg-gradient-to-r from-blue-500/20 to-blue-700/20'
                  }`}
                >
                  <div>
                    <div className="mb-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white ${
                          displayEventType === 'camps'
                            ? 'bg-red-500'
                            : displayEventType === 'at-home'
                              ? 'bg-orange-500'
                              : 'bg-blue-500'
                        }`}
                      >
                        {displayEventType === 'camps'
                          ? 'Camp'
                          : displayEventType === 'at-home'
                            ? 'At Home Training'
                            : 'Lesson'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">
                      {event.summary || 'Untitled Event'}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-neutral-light hover:text-white transition-colors"
                    aria-label="Close modal"
                  >
                    <HiX className="text-2xl" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-4">
                  {/* Date & Time */}
                  {multiDateData ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-neutral-light">
                        <HiCalendar className="text-teal-500 text-xl flex-shrink-0" />
                        <span className="font-medium text-white">{multiDateData.dateRange}</span>
                        <span className="text-sm text-neutral-light">
                          ({multiDateData.sessionCount} sessions)
                        </span>
                      </div>
                      {/* Session schedule */}
                      <div className="pl-8 space-y-2 border-l-2 border-neutral-dark ml-2">
                        {multiDateData.sessions.map((session, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <span className="text-teal-400 font-semibold w-10">
                              {session.dayOfWeek}
                            </span>
                            <span className="text-neutral-light">{session.date}</span>
                            <span className="text-neutral-dark">—</span>
                            <HiClock className="text-teal-500 text-sm" />
                            <span className="text-neutral-light">
                              {session.startTime} - {session.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-neutral-light">
                        <HiCalendar className="text-teal-500 text-xl flex-shrink-0" />
                        <span className="font-medium">{date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-light">
                        <HiClock className="text-teal-500 text-xl flex-shrink-0" />
                        <span className="font-medium">{time}</span>
                      </div>
                    </div>
                  )}

                  {/* Location - Hide for At Home Training */}
                  {event.location && !isAtHomeTraining && (
                    <div className="flex items-start gap-3 text-neutral-light">
                      <HiLocationMarker className="text-teal-500 text-xl flex-shrink-0" />
                      <span className="font-medium">{event.location}</span>
                    </div>
                  )}

                  {/* Price */}
                  {event.registrationData?.price && (
                    <div className="flex items-center gap-3 text-neutral-light">
                      <HiCurrencyDollar className="text-teal-500 text-xl flex-shrink-0" />
                      <span className="font-medium">{getFormattedPrice(event)} per player</span>
                    </div>
                  )}

                  {/* Custom Text */}
                  {customText && (
                    <div className="pt-4 border-t border-neutral-dark/50">
                      <p className="text-neutral-light text-sm italic">{customText}</p>
                    </div>
                  )}

                  {/* Warning Text (Camps only) */}
                  {warningText && displayEventType === 'camps' && (
                    <div className={`pt-4 ${!customText ? 'border-t border-neutral-dark/50' : ''}`}>
                      <div className="flex items-start gap-2 text-amber-400 text-sm">
                        <span className="font-semibold">⚠️</span>
                        <span>{warningText}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-dark flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-primary border border-neutral-dark text-neutral-light rounded-lg hover:border-teal-500 transition-colors"
                  >
                    Close
                  </button>
                  {eligible && registrationEnabled ? (
                    <Link
                      to={
                        isAtHomeTraining ? `/register/at-home/${event.id}` : `/register/${event.id}`
                      }
                      className={`px-6 py-2 bg-gradient-to-r ${
                        isAtHomeTraining
                          ? 'from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800'
                          : 'from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800'
                      } text-white font-semibold rounded-lg transition-all duration-300`}
                    >
                      {buttonText}
                    </Link>
                  ) : buttonText === 'Contact' ? (
                    <Link
                      to={`/contact?event=${encodeURIComponent(JSON.stringify({ id: event.id, summary: event.summary, date, time, location: event.location }))}`}
                      className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300"
                    >
                      {buttonText}
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-6 py-2 bg-neutral-dark text-neutral-light font-semibold rounded-lg cursor-not-allowed"
                    >
                      {buttonText}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventModal;
