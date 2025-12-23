import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { faqs } from '@data/faqs';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={faq.id}
          className="bg-primary border border-neutral-dark rounded-lg overflow-hidden"
        >
          <button
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-primary-light transition-colors"
            onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
          >
            <span className="font-semibold text-white pr-4">{faq.question}</span>
            <motion.div
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5 text-teal-500 flex-shrink-0" />
            </motion.div>
          </button>

          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-6 py-4 bg-primary-light border-t border-neutral-dark">
                  <p className="text-neutral-light leading-relaxed">{faq.answer}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default FAQ;
