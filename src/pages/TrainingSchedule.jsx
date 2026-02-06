import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { HiRefresh, HiHome, HiExclamation, HiViewList, HiCalendar } from 'react-icons/hi';
import SEO from '@components/common/SEO/SEO';
import EventList from '@components/schedule/EventList/EventList';
import EventCalendar from '@components/schedule/EventCalendar/EventCalendar';
import useMediaQuery from '@hooks/useMediaQuery';
import {
  fetchCamps,
  fetchRockvilleSmallGroup,
  fetchMtVernonSkating,
  fetchEvents,
  fetchAtHomeTrainingByMonth,
  filterVisibleEvents,
  filterAvailableAtHomeTraining,
  filterAvailableMtVernonSkating,
  filterAvailableRockvilleSmallGroup,
  filterTestEvents,
  refreshEvents,
} from '@services/calendarService';
import { sortEventsByDate } from '@utils/eventCategorization';

// View content animation variants
const viewContentVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Tab content animation variants (for event type sub-tabs)
const tabContentVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// Skeleton loading component for events
const EventSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="card animate-shimmer bg-primary-light h-32 flex items-center gap-4">
        <div className="w-20 h-20 bg-neutral-dark/50 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-neutral-dark/50 rounded w-3/4" />
          <div className="h-4 bg-neutral-dark/50 rounded w-1/2" />
          <div className="h-4 bg-neutral-dark/50 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

