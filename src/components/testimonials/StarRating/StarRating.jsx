import { HiStar } from 'react-icons/hi';

const StarRating = ({ rating, onRatingChange }) => {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-primary rounded"
          aria-label={`Rate ${star} out of 5 stars`}
        >
          <HiStar
            className={`w-8 h-8 transition-colors ${
              star <= rating ? 'text-teal-400' : 'text-neutral-dark'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
