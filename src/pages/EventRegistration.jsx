import { motion } from 'framer-motion';
import { HiCalendar } from 'react-icons/hi';
import Button from '@components/common/Button/Button';
import Card from '@components/common/Card/Card';

const EventRegistration = () => {
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-4">
              <span className="gradient-text">CAMPS AND TRAINING</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              Register for upcoming camps and training sessions
            </p>
          </motion.div>
        </div>
      </section>

      {/* Calendar Placeholder */}
      <section className="section-container">
        <Card>
          <div className="text-center py-20">
            <HiCalendar className="w-24 h-24 mx-auto mb-6 text-teal-500 opacity-50" />
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              Event Calendar Coming Soon
            </h2>
            <p className="text-neutral-light max-w-2xl mx-auto mb-8">
              We're working on an interactive calendar to help you find and register for upcoming camps
              and training sessions. In the meantime, please contact us directly for availability.
            </p>
            <Button to="/contact" variant="primary">
              Contact Us for Schedule
            </Button>
          </div>
        </Card>
      </section>

      {/* How to Stay Updated */}
      <section className="section-container bg-primary/30">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold text-white mb-8 text-center">
            Stay Updated on Camps & Events
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                  <HiCalendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Event Calendar</h3>
                <p className="text-neutral-light text-sm">
                  Check this page regularly for upcoming camp dates and registration
                </p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-3xl">
                  📸
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Instagram</h3>
                <p className="text-neutral-light text-sm">
                  Follow @NewEraHockeyDMV for announcements and camp flyers
                </p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-300 to-teal-500 flex items-center justify-center text-3xl">
                  🏒
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Host Rinks</h3>
                <p className="text-neutral-light text-sm">
                  Official flyers will be posted at host rinks throughout the DMV area
                </p>
              </div>
            </Card>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default EventRegistration;
