import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { formatEventDateTime, isUpcoming, getMultiDateDisplay } from '@utils/eventCategorization';
import {
  canRegister,
  isSoldOut,
  getFormattedPrice,
  getRemainingSpots,
  getRegistrationButtonText,
  getEventCustomText,
  getEventWarningText,
} from '@/services/calendarService';
import SoldOutBadge from '@components/registration/SoldOutBadge';
import EventBottomSheet from '@components/schedule/EventBottomSheet';
import useMediaQuery from '@hooks/useMediaQuery';

const EVENTS_PER_PAGE = 8;

const EventList = ({ events, eventType }) => {
  const [visibleCount, setVisibleCount] = useState(EVENTS_PER_PAGE);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 640px)');

  // Reset pagination when events change
  useEffect(() => {
    setVisibleCount(EVENTS_PER_PAGE);
  }, [events]);

  if (!events || events.length === 0) {
    return null;
  }

  const visibleEvents = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  const handleOpenSheet = (event, type) => {
    setSelectedEvent({ event, eventType: type });
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <div className="space-y-3">
        {visibleEvents.map((event, index) => (
          <CompactEventCard
            key={event.id || index}
            event={event}
            eventType={event._eventType || eventType}
            isMobile={isMobile}
            onOpenSheet={handleOpenSheet}
          />
        ))}
        {hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={() => setVisibleCount(prev => prev + EVENTS_PER_PAGE)}
              className="px-6 py-2.5 bg-primary border border-neutral-dark rounded-lg text-neutral-light hover:border-teal-500 hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <ChevronDown className="w-4 h-4" />
              Show More ({events.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      <EventBottomSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        event={selectedEvent?.event}
        eventType={selectedEvent?.eventType}
      />
    </>
  );
};

// Color mapping for event types
const getTypeStyles = eventType => {
  switch (eventType) {
    case 'camps':
      return {
        border: 'border-l-red-500',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        label: 'Camp',
      };
    case 'rockville':
      return {
        border: 'border-l-cyan-500',
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        label: 'Rockville',
      };
    case 'skating':
      return {
        border: 'border-l-green-500',
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        label: 'Mt Vernon',
      };
    default:
      return {
        border: 'border-l-gray-500',
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        label: 'Event',
      };
  }
};

const CompactEventCard = ({ event, eventType, isMobile, onOpenSheet }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { date, time } = formatEventDateTime(event);
  const multiDateData = getMultiDateDisplay(event);
  const upcoming = isUpcoming(event);
  const soldOut = isSoldOut(event);
  const eligible = canRegister(event);
  const remaining = getRemainingSpots(event);
  const price = getFormattedPrice(event);
  const buttonText = getRegistrationButtonText(event);
  const customText = getEventCustomText(event);
  const warningText = getEventWarningText(event);

  const typeStyles = getTypeStyles(eventType);
  const hasExpandableContent = multiDateData || customText || warningText || event.location;

  // Handle card tap on mobile - open bottom sheet
  const handleCardClick = e => {
    if (!isMobile || !hasExpandableContent) return;

    // Don't open sheet if clicking on action buttons or links
    const target = e.target;
    if (
      target.closest('a') ||
      target.closest('button') ||
      target.tagName === 'A' ||
      target.tagName === 'BUTTON'
    ) {
      return;
    }

    onOpenSheet(event, eventType);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleCardClick}
      className={`relative bg-primary-light rounded-lg border border-neutral-dark border-l-4 ${typeStyles.border} ${
        !upcoming ? 'opacity-50' : ''
      } hover:border-neutral-dark/80 hover:shadow-lg transition-all duration-200 ${
        isMobile && hasExpandableContent ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
      {/* Main Content Row */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Left: Type Badge + Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Type Badge */}
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${typeStyles.bg} ${typeStyles.text}`}
              >
                {typeStyles.label}
              </span>
              {/* Sold Out Badge */}
              {upcoming && soldOut && (eventType === 'camps' || eventType === 'skating') && (
                <SoldOutBadge size="sm" />
              )}
              {/* Low Spots Warning */}
              {upcoming && remaining !== null && remaining <= 5 && !soldOut && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  {remaining} left
                </span>
              )}
              {/* Mobile tap hint */}
              {isMobile && hasExpandableContent && (
                <span className="text-xs text-neutral-light/50 ml-auto">Tap for details</span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
              {event.summary || 'Untitled Event'}
            </h3>
          </div>

          {/* Center: Date/Time Info - Hidden on mobile to save space */}
          <div className="hidden sm:flex items-center gap-4 text-sm text-neutral-light flex-shrink-0">
            {multiDateData ? (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-500" />
                <span className="text-white font-medium">{multiDateData.dateRange}</span>
                <span className="text-neutral-light/70">
                  ({multiDateData.sessionCount} sessions)
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-500" />
                  <span>{time}</span>
                </div>
              </>
            )}
            {price && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-teal-500" />
                <span className="text-white font-medium">{price}</span>
              </div>
            )}
          </div>

          {/* Mobile: Compact date/time row */}
          <div className="flex sm:hidden items-center gap-3 text-sm text-neutral-light">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-500" />
              <span>{multiDateData ? multiDateData.dateRange : date}</span>
            </div>
            {!multiDateData && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-500" />
                <span>{time}</span>
              </div>
            )}
            {price && (
              <div className="flex items-center gap-1.5 ml-auto">
                <DollarSign className="w-4 h-4 text-teal-500" />
                <span className="text-white font-medium">{price}</span>
              </div>
            )}
          </div>

          {/* Right: Action Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {upcoming ? (
              eligible ? (
                <Link
                  to={`/register/${event.id}`}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white text-sm font-semibold rounded-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300"
                >
                  {buttonText}
                </Link>
              ) : buttonText === 'Contact' ? (
                <Link
                  to={`/contact?event=${encodeURIComponent(JSON.stringify({ id: event.id, summary: event.summary, date, time, location: event.location }))}`}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white text-sm font-semibold rounded-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300"
                >
                  {buttonText}
                </Link>
              ) : soldOut ? (
                <button
                  disabled
                  className="px-4 py-2 bg-neutral-dark text-neutral-light text-sm font-semibold rounded-lg cursor-not-allowed"
                >
                  {buttonText}
                </button>
              ) : event.htmlLink ? (
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-neutral-600 to-neutral-700 text-white text-sm font-semibold rounded-lg hover:from-neutral-500 hover:to-neutral-600 transition-all duration-300"
                >
                  {buttonText}
                </a>
              ) : null
            ) : (
              <span className="px-3 py-1.5 bg-neutral-dark text-neutral-light text-xs rounded-full">
                Past Event
              </span>
            )}

            {/* Expand Button - Desktop only */}
            {!isMobile && hasExpandableContent && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-neutral-light hover:text-white hover:bg-neutral-dark/50 rounded-lg transition-colors"
                aria-label={isExpanded ? 'Show less' : 'Show more'}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details - Desktop only */}
      {!isMobile && isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-neutral-dark"
        >
          <div className="p-4 pt-3 space-y-2 text-sm">
            {/* Multi-date sessions */}
            {multiDateData && (
              <div className="space-y-1">
                <p className="text-neutral-light/70 text-xs uppercase tracking-wide">Sessions</p>
                <div className="pl-3 border-l-2 border-neutral-dark space-y-1">
                  {multiDateData.sessions.map((session, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-neutral-light">
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
            )}

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-2 text-neutral-light">
                <MapPin className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>{event.location}</span>
              </div>
            )}

            {/* Custom Text */}
            {customText && <p className="text-neutral-light/80 italic">{customText}</p>}

            {/* Warning Text */}
            {warningText && (eventType === 'camps' || eventType === 'skating') && (
              <div className="flex items-start gap-2 text-amber-400">
                <span>⚠️</span>
                <span>{warningText}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EventList;
