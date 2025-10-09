import { motion } from 'framer-motion';

const Card = ({ children, className = '', hover = true, delay = 0 }) => {
  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={hover ? { y: -8, scale: 1.02 } : {}}
    >
      {children}
    </motion.div>
  );
};

export default Card;
