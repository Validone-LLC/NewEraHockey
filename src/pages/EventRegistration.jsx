import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiCalendar,
  HiClock,
  HiLocationMarker,
  HiCurrencyDollar,
  HiUserGroup,
  HiArrowLeft,
  HiCheckCircle,
} from 'react-icons/hi';
import { fetchEventById } from '@/services/calendarService';
import SEO from '@components/common/SEO/SEO';
import {
  canRegister,
  getFormattedPrice,
  isSoldOut,
  getRegistrationStatus,
} from '@/services/calendarService';
import { formatEventDateTime, getMultiDateDisplay } from '@utils/eventCategorization';
import Card from '@components/common/Card/Card';
import Button from '@components/common/Button/Button';
import SoldOutBadge from '@components/registration/SoldOutBadge';
import UnifiedRegistrationForm from '@components/registration/UnifiedRegistrationForm';
import { getFormConfig } from '@components/registration/config/formConfigs';

const EventRegistration = () => {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch event details
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch single event by ID (always fresh, no cache)
        const data = await fetchEventById(eventId);

        if (!data.event) {
          setError('Event not found');
          return;
        }

        setEvent(data.event);
      } catch (err) {
        console.error('Failed to load event:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  // Get form config for display settings (needs event loaded)
  const formConfig = event ? getFormConfig(event) : null;
  const display = formConfig?.display || {};

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-neutral-light">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center py-8">
            <h2 className="text-2xl font-display font-bold text-white mb-4">
              {error || 'Event Not Found'}
            </h2>
            <p className="text-neutral-light mb-6">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button to="/event-registration" variant="primary">
              Back to Event Registration
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { date, time } = formatEventDateTime(event);
  const multiDateData = getMultiDateDisplay(event);
  const soldOut = isSoldOut(event);
  const eligible = canRegister(event);
  const status = getRegistrationStatus(event);

  // Dynamic SEO meta based on event
  const eventTitle = event?.summary || 'Event Registration';
  const eventDescription = event?.description
    ? event.description.substring(0, 160)
    : `Register for ${eventTitle} with New Era Hockey. Expert hockey training in the DMV area.`;

  return (
    <div className="min-h-screen">
      <SEO
        pageKey="event-registration"
        customMeta={{
          title: `${eventTitle} | Register | New Era Hockey`,
          description: eventDescription,
          url: `https://newerahockeytraining.com/register/${eventId}`,
        }}
      />
      {/* Header */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Back button */}
            <Link
              to="/event-registration"
              className={`inline-flex items-center gap-2 mb-6 transition-colors ${display.textClasses} ${display.hoverClasses}`}
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back to Event Registration</span>
            </Link>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-2">
              <span
                className={`bg-gradient-to-r ${display.gradientClasses} bg-clip-text text-transparent`}
              >
                {display.pageTitle}
              </span>
            </h1>
            <p className="text-lg text-neutral-light">{display.pageSubtitle}</p>
          </motion.div>
        </div>
      </section>

      <section className="section-container">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details - Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Event Details Card */}
              <Card>
                <h2 className="text-xl font-display font-bold text-white mb-6 pb-4 border-b border-neutral-dark">
                  {display.sidebarTitle}
                </h2>

                {/* Event Name */}
                <div
                  className={`mb-6 bg-gradient-to-r ${display.gradientBgClasses} to-transparent p-4 rounded-lg border-l-4 ${display.borderClasses}`}
                >
                  <h3 className="text-xl font-display font-bold text-white leading-tight">
                    {event.summary || 'Untitled Event'}
                  </h3>
                </div>

                {/* Date & Time */}
                <div className="space-y-4 mb-6">
                  {multiDateData ? (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-bg/50 hover:bg-neutral-bg transition-colors">
                        <div className={`p-2 rounded-lg ${display.bgClasses}`}>
                          <HiCalendar className={`w-5 h-5 ${display.textClasses}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wide text-neutral-light mb-1">
                            Dates
                          </p>
                          <p className="text-white font-semibold">{multiDateData.dateRange}</p>
                          <p className="text-sm text-neutral-light">
                            {multiDateData.sessionCount} sessions
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-bg/50">
                        <div className={`p-2 rounded-lg ${display.bgClasses}`}>
                          <HiClock className={`w-5 h-5 ${display.textClasses}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wide text-neutral-light mb-2">
                            Schedule
                          </p>
                          <div className="space-y-2">
                            {multiDateData.sessions.map((session, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className={`font-semibold w-10 ${display.textClasses}`}>
                                  {session.dayOfWeek}
                                </span>
                                <span className="text-neutral-light">{session.date}</span>
                                <span className="text-neutral-dark">—</span>
                                <span className="text-white font-medium">
                                  {session.startTime} - {session.endTime}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-bg/50 hover:bg-neutral-bg transition-colors">
                        <div className={`p-2 rounded-lg ${display.bgClasses}`}>
                          <HiCalendar className={`w-5 h-5 ${display.textClasses}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wide text-neutral-light mb-1">
                            Date
                          </p>
                          <p className="text-white font-semibold">{date}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-bg/50 hover:bg-neutral-bg transition-colors">
                        <div className={`p-2 rounded-lg ${display.bgClasses}`}>
                          <HiClock className={`w-5 h-5 ${display.textClasses}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wide text-neutral-light mb-1">
                            Time
                          </p>
                          <p className="text-white font-semibold">{time}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {event.location && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-bg/50 hover:bg-neutral-bg transition-colors">
                      <div className={`p-2 rounded-lg ${display.bgClasses}`}>
                        <HiLocationMarker className={`w-5 h-5 ${display.textClasses}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-wide text-neutral-light mb-1">
                          Location
                        </p>
                        <p className="text-white font-semibold">{event.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price & Capacity */}
                <div className="border-t border-neutral-dark pt-6 space-y-4">
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r ${display.gradientBgClasses} to-transparent`}
                  >
                    <div className={`p-2 rounded-lg ${display.bgClasses}`}>
                      <HiCurrencyDollar className={`w-5 h-5 ${display.textClasses}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-neutral-light mb-1">
                        Price
                      </p>
                      <p className={`text-2xl font-bold ${display.textClasses}`}>
                        {getFormattedPrice(event)}
                      </p>
                    </div>
                  </div>

                  {event.registrationData?.hasCapacityInfo && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-bg/50">
                      <div className={`p-2 rounded-lg ${display.bgClasses}`}>
                        <HiUserGroup className={`w-5 h-5 ${display.textClasses}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-wide text-neutral-light mb-1">
                          Capacity
                        </p>
                        <p className="text-white font-semibold">
                          {event.registrationData.maxCapacity} spots
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="border-t border-neutral-dark pt-6 mt-6">
                  <div
                    className={`p-4 rounded-lg text-center ${
                      soldOut ? 'bg-red-500/10 border border-red-500/30' : display.statusBgClasses
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-neutral-light mb-2">
                      Status
                    </p>
                    <p
                      className={`text-lg font-bold ${soldOut ? 'text-red-400' : display.textClasses}`}
                    >
                      {status}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Important Info */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 rounded-lg ${display.bgClasses}`}>
                    <HiCheckCircle className={`w-6 h-6 ${display.textClasses}`} />
                  </div>
                  <h3 className="text-lg font-display font-bold text-white">
                    Important Information
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-neutral-light p-2 rounded hover:bg-neutral-bg/30 transition-colors">
                    <span className={`mt-0.5 ${display.textClasses}`}>•</span>
                    <span>Payment processed securely via Stripe</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-neutral-light p-2 rounded hover:bg-neutral-bg/30 transition-colors">
                    <span className={`mt-0.5 ${display.textClasses}`}>•</span>
                    <span>Confirmation email sent after registration</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-neutral-light p-2 rounded hover:bg-neutral-bg/30 transition-colors">
                    <span className={`mt-0.5 ${display.textClasses}`}>•</span>
                    <span>Cancellation policy applies</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Registration Form - Main Content */}
            <div className="lg:col-span-2">
              {soldOut ? (
                <Card>
                  <div className="text-center py-12">
                    <SoldOutBadge large />
                    <h2 className="text-2xl font-display font-bold text-white mb-4 mt-6">
                      This Event is Sold Out
                    </h2>
                    <p className="text-neutral-light mb-6">
                      Unfortunately, this event has reached maximum capacity. Check back for future
                      events or contact us about waitlist options.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button to="/event-registration" variant="secondary">
                        View Other Events
                      </Button>
                      <Button to="/contact" variant="primary">
                        Contact Us
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : !eligible ? (
                <Card>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-display font-bold text-white mb-4">
                      Registration Not Available
                    </h2>
                    <p className="text-neutral-light mb-6">
                      Registration is currently closed for this event. Please contact us for more
                      information.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button to="/event-registration" variant="secondary">
                        Back to Schedule
                      </Button>
                      <Button to="/contact" variant="primary">
                        Contact Us
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <UnifiedRegistrationForm event={event} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventRegistration;
