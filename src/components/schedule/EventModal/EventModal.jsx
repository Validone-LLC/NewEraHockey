import { HiX, HiCalendar, HiClock, HiLocationMarker, HiCurrencyDollar } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatEventDateTime } from '@utils/eventCategorization';
import { getFormattedPrice } from '@/services/calendarService';

const EventModal = ({ isOpen, onClose, event, eventType }) => {
  if (!event) return null;

  const { date, time } = formatEventDateTime(event);

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
                className="relative bg-primary-dark border border-neutral-dark rounded-lg shadow-2xl max-w-2xl w-full"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  className={`px-6 py-4 border-b border-neutral-dark flex items-start justify-between ${
                    eventType === 'camps'
                      ? 'bg-gradient-to-r from-red-500/20 to-red-700/20'
                      : 'bg-gradient-to-r from-blue-500/20 to-blue-700/20'
                  }`}
                >
                  <div>
                    <div className="mb-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white ${
                          eventType === 'camps' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                      >
                        {eventType === 'camps' ? 'Camp' : 'Lesson'}
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

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-3 text-neutral-light">
                      <HiLocationMarker className="text-teal-500 text-xl flex-shrink-0" />
                      <span className="font-medium">{event.location}</span>
                    </div>
                  )}

                  {/* Price */}
                  {event.registrationData?.price && (
                    <div className="flex items-center gap-3 text-neutral-light">
                      <HiCurrencyDollar className="text-teal-500 text-xl flex-shrink-0" />
                      <span className="font-medium">{getFormattedPrice(event)}</span>
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
                  <Link
                    to={`/register/${event.id}`}
                    className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300"
                  >
                    Register
                  </Link>
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
