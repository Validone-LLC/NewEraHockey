import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './EventCalendar.css';
import EventModal from '../EventModal/EventModal';
import { EVENT_TYPES, CALENDAR_DISPLAY_COLORS } from '@/config/constants';
import { categorizeEvent } from '@utils/eventCategorization';

// Setup date-fns localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EventCalendar = ({
  events,
  eventType,
  currentMonth,
  onMonthChange,
  defaultView = 'month',
}) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Transform Google Calendar events to react-big-calendar format
  const calendarEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];

    return events.map(event => {
      const start = event.start?.dateTime
        ? new Date(event.start.dateTime)
        : new Date(event.start?.date);

      const end = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.end?.date);

      return {
        id: event.id,
        title: event.summary || 'Untitled Event',
        start,
        end,
        allDay: !event.start?.dateTime,
        resource: event, // Store full event data
      };
    });
  }, [events]);

  // Event style getter - color code by categorized type (memoized to avoid recalculation on re-renders)
  const eventStyleGetter = useCallback(event => {
    const eventData = event.resource;
    const category = categorizeEvent(eventData);

    const backgroundColor =
      CALENDAR_DISPLAY_COLORS[category] || CALENDAR_DISPLAY_COLORS[EVENT_TYPES.LESSON];

    const style = {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      fontWeight: '600',
    };

    return { style };
  }, []);

  // Handle event click
  const handleSelectEvent = event => {
    setSelectedEvent(event.resource);
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
  };

  // Handle calendar navigation (month change)
  const handleNavigate = date => {
    if (onMonthChange) {
      onMonthChange(date);
    }
  };

  return (
    <>
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          date={currentMonth}
          defaultDate={currentMonth}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          onNavigate={handleNavigate}
          views={['month', 'week', 'day', 'agenda']}
          defaultView={defaultView}
          popup
          tooltipAccessor={event => event.title}
        />
      </div>

      {/* Event Detail Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        eventType={eventType}
      />
    </>
  );
};

export default EventCalendar;
