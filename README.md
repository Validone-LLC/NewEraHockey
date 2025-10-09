# New Era Hockey - React SPA

A modern, responsive single-page application for New Era Hockey, a premier hockey training program in the DMV area led by Coach Will Pasko.

## 🚀 Features

- **Modern Design**: Built with React 18 and Tailwind CSS for a sleek, responsive UI
- **Smooth Animations**: Framer Motion for engaging user experience
- **Optimized Performance**: Vite for lightning-fast development and optimized builds
- **Accessibility**: WCAG-compliant components with proper semantic HTML
- **Mobile-First**: Fully responsive design for all device sizes
- **SEO-Friendly**: Proper meta tags and semantic structure

## 📋 Pages

1. **Home** - Hero section, core values, about section, and camp photos
2. **Coach Will** - Coach biography, certifications, and personal statement
3. **Testimonials** - Parent and player success stories
4. **Gallery** - Training camp photos and player highlights
5. **Contact** - Contact form, direct contact info, and FAQ section
6. **Event Registration** - Upcoming camps and training sessions (calendar integration ready)

## 🛠️ Tech Stack

- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.1.4
- **Styling**: Tailwind CSS 3.4.1
- **Routing**: React Router DOM 6.22.0
- **Animations**: Framer Motion 11.0.8
- **Form Handling**: Formik 2.4.5 + Yup 1.4.0
- **Notifications**: React Toastify 10.0.4
- **Icons**: React Icons 5.0.1
- **Calendar**: React Big Calendar 1.11.2

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your configuration:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   VITE_CONTACT_EMAIL=Nehockeytraining@outlook.com
   VITE_PHONE=(571) 274-4691
   VITE_INSTAGRAM=@NewEraHockeyDMV
   VITE_RECAPTCHA_SITE_KEY=your_recaptcha_key
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview production build**:
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
newerahockey/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, icons
│   │   └── images/
│   │       └── camp-photos/
│   ├── components/        # React components
│   │   ├── common/        # Reusable components
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Header/
│   │   │   └── Footer/
│   │   ├── home/          # Home page components
│   │   ├── contact/       # Contact page components
│   │   └── testimonials/  # Testimonials components
│   ├── data/              # Static data files
│   │   ├── coreValues.js
│   │   ├── coachInfo.js
│   │   ├── testimonials.js
│   │   ├── galleryImages.js
│   │   └── faqs.js
│   ├── pages/             # Page components
│   ├── routes/            # Routing configuration
│   ├── App.jsx            # Main app component
│   ├── index.jsx          # Entry point
│   └── index.css          # Global styles
├── .env.example           # Environment variables template
├── index.html             # HTML template
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind configuration
├── vite.config.js         # Vite configuration
└── README.md
```

## 🎨 Design System

### Colors

- **Primary**: Dark charcoal background (#1a1a1b)
- **Accent Colors**:
  - Red: #c8102e (Passion)
  - Blue: #003087 (Discipline)
  - Gold: #fcb514 (Results)
- **Neutral**: Various grays for text and backgrounds

### Typography

- **Display Font**: Montserrat (headings)
- **Body Font**: Roboto (content)

### Components

All components follow modern React patterns with:
- Framer Motion animations
- Responsive design (mobile-first)
- Accessibility features
- Hover and interaction states

## 🔧 Customization

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/routes/AppRoutes.jsx`
3. Update navigation in `src/components/common/Header/Navigation.jsx`

### Modifying Content

All static content is stored in `src/data/` for easy updates without touching component code.

### Styling

Tailwind utility classes are used throughout. Customize the theme in `tailwind.config.js`.

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🚧 Future Enhancements

- [ ] Integrate backend API for contact form
- [ ] Add event calendar with registration system
- [ ] Implement image lightbox for gallery
- [ ] Add Google Analytics
- [ ] Integrate ReCAPTCHA for forms
- [ ] Add blog/news section
- [ ] Player progress tracking portal

## 📞 Contact

**New Era Hockey**
- Email: Nehockeytraining@outlook.com
- Phone: (571) 274-4691
- Instagram: @NewEraHockeyDMV

## 📄 License

© 2025 New Era Hockey. All rights reserved.
