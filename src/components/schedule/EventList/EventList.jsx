import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign } from 'lucide-react';
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

const EventList = ({ events, eventType }) => {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <EventCard key={event.id || index} event={event} eventType={eventType} />
      ))}
    </div>
  );
};

const EventCard = ({ event, eventType }) => {
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

  // Determine badge styling and label based on event type
  const getBadgeStyles = () => {
    switch (eventType) {
      case 'camps':
        return {
          className: 'bg-gradient-to-r from-red-500 to-red-700',
          label: 'Camp',
        };
      case 'lessons':
        return {
          className: 'bg-gradient-to-r from-blue-500 to-blue-700',
          label: 'Lesson',
        };
      case 'skating':
        return {
          className: 'bg-gradient-to-r from-green-500 to-green-700',
          label: 'Skating',
        };
      default:
        return {
          className: 'bg-gradient-to-r from-gray-500 to-gray-700',
          label: 'Event',
        };
    }
  };

  const badgeStyles = getBadgeStyles();

  return (
    <motion.div
      className={`card hover:border-teal-500 transition-all duration-300 ${
        !upcoming ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Event Type Badge */}
        <div className="flex-shrink-0">
          <div
            className={`px-4 py-2 rounded-lg font-semibold text-white text-center ${badgeStyles.className}`}
          >
            {badgeStyles.label}
          </div>
        </div>

        {/* Event Details */}
        <div className="flex-grow">
          {/* Title */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-xl font-display font-bold text-white">
              {event.summary || 'Untitled Event'}
            </h3>
            {upcoming && soldOut && (eventType === 'camps' || eventType === 'skating') && (
              <SoldOutBadge />
            )}
          </div>

          {/* Date & Time */}
          {multiDateData ? (
            <div className="mb-3">
              {/* Multi-date header */}
              <div className="flex items-center gap-2 text-neutral-light mb-2">
                <Calendar className="w-4 h-4 text-teal-500" />
                <span className="text-white font-medium">{multiDateData.dateRange}</span>
                <span className="text-xs text-neutral-light">
                  ({multiDateData.sessionCount} sessions)
                </span>
                {event.registrationData?.price && (
                  <>
                    <span className="text-neutral-dark">•</span>
                    <DollarSign className="w-4 h-4 text-teal-500" />
                    <span className="text-white">{price}</span>
                  </>
                )}
              </div>
              {/* Session schedule */}
              <div className="pl-6 space-y-1 border-l-2 border-neutral-dark ml-2">
                {multiDateData.sessions.map((session, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-teal-400 font-medium w-8">{session.dayOfWeek}</span>
                    <span className="text-neutral-light">{session.date}</span>
                    <span className="text-neutral-dark">—</span>
                    <Clock className="w-3 h-3 text-teal-500" />
                    <span className="text-neutral-light">
                      {session.startTime} - {session.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 text-neutral-light mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-500" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-500" />
                <span>{time}</span>
              </div>
              {event.registrationData?.price && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-500" />
                  <span className="text-white">{price}</span>
                </div>
              )}
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-2 text-neutral-light mb-3">
              <MapPin className="w-4 h-4 text-teal-500 mt-1 flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Custom Text */}
          {customText && <div className="text-neutral-light text-sm mb-3 italic">{customText}</div>}

          {/* Warning Text (Camps and Skating) */}
          {warningText && (eventType === 'camps' || eventType === 'skating') && (
            <div className="flex items-start gap-2 text-amber-400 text-sm mb-3">
              <span className="font-semibold">⚠️</span>
              <span>{warningText}</span>
            </div>
          )}

          {/* Registration Status */}
          {upcoming && remaining !== null && remaining <= 5 && !soldOut && (
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                Only {remaining} spot{remaining === 1 ? '' : 's'} left!
              </span>
            </div>
          )}

          {/* Description */}
          {/* {event.description && (
            <p className="text-neutral-light text-sm line-clamp-2">{event.description}</p>
          )} */}

          {/* Status Badge */}
          {!upcoming && (
            <div className="mt-3">
              <span className="inline-block px-3 py-1 bg-neutral-dark text-neutral-light text-xs rounded-full">
                Past Event
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {upcoming && (
          <div className="flex-shrink-0 flex items-center">
            {eligible ? (
              <Link
                to={`/register/${event.id}`}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300 text-center"
              >
                {buttonText}
              </Link>
            ) : buttonText === 'Contact' ? (
              <Link
                to={`/contact?event=${encodeURIComponent(JSON.stringify({ id: event.id, summary: event.summary, date, time, location: event.location }))}`}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300 text-center"
              >
                {buttonText}
              </Link>
            ) : soldOut ? (
              <button
                disabled
                className="px-6 py-2 bg-neutral-dark text-neutral-light font-semibold rounded-lg cursor-not-allowed"
              >
                {buttonText}
              </button>
            ) : event.htmlLink ? (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-gradient-to-r from-neutral-600 to-neutral-700 text-white font-semibold rounded-lg hover:from-neutral-500 hover:to-neutral-600 transition-all duration-300"
              >
                {buttonText}
              </a>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EventList;