const TrainingSchedule = () => {
  // Primary view toggle: 'list' or 'calendar'
  const [activeView, setActiveView] = useState('list');

  // Filter chips state (multi-select: 'all' or specific types)
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [campsEvents, setCampsEvents] = useState([]);
  const [rockvilleEvents, setRockvilleEvents] = useState([]);
  const [skatingEvents, setSkatingEvents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // Calendar view state (all three event types combined)
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [isStaleData, setIsStaleData] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [monthCache, setMonthCache] = useState({}); // Cache for at-home training by month (accessed via setter)
  const monthCacheRef = useRef({}); // Ref for synchronous cache access (prevents loading flicker)

  // Media query for mobile view
  const isMobile = useMediaQuery('(max-width: 640px)');

  // Total events count for the list view badge
  const totalListEvents = campsEvents.length + rockvilleEvents.length + skatingEvents.length;

  // Load camps, rockville, and skating events for list view (fetch all events)
  const loadListEvents = useCallback(async () => {
    try {
      setListLoading(true);
      setListError(null);

      // Fetch camps, rockville small group, and skating in parallel
      const [campsData, rockvilleData, skatingData] = await Promise.all([
        fetchCamps(),
        fetchRockvilleSmallGroup(),
        fetchMtVernonSkating(),
      ]);

      // Detect if any data came from stale cache (API was down)
      const stale = [campsData, rockvilleData, skatingData].some(d => d._stale);
      setIsStaleData(stale);

      // Filter visible events (camps show all, rockville hide sold-out, skating hide registered)
      // Also filter out [TEST] events unless VITE_SHOW_TEST_EVENTS=true
      const visibleCamps = filterTestEvents(filterVisibleEvents(campsData.events, 'camps'));
      const visibleRockville = filterTestEvents(
        filterAvailableRockvilleSmallGroup(rockvilleData.events)
      );
      const visibleSkating = filterTestEvents(filterAvailableMtVernonSkating(skatingData.events));

      setCampsEvents(sortEventsByDate(visibleCamps));
      setRockvilleEvents(sortEventsByDate(visibleRockville));
      setSkatingEvents(sortEventsByDate(visibleSkating));
      setLastUpdated(stale && campsData._cachedAt ? new Date(campsData._cachedAt) : new Date());
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

      // Filter available at-home training slots (hide booked) and test events
      const visibleAtHome = filterTestEvents(filterAvailableAtHomeTraining(atHomeData.events));

      // Combine all events for calendar (use already loaded camps/rockville/skating + at-home for month)
      const allCalendarEvents = [
        ...campsEvents,
        ...rockvilleEvents,
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
  }, [currentMonth, campsEvents, rockvilleEvents, skatingEvents]);

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

  // Single consolidated poll for all event types (replaces 3 separate polling intervals)
  useEffect(() => {
    const POLL_INTERVAL = 300000; // 5 minutes

    const pollId = setInterval(async () => {
      try {
        // Fetch all event types in parallel, bypassing cache for fresh data
        const [campsData, rockvilleData, skatingData] = await Promise.all([
          fetchEvents('camp', true, false),
          fetchEvents('rockville_small_group', true, false),
          fetchEvents('mt_vernon_skating', true, false),
        ]);

        const visibleCamps = filterTestEvents(filterVisibleEvents(campsData.events, 'camps'));
        const visibleRockville = filterTestEvents(
          filterAvailableRockvilleSmallGroup(rockvilleData.events)
        );
        const visibleSkating = filterTestEvents(filterAvailableMtVernonSkating(skatingData.events));

        setCampsEvents(sortEventsByDate(visibleCamps));
        setRockvilleEvents(sortEventsByDate(visibleRockville));
        setSkatingEvents(sortEventsByDate(visibleSkating));
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(pollId);
  }, []);

  const handleRefresh = async () => {
    try {
      setListLoading(true);
      setCalendarLoading(true);
      setListError(null);
      setCalendarError(null);

      // Refresh list events (camps, rockville, and skating)
      const [campsData, rockvilleData, skatingData] = await Promise.all([
        refreshEvents('camp'),
        refreshEvents('rockville_small_group'),
        refreshEvents('mt_vernon_skating'),
      ]);

      const visibleCamps = filterTestEvents(filterVisibleEvents(campsData.events, 'camps'));
      const visibleRockville = filterTestEvents(
        filterAvailableRockvilleSmallGroup(rockvilleData.events)
      );
      const visibleSkating = filterTestEvents(filterAvailableMtVernonSkating(skatingData.events));

      setCampsEvents(sortEventsByDate(visibleCamps));
      setRockvilleEvents(sortEventsByDate(visibleRockville));
      setSkatingEvents(sortEventsByDate(visibleSkating));
      setIsStaleData(false);

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

      const visibleAtHome = filterTestEvents(filterAvailableAtHomeTraining(atHomeData.events));
      const allCalendarEvents = [
        ...visibleCamps,
        ...visibleRockville,
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

  // Filter chip definitions
  const filterChips = [
    { id: 'all', label: 'All Events', color: 'bg-neutral-600', activeColor: 'bg-neutral-500' },
    {
      id: 'camps',
      label: 'Camps',
      color: 'bg-red-500/20 text-red-400 border-red-500/50',
      activeColor: 'bg-red-500 text-white',
      count: campsEvents.length,
    },
    {
      id: 'rockville',
      label: 'Rockville',
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      activeColor: 'bg-cyan-500 text-white',
      count: rockvilleEvents.length,
    },
    {
      id: 'skating',
      label: 'Mt Vernon',
      color: 'bg-green-500/20 text-green-400 border-green-500/50',
      activeColor: 'bg-green-500 text-white',
      count: skatingEvents.length,
    },
  ];

  // Handle filter chip toggle
  const handleFilterToggle = filterId => {
    setActiveFilters(prev => {
      if (filterId === 'all') {
        // Clicking "All" clears other filters
        return ['all'];
      }

      // Remove 'all' if selecting specific filter
      const withoutAll = prev.filter(f => f !== 'all');

      if (prev.includes(filterId)) {
        // Deselecting a filter
        const newFilters = withoutAll.filter(f => f !== filterId);
        // If no filters left, default to 'all'
        return newFilters.length === 0 ? ['all'] : newFilters;
      } else {
        // Adding a filter
        return [...withoutAll, filterId];
      }
    });
  };

  // Get unified filtered events based on active filter chips
  const getFilteredEvents = useCallback(() => {
    // Add _eventType to each event for proper styling in EventList
    const campsWithType = campsEvents.map(e => ({ ...e, _eventType: 'camps' }));
    const rockvilleWithType = rockvilleEvents.map(e => ({ ...e, _eventType: 'rockville' }));
    const skatingWithType = skatingEvents.map(e => ({ ...e, _eventType: 'skating' }));

    // If 'all' is selected, return all events
    if (activeFilters.includes('all')) {
      return sortEventsByDate([...campsWithType, ...rockvilleWithType, ...skatingWithType]);
    }

    // Otherwise, filter based on selected chips
    const filtered = [];
    if (activeFilters.includes('camps')) filtered.push(...campsWithType);
    if (activeFilters.includes('rockville')) filtered.push(...rockvilleWithType);
    if (activeFilters.includes('skating')) filtered.push(...skatingWithType);

    return sortEventsByDate(filtered);
  }, [activeFilters, campsEvents, rockvilleEvents, skatingEvents]);

  // Primary view tabs
  const viewTabs = [
    { id: 'list', label: 'Events List', icon: HiViewList },
    { id: 'calendar', label: 'Calendar', icon: HiCalendar },
  ];

  return (
    <div className="min-h-screen">
      <SEO pageKey="event-registration" />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsOrganization',
            name: 'New Era Hockey',
            url: 'https://newerahockeytraining.com',
            sport: 'Ice Hockey',
            description:
              'Premier hockey training in the DMV area offering camps, private lessons, and skating sessions.',
            areaServed: {
              '@type': 'Place',
              name: 'DMV (DC, Maryland, Virginia)',
            },
            event: {
              '@type': 'Event',
              name: 'New Era Hockey Training Events',
              url: 'https://newerahockeytraining.com/event-registration',
              organizer: {
                '@type': 'SportsOrganization',
                name: 'New Era Hockey',
              },
            },
          })}
        </script>
      </Helmet>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-4">
              <span className="gradient-text">TRAINING EVENTS</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-light max-w-2xl mx-auto mb-6">
              Browse and register for upcoming camps and private lessons
            </p>

            {/* At Home Training Banner */}
            <motion.div
              className="flex items-center justify-center gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <HiHome className="text-2xl text-orange-400 flex-shrink-0" />
              <p className="text-sm text-orange-200 text-left">
                <span className="font-semibold">
                  1-on-1 training, stick handling, shooting, and film analysis
                </span>{' '}
                — book an <span className="text-orange-400 font-semibold">At Home Training</span>{' '}
                appointment in the calendar.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stale Data Warning */}
      {isStaleData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <HiExclamation className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-200">
              Showing cached data — our event service is temporarily unavailable.{' '}
              {lastUpdated && (
                <span className="text-amber-400">
                  Last updated:{' '}
                  {lastUpdated.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              )}
            </p>
            <button
              onClick={handleRefresh}
              className="ml-auto text-sm text-amber-400 hover:text-amber-300 underline flex-shrink-0"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content Section */}
      <section className="section-container">
        {/* Header with View Toggle and Refresh */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          {/* Primary View Tabs */}
          <div
            role="tablist"
            aria-label="View selection"
            className="flex bg-primary rounded-xl p-1.5 border border-neutral-dark"
          >
            {viewTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              const count = tab.id === 'list' ? totalListEvents : calendarEvents.length;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`view-panel-${tab.id}`}
                  id={`view-tab-${tab.id}`}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 to-teal-700 text-white shadow-lg'
                      : 'text-neutral-light hover:text-white hover:bg-neutral-dark/50'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {!listLoading && count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-neutral-dark text-neutral-light'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Refresh Button with Auto-refresh indicator */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-light/60 hidden sm:inline">
              Auto-refreshes every 5 min
            </span>
            <button
              onClick={handleRefresh}
              disabled={listLoading || calendarLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary border border-neutral-dark rounded-lg text-neutral-light hover:border-teal-500 transition-colors disabled:opacity-50"
              aria-label="Refresh all events"
            >
              <HiRefresh
                className={`text-xl ${listLoading || calendarLoading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* View Content */}
        <AnimatePresence mode="wait">
          {activeView === 'list' ? (
            <motion.div
              key="list-view"
              role="tabpanel"
              id="view-panel-list"
              aria-labelledby="view-tab-list"
              variants={viewContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {/* Filter Chips */}
              <div
                role="group"
                aria-label="Filter events by type"
                className="flex flex-wrap gap-2 mb-6"
              >
                {filterChips.map(chip => {
                  const isActive = activeFilters.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      onClick={() => handleFilterToggle(chip.id)}
                      aria-pressed={isActive}
                      className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 border flex items-center gap-2 ${
                        isActive
                          ? chip.activeColor + ' border-transparent shadow-md'
                          : chip.color + ' hover:opacity-80'
                      }`}
                    >
                      {chip.label}
                      {chip.count !== undefined && !listLoading && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20' : 'bg-black/20'
                          }`}
                        >
                          {chip.count}
                        </span>
                      )}
                    </button>
                  );
                })}
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

              {/* Skeleton Loading State */}
              {listLoading && <EventSkeleton />}

              {/* List Content */}
              {!listLoading && !listError && (
                <div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeFilters.join('-')}
                      variants={tabContentVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                    >
                      <EventList events={getFilteredEvents()} />

                      {/* Empty State */}
                      {getFilteredEvents().length === 0 && (
                        <motion.div
                          className="text-center py-12"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <p className="text-xl text-neutral-light mb-2">
                            No upcoming events scheduled
                          </p>
                          <p className="text-neutral-light text-sm">
                            Check back soon for new training opportunities!
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="calendar-view"
              role="tabpanel"
              id="view-panel-calendar"
              aria-labelledby="view-tab-calendar"
              variants={viewContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {/* Colorblind-safe Calendar Legend with shapes */}
              <div className="flex flex-wrap justify-center gap-4 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" aria-hidden="true" />
                  <span className="text-neutral-light">Camps</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 bg-cyan-500"
                    style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                    aria-hidden="true"
                  />
                  <span className="text-neutral-light">Rockville Small Group</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500" aria-hidden="true" />
                  <span className="text-neutral-light">Mt Vernon Skating</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 bg-orange-500"
                    style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
                    aria-hidden="true"
                  />
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

                  {/* Calendar Content with mobile-responsive default view */}
                  <div className={calendarLoading ? 'opacity-30 pointer-events-none' : ''}>
                    <EventCalendar
                      events={calendarEvents}
                      eventType="all"
                      currentMonth={currentMonth}
                      onMonthChange={handleMonthChange}
                      defaultView={isMobile ? 'agenda' : 'month'}
                    />
                  </div>

                  {/* No Events Message */}
                  {!calendarLoading && calendarEvents.length === 0 && (
                    <motion.div
                      className="text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="text-xl text-neutral-light mb-2">
                        No events scheduled this month
                      </p>
                      <p className="text-neutral-light text-sm">
                        Check back soon for new training opportunities!
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last Updated - More visible */}
        {lastUpdated && !listLoading && !calendarLoading && (
          <motion.div
            className="flex items-center justify-center gap-2 mt-6 text-sm text-neutral-light/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span>
              Last updated:{' '}
              {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default TrainingSchedule;
