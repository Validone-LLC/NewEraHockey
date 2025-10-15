import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import Button from '@components/common/Button/Button';
import aboutData from '@data/homeAbout.json';
import statsData from '@data/homeStats.json';

const AboutSection = () => {
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
            {aboutData.title.split(' ')[0]}{' '}
            <span className="gradient-text">{aboutData.title.split(' ').slice(1).join(' ')}</span>
          </h2>

          <div className="space-y-6 text-neutral-light">
            {aboutData.paragraphs.map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-8">
            <Button to={aboutData.cta.link} variant="primary">
              {aboutData.cta.text}
            </Button>
          </div>
        </motion.div>

        {/* Coach Will's Experience */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-primary border border-neutral-dark rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">{aboutData.experience.title}</h3>
            <p className="text-neutral-light mb-4">{aboutData.experience.description}</p>

            <div className="space-y-2">
              {aboutData.experience.certifications.map((cert, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-neutral-light">{cert}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats Section */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {statsData.stats.map((stat, index) => (
          <StatCard
            key={stat.id}
            number={stat.number}
            label={stat.label}
            gradient={stat.gradient}
            index={index}
          />
        ))}
      </motion.div>

      {/* Additional Context */}
      <motion.div
        className="mt-12 max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <p className="text-neutral-light leading-relaxed">{aboutData.additionalContext}</p>
      </motion.div>
    </section>
  );
};

const StatCard = ({ number, label, gradient }) => {
  return (
    <motion.div
      className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-center shadow shadow-teal-500/10`}
      whileHover={{ rotate: 2 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-4xl font-display font-bold text-white mb-2">{number}</div>
      <div className="text-sm text-white/90 font-medium">{label}</div>
    </motion.div>
  );
};

export default AboutSection;
