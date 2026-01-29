/**
 * Dynamic Registration Form Validation Schema
 *
 * Builds Yup validation schema based on form configuration.
 * Supports conditional validation for multi-player, address, and emergency sections.
 */

import * as Yup from 'yup';

/**
 * Phone validation test
 */
const phoneValidation = Yup.string().test(
  'valid-phone',
  'Invalid phone format (e.g., (555) 555-5555)',
  value => {
    if (!value) return true; // Let required() handle empty check
    const phoneDigits = value.replace(/[^\d]/g, '');
    return phoneDigits.length === 10;
  }
);

/**
 * Single player schema
 */
const singlePlayerSchema = {
  playerFirstName: Yup.string().trim().required('Player first name is required'),
  playerLastName: Yup.string().trim().required('Player last name is required'),
  playerDateOfBirth: Yup.date()
    .max(new Date(), 'Date of birth must be in the past')
    .required('Date of birth is required'),
  playerLevelOfPlay: Yup.string().trim().required('Level of play is required'),
};

/**
 * Multi-player array schema
 */
const playerItemSchema = Yup.object({
  firstName: Yup.string().trim().required('First name is required'),
  lastName: Yup.string().trim().required('Last name is required'),
  dateOfBirth: Yup.date()
    .max(new Date(), 'Date of birth must be in the past')
    .required('Date of birth is required'),
  levelOfPlay: Yup.string().trim().required('Level of play is required'),
});

const multiPlayerSchema = {
  players: Yup.array()
    .of(playerItemSchema)
    .min(1, 'At least one player is required')
    .max(6, 'Maximum of 6 players allowed'),
};

/**
 * Guardian schema (always required)
 */
const guardianSchema = {
  guardianFirstName: Yup.string().trim().required('Guardian first name is required'),
  guardianLastName: Yup.string().trim().required('Guardian last name is required'),
  guardianEmail: Yup.string().trim().email('Invalid email format').required('Email is required'),
  guardianPhone: phoneValidation.required('Phone number is required'),
  guardianRelationship: Yup.string().default('Parent'),
};

/**
 * Address schema (conditional)
 */
const addressSchema = {
  addressStreet: Yup.string().trim().required('Street address is required'),
  addressUnit: Yup.string(), // Optional
  addressCity: Yup.string().trim().required('City is required'),
  addressState: Yup.string().trim().required('State/Province is required'),
  addressZip: Yup.string().trim().required('Postal code is required'),
  addressCountry: Yup.string().default('USA'),
};

/**
 * Emergency contact schema - required version
 */
const emergencyRequiredSchema = {
  emergencyName: Yup.string().trim().required('Emergency contact name is required'),
  emergencyPhone: phoneValidation.required('Emergency contact phone is required'),
  emergencyRelationship: Yup.string().trim().required('Emergency contact relationship is required'),
};

/**
 * Emergency contact schema - optional version
 */
const emergencyOptionalSchema = {
  emergencyName: Yup.string(),
  emergencyPhone: phoneValidation, // Still validates format if provided
  emergencyRelationship: Yup.string(),
};

/**
 * Waiver and additional fields (always required)
 */
const waiverSchema = {
  medicalNotes: Yup.string(),
  waiverAccepted: Yup.boolean()
    .oneOf([true], 'You must accept the waiver to continue')
    .required('You must accept the waiver to continue'),
  emailOptIn: Yup.boolean().default(false),
};

/**
 * Build dynamic validation schema based on form config
 * @param {Object} config - Form configuration object
 * @returns {Yup.ObjectSchema} Complete validation schema
 */
export const buildValidationSchema = config => {
  let schemaFields = {
    ...guardianSchema,
    ...waiverSchema,
  };

  // Player section: single vs multi-player
  if (config.features.multiPlayer) {
    schemaFields = { ...schemaFields, ...multiPlayerSchema };
  } else {
    schemaFields = { ...schemaFields, ...singlePlayerSchema };
  }

  // Address section: conditional
  if (config.features.showAddress) {
    schemaFields = { ...schemaFields, ...addressSchema };
  }

  // Emergency contact: required vs optional
  if (config.features.emergencyRequired) {
    schemaFields = { ...schemaFields, ...emergencyRequiredSchema };
  } else {
    schemaFields = { ...schemaFields, ...emergencyOptionalSchema };
  }

  return Yup.object(schemaFields);
};

/**
 * Get initial form values based on config
 * @param {Object} config - Form configuration object
 * @returns {Object} Initial form values
 */
export const getInitialValues = config => {
  const baseValues = {
    // Guardian (always)
    guardianFirstName: '',
    guardianLastName: '',
    guardianEmail: '',
    guardianPhone: '',
    guardianRelationship: 'Parent',

    // Emergency (always present, validation differs)
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',

    // Additional (always)
    medicalNotes: '',
    waiverAccepted: false,
    emailOptIn: false,
  };

  // Player section
  if (config.features.multiPlayer) {
    baseValues.players = [
      {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        levelOfPlay: '',
      },
    ];
  } else {
    baseValues.playerFirstName = '';
    baseValues.playerLastName = '';
    baseValues.playerDateOfBirth = '';
    baseValues.playerLevelOfPlay = '';
  }

  // Address section
  if (config.features.showAddress) {
    baseValues.addressStreet = '';
    baseValues.addressUnit = '';
    baseValues.addressCity = '';
    baseValues.addressState = '';
    baseValues.addressZip = '';
    baseValues.addressCountry = 'USA';
  }

  return baseValues;
};

export { phoneValidation };
