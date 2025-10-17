import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiCalendar, HiViewList, HiRefresh } from 'react-icons/hi';
import EventList from '@components/schedule/EventList/EventList';
import EventCalendar from '@components/schedule/EventCalendar/EventCalendar';
import {
  fetchCamps,
  fetchLessons,
  startPolling,
  filterVisibleEvents,
} from '@services/calendarService';
import { sortEventsByDate } from '@utils/eventCategorization';

const TrainingSchedule = () => {
  const [eventType, setEventType] = useState('camps'); // 'camps' or 'lessons'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchFn = eventType === 'camps' ? fetchCamps : fetchLessons;
      const data = await fetchFn();

      // Filter out sold-out lessons (camps show with badge)
      const visibleEvents = filterVisibleEvents(data.events, eventType);

      setEvents(sortEventsByDate(visibleEvents));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err.message || 'Failed to load training schedule');
    } finally {
      setLoading(false);
    }
  }, [eventType]);

  // Fetch events when type changes
  useEffect(() => {
    loadEvents();
  }, [eventType, loadEvents]);

  // Set up automatic polling
  useEffect(() => {
    // Map plural state to singular API parameter
    const pollType = eventType === 'camps' ? 'camp' : 'lesson';

    const stopPollingFn = startPolling(
      updatedEvents => {
        // Filter out sold-out lessons (camps show with badge)
        const visibleEvents = filterVisibleEvents(updatedEvents, eventType);
        setEvents(sortEventsByDate(visibleEvents));
        setLastUpdated(new Date());
      },
      pollType,
      300000, // 5 minutes
      true // Skip initial fetch - loadEvents() already fetched
    );

    return () => stopPollingFn();
  }, [eventType]);

  const handleRefresh = () => {
    loadEvents();
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
              <span className="gradient-text">TRAINING SCHEDULE</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              View upcoming camps and private lessons with Coach Will
            </p>
          </motion.div>
        </div>
      </section>

      {/* Controls */}
      <section className="section-container">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-8">
          {/* Event Type Toggle */}
          <div className="flex gap-2 bg-primary rounded-lg p-1 border border-neutral-dark">
            <ToggleButton
              label="Camps"
              active={eventType === 'camps'}
              onClick={() => setEventType('camps')}
            />
            <ToggleButton
              label="Lessons"
              active={eventType === 'lessons'}
              onClick={() => setEventType('lessons')}
            />
          </div>

          {/* View Mode & Refresh */}
          <div className="flex gap-4 items-center">
            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-primary rounded-lg p-1 border border-neutral-dark">
              <ViewButton
                icon={HiViewList}
                label="List"
                active={viewMode === 'list'}
                onClick={() => setViewMode('list')}
              />
              <ViewButton
                icon={HiCalendar}
                label="Calendar"
                active={viewMode === 'calendar'}
                onClick={() => setViewMode('calendar')}
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary border border-neutral-dark rounded-lg text-neutral-light hover:border-teal-500 transition-colors disabled:opacity-50"
              aria-label="Refresh events"
            >
              <HiRefresh className={`text-xl ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && !loading && (
          <motion.p
            className="text-sm text-neutral-light text-center mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Last updated:{' '}
            {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </motion.p>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            className="card bg-red-900/20 border-red-500 text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-neutral-light">Loading {eventType}...</p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {viewMode === 'list' ? (
              <EventList events={events} eventType={eventType} />
            ) : (
              <EventCalendar events={events} eventType={eventType} />
            )}

            {/* No Events Message */}
            {events.length === 0 && (
              <motion.div
                className="text-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-2xl text-neutral-light mb-4">
                  No upcoming {eventType} scheduled
                </p>
                <p className="text-neutral-light">
                  Check back soon for new training opportunities!
                </p>
              </motion.div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

const ToggleButton = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-teal-500 to-teal-700 text-white'
          : 'text-neutral-light hover:text-white'
      }`}
    >
      {label}
    </button>
  );
};

const ViewButton = ({ icon: Icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-teal-500 to-teal-700 text-white'
          : 'text-neutral-light hover:text-white'
      }`}
      aria-label={`Switch to ${label} view`}
    >
      <Icon className="text-xl" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export default TrainingSchedule;
