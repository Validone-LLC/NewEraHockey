# New Era Hockey - React SPA Project

### src/services/api/contactApi.js

```javascript
import axios from './axiosConfig';

export const sendContactMessage = async formData => {
  try {
    const response = await axios.post('/api/contact', formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to send message' };
  }
};
```

### src/services/api/registrationApi.js

```javascript
import axios from './axiosConfig';

export const registerForEvent = async registrationData => {
  try {
    const response = await axios.post('/api/events/register', registrationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

export const getEventSchedule = async () => {
  try {
    const response = await axios.get('/api/events/schedule');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch events' };
  }
};
```

## Notes

- **Static Content**: All content except Contact and Event Registration is static and stored in `/src/data/`
- **API Calls**: Only contact form and event registration make API calls
- **Routing**: Uses React Router v6 for client-side routing
- **Styling**: CSS Modules for component-specific styles, with global styles in `/src/styles/`
- **State Management**: Context API for global state (notifications, theme)
- **Form Handling**: Formik + Yup for form validation
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite for faster development and optimized builds

## Pages Structure

1. **Home** (`/`): Hero, Core Values, About Section, Camp Photos, CTA
2. **Coach Will** (`/coach-will`): Profile, Certifications, Experience
3. **Testimonials** (`/testimonials`): Client testimonials and reviews
4. **Gallery** (`/gallery`): Photo gallery with lightbox
5. **Contact** (`/contact`): Contact form with API integration
6. **Event Registration** (`/register`): Event schedule and registration form with API integration
