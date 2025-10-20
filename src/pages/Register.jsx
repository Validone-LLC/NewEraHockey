import { motion } from 'framer-motion';
import { Instagram, Calendar } from 'lucide-react';
import SEO from '@components/common/SEO/SEO';
import Card from '@components/common/Card/Card';

const Register = () => {
  return (
    <div className="min-h-screen">
      <SEO pageKey="register" />
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
              <span className="gradient-text">REGISTRATION</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              Event and Schedule Registration
            </p>
          </motion.div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="section-container">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-display font-bold text-white mb-4">Coming Soon!</h2>

              <p className="text-lg text-neutral-light mb-8">
                Event and Schedule Registration coming soon! Stay tuned and keep up to date with
                Coach Will at{' '}
                <a
                  href="https://www.instagram.com/NewEraHockeyDMV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 transition-colors font-semibold align-middle"
                >
                  <Instagram className="w-4 h-4 inline-block" />
                  <span>@NewEraHockeyDMV</span>
                </a>{' '}
                page for when it becomes released.
              </p>

              {/* <div className="mt-8 pt-8 border-t border-neutral-light/20">
                <p className="text-sm text-neutral-light">
                  Check our{' '}
                  <a href="/schedule" className="text-teal-400 hover:text-teal-300 transition-colors">
                    Training Schedule
                  </a>
                  {' '}for current events and sessions.
                </p>
              </div> */}
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Register;
