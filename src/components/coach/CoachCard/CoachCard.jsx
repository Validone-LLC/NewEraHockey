import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheckCircle, HiChevronDown } from 'react-icons/hi';
import Card from '@components/common/Card/Card';

const CoachCard = ({ coach, isPrimary = false, index = 0 }) => {
  const location = useLocation();
  const cardRef = useRef(null);

  // Check if this coach should be expanded based on URL hash
  const shouldExpandFromHash = location.hash === `#${coach.id}`;
  const [isExpanded, setIsExpanded] = useState(shouldExpandFromHash);

  // Handle hash-based expansion and scrolling
  useEffect(() => {
    if (shouldExpandFromHash && cardRef.current) {
      // Expand the card
      setIsExpanded(true);

      // Scroll to the card after a short delay to allow for page load
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [shouldExpandFromHash]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={isPrimary ? 'col-span-full' : ''}
    >
      <Card className="h-full">
        <div className="space-y-4">
          {/* Coach Header */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Coach Image */}
            <div className="md:col-span-1">
              <div className="relative rounded-lg overflow-hidden aspect-square">
                <img src={coach.image} alt={coach.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {isPrimary && (
                  <div className="absolute top-4 right-4 bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Head Coach
                  </div>
                )}
              </div>
            </div>

            {/* Coach Info */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-2xl font-display font-bold text-white mb-1">{coach.name}</h3>
                <p className="text-teal-500 font-semibold">{coach.title}</p>
              </div>
              <p className="text-neutral-light leading-relaxed">{coach.quickSummary}</p>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={toggleExpand}
            aria-expanded={isExpanded}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-dark border border-neutral-dark rounded-lg hover:border-teal-500 transition-colors duration-200"
          >
            <span className="text-neutral-light font-medium">
              {isExpanded
                ? 'Show Less'
                : `Meet Coach ${coach.name.split(' ')[coach.name.split(' ').length - 1]}`}
            </span>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <HiChevronDown className="w-5 h-5 text-teal-500" />
            </motion.div>
          </button>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <div className="space-y-6 pt-4 border-t border-neutral-dark">
                  {/* Full Bio */}
                  <div className="space-y-4 text-neutral-light leading-relaxed">
                    <p>{coach.bio.intro}</p>
                    <p>{coach.bio.experience}</p>
                  </div>

                  {/* Certifications */}
                  {coach.certifications && coach.certifications.length > 0 && (
                    <div>
                      <h4 className="text-xl font-display font-bold text-white mb-4">
                        Certifications & Experience
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {coach.certifications.map((cert, certIndex) => (
                          <motion.div
                            key={certIndex}
                            className="flex items-center gap-3 bg-primary border border-neutral-dark rounded-lg p-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: certIndex * 0.05 }}
                          >
                            <HiCheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
                            <span className="text-neutral-light text-sm">{cert}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personal Statement */}
                  {coach.statement && (
                    <div className="bg-gradient-to-br from-teal-500/10 to-teal-700/10 rounded-lg p-6">
                      <h4 className="text-xl font-display font-bold text-white mb-4">
                        Personal Statement
                      </h4>
                      <p className="text-neutral-light leading-relaxed italic mb-4">
                        {coach.statement}
                      </p>
                      {coach.signature && (
                        <p className="text-teal-500 font-semibold text-right text-lg">
                          {coach.signature}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fun Fact */}
                  {coach.funFact && (
                    <div className="bg-gradient-to-br from-primary-dark to-neutral-bg border border-teal-500/30 rounded-lg p-6">
                      <h4 className="text-xl font-display font-bold text-teal-500 mb-3">
                        Fun Fact
                      </h4>
                      <p className="text-neutral-light leading-relaxed">{coach.funFact}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

export default CoachCard;
