import { HiX, HiCalendar, HiClock, HiLocationMarker, HiExternalLink } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEventDateTime } from '@utils/eventCategorization';

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
                      <span className="font-semibold">{date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-light">
                      <HiClock className="text-teal-500 text-xl flex-shrink-0" />
                      <span className="font-semibold">{time}</span>
                    </div>
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-3 text-neutral-light">
                      <HiLocationMarker className="text-teal-500 text-xl flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold mb-1">Location</p>
                        <p>{event.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {event.description && (
                    <div className="text-neutral-light">
                      <p className="font-semibold mb-2">Details</p>
                      <p className="whitespace-pre-wrap">{event.description}</p>
                    </div>
                  )}

                  {/* Attendees (if any) */}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="text-neutral-light">
                      <p className="font-semibold mb-2">Attendees ({event.attendees.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {event.attendees.slice(0, 5).map((attendee, index) => (
                          <span key={index} className="px-3 py-1 bg-primary rounded-full text-sm">
                            {attendee.email}
                          </span>
                        ))}
                        {event.attendees.length > 5 && (
                          <span className="px-3 py-1 bg-primary rounded-full text-sm">
                            +{event.attendees.length - 5} more
                          </span>
                        )}
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
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300"
                    >
                      <span>View in Google Calendar</span>
                      <HiExternalLink />
                    </a>
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
