import { motion } from 'framer-motion';
import { HiCheckCircle } from 'react-icons/hi';
import { coachInfo } from '@data/coachInfo';
import Button from '@components/common/Button/Button';
import Card from '@components/common/Card/Card';

const CoachWill = () => {
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
              <span className="gradient-text">COACH WILL</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              First-generation hockey player and coach with a passion for developing athletes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-4xl font-display font-bold text-white mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Meet Coach Will Pasko
          </motion.h2>

          <Card>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Coach Image */}
              <motion.div
                className="md:col-span-1"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="relative rounded-lg overflow-hidden aspect-square">
                  <img
                    src={coachInfo.image}
                    alt={coachInfo.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              </motion.div>

              {/* Bio Text */}
              <div className="md:col-span-2 space-y-6 text-neutral-light leading-relaxed">
                <p>{coachInfo.bio.intro}</p>
                <p>{coachInfo.bio.experience}</p>
              </div>
            </div>
          </Card>

          {/* Certifications */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-display font-bold text-white mb-6">
              Certifications & Experience
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coachInfo.certifications.map((cert, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 bg-primary border border-neutral-dark rounded-lg p-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <HiCheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0" />
                  <span className="text-neutral-light">{cert}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Personal Statement */}
      <section className="section-container bg-gradient-to-br from-teal-500/10 to-teal-700/10">
        <div className="max-w-4xl mx-auto">
          <motion.h3
            className="text-3xl font-display font-bold text-white mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Personal Statement from Coach Will
          </motion.h3>

          <Card>
            <p className="text-neutral-light leading-relaxed text-lg italic mb-6">
              {coachInfo.statement}
            </p>
            <p className="text-teal-500 font-semibold text-right text-xl">
              {coachInfo.signature}
            </p>
          </Card>
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
            Contact Coach Will
          </Button>
        </div>
      </section>
    </div>
  );
};

export default CoachWill;
