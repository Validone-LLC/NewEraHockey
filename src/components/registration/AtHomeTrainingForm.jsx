import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Plus, X, MapPin } from 'lucide-react';
import Card from '@components/common/Card/Card';
import Select from '@components/common/Select';
import { formatPhoneNumber } from '@/utils/formatters';

// Level of Play options (same as camps/lessons)
const LEVEL_OF_PLAY_OPTIONS = [
  { value: 'Mini Mite/U6: Ages 5-6', label: 'Mini Mite/U6: Ages 5-6' },
  { value: 'Mite/U8: Ages 7-8', label: 'Mite/U8: Ages 7-8' },
  { value: 'Squirt/U10: Ages 9-10', label: 'Squirt/U10: Ages 9-10' },
  { value: 'PeeWee/U12: Ages 11-12', label: 'PeeWee/U12: Ages 11-12' },
  { value: 'Bantam/U14: Ages 13-14', label: 'Bantam/U14: Ages 13-14' },
  {
    value: 'Midget U16 (Minor Midget): Ages 15-16',
    label: 'Midget U16 (Minor Midget): Ages 15-16',
  },
  {
    value: 'Midget U18 (Major Midget): Ages 15-18',
    label: 'Midget U18 (Major Midget): Ages 15-18',
  },
];

