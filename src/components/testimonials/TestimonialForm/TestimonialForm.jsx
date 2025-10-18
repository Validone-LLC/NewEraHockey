import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@components/common/Card/Card';
import StarRating from '@components/testimonials/StarRating/StarRating';
import TestimonialSuccessModal from '@components/testimonials/TestimonialSuccessModal/TestimonialSuccessModal';

const TestimonialForm = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    role: '',
    teamName: '',
    testimonial: '',
    rating: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = newRating => {
    setFormData(prev => ({
      ...prev,
      rating: newRating,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/.netlify/functions/submit-testimonial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit testimonial');
      }

      // Success - show modal and reset form
      setShowSuccessModal(true);
      setFormData({
        displayName: '',
        role: '',
        teamName: '',
        testimonial: '',
        rating: 0,
      });
    } catch (err) {
      console.error('Testimonial submission error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.displayName && formData.role && formData.testimonial && formData.rating > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card>
          <h2 className="text-2xl font-display font-bold text-white mb-6">Submit Your Review</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name for Display */}
            <div>
              <label htmlFor="displayName" className="block text-white font-semibold mb-2">
                Name for Display *
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-neutral-bg text-white border border-neutral-dark rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Your name"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-white font-semibold mb-2">
                I am a *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-neutral-bg text-white border border-neutral-dark rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="">Select your role</option>
                <option value="Player">Player</option>
                <option value="Parent">Parent</option>
                <option value="Parents">Parents</option>
                <option value="Coach">Coach</option>
              </select>
            </div>

            {/* Team Name */}
            <div>
              <label htmlFor="teamName" className="block text-white font-semibold mb-2">
                Current Team Name{' '}
                {formData.role && <span className="text-neutral-light text-sm">(Optional)</span>}
              </label>
              <input
                type="text"
                id="teamName"
                name="teamName"
                value={formData.teamName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-neutral-bg text-white border border-neutral-dark rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="e.g., USPHL Bold City Battalion"
              />
              {formData.role && formData.teamName && (
                <p className="mt-2 text-sm text-neutral-light">
                  Will display as:{' '}
                  <span className="text-white">
                    {formData.role} • {formData.teamName}
                  </span>
                </p>
              )}
            </div>

            {/* Rating */}
            <div>
              <div className="block text-white font-semibold mb-3" id="rating-label">
                Rating *
              </div>
              <StarRating rating={formData.rating} onRatingChange={handleRatingChange} />
              {formData.rating > 0 && (
                <p className="mt-2 text-sm text-neutral-light">{formData.rating} out of 5 stars</p>
              )}
            </div>

            {/* Testimonial Text */}
            <div>
              <label htmlFor="testimonial" className="block text-white font-semibold mb-2">
                Your Testimonial *
              </label>
              <textarea
                id="testimonial"
                name="testimonial"
                value={formData.testimonial}
                onChange={handleChange}
                required
                rows={8}
                className="w-full px-4 py-3 bg-neutral-bg text-white border border-neutral-dark rounded-lg focus:outline-none focus:border-teal-500 transition-colors resize-none"
                placeholder="Share your experience with New Era Hockey..."
              />
              <p className="mt-1 text-sm text-neutral-light">
                {formData.testimonial.length} characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:shadow hover:shadow-teal-500/20'
                  : 'bg-neutral-dark text-neutral-text cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Testimonial'
              )}
            </button>
          </form>
        </Card>
      </motion.div>

      {/* Success Modal */}
      <TestimonialSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </>
  );
};

export default TestimonialForm;
