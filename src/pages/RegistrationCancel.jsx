import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { HiXCircle, HiArrowLeft, HiQuestionMarkCircle } from 'react-icons/hi';
import Card from '@components/common/Card/Card';
import Button from '@components/common/Button/Button';

const RegistrationCancel = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-neutral-bg">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Registration Cancelled | New Era Hockey</title>
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Cancel Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <HiXCircle className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl sm:text-4xl font-display font-bold mb-4 text-white"
            >
              Registration Cancelled
            </motion.h1>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-neutral-light mb-8"
            >
              Your registration was not completed and no payment was processed.
            </motion.p>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-8 p-6 bg-amber-500/10 border border-amber-500/30 rounded-lg"
            >
              <div className="flex items-start gap-3 text-left">
                <HiQuestionMarkCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">What happened?</h3>
                  <p className="text-sm text-neutral-light mb-2">
                    You navigated away from the payment page before completing your registration.
                    Your spot has not been reserved, and no charges were made to your card.
                  </p>
                  <p className="text-sm text-neutral-light">
                    Events can fill up quickly, so we recommend completing your registration soon to
                    secure your spot!
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Common Reasons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mb-8 text-left"
            >
              <h2 className="text-lg font-display font-bold text-white mb-4 text-center">
                Common Reasons for Cancellation
              </h2>
              <ul className="space-y-2 text-sm text-neutral-light">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-1">•</span>
                  <span>Changed your mind - That's okay! You can register again anytime.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-1">•</span>
                  <span>
                    Need to check your schedule - Your registration will be waiting when you're
                    ready.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-1">•</span>
                  <span>Payment issues - Contact us if you need alternative payment options.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-1">•</span>
                  <span>Questions about the event - Reach out to us before registering!</span>
                </li>
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {eventId ? (
                <Button to={`/register/${eventId}`} variant="primary">
                  <HiArrowLeft className="inline mr-2" />
                  Try Again
                </Button>
              ) : (
                <Button to="/event-registration" variant="primary">
                  View Schedule
                </Button>
              )}
              <Button to="/contact" variant="secondary">
                Contact Us
              </Button>
            </motion.div>

            {/* Additional Help */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8 pt-6 border-t border-neutral-dark"
            >
              <p className="text-sm text-neutral-light mb-4">
                Need help completing your registration?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
                <Link to="/faq" className="text-teal-400 hover:text-teal-300 underline">
                  View FAQs
                </Link>
                <span className="hidden sm:inline text-neutral-dark">|</span>
                <Link to="/contact" className="text-teal-400 hover:text-teal-300 underline">
                  Email Coach Will
                </Link>
                <span className="hidden sm:inline text-neutral-dark">|</span>
                <a href="tel:5712744691" className="text-teal-400 hover:text-teal-300 underline">
                  Call (571) 274-4691
                </a>
              </div>
            </motion.div>
          </motion.div>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationCancel;
