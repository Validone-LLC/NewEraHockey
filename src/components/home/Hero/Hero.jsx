import { motion } from 'framer-motion';
import Button from '@components/common/Button/Button';
import heroData from '@data/homeHero.json';

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-neutral-bg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(200,16,46,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,48,135,0.1),transparent_50%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <img
            src={heroData.logoImage}
            alt="New Era Hockey Logo"
            className="h-56 sm:h-40 lg:h-64 w-auto mx-auto drop-shadow-2xl"
          />
          <p className="text-sm sm:text-base tracking-[0.25em] text-silver font-display uppercase mt-3">
            Est. 2019
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold mb-6">
            <span className="block text-white mb-2">{heroData.title}</span>
            <span className="gradient-text text-6xl sm:text-7xl lg:text-8xl">
              {heroData.brandName}
            </span>
          </h1>
        </motion.div>

        <motion.p
          className="text-xl sm:text-2xl text-neutral-light max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {heroData.tagline.text}{' '}
          {heroData.tagline.highlights.map((highlight, index) => (
            <span key={index}>
              <span className={`${highlight.color} font-semibold`}>{highlight.word}</span>
              {index < heroData.tagline.highlights.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Button to={heroData.primaryCTA.link} variant="primary">
            {heroData.primaryCTA.text}
          </Button>
          <Button to={heroData.secondaryCTA.link} variant="secondary">
            {heroData.secondaryCTA.text}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
