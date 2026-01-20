import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiRefresh, HiHome } from 'react-icons/hi';
import SEO from '@components/common/SEO/SEO';
import EventList from '@components/schedule/EventList/EventList';
import EventCalendar from '@components/schedule/EventCalendar/EventCalendar';
import {
  fetchCamps,
  fetchLessons,
  fetchMtVernonSkating,
  fetchAtHomeTrainingByMonth,
  startPolling,
  filterVisibleEvents,
  filterAvailableAtHomeTraining,
  filterAvailableMtVernonSkating,
  refreshEvents,
} from '@services/calendarService';
import { sortEventsByDate } from '@utils/eventCategorization';

const TrainingSchedule = () => {
  // List view state (Camps/Lessons/Mt Vernon Skating tabs)
  const [listType, setListType] = useState('camps'); // 'camps', 'lessons', or 'skating'
  const [campsEvents, setCampsEvents] = useState([]);
  const [lessonsEvents, setLessonsEvents] = useState([]);
  const [skatingEvents, setSkatingEvents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // Calendar view state (all three event types combined)
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [monthCache, setMonthCache] = useState({}); // Cache for at-home training by month (accessed via setter)
  const monthCacheRef = useRef({}); // Ref for synchronous cache access (prevents loading flicker)

  // Load camps, lessons, and skating events for list view (fetch all events)
  const loadListEvents = useCallback(async () => {
    try {
      setListLoading(true);
      setListError(null);

      // Fetch camps, lessons, and skating in parallel
      const [campsData, lessonsData, skatingData] = await Promise.all([
        fetchCamps(),
        fetchLessons(),
        fetchMtVernonSkating(),
      ]);

      // Filter visible events (camps show all, lessons hide sold-out, skating hide registered)
      const visibleCamps = filterVisibleEvents(campsData.events, 'camps');
      const visibleLessons = filterVisibleEvents(lessonsData.events, 'lessons');
      const visibleSkating = filterAvailableMtVernonSkating(skatingData.events);

      setCampsEvents(sortEventsByDate(visibleCamps));
      setLessonsEvents(sortEventsByDate(visibleLessons));
      setSkatingEvents(sortEventsByDate(visibleSkating));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load list events:', err);
      setListError(err.message || 'Failed to load events');
    } finally {
      setListLoading(false);
    }
  }, []);

  // Load calendar events (camps + lessons + at-home for current month)
  const loadCalendarEvents = useCallback(async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const cacheKey = `${year}-${month}`;

    // Check cache synchronously via ref - skip loading state if cached
    const cachedData = monthCacheRef.current[cacheKey];
    const isCached = !!cachedData;

    try {
      // Only show loading for uncached months (prevents flicker on navigation)
      if (!isCached) {
        setCalendarLoading(true);
      }
      setCalendarError(null);

      let atHomeData;

      if (isCached) {
        atHomeData = cachedData;
      } else {
        atHomeData = await fetchAtHomeTrainingByMonth(year, month);
        // Update both ref and state
        monthCacheRef.current[cacheKey] = atHomeData;
        setMonthCache(prev => ({ ...prev, [cacheKey]: atHomeData }));
      }

      // Filter available at-home training slots (hide booked)
      const visibleAtHome = filterAvailableAtHomeTraining(atHomeData.events);

      // Combine all events for calendar (use already loaded camps/lessons/skating + at-home for month)
      const allCalendarEvents = [
        ...campsEvents,
        ...lessonsEvents,
        ...skatingEvents,
        ...visibleAtHome,
      ];

      setCalendarEvents(sortEventsByDate(allCalendarEvents));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      setCalendarError(err.message || 'Failed to load calendar');
    } finally {
      setCalendarLoading(false);
    }
  }, [currentMonth, campsEvents, lessonsEvents, skatingEvents]);

  // Initial load: Fetch list events on mount
  useEffect(() => {
    loadListEvents();
  }, [loadListEvents]);

  // Load calendar events when list events are ready or month changes
  // Always load calendar events (even if no camps/lessons) to show at-home training
  useEffect(() => {
    // Wait for initial list load to complete before loading calendar
    if (!listLoading) {
      loadCalendarEvents();
    }
  }, [listLoading, currentMonth, loadCalendarEvents]);

  // Set up automatic polling for camps, lessons, and skating (updates both list and calendar)
  useEffect(() => {
    const stopCampsPolling = startPolling(
      updatedEvents => {
        const visibleCamps = filterVisibleEvents(updatedEvents, 'camps');
        setCampsEvents(sortEventsByDate(visibleCamps));
        setLastUpdated(new Date());
      },
      'camp',
      300000, // 5 minutes
      true // Skip initial fetch
    );

    const stopLessonsPolling = startPolling(
      updatedEvents => {
        const visibleLessons = filterVisibleEvents(updatedEvents, 'lessons');
        setLessonsEvents(sortEventsByDate(visibleLessons));
        setLastUpdated(new Date());
      },
      'lesson',
      300000, // 5 minutes
      true // Skip initial fetch
    );

    const stopSkatingPolling = startPolling(
      updatedEvents => {
        const visibleSkating = filterAvailableMtVernonSkating(updatedEvents);
        setSkatingEvents(sortEventsByDate(visibleSkating));
        setLastUpdated(new Date());
      },
      'mt_vernon_skating',
      300000, // 5 minutes
      true // Skip initial fetch
    );

    return () => {
      stopCampsPolling();
      stopLessonsPolling();
      stopSkatingPolling();
    };
  }, []);

  const handleRefresh = async () => {
    try {
      setListLoading(true);
      setCalendarLoading(true);
      setListError(null);
      setCalendarError(null);

      // Refresh list events (camps, lessons, and skating)
      const [campsData, lessonsData, skatingData] = await Promise.all([
        refreshEvents('camp'),
        refreshEvents('lesson'),
        refreshEvents('mt_vernon_skating'),
      ]);

      const visibleCamps = filterVisibleEvents(campsData.events, 'camps');
      const visibleLessons = filterVisibleEvents(lessonsData.events, 'lessons');
      const visibleSkating = filterAvailableMtVernonSkating(skatingData.events);

      setCampsEvents(sortEventsByDate(visibleCamps));
      setLessonsEvents(sortEventsByDate(visibleLessons));
      setSkatingEvents(sortEventsByDate(visibleSkating));

      // Refresh at-home training for current month (clear cache)
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const cacheKey = `${year}-${month}`;

      // Clear cache (both ref and state)
      delete monthCacheRef.current[cacheKey];
      setMonthCache(prev => {
        const newCache = { ...prev };
        delete newCache[cacheKey];
        return newCache;
      });

      const atHomeData = await fetchAtHomeTrainingByMonth(year, month);
      // Update both ref and state
      monthCacheRef.current[cacheKey] = atHomeData;
      setMonthCache(prev => ({ ...prev, [cacheKey]: atHomeData }));

      const visibleAtHome = filterAvailableAtHomeTraining(atHomeData.events);
      const allCalendarEvents = [
        ...visibleCamps,
        ...visibleLessons,
        ...visibleSkating,
        ...visibleAtHome,
      ];

      setCalendarEvents(sortEventsByDate(allCalendarEvents));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to refresh events:', err);
      setListError(err.message || 'Failed to refresh events');
      setCalendarError(err.message || 'Failed to refresh events');
    } finally {
      setListLoading(false);
      setCalendarLoading(false);
    }
  };

  // Handle calendar month navigation
  const handleMonthChange = useCallback(newDate => {
    setCurrentMonth(newDate);
  }, []);

  return (
    <div className="min-h-screen">
      <SEO pageKey="event-registration" />
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
              <span className="gradient-text">TRAINING EVENTS</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              Browse and register for upcoming camps and private lessons
            </p>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events List Section */}
      <section className="section-container pb-12">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold gradient-text">Upcoming Events</h2>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={listLoading || calendarLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary border border-neutral-dark rounded-lg text-neutral-light hover:border-teal-500 transition-colors disabled:opacity-50"
            aria-label="Refresh events"
          >
            <HiRefresh
              className={`text-xl ${listLoading || calendarLoading ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* List Tabs */}
        <div className="inline-flex gap-2 bg-primary rounded-lg p-1 border border-neutral-dark mb-6">
          <ToggleButton
            label="Camps"
            active={listType === 'camps'}
            onClick={() => setListType('camps')}
          />
          <ToggleButton
            label="Lessons"
            active={listType === 'lessons'}
            onClick={() => setListType('lessons')}
          />
          <ToggleButton
            label="Mt Vernon Skating"
            active={listType === 'skating'}
            onClick={() => setListType('skating')}
          />
        </div>

        {/* List Error State */}
        {listError && (
          <motion.div
            className="card bg-red-900/20 border-red-500 text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-400 mb-4">{listError}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* List Loading State */}
        {listLoading && (
          <motion.div
            className="flex flex-col items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-neutral-light">Loading events...</p>
          </motion.div>
        )}

        {/* List Content with max height and scroll */}
        {!listLoading && !listError && (
          <div className="max-h-[36rem] sm:max-h-[32rem] overflow-y-auto custom-scrollbar pb-4">
            <EventList
              events={
                listType === 'camps'
                  ? campsEvents
                  : listType === 'lessons'
                    ? lessonsEvents
                    : skatingEvents
              }
              eventType={listType}
            />

            {/* No Events Message */}
            {((listType === 'camps' && campsEvents.length === 0) ||
              (listType === 'lessons' && lessonsEvents.length === 0) ||
              (listType === 'skating' && skatingEvents.length === 0)) && (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xl text-neutral-light mb-2">
                  No upcoming {listType === 'skating' ? 'Mt Vernon Skating sessions' : listType}{' '}
                  scheduled
                </p>
                <p className="text-neutral-light text-sm">
                  Check back soon for new training opportunities!
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && !listLoading && !calendarLoading && (
          <motion.p
            className="text-xs text-neutral-light text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Last updated:{' '}
            {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </motion.p>
        )}
      </section>

      {/* Additional Training Services Info */}
      <section className="section-container pt-0">
        <motion.div
          className="flex items-center gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <HiHome className="text-2xl text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-200">
            <span className="font-semibold">
              1-on-1 training, stick handling, shooting, and film analysis
            </span>{' '}
            — book an <span className="text-orange-400 font-semibold">At Home Training</span>{' '}
            appointment in the calendar below.
          </p>
        </motion.div>
      </section>

      {/* Calendar Section */}
      <section className="section-container pt-0">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-4">
          <h2 className="text-2xl font-display font-bold gradient-text">Training Calendar</h2>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={listLoading || calendarLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary border border-neutral-dark rounded-lg text-neutral-light hover:border-teal-500 transition-colors disabled:opacity-50"
            aria-label="Refresh calendar"
          >
            <HiRefresh
              className={`text-xl ${listLoading || calendarLoading ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Calendar Legend */}
        <div className="flex flex-wrap justify-center gap-4 text-sm mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-neutral-light">Camps</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-neutral-light">Lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-neutral-light">Mt Vernon Skating</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-neutral-light">At Home</span>
          </div>
        </div>

        {/* Calendar Error State */}
        {calendarError && (
          <motion.div
            className="card bg-red-900/20 border-red-500 text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-400 mb-4">{calendarError}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Calendar Container */}
        {!calendarError && (
          <div className="relative">
            {/* Loading Overlay */}
            {calendarLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary/80 rounded-lg">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-neutral-light">Loading calendar...</p>
              </div>
            )}

            {/* Calendar Content - Always rendered to maintain dimensions */}
            <div className={calendarLoading ? 'opacity-30 pointer-events-none' : ''}>
              <EventCalendar
                events={calendarEvents}
                eventType="all"
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
              />
            </div>

            {/* No Events Message */}
            {!calendarLoading && calendarEvents.length === 0 && (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xl text-neutral-light mb-2">No events scheduled this month</p>
                <p className="text-neutral-light text-sm">
                  Check back soon for new training opportunities!
                </p>
              </motion.div>
            )}
          </div>
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

export default TrainingSchedule;
