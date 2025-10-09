import { motion } from 'framer-motion';
import { HiCheckCircle } from 'react-icons/hi';
import Button from '@components/common/Button/Button';

const AboutSection = () => {
  const certifications = [
    'Safe Sport Certified',
    'Fully Insured',
    'USA Hockey Certified Coach',
    'Currently coaching MYHA 14\'s'
  ];

  return (
    <section className="section-container bg-primary/50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6">
            About <span className="gradient-text">Us</span>
          </h2>

          <div className="space-y-6 text-neutral-light">
            <p className="leading-relaxed">
              At New Era Hockey, we promise more than just your average private coach – we deliver an
              unparalleled experience where results and enjoyment go hand in hand. Our players are not
              only fulfilled but also brimming with motivation to persist in their hard work, all while
              enjoying the process while parents and players become like family.
            </p>

            <p className="leading-relaxed">
              We take immense pride in our ability to cultivate a hockey environment of learning,
              competitiveness, and a safe atmosphere that simultaneously creates good athletes, and
              better people.
            </p>

            <div className="bg-primary border border-neutral-dark rounded-lg p-6 my-8">
              <h3 className="text-xl font-semibold text-white mb-4">Coach Will's Experience</h3>
              <p className="text-neutral-light mb-4">
                Coach Will has trained and guided hockey players in the DMV for 6 years and has played
                hockey for 23. He is known for his commitment to the sport we all love.
              </p>

              <div className="space-y-2">
                {certifications.map((cert, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <HiCheckCircle className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-neutral-light">{cert}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <p className="leading-relaxed">
              This unique blend of elements allows players and parents alike to fully immerse themselves
              in the world of hockey training and development within the DMV area, ranging from prep-schools,
              all the way to the various clubs in the DMV, to complete beginners.
            </p>
          </div>

          <div className="mt-8">
            <Button to="/coach-will" variant="primary">
              Learn More About Coach Will
            </Button>
          </div>
        </motion.div>

        {/* Image/Stats Side */}
        <motion.div
          className="grid grid-cols-2 gap-6"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <StatCard number="6+" label="Years Coaching" gradient="from-accent-red to-red-700" />
          <StatCard number="23+" label="Years Playing" gradient="from-accent-blue to-blue-700" />
          <StatCard number="100+" label="Players Trained" gradient="from-accent-gold to-yellow-700" />
          <StatCard number="DMV" label="Service Area" gradient="from-purple-600 to-pink-600" />
        </motion.div>
      </div>
    </section>
  );
};

const StatCard = ({ number, label, gradient }) => {
  return (
    <motion.div
      className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-center shadow-lg`}
      whileHover={{ scale: 1.05, rotate: 2 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-4xl font-display font-bold text-white mb-2">{number}</div>
      <div className="text-sm text-white/90 font-medium">{label}</div>
    </motion.div>
  );
};

export default AboutSection;
