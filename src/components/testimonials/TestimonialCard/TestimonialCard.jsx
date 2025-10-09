import { HiStar } from 'react-icons/hi';
import Card from '@components/common/Card/Card';

const TestimonialCard = ({ testimonial, index }) => {
  return (
    <Card delay={index * 0.1}>
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <HiStar key={i} className="w-5 h-5 text-teal-400" />
        ))}
      </div>

      {/* Text */}
      <p className="text-neutral-light leading-relaxed mb-6 whitespace-pre-line">
        {testimonial.text.length > 400 && !testimonial.featured
          ? `${testimonial.text.substring(0, 400)}...`
          : testimonial.text}
      </p>

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
