/**
 * Navigation Configuration
 *
 * Shared navigation links used by Header and Footer components.
 * Single source of truth for all navigation routes.
 */

/**
 * Main navigation links displayed in header and footer
 */
export const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/coaches', label: 'Coaches' },
  { path: '/testimonials', label: 'Testimonials' },
  { path: '/gallery', label: 'Gallery' },
  { path: '/faq', label: 'FAQ' },
  { path: '/contact', label: 'Contact' },
  { path: '/event-registration', label: 'Event Registration' },
];

/**
 * Header navigation links (excludes FAQ - available via footer/contact page)
 */
export const headerNavLinks = navLinks.filter(link => link.path !== '/faq');

/**
 * Footer navigation links (full set)
 */
export const footerNavLinks = navLinks;
