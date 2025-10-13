import { motion } from 'framer-motion';
import { coaches } from '@data/coachInfo';
import CoachCard from '@components/coach/CoachCard/CoachCard';
import Button from '@components/common/Button/Button';

const CoachTeam = () => {
  // Separate primary coach (Will) from others
  const primaryCoach = coaches.find(coach => coach.isPrimary) || coaches[0];
  const otherCoaches = coaches.filter(coach => !coach.isPrimary);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
              <span className="gradient-text">COACH TEAM</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              Meet our dedicated coaching staff committed to developing elite hockey players
            </p>
          </motion.div>
        </div>
      </section>

      {/* Coaches Section */}
      <section className="section-container">
        <div className="max-w-7xl mx-auto">
          {/* Primary Coach - Full Width */}
          {primaryCoach && (
            <div className="mb-12">
              <motion.h2
                className="text-3xl font-display font-bold text-white mb-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Head Coach & Founder
              </motion.h2>
              <CoachCard coach={primaryCoach} isPrimary={true} index={0} />
            </div>
          )}

          {/* Other Coaches - Grid Layout */}
          {otherCoaches.length > 0 && (
            <>
              <motion.h2
                className="text-3xl font-display font-bold text-white mb-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Our Coaching Staff
              </motion.h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {otherCoaches.map((coach, index) => (
                  <CoachCard key={coach.id} coach={coach} isPrimary={false} index={index + 1} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-container">
        <div className="text-center">
          <motion.h2
            className="text-3xl font-display font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Still Have Questions?
          </motion.h2>
          <Button to="/contact" variant="primary">
            Contact Our Team
          </Button>
        </div>
      </section>
    </div>
  );
};

export default CoachTeam;
