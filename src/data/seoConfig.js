// SEO metadata configuration for all routes
const BASE_URL = 'https://newerahockeytraining.com';
const DEFAULT_IMAGE = `${BASE_URL}/assets/og-image.jpg`; // TODO: Create default OG image

export const seoConfig = {
  default: {
    title: 'New Era Hockey | Premier Hockey Training in the DMV Area',
    description:
      'New Era Hockey offers premier hockey training in the DMV area. Led by Coach Will Pasko, we provide expert coaching with proven results, passion, and discipline for players of all skill levels.',
    keywords:
      'hockey training, DMV hockey, hockey coach, New Era Hockey, Coach Will, hockey camps, hockey skills, ice hockey training, youth hockey, hockey development',
    image: DEFAULT_IMAGE,
    url: BASE_URL,
  },

  home: {
    title: 'New Era Hockey | Premier Hockey Training in the DMV Area',
    description:
      'Transform your hockey skills with New Era Hockey. Expert coaching by Coach Will Pasko in the DMV area. Join our camps, training sessions, and development programs.',
    keywords:
      'hockey training, DMV hockey, Coach Will Pasko, hockey camps, ice hockey, youth hockey, hockey development',
    url: BASE_URL,
  },

  coaches: {
    title: 'Meet Our Coaches | New Era Hockey',
    description:
      'Meet our experienced coaching team led by Coach Will Pasko. Learn about their hockey backgrounds, coaching philosophy, and commitment to player development.',
    keywords: 'hockey coaches, Coach Will Pasko, DMV hockey coaches, hockey training staff',
    url: `${BASE_URL}/coaches`,
  },

  testimonials: {
    title: 'Player Testimonials & Reviews | New Era Hockey',
    description:
      'Read what players and parents say about New Era Hockey. Discover success stories, skill improvements, and why families choose our hockey training programs.',
    keywords:
      'hockey testimonials, hockey reviews, player success stories, hockey training reviews',
    url: `${BASE_URL}/testimonials`,
  },

  'submit-review': {
    title: 'Submit Your Review | New Era Hockey',
    description:
      'Share your experience with New Era Hockey. Submit a review and help other families discover our premier hockey training programs.',
    keywords: 'submit hockey review, hockey feedback, training review',
    url: `${BASE_URL}/testimonials/submit-review`,
  },

  gallery: {
    title: 'Photo Gallery | New Era Hockey',
    description:
      'View photos from New Era Hockey camps, training sessions, and events. See our facilities, coaching in action, and player development firsthand.',
    keywords: 'hockey photos, hockey camp gallery, training photos, hockey events',
    url: `${BASE_URL}/gallery`,
  },

  contact: {
    title: 'Contact Us | New Era Hockey',
    description:
      'Get in touch with New Era Hockey. Contact us for training inquiries, camp registration, or any questions about our hockey programs.',
    keywords: 'contact hockey coach, hockey training inquiry, camp registration',
    url: `${BASE_URL}/contact`,
  },

  faq: {
    title: 'Frequently Asked Questions | New Era Hockey',
    description:
      'Find answers to common questions about New Era Hockey training programs, camps, pricing, skill levels, equipment, and registration process.',
    keywords: 'hockey training FAQ, camp questions, hockey program info',
    url: `${BASE_URL}/faq`,
  },

  register: {
    title: 'Register for Training | New Era Hockey',
    description:
      'Register for New Era Hockey training camps and sessions. View upcoming events, available spots, pricing, and secure your place in our programs.',
    keywords:
      'hockey camp registration, hockey training signup, DMV hockey camps, register for hockey',
    url: `${BASE_URL}/register`,
  },

  'event-registration': {
    title: 'Event Registration | New Era Hockey',
    description:
      'Complete your registration for New Era Hockey training events. Secure payment processing and easy registration for camps and training sessions.',
    keywords: 'hockey event registration, camp signup, training registration',
    url: `${BASE_URL}/register`,
  },

  schedule: {
    title: 'Training Schedule | New Era Hockey',
    description:
      'View the New Era Hockey training schedule. Find upcoming camps, training sessions, and events. Plan your hockey development journey with us.',
    keywords: 'hockey schedule, training calendar, camp dates, hockey events',
    url: `${BASE_URL}/schedule`,
  },

  waiver: {
    title: 'Waiver & Liability Release | New Era Hockey',
    description:
      'New Era Hockey waiver and liability release form. Review terms and conditions for participation in training programs and camps.',
    keywords: 'hockey waiver, liability release, training terms',
    url: `${BASE_URL}/waiver`,
  },

  'terms-and-conditions': {
    title: 'Terms and Conditions | New Era Hockey',
    description:
      'New Era Hockey terms and conditions. Read our policies, registration terms, cancellation policy, and program guidelines.',
    keywords: 'terms and conditions, hockey policies, training terms',
    url: `${BASE_URL}/terms-and-conditions`,
  },

  'privacy-policy': {
    title: 'Privacy Policy | New Era Hockey',
    description:
      'New Era Hockey privacy policy. Learn how we collect, use, and protect your personal information and data.',
    keywords: 'privacy policy, data protection, personal information',
    url: `${BASE_URL}/privacy-policy`,
  },
};

/**
 * Get SEO metadata for a specific page
 * @param {string} pageKey - Key from seoConfig (e.g., 'home', 'coaches')
 * @returns {object} SEO metadata object
 */
export const getSeoData = pageKey => {
  return seoConfig[pageKey] || seoConfig.default;
};
