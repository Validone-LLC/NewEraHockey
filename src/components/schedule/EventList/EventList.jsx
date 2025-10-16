import { motion } from 'framer-motion';
import { HiCalendar, HiClock, HiLocationMarker } from 'react-icons/hi';
import { formatEventDateTime, isUpcoming } from '@utils/eventCategorization';

const EventList = ({ events, eventType }) => {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <EventCard key={event.id || index} event={event} eventType={eventType} index={index} />
      ))}
    </div>
  );
};

const EventCard = ({ event, eventType, index }) => {
  const { date, time } = formatEventDateTime(event);
  const upcoming = isUpcoming(event);

  return (
    <motion.div
      className={`card hover:border-teal-500 transition-all duration-300 ${
        !upcoming ? 'opacity-60' : ''
      }`}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Event Type Badge */}
        <div className="flex-shrink-0">
          <div
            className={`px-4 py-2 rounded-lg font-semibold text-white text-center ${
              eventType === 'camps'
                ? 'bg-gradient-to-r from-red-500 to-red-700'
                : 'bg-gradient-to-r from-blue-500 to-blue-700'
            }`}
          >
            {eventType === 'camps' ? 'Camp' : 'Lesson'}
          </div>
        </div>

        {/* Event Details */}
        <div className="flex-grow">
          {/* Title */}
          <h3 className="text-xl font-display font-bold text-white mb-2">
            {event.summary || 'Untitled Event'}
          </h3>

          {/* Date & Time */}
          <div className="flex flex-wrap gap-4 text-neutral-light mb-2">
            <div className="flex items-center gap-2">
              <HiCalendar className="text-teal-500" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <HiClock className="text-teal-500" />
              <span>{time}</span>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-2 text-neutral-light mb-3">
              <HiLocationMarker className="text-teal-500 mt-1 flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-neutral-light text-sm line-clamp-3">{event.description}</p>
          )}

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
        {upcoming && event.htmlLink && (
          <div className="flex-shrink-0 flex items-center">
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300"
            >
              View Details
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EventList;
