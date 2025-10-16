import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import Button from '@components/common/Button/Button';
import aboutData from '@data/homeAbout.json';
import statsData from '@data/homeStats.json';

const AboutSection = () => {
  return (
    <section className="section-container bg-primary/50">
      {/* Organization Introduction */}
      <motion.div
        className="max-w-3xl mx-auto text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6">
          {aboutData.organization.title.split(' ')[0]}{' '}
          <span className="gradient-text">
            {aboutData.organization.title.split(' ').slice(1).join(' ')}
          </span>
        </h2>

        <div className="space-y-6 text-neutral-light">
          {aboutData.organization.paragraphs.map((paragraph, index) => (
            <p key={index} className="leading-relaxed text-lg">
              {paragraph}
            </p>
          ))}
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
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

      {/* Coach Section */}
      <div className="mb-12">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
            {aboutData.coach.sectionTitle.split(' ')[0]}{' '}
            {aboutData.coach.sectionTitle.split(' ')[1]}{' '}
            <span className="gradient-text">
              {aboutData.coach.sectionTitle.split(' ').slice(2).join(' ')}
            </span>
          </h2>
          <p className="text-xl text-teal-400 font-medium">
            {aboutData.coach.name} - {aboutData.coach.title}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Coach Introduction */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6 text-neutral-light">
              {aboutData.coach.intro.map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8">
              <Button to={aboutData.coach.cta.link} variant="primary">
                {aboutData.coach.cta.text}
              </Button>
            </div>
          </motion.div>

          {/* Coach Experience & Credentials */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-primary border border-neutral-dark rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                {aboutData.coach.experience.title}
              </h3>
              <p className="text-neutral-light mb-4">{aboutData.coach.experience.description}</p>

              <div className="space-y-2">
                {aboutData.coach.experience.certifications.map((cert, index) => (
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
      </div>

      {/* Additional Context */}
      <motion.div
        className="max-w-3xl mx-auto text-center"
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
