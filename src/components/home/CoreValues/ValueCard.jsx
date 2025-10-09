import { motion } from 'framer-motion';
import Card from '@components/common/Card/Card';

const ValueCard = ({ value, index }) => {
  return (
    <Card delay={index * 0.2}>
      <div className="text-center">
        {/* Icon with gradient background */}
        <motion.div
          className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${value.gradient}
            flex items-center justify-center text-4xl shadow-lg`}
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6 }}
        >
          {value.icon}
        </motion.div>

        {/* Title */}
        <h3 className="text-2xl font-display font-bold text-white mb-4">
          {value.title}
        </h3>

        {/* Description */}
        <p className="text-neutral-light leading-relaxed">
          {value.description}
        </p>
      </div>
    </Card>
  );
};

export default ValueCard;
