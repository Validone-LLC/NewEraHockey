import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { HiCheckCircle, HiMail, HiCalendar } from 'react-icons/hi';
import Card from '@components/common/Card/Card';
import Button from '@components/common/Button/Button';
import { invalidateCache } from '../services/calendarService';

/**
 * Build a Google Calendar "Add Event" URL from event data
 */
function buildGoogleCalendarUrl({ summary, startDateTime, endDateTime, location }) {
  if (!summary || !startDateTime) return null;

  const formatForGCal = dateStr => {
    if (!dateStr) return '';
    const isDateOnly = !dateStr.includes('T');
    if (isDateOnly) return dateStr.replace(/-/g, '');
    const d = new Date(dateStr);
    return d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  };

  const start = formatForGCal(startDateTime);
  const end = formatForGCal(endDateTime || startDateTime);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: `${start}/${end}`,
  });

  if (location) params.set('location', location);
  params.set('details', `New Era Hockey Training - ${summary}`);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const RegistrationSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [showConfetti, setShowConfetti] = useState(true);
  const [googleCalUrl, setGoogleCalUrl] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Invalidate cache immediately on mount to ensure fresh data
  useEffect(() => {
    invalidateCache(); // Clear all cached events to show updated capacity
  }, []);

  // Read stored event data for "Add to Google Calendar" button
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('neh_registered_event');
      if (stored) {
        const eventData = JSON.parse(stored);
        const url = buildGoogleCalendarUrl(eventData);
        if (url) setGoogleCalUrl(url);
        sessionStorage.removeItem('neh_registered_event');
      }
    } catch (e) {
      // sessionStorage not available — non-blocking
    }
  }, []);

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Update window dimensions for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-neutral-bg">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Registration Complete | New Era Hockey</title>
      </Helmet>
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
          colors={['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a']}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
                <HiCheckCircle className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl sm:text-4xl font-display font-bold mb-4"
            >
              <span className="gradient-text">Registration Complete!</span>
            </motion.h1>

            {/* Success Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-neutral-light mb-8"
            >
              Your payment was successful and your registration has been confirmed.
            </motion.p>

            {/* Session ID (for reference) */}
            {sessionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-8 p-4 bg-primary rounded-lg border border-neutral-dark"
              >
                <p className="text-sm text-neutral-light mb-1">Confirmation Number</p>
                <p className="text-white font-mono text-xs sm:text-sm break-all">{sessionId}</p>
              </motion.div>
            )}

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mb-8"
            >
              <h2 className="text-xl font-display font-bold text-white mb-4">What Happens Next?</h2>

              <div className="space-y-4 text-left">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <HiMail className="w-5 h-5 text-teal-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Confirmation Email</h3>
                    <p className="text-sm text-neutral-light">
                      You'll receive a confirmation email with event details and payment receipt
                      shortly.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Add to Google Calendar */}
            {googleCalUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="mb-8"
              >
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors"
                >
                  <HiCalendar className="w-5 h-5" />
                  Add to Google Calendar
                </a>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button to="/event-registration" variant="primary">
                View Events
              </Button>
              <Button to="/" variant="secondary">
                Back to Home
              </Button>
            </motion.div>

            {/* Support Contact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8 pt-6 border-t border-neutral-dark"
            >
              <p className="text-sm text-neutral-light">
                Questions about your registration?{' '}
                <Link to="/contact" className="text-teal-400 hover:text-teal-300 underline">
                  Contact us
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
