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
import { fetchEvents } from '@/services/calendarService';
import {
  canRegister,
  getFormattedPrice,
  getRemainingSpots,
  isSoldOut,
  getRegistrationStatus,
} from '@/services/calendarService';
import { formatEventDateTime } from '@utils/eventCategorization';
import Card from '@components/common/Card/Card';
import Button from '@components/common/Button/Button';
import SoldOutBadge from '@components/registration/SoldOutBadge';
import RegistrationForm from '@components/registration/RegistrationForm';

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

        // Fetch all events (we'll filter by ID)
        const data = await fetchEvents(null, false);
        const targetEvent = data.events.find(e => e.id === eventId);

        if (!targetEvent) {
          setError('Event not found');
          return;
        }

        setEvent(targetEvent);
      } catch (err) {
        console.error('Failed to load event:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

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
            <Button to="/schedule" variant="primary">
              Back to Schedule
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { date, time } = formatEventDateTime(event);
  const soldOut = isSoldOut(event);
  const eligible = canRegister(event);
  const remaining = getRemainingSpots(event);
  const status = getRegistrationStatus(event);

  return (
    <div className="min-h-screen">
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
              to="/schedule"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-6 transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back to Schedule</span>
            </Link>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-2">
              <span className="gradient-text">Event Registration</span>
            </h1>
            <p className="text-lg text-neutral-light">
              Complete the form below to register for this event
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-container">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details - Left Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <h2 className="text-2xl font-display font-bold text-white mb-6">Event Details</h2>

                {/* Event Name */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {event.summary || 'Untitled Event'}
                  </h3>
                  {soldOut && <SoldOutBadge />}
                  {!soldOut && remaining !== null && remaining <= 5 && (
                    <div className="mt-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-lg inline-block">
                      {remaining} spot{remaining === 1 ? '' : 's'} left!
                    </div>
                  )}
                </div>

                {/* Date & Time */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <HiCalendar className="text-teal-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-neutral-light">Date</p>
                      <p className="text-white font-medium">{date}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <HiClock className="text-teal-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-neutral-light">Time</p>
                      <p className="text-white font-medium">{time}</p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start gap-3">
                      <HiLocationMarker className="text-teal-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-neutral-light">Location</p>
                        <p className="text-white font-medium">{event.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price & Capacity */}
                <div className="border-t border-neutral-dark pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <HiCurrencyDollar className="text-teal-500 w-5 h-5" />
                    <div>
                      <p className="text-sm text-neutral-light">Price</p>
                      <p className="text-white font-bold text-xl">{getFormattedPrice(event)}</p>
                    </div>
                  </div>

                  {event.registrationData?.hasCapacityInfo && (
                    <div className="flex items-center gap-3">
                      <HiUserGroup className="text-teal-500 w-5 h-5" />
                      <div>
                        <p className="text-sm text-neutral-light">Capacity</p>
                        <p className="text-white font-medium">
                          {event.registrationData.currentRegistrations} /{' '}
                          {event.registrationData.maxCapacity} registered
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <div className="border-t border-neutral-dark pt-4 mt-4">
                    <p className="text-sm text-neutral-light mb-2">Description</p>
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="border-t border-neutral-dark pt-4 mt-4">
                  <p className="text-sm text-neutral-light mb-2">Status</p>
                  <p className={`font-semibold ${soldOut ? 'text-red-400' : 'text-teal-400'}`}>
                    {status}
                  </p>
                </div>
              </Card>

              {/* Important Info */}
              <Card className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <HiCheckCircle className="text-teal-500" />
                  Important Information
                </h3>
                <ul className="text-sm text-neutral-light space-y-2">
                  <li>• Payment processed securely via Stripe</li>
                  <li>• Confirmation email sent after registration</li>
                  <li>• Waiver must be signed before participation</li>
                  <li>• Cancellation policy applies</li>
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
                      <Button to="/schedule" variant="secondary">
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
                      <Button to="/schedule" variant="secondary">
                        Back to Schedule
                      </Button>
                      <Button to="/contact" variant="primary">
                        Contact Us
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <RegistrationForm event={event} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventRegistration;
