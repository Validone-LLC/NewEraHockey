/**
 * useRegistrationForm Hook
 *
 * Handles form state, validation, and submission logic.
 * Uses Formik for form management with dynamic Yup validation.
 */

import { useState } from 'react';
import { useFormik } from 'formik';
import axios from 'axios';
import { getFormConfig, getEventType } from '../config/formConfigs';
import { buildValidationSchema, getInitialValues } from '../validation/registrationSchema';
import { getPrice, getFormattedPrice } from '@/utils/registrationHelpers';

// Mailing list configuration
const MAIL_SERVICE_API = 'https://eqk81e6nlj.execute-api.us-east-1.amazonaws.com/public/subscribe';
const MASTER_LIST_ID = 'list_7952d451';

/**
 * Calculate total price based on event type and player count
 * @param {Object} event - Google Calendar event
 * @param {Object} config - Form configuration
 * @param {number} playerCount - Number of players
 * @returns {number} Total price
 */
const calculateTotalPrice = (event, config, playerCount) => {
  const basePrice = getPrice(event) || 0;

  // Multi-player events: price per player
  if (config.features.multiPlayer) {
    return basePrice * playerCount;
  }

  // Single player: just the base price
  return basePrice;
};

/**
 * Format price for display
 * @param {Object} event - Google Calendar event
 * @param {Object} config - Form configuration
 * @param {number} playerCount - Number of players
 * @returns {string} Formatted price string
 */
const formatTotalPrice = (event, config, playerCount) => {
  const total = calculateTotalPrice(event, config, playerCount);
  return `$${total}`;
};

/**
 * useRegistrationForm hook
 * @param {Object} event - Google Calendar event object
 * @returns {Object} Form state and handlers
 */
const useRegistrationForm = event => {
  const [submitError, setSubmitError] = useState(null);

  // Get configuration for this event type
  const config = getFormConfig(event);
  const eventType = getEventType(event);

  // Build dynamic validation schema
  const validationSchema = buildValidationSchema(config);

  // Get initial values based on config
  const initialValues = getInitialValues(config);

  // Initialize Formik
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async values => {
      setSubmitError(null);

      try {
        // Subscribe to mailing list if opted in (fire and forget)
        if (values.emailOptIn && values.guardianEmail) {
          axios
            .post(MAIL_SERVICE_API, {
              email: values.guardianEmail.trim().toLowerCase(),
              firstName: values.guardianFirstName?.trim() || '',
              lastName: values.guardianLastName?.trim() || '',
              listId: MASTER_LIST_ID,
            })
            .catch(err => {
              console.warn('Mailing list subscription failed:', err);
            });
        }

        // Build checkout payload
        const playerCount = config.features.multiPlayer ? values.players.length : 1;
        const basePrice = getPrice(event);
        const totalPrice = calculateTotalPrice(event, config, playerCount);

        // Extract slot date and time for at-home training
        let slotDate = null;
        let slotTime = null;
        if (event.start?.dateTime) {
          const eventStart = new Date(event.start.dateTime);
          slotDate = eventStart.toISOString().split('T')[0];
          slotTime = eventStart.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        }

        // Create Stripe Checkout session
        const response = await fetch('/.netlify/functions/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: {
              id: event.id,
              summary: event.summary,
              price: basePrice,
              playerCount: config.features.multiPlayer ? playerCount : undefined,
              totalPrice: config.features.multiPlayer ? totalPrice : undefined,
              eventType,
              start: event.start,
              end: event.end,
              location: event.location,
              slotDate,
              slotTime,
            },
            formData: values,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create checkout session');
        }

        // Store event info for the success page (e.g., "Add to Google Calendar" button)
        try {
          sessionStorage.setItem(
            'neh_registered_event',
            JSON.stringify({
              summary: event.summary,
              startDateTime: event.start?.dateTime || event.start?.date || '',
              endDateTime: event.end?.dateTime || event.end?.date || '',
              location: event.location || '',
            })
          );
        } catch (e) {
          // sessionStorage not available — non-blocking
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } catch (error) {
        console.error('Registration error:', error);
        setSubmitError(error.message || 'Failed to process registration. Please try again.');
      }
    },
  });

  // Calculate current total price
  const playerCount = config.features.multiPlayer ? formik.values.players?.length || 1 : 1;
  const totalPrice = calculateTotalPrice(event, config, playerCount);
  const formattedTotalPrice = formatTotalPrice(event, config, playerCount);
  const formattedEventPrice = getFormattedPrice(event);

  return {
    formik,
    config,
    eventType,
    submitError,
    totalPrice,
    formattedTotalPrice,
    formattedEventPrice,
    playerCount,
  };
};

export default useRegistrationForm;
