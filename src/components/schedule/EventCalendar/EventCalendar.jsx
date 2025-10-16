import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './EventCalendar.css';
import EventModal from '../EventModal/EventModal';

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

const EventCalendar = ({ events, eventType }) => {
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

  // Event style getter - color code by type
  const eventStyleGetter = () => {
    const style = {
      backgroundColor: eventType === 'camps' ? '#ef4444' : '#3b82f6', // red for camps, blue for lessons
      borderRadius: '5px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      fontWeight: '600',
    };

    return { style };
  };

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

  return (
    <>
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          views={['month', 'week', 'day']}
          defaultView="month"
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
