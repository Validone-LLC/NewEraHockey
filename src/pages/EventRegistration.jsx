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
import {
  canRegister,
  getFormattedPrice,
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
  const soldOut = isSoldOut(event);
  const eligible = canRegister(event);
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
              to="/event-registration"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-6 transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back to Event Registration</span>
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
            <div className="lg:col-span-1 space-y-6">
              {/* Event Details Card */}
              <Card>
                <h2 className="text-xl font-display font-bold text-white mb-6 pb-4 border-b border-neutral-dark">
                  Event Details
                </h2>

                {/* Event Name */}
                <div className="mb-6 bg-gradient-to-r from-teal-500/10 to-transparent p-4 rounded-lg border-l-4 border-teal-500">
                  <h3 className="text-xl font-display font-bold text-white leading-tight">
                    {event.summary || 'Untitled Event'}
                  </h3>
                </div>

                {/* Date & Time */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-bg/50 hover:bg-neutral-bg transition-colors">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <HiCalendar className="text-teal-400 w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-neutral-light mb-1">
                        Date
                      </p>
                      <p className="text-white font-semibold">{date}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-bg/50 hover:bg-neutral-bg transition-colors">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <HiClock className="text-teal-400 w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-neutral-light mb-1">
                        Time
                      </p>
                      <p className="text-white font-semibold">{time}</p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-bg/50 hover:bg-neutral-bg transition-colors">
                      <div className="p-2 bg-teal-500/20 rounded-lg">
                        <HiLocationMarker className="text-teal-400 w-5 h-5" />
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
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-teal-500/10 to-transparent">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <HiCurrencyDollar className="text-teal-400 w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-neutral-light mb-1">
                        Price
                      </p>
                      <p className="text-2xl font-bold text-teal-400">{getFormattedPrice(event)}</p>
                    </div>
                  </div>

                  {event.registrationData?.hasCapacityInfo && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-bg/50">
                      <div className="p-2 bg-teal-500/20 rounded-lg">
                        <HiUserGroup className="text-teal-400 w-5 h-5" />
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
                      soldOut
                        ? 'bg-red-500/10 border border-red-500/30'
                        : 'bg-teal-500/10 border border-teal-500/30'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-neutral-light mb-2">
                      Status
                    </p>
                    <p
                      className={`text-lg font-bold ${soldOut ? 'text-red-400' : 'text-teal-400'}`}
                    >
                      {status}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Important Info */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-teal-500/20 rounded-lg">
                    <HiCheckCircle className="text-teal-400 w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-white">
                    Important Information
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-neutral-light p-2 rounded hover:bg-neutral-bg/30 transition-colors">
                    <span className="text-teal-400 mt-0.5">•</span>
                    <span>Payment processed securely via Stripe</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-neutral-light p-2 rounded hover:bg-neutral-bg/30 transition-colors">
                    <span className="text-teal-400 mt-0.5">•</span>
                    <span>Confirmation email sent after registration</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-neutral-light p-2 rounded hover:bg-neutral-bg/30 transition-colors">
                    <span className="text-teal-400 mt-0.5">•</span>
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