const AtHomeTrainingForm = ({ event }) => {
  const addressInputRef = useRef(null);
  const [googleMapsReady, setGoogleMapsReady] = useState(false);

  const [formData, setFormData] = useState({
    // Array of players (default: 1 player)
    players: [
      {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        levelOfPlay: '',
      },
    ],

    // Parent/Guardian Information
    guardianFirstName: '',
    guardianLastName: '',
    guardianEmail: '',
    guardianPhone: '',
    guardianRelationship: 'Parent',

    // Address Information (NEW)
    addressStreet: '',
    addressUnit: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    addressCountry: 'USA',

    // Emergency Contact (OPTIONAL for At Home Training)
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',

    // Additional
    medicalNotes: '',
    waiverAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize Google Places Autocomplete (runs after Google Maps script loads)
  useEffect(() => {
    if (!googleMapsReady) {
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    if (!addressInputRef.current) {
      return;
    }

    try {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: ['us', 'ca'] }, // USA and Canada
          fields: ['address_components'], // Only request address components to minimize API usage
        }
      );

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (!place.address_components) return;

        // Extract address components
        let street = '';
        let city = '';
        let state = '';
        let zip = '';
        let country = '';

        place.address_components.forEach(component => {
          const types = component.types;

          if (types.includes('street_number')) {
            street = component.long_name + ' ';
          }
          if (types.includes('route')) {
            street += component.long_name;
          }
          if (types.includes('locality')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          }
          if (types.includes('postal_code')) {
            zip = component.long_name;
          }
          if (types.includes('country')) {
            country = component.short_name;
          }
        });

        // Auto-populate address fields
        setFormData(prev => ({
          ...prev,
          addressStreet: street.trim(),
          addressCity: city,
          addressState: state,
          addressZip: zip,
          addressCountry: country === 'CA' ? 'Canada' : 'USA',
        }));

        // Mark as touched
        setTouched(prev => ({
          ...prev,
          addressStreet: true,
          addressCity: true,
          addressState: true,
          addressZip: true,
        }));

        // Clear the autocomplete input value to allow manual editing
        // This prevents the autocomplete from overriding user edits
        if (addressInputRef.current) {
          addressInputRef.current.value = street.trim();
        }
      });
    } catch (error) {
      // Google Places Autocomplete initialization failed - address autocomplete won't be available
    }
  }, [googleMapsReady]); // Re-run when Google Maps API becomes ready

  // Load Google Maps API (only once globally)
  useEffect(() => {
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setGoogleMapsReady(true);
      return;
    }

    // Check if currently loading
    if (window.googleMapsLoading) {
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      return;
    }

    // Set loading flag
    window.googleMapsLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.googleMapsLoading = false;

      // Poll for Places library availability (loading=async delays library init)
      const checkPlacesReady = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkPlacesReady);
          setGoogleMapsReady(true);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkPlacesReady);
      }, 10000);
    };

    script.onerror = () => {
      window.googleMapsLoading = false;
    };

    document.head.appendChild(script);
  }, []);

  // Add player
  const addPlayer = () => {
    setFormData(prev => ({
      ...prev,
      players: [
        ...prev.players,
        {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          levelOfPlay: '',
        },
      ],
    }));
  };

  // Remove player
  const removePlayer = index => {
    if (formData.players.length === 1) return; // Keep at least one player
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index),
    }));
  };

  // Handle player field change
  const handlePlayerChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map((player, i) =>
        i === index ? { ...player, [field]: value } : player
      ),
    }));

    // Mark field as touched
    setTouched(prev => ({ ...prev, [`player_${index}_${field}`]: true }));

    // Validate field
    validatePlayerField(index, field, value);
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, type === 'checkbox' ? checked : value);
  };

  const handleBlur = e => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const validatePlayerField = (index, fieldName, value) => {
    let error = '';
    const errorKey = `player_${index}_${fieldName}`;

    switch (fieldName) {
      case 'firstName':
        if (!value.trim()) error = 'First name is required';
        break;
      case 'lastName':
        if (!value.trim()) error = 'Last name is required';
        break;
      case 'dateOfBirth':
        if (!value) error = 'Date of birth is required';
        break;
      case 'levelOfPlay':
        if (!value) error = 'Level of play is required';
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [errorKey]: error }));
  };

  const validateField = (fieldName, value) => {
    let error = '';

    switch (fieldName) {
      case 'guardianFirstName':
        if (!value.trim()) error = 'Guardian first name is required';
        break;
      case 'guardianLastName':
        if (!value.trim()) error = 'Guardian last name is required';
        break;
      case 'guardianEmail':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Invalid email format';
        }
        break;
      case 'guardianPhone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else {
          const phoneDigits = value.replace(/[^\d]/g, '');
          if (phoneDigits.length !== 10) {
            error = 'Invalid phone format (e.g., (555) 555-5555)';
          }
        }
        break;
      case 'addressStreet':
        if (!value.trim()) error = 'Street address is required';
        break;
      case 'addressCity':
        if (!value.trim()) error = 'City is required';
        break;
      case 'addressState':
        if (!value.trim()) error = 'State/Province is required';
        break;
      case 'addressZip':
        if (!value.trim()) error = 'Postal code is required';
        break;
      case 'emergencyPhone':
        if (value.trim()) {
          const phoneDigits = value.replace(/[^\d]/g, '');
          if (phoneDigits.length !== 10) {
            error = 'Invalid phone format (e.g., (555) 555-5555)';
          }
        }
        break;
      case 'waiverAccepted':
        if (!value) error = 'You must accept the waiver to continue';
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate all players
    formData.players.forEach((player, index) => {
      if (!player.firstName.trim()) {
        newErrors[`player_${index}_firstName`] = 'First name is required';
      }
      if (!player.lastName.trim()) {
        newErrors[`player_${index}_lastName`] = 'Last name is required';
      }
      if (!player.dateOfBirth) {
        newErrors[`player_${index}_dateOfBirth`] = 'Date of birth is required';
      }
      if (!player.levelOfPlay) {
        newErrors[`player_${index}_levelOfPlay`] = 'Level of play is required';
      }
    });

    // Guardian validation
    if (!formData.guardianFirstName.trim()) {
      newErrors.guardianFirstName = 'Guardian first name is required';
    }
    if (!formData.guardianLastName.trim()) {
      newErrors.guardianLastName = 'Guardian last name is required';
    }
    if (!formData.guardianEmail.trim()) {
      newErrors.guardianEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail)) {
      newErrors.guardianEmail = 'Invalid email format';
    }
    if (!formData.guardianPhone.trim()) {
      newErrors.guardianPhone = 'Phone number is required';
    } else {
      const phoneDigits = formData.guardianPhone.replace(/[^\d]/g, '');
      if (phoneDigits.length !== 10) {
        newErrors.guardianPhone = 'Invalid phone format (e.g., (555) 555-5555)';
      }
    }

    // Address validation
    if (!formData.addressStreet.trim()) {
      newErrors.addressStreet = 'Street address is required';
    }
    if (!formData.addressCity.trim()) {
      newErrors.addressCity = 'City is required';
    }
    if (!formData.addressState.trim()) {
      newErrors.addressState = 'State/Province is required';
    }
    if (!formData.addressZip.trim()) {
      newErrors.addressZip = 'Postal code is required';
    }

    // Emergency contact validation (OPTIONAL - only validate phone format if provided)
    if (formData.emergencyPhone.trim()) {
      const phoneDigits = formData.emergencyPhone.replace(/[^\d]/g, '');
      if (phoneDigits.length !== 10) {
        newErrors.emergencyPhone = 'Invalid phone format (e.g., (555) 555-5555)';
      }
    }

    // Waiver validation
    if (!formData.waiverAccepted) {
      newErrors.waiverAccepted = 'You must accept the waiver to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Mark all fields as touched
    const touchedFields = {
      guardianFirstName: true,
      guardianLastName: true,
      guardianEmail: true,
      guardianPhone: true,
      addressStreet: true,
      addressCity: true,
      addressState: true,
      addressZip: true,
      waiverAccepted: true,
    };

    // Mark all player fields as touched
    formData.players.forEach((_, index) => {
      touchedFields[`player_${index}_firstName`] = true;
      touchedFields[`player_${index}_lastName`] = true;
      touchedFields[`player_${index}_dateOfBirth`] = true;
      touchedFields[`player_${index}_levelOfPlay`] = true;
    });

    setTouched(touchedFields);

    if (!validateForm()) {
      const firstError = document.querySelector('.text-red-400');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);

    try {
      // Extract slot date and time from event
      const eventStart = new Date(event.start.dateTime);
      const slotDate = eventStart.toISOString().split('T')[0];
      const slotTime = eventStart.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Calculate total price ($95 per player)
      const basePrice = 95;
      const totalPrice = basePrice * formData.players.length;

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
            playerCount: formData.players.length,
            totalPrice: totalPrice,
            eventType: 'at_home_training',
            start: event.start,
            end: event.end,
            slotDate: slotDate,
            slotTime: slotTime,
          },
          formData: formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to process registration. Please try again.' });
      setSubmitting(false);
    }
  };

  // Calculate total price for display
  const totalPrice = 95 * formData.players.length;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Player Information */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-teal-500" />
              Player Information
            </h3>
            <motion.button
              type="button"
              onClick={addPlayer}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Sibling
            </motion.button>
          </div>

          {formData.players.map((player, index) => (
            <div
              key={index}
              className={`${index > 0 ? 'border-t border-neutral-dark pt-6 mt-6' : ''}`}
            >
              {formData.players.length > 1 && (
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Player {index + 1}</h4>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`player_${index}_firstName`}
                    className="block text-sm font-medium text-neutral-light mb-2"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    id={`player_${index}_firstName`}
                    value={player.firstName}
                    onChange={e => handlePlayerChange(index, 'firstName', e.target.value)}
                    onBlur={() => validatePlayerField(index, 'firstName', player.firstName)}
                    className={`w-full px-4 py-2 bg-neutral-bg border ${
                      touched[`player_${index}_firstName`] && errors[`player_${index}_firstName`]
                        ? 'border-red-500'
                        : 'border-neutral-dark'
                    } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                    placeholder="John"
                  />
                  {touched[`player_${index}_firstName`] && errors[`player_${index}_firstName`] && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors[`player_${index}_firstName`]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`player_${index}_lastName`}
                    className="block text-sm font-medium text-neutral-light mb-2"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id={`player_${index}_lastName`}
                    value={player.lastName}
                    onChange={e => handlePlayerChange(index, 'lastName', e.target.value)}
                    onBlur={() => validatePlayerField(index, 'lastName', player.lastName)}
                    className={`w-full px-4 py-2 bg-neutral-bg border ${
                      touched[`player_${index}_lastName`] && errors[`player_${index}_lastName`]
                        ? 'border-red-500'
                        : 'border-neutral-dark'
                    } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                    placeholder="Doe"
                  />
                  {touched[`player_${index}_lastName`] && errors[`player_${index}_lastName`] && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors[`player_${index}_lastName`]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`player_${index}_dateOfBirth`}
                    className="block text-sm font-medium text-neutral-light mb-2"
                  >
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    id={`player_${index}_dateOfBirth`}
                    value={player.dateOfBirth}
                    onChange={e => handlePlayerChange(index, 'dateOfBirth', e.target.value)}
                    onBlur={() => validatePlayerField(index, 'dateOfBirth', player.dateOfBirth)}
                    className={`w-full px-4 py-2 bg-neutral-bg border ${
                      touched[`player_${index}_dateOfBirth`] &&
                      errors[`player_${index}_dateOfBirth`]
                        ? 'border-red-500'
                        : 'border-neutral-dark'
                    } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  />
                  {touched[`player_${index}_dateOfBirth`] &&
                    errors[`player_${index}_dateOfBirth`] && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors[`player_${index}_dateOfBirth`]}
                      </p>
                    )}
                </div>

                <div>
                  <label
                    htmlFor={`player_${index}_levelOfPlay`}
                    className="block text-sm font-medium text-neutral-light mb-2"
                  >
                    Level of Play *
                  </label>
                  <Select
                    id={`player_${index}_levelOfPlay`}
                    name={`player_${index}_levelOfPlay`}
                    value={player.levelOfPlay}
                    onChange={e => handlePlayerChange(index, 'levelOfPlay', e.target.value)}
                    onBlur={() => validatePlayerField(index, 'levelOfPlay', player.levelOfPlay)}
                    error={
                      touched[`player_${index}_levelOfPlay`] &&
                      errors[`player_${index}_levelOfPlay`]
                    }
                    placeholder="Select level of play"
                    options={LEVEL_OF_PLAY_OPTIONS}
                  />
                  {touched[`player_${index}_levelOfPlay`] &&
                    errors[`player_${index}_levelOfPlay`] && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors[`player_${index}_levelOfPlay`]}
                      </p>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Parent/Guardian Information */}
        <div className="border-t border-neutral-dark pt-6">
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-teal-500" />
            Parent/Guardian Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="guardianFirstName"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                First Name *
              </label>
              <input
                type="text"
                id="guardianFirstName"
                name="guardianFirstName"
                value={formData.guardianFirstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.guardianFirstName && errors.guardianFirstName
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Jane"
              />
              {touched.guardianFirstName && errors.guardianFirstName && (
                <p className="text-red-400 text-sm mt-1">{errors.guardianFirstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="guardianLastName"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Last Name *
              </label>
              <input
                type="text"
                id="guardianLastName"
                name="guardianLastName"
                value={formData.guardianLastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.guardianLastName && errors.guardianLastName
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Doe"
              />
              {touched.guardianLastName && errors.guardianLastName && (
                <p className="text-red-400 text-sm mt-1">{errors.guardianLastName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="guardianEmail"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-light" />
                <input
                  type="email"
                  id="guardianEmail"
                  name="guardianEmail"
                  value={formData.guardianEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    touched.guardianEmail && errors.guardianEmail
                      ? 'border-red-500'
                      : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="jane@example.com"
                />
              </div>
              {touched.guardianEmail && errors.guardianEmail && (
                <p className="text-red-400 text-sm mt-1">{errors.guardianEmail}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="guardianPhone"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-light" />
                <input
                  type="tel"
                  id="guardianPhone"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={e => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData(prev => ({ ...prev, guardianPhone: formatted }));
                    setTouched(prev => ({ ...prev, guardianPhone: true }));
                    validateField('guardianPhone', formatted);
                  }}
                  onBlur={e => {
                    setTouched(prev => ({ ...prev, guardianPhone: true }));
                    validateField('guardianPhone', e.target.value);
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    touched.guardianPhone && errors.guardianPhone
                      ? 'border-red-500'
                      : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="(555) 555-5555"
                />
              </div>
              {touched.guardianPhone && errors.guardianPhone && (
                <p className="text-red-400 text-sm mt-1">{errors.guardianPhone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="guardianRelationship"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Relationship to Player *
              </label>
              <select
                id="guardianRelationship"
                name="guardianRelationship"
                value={formData.guardianRelationship}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-neutral-bg border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="Parent">Parent</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="border-t border-neutral-dark pt-6">
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-500" />
            Training Location Address
          </h3>
          <p className="text-sm text-neutral-light mb-4">
            Enter the address where the at-home training will take place. Start typing and select
            from suggestions, or manually enter your address. You can edit any field after
            selection.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="addressStreet"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Street Address *
              </label>
              <input
                ref={addressInputRef}
                type="text"
                id="addressStreet"
                name="addressStreet"
                defaultValue={formData.addressStreet}
                onChange={e => {
                  // Update state on change for validation
                  setFormData(prev => ({ ...prev, addressStreet: e.target.value }));
                  setTouched(prev => ({ ...prev, addressStreet: true }));
                  validateField('addressStreet', e.target.value);
                }}
                onBlur={e => {
                  // Sync final value from DOM to state on blur
                  const currentValue = e.target.value;
                  setFormData(prev => ({ ...prev, addressStreet: currentValue }));
                  setTouched(prev => ({ ...prev, addressStreet: true }));
                  validateField('addressStreet', currentValue);
                }}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.addressStreet && errors.addressStreet
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="123 Main Street"
              />
              {touched.addressStreet && errors.addressStreet && (
                <p className="text-red-400 text-sm mt-1">{errors.addressStreet}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="addressUnit"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Apartment / Unit (Optional)
              </label>
              <input
                type="text"
                id="addressUnit"
                name="addressUnit"
                value={formData.addressUnit}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-neutral-bg border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Unit 5, Apt 2B, etc."
              />
            </div>

            <div>
              <label
                htmlFor="addressCity"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                City *
              </label>
              <input
                type="text"
                id="addressCity"
                name="addressCity"
                value={formData.addressCity}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.addressCity && errors.addressCity
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Chicago"
              />
              {touched.addressCity && errors.addressCity && (
                <p className="text-red-400 text-sm mt-1">{errors.addressCity}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="addressState"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                State / Province *
              </label>
              <input
                type="text"
                id="addressState"
                name="addressState"
                value={formData.addressState}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.addressState && errors.addressState
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="IL"
              />
              {touched.addressState && errors.addressState && (
                <p className="text-red-400 text-sm mt-1">{errors.addressState}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="addressZip"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Postal Code *
              </label>
              <input
                type="text"
                id="addressZip"
                name="addressZip"
                value={formData.addressZip}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.addressZip && errors.addressZip ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="60601"
              />
              {touched.addressZip && errors.addressZip && (
                <p className="text-red-400 text-sm mt-1">{errors.addressZip}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="addressCountry"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Country *
              </label>
              <select
                id="addressCountry"
                name="addressCountry"
                value={formData.addressCountry}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-neutral-bg border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="USA">United States</option>
                <option value="Canada">Canada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Emergency Contact (OPTIONAL) */}
        <div className="border-t border-neutral-dark pt-6">
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-teal-500" />
            Emergency Contact{' '}
            <span className="text-sm text-neutral-light font-normal">(Optional)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="emergencyName"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="emergencyName"
                name="emergencyName"
                value={formData.emergencyName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-neutral-bg border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Emergency Contact Name"
              />
            </div>

            <div>
              <label
                htmlFor="emergencyPhone"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-light" />
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={e => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData(prev => ({ ...prev, emergencyPhone: formatted }));
                    setTouched(prev => ({ ...prev, emergencyPhone: true }));
                    validateField('emergencyPhone', formatted);
                  }}
                  onBlur={e => {
                    setTouched(prev => ({ ...prev, emergencyPhone: true }));
                    validateField('emergencyPhone', e.target.value);
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    touched.emergencyPhone && errors.emergencyPhone
                      ? 'border-red-500'
                      : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="(555) 555-5555"
                />
              </div>
              {touched.emergencyPhone && errors.emergencyPhone && (
                <p className="text-red-400 text-sm mt-1">{errors.emergencyPhone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="emergencyRelationship"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Relationship to Player
              </label>
              <input
                type="text"
                id="emergencyRelationship"
                name="emergencyRelationship"
                value={formData.emergencyRelationship}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-neutral-bg border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="e.g., Aunt, Uncle, Family Friend"
              />
            </div>
          </div>
        </div>

        {/* Medical Notes */}
        <div className="border-t border-neutral-dark pt-6">
          <label
            htmlFor="medicalNotes"
            className="block text-sm font-medium text-neutral-light mb-2"
          >
            Medical Notes / Allergies (Optional)
          </label>
          <textarea
            id="medicalNotes"
            name="medicalNotes"
            value={formData.medicalNotes}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 bg-neutral-bg border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors resize-none"
            placeholder="Any medical conditions, allergies, or special considerations we should know about..."
          />
        </div>

        {/* Waiver Agreement */}
        <div className="border-t border-neutral-dark pt-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="waiverAccepted"
              name="waiverAccepted"
              checked={formData.waiverAccepted}
              onChange={handleChange}
              onBlur={handleBlur}
              className="mt-1 w-5 h-5 rounded border-neutral-dark bg-neutral-bg text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
            />
            <label htmlFor="waiverAccepted" className="text-sm text-neutral-light">
              I have read and agree to the{' '}
              <a
                href="/waiver"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline"
              >
                Waiver and Release of Liability
              </a>
              . I understand that hockey is a contact sport with inherent risks. *
            </label>
          </div>
          {touched.waiverAccepted && errors.waiverAccepted && (
            <p className="text-red-400 text-sm mt-2">{errors.waiverAccepted}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <div className="border-t border-neutral-dark pt-6">
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
              submitting
                ? 'bg-neutral-dark text-neutral-light cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-teal-700 text-white hover:from-teal-600 hover:to-teal-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : (
              <span>
                Continue to Payment • ${totalPrice}
                {formData.players.length > 1 && (
                  <span className="text-sm opacity-80"> ({formData.players.length} players)</span>
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
  );
};

export default AtHomeTrainingForm;
