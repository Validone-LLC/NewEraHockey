/**
 * Unified Registration Form Component
 *
 * Config-driven registration form that adapts to different event types.
 * Replaces AtHomeTrainingForm and RegistrationForm with a single component.
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@components/common/Card/Card';
import useRegistrationForm from './hooks/useRegistrationForm';
import {
  PlayerSection,
  GuardianSection,
  AddressSection,
  EmergencySection,
  MedicalNotesSection,
  WaiverSection,
} from './sections';

const UnifiedRegistrationForm = ({ event }) => {
  const { formik, config, submitError, formattedTotalPrice, formattedEventPrice, playerCount } =
    useRegistrationForm(event);

  const isDisabled = formik.isSubmitting;
  const formRef = useRef(null);

  // Scroll to first validation error after a failed submit attempt
  const prevSubmitCountRef = useRef(formik.submitCount);
  useEffect(() => {
    if (formik.submitCount > prevSubmitCountRef.current && !formik.isValid) {
      const firstErrorEl = formRef.current?.querySelector('.border-red-500, .text-red-400');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    prevSubmitCountRef.current = formik.submitCount;
  }, [formik.submitCount, formik.isValid]);

  return (
    <div className="relative">
      {/* Full-page loading overlay */}
      <AnimatePresence>
        {formik.isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-white text-lg font-semibold">Processing your registration...</p>
              <p className="text-neutral-light text-sm mt-2">
                Please do not close or refresh this page.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <form ref={formRef} onSubmit={formik.handleSubmit} className="space-y-8">
          {/* Player Information */}
          <PlayerSection formik={formik} config={config} />

          {/* Parent/Guardian Information */}
          <GuardianSection formik={formik} />

          {/* Address Information (conditional) */}
          {config.features.showAddress && <AddressSection formik={formik} config={config} />}

          {/* Emergency Contact */}
          <EmergencySection formik={formik} config={config} />

          {/* Medical Notes */}
          <MedicalNotesSection formik={formik} />

          {/* Waiver Agreement */}
          <WaiverSection formik={formik} />

          {/* Submit Error */}
          {submitError && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {submitError}
            </div>
          )}

          {/* Price Breakdown (multi-player) */}
          {config.features.multiPlayer && playerCount > 1 && (
            <div className="bg-neutral-bg/50 border border-neutral-dark rounded-lg p-4">
              <div className="flex justify-between text-sm text-neutral-light mb-2">
                <span>
                  {playerCount} players x {formattedEventPrice} each
                </span>
                <span>{formattedTotalPrice}</span>
              </div>
              <div className="flex justify-between font-semibold text-white border-t border-neutral-dark pt-2">
                <span>Total</span>
                <span className="text-teal-400">{formattedTotalPrice}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="border-t border-neutral-dark pt-6">
            <motion.button
              type="submit"
              disabled={isDisabled}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
                isDisabled
                  ? 'bg-neutral-dark text-neutral-light cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-teal-700 text-white hover:from-teal-600 hover:to-teal-800 shadow-lg hover:shadow-xl'
              }`}
            >
              {formik.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                <span>
                  Continue to Payment • {formattedTotalPrice}
                  {config.features.multiPlayer && playerCount > 1 && (
                    <span className="text-sm opacity-80"> ({playerCount} players)</span>
                  )}
                </span>
              )}
            </motion.button>
            <p className="text-center text-sm text-neutral-light mt-4">
              Secure payment powered by <span className="font-semibold text-white">Stripe</span>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UnifiedRegistrationForm;
