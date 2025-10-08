# New Era Hockey - React SPA Project Structure

```
newerahockey-spa/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo.svg
│   │   │   ├── hero-background.jpg
│   │   │   ├── passion-image.jpg
│   │   │   ├── discipline-image.jpg
│   │   │   ├── results-image.jpg
│   │   │   ├── coach-will.jpg
│   │   │   └── camp-photos/
│   │   │       └── (multiple camp photos)
│   │   └── icons/
│   │       ├── hockey-stick.svg
│   │       ├── trophy.svg
│   │       └── whistle.svg
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Header.module.css
│   │   │   │   └── Navigation.jsx
│   │   │   ├── Footer/
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── Footer.module.css
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Card/
│   │   │   │   ├── Card.jsx
│   │   │   │   └── Card.module.css
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── Modal.module.css
│   │   │   └── Loader/
│   │   │       ├── Loader.jsx
│   │   │       └── Loader.module.css
│   │   │
│   │   ├── home/
│   │   │   ├── Hero/
│   │   │   │   ├── Hero.jsx
│   │   │   │   └── Hero.module.css
│   │   │   ├── CoreValues/
│   │   │   │   ├── CoreValues.jsx
│   │   │   │   ├── CoreValues.module.css
│   │   │   │   └── ValueCard.jsx
│   │   │   ├── AboutSection/
│   │   │   │   ├── AboutSection.jsx
│   │   │   │   └── AboutSection.module.css
│   │   │   └── CampPhotos/
│   │   │       ├── CampPhotos.jsx
│   │   │       ├── CampPhotos.module.css
│   │   │       └── PhotoGallery.jsx
│   │   │
│   │   ├── coach/
│   │   │   ├── CoachProfile/
│   │   │   │   ├── CoachProfile.jsx
│   │   │   │   └── CoachProfile.module.css
│   │   │   ├── Certifications/
│   │   │   │   ├── Certifications.jsx
│   │   │   │   └── Certifications.module.css
│   │   │   └── Experience/
│   │   │       ├── Experience.jsx
│   │   │       └── Experience.module.css
│   │   │
│   │   ├── testimonials/
│   │   │   ├── TestimonialCard/
│   │   │   │   ├── TestimonialCard.jsx
│   │   │   │   └── TestimonialCard.module.css
│   │   │   └── TestimonialList/
│   │   │       ├── TestimonialList.jsx
│   │   │       └── TestimonialList.module.css
│   │   │
│   │   ├── gallery/
│   │   │   ├── ImageGrid/
│   │   │   │   ├── ImageGrid.jsx
│   │   │   │   └── ImageGrid.module.css
│   │   │   └── Lightbox/
│   │   │       ├── Lightbox.jsx
│   │   │       └── Lightbox.module.css
│   │   │
│   │   ├── contact/
│   │   │   ├── ContactForm/
│   │   │   │   ├── ContactForm.jsx
│   │   │   │   └── ContactForm.module.css
│   │   │   ├── ContactInfo/
│   │   │   │   ├── ContactInfo.jsx
│   │   │   │   └── ContactInfo.module.css
│   │   │   └── FormValidation/
│   │   │       └── validation.js
│   │   │
│   │   └── events/
│   │       ├── EventSchedule/
│   │       │   ├── EventSchedule.jsx
│   │       │   └── EventSchedule.module.css
│   │       ├── EventCard/
│   │       │   ├── EventCard.jsx
│   │       │   └── EventCard.module.css
│   │       ├── RegistrationForm/
│   │       │   ├── RegistrationForm.jsx
│   │       │   ├── RegistrationForm.module.css
│   │       │   └── RegistrationSteps.jsx
│   │       └── Calendar/
│   │           ├── Calendar.jsx
│   │           └── Calendar.module.css
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── CoachWill.jsx
│   │   ├── Testimonials.jsx
│   │   ├── Gallery.jsx
│   │   ├── Contact.jsx
│   │   ├── EventRegistration.jsx
│   │   └── NotFound.jsx
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── axiosConfig.js
│   │   │   ├── contactApi.js
│   │   │   └── registrationApi.js
│   │   ├── validation/
│   │   │   ├── contactValidation.js
│   │   │   └── registrationValidation.js
│   │   └── utils/
│   │       ├── dateFormatter.js
│   │       └── imageOptimizer.js
│   │
│   ├── hooks/
│   │   ├── useForm.js
│   │   ├── useApi.js
│   │   ├── useScrollPosition.js
│   │   └── useMediaQuery.js
│   │
│   ├── context/
│   │   ├── ThemeContext.jsx
│   │   └── NotificationContext.jsx
│   │
│   ├── data/
│   │   ├── coreValues.js
│   │   ├── testimonials.js
│   │   ├── events.js
│   │   ├── galleryImages.js
│   │   └── coachInfo.js
│   │
│   ├── styles/
│   │   ├── global.css
│   │   ├── variables.css
│   │   ├── typography.css
│   │   └── animations.css
│   │
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.js
│   └── index.css
│
├── .env.example
├── .env.local
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js (or webpack.config.js)
```

## Key Files Content Examples

### package.json
```json
{
  "name": "newerahockey-spa",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "formik": "^2.4.5",
    "yup": "^1.3.3",
    "react-icons": "^5.0.0",
    "framer-motion": "^11.0.0",
    "react-responsive": "^10.0.0",
    "react-toastify": "^10.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx"
  }
}
```

### src/routes/AppRoutes.jsx
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import CoachWill from '../pages/CoachWill';
import Testimonials from '../pages/Testimonials';
import Gallery from '../pages/Gallery';
import Contact from '../pages/Contact';
import EventRegistration from '../pages/EventRegistration';
import NotFound from '../pages/NotFound';
import Header from '../components/common/Header/Header';
import Footer from '../components/common/Footer/Footer';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coach-will" element={<CoachWill />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/register" element={<EventRegistration />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
};

export default AppRoutes;
```

### src/data/coreValues.js
```javascript
export const coreValues = [
  {
    id: 1,
    title: 'Passion',
    description: 'At New Era Hockey, we firmly believe that passion is the lifeblood of the sport. Without it, hockey loses its essence and fun. That is why we prioritize fostering an environment that not only ignites a love for the game but also fuels the dedication required for the rigorous training behind it. Our goal is to inspire every player to strive for their best!',
    image: '/assets/images/passion-image.jpg',
    icon: '🔥'
  },
  {
    id: 2,
    title: 'Discipline',
    description: 'Achieving results requires discipline, particularly in the realm of hockey, where success and growth are directly tied to hard work. At New Era Hockey, we strike an ideal balance between discipline and enjoyment, ensuring every moment on the ice contributes to growth while still being a source of fun!',
    image: '/assets/images/discipline-image.jpg',
    icon: '💪'
  },
  {
    id: 3,
    title: 'Results',
    description: 'At New Era Hockey, we take immense pride in the results we deliver. Every opportunity to assist hockey players is a chance for us to demonstrate our commitment to excellence. Rest assured, with us, positive outcomes aren\'t just a possibility, they\'re a guarantee – each and every time!',
    image: '/assets/images/results-image.jpg',
    icon: '🏆'
  }
];
```

### src/services/api/contactApi.js
```javascript
import axios from './axiosConfig';

export const sendContactMessage = async (formData) => {
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

export const registerForEvent = async (registrationData) => {
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

### .env.example
```
VITE_API_BASE_URL=http://localhost:3000
VITE_CONTACT_EMAIL=Nehockeytraining@outlook.com
VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
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