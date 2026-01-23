/**
 * Address Section Component
 *
 * Training location address with Google Places autocomplete.
 * Only shown for event types that require an address (e.g., at-home training).
 */

import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

const AddressSection = ({ formik, config }) => {
  const addressInputRef = useRef(null);
  const [googleMapsReady, setGoogleMapsReady] = useState(false);

  const { addressLabel = 'Training Location Address', addressDescription = '' } = config.features;

  const getFieldError = fieldName =>
    formik.touched[fieldName] && formik.errors[fieldName] ? formik.errors[fieldName] : null;

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!googleMapsReady) return;
    if (!window.google?.maps?.places) return;
    if (!addressInputRef.current) return;

    try {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: ['us', 'ca'] },
          fields: ['address_components'],
        }
      );

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (!place.address_components) return;

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
        formik.setFieldValue('addressStreet', street.trim());
        formik.setFieldValue('addressCity', city);
        formik.setFieldValue('addressState', state);
        formik.setFieldValue('addressZip', zip);
        formik.setFieldValue('addressCountry', country === 'CA' ? 'Canada' : 'USA');

        // Mark as touched
        formik.setFieldTouched('addressStreet', true);
        formik.setFieldTouched('addressCity', true);
        formik.setFieldTouched('addressState', true);
        formik.setFieldTouched('addressZip', true);

        // Update input value
        if (addressInputRef.current) {
          addressInputRef.current.value = street.trim();
        }
      });
    } catch {
      // Google Places initialization failed - autocomplete won't be available
    }
  }, [googleMapsReady, formik]);

  // Load Google Maps API
  useEffect(() => {
    if (window.google?.maps?.places) {
      setGoogleMapsReady(true);
      return;
    }

    if (window.googleMapsLoading) return;

    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return;

    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) return;

    window.googleMapsLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.googleMapsLoading = false;

      const checkPlacesReady = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkPlacesReady);
          setGoogleMapsReady(true);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkPlacesReady);
      }, 10000);
    };

    script.onerror = () => {
      window.googleMapsLoading = false;
    };

    document.head.appendChild(script);
  }, []);

  return (
    <div className="border-t border-neutral-dark pt-6">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-teal-500" />
        {addressLabel}
      </h3>
      {addressDescription && (
        <p className="text-sm text-neutral-light mb-4">{addressDescription}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Street Address */}
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
            defaultValue={formik.values.addressStreet}
            onChange={e => {
              formik.setFieldValue('addressStreet', e.target.value);
              formik.setFieldTouched('addressStreet', true);
            }}
            onBlur={e => {
              const currentValue = e.target.value;
              formik.setFieldValue('addressStreet', currentValue);
              formik.setFieldTouched('addressStreet', true);
            }}
            className={`w-full px-4 py-2 bg-neutral-bg border ${
              getFieldError('addressStreet') ? 'border-red-500' : 'border-neutral-dark'
            } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
            placeholder="123 Main Street"
          />
          {getFieldError('addressStreet') && (
            <p className="text-red-400 text-sm mt-1">{getFieldError('addressStreet')}</p>
          )}
        </div>

        {/* Unit/Apt */}
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
            {...formik.getFieldProps('addressUnit')}
            className="w-full px-4 py-2 bg-neutral-bg border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
            placeholder="Unit 5, Apt 2B, etc."
          />
        </div>

        {/* City */}
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
            {...formik.getFieldProps('addressCity')}
            className={`w-full px-4 py-2 bg-neutral-bg border ${
              getFieldError('addressCity') ? 'border-red-500' : 'border-neutral-dark'
            } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
            placeholder="Chicago"
          />
          {getFieldError('addressCity') && (
            <p className="text-red-400 text-sm mt-1">{getFieldError('addressCity')}</p>
          )}
        </div>

        {/* State */}
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
            {...formik.getFieldProps('addressState')}
            className={`w-full px-4 py-2 bg-neutral-bg border ${
              getFieldError('addressState') ? 'border-red-500' : 'border-neutral-dark'
            } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
            placeholder="IL"
          />
          {getFieldError('addressState') && (
            <p className="text-red-400 text-sm mt-1">{getFieldError('addressState')}</p>
          )}
        </div>

        {/* Zip */}
        <div>
          <label htmlFor="addressZip" className="block text-sm font-medium text-neutral-light mb-2">
            Postal Code *
          </label>
          <input
            type="text"
            id="addressZip"
            name="addressZip"
            {...formik.getFieldProps('addressZip')}
            className={`w-full px-4 py-2 bg-neutral-bg border ${
              getFieldError('addressZip') ? 'border-red-500' : 'border-neutral-dark'
            } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
            placeholder="60601"
          />
          {getFieldError('addressZip') && (
            <p className="text-red-400 text-sm mt-1">{getFieldError('addressZip')}</p>
          )}
        </div>

        {/* Country */}
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
            value={formik.values.addressCountry}
            onChange={formik.handleChange}
            className="w-full px-4 py-2 bg-neutral-bg border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
          >
            <option value="USA">United States</option>
            <option value="Canada">Canada</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AddressSection;
