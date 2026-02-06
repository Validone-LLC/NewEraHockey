import { useState } from 'react';
import { HiStar, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import Card from '@components/common/Card/Card';

const TestimonialCard = ({ testimonial, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const characterLimit = 400;
  const isLongText = testimonial.text.length > characterLimit;
  const shouldTruncate = isLongText && !isExpanded && !testimonial.featured;

  return (
    <Card delay={index * 0.1}>
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <HiStar key={i} className="w-5 h-5 text-teal-400" />
        ))}
      </div>

      {/* Text */}
      <p className="text-neutral-light leading-relaxed mb-4 whitespace-pre-line">
        {shouldTruncate ? `${testimonial.text.substring(0, characterLimit)}...` : testimonial.text}
      </p>

      {/* Read More Button */}
      {isLongText && !testimonial.featured && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-teal-400 hover:text-teal-300 transition-colors text-sm font-semibold mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-primary-dark rounded"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Show less' : 'Read more'}
        >
          {isExpanded ? (
            <>
              Show Less <HiChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Read More <HiChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {/* Author */}
      <div className="border-t border-neutral-dark pt-4">
        <p className="text-white font-semibold">{testimonial.name}</p>
        <p className="text-sm text-neutral-text">
          {testimonial.role}
          {testimonial.playerInfo && ` • ${testimonial.playerInfo}`}
        </p>
      </div>
    </Card>
  );
};

export default TestimonialCard;
