import { Helmet } from 'react-helmet-async';

/**
 * LocalBusiness Schema for New Era Hockey
 * Provides search engines with structured business information
 * Use on Home page
 */
const LocalBusinessSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: 'New Era Hockey',
    description:
      'Premier hockey training in the DMV area. Expert coaching by Coach Will Pasko with proven results, passion, and discipline for players of all skill levels.',
    url: 'https://newerahockeytraining.com',
    logo: 'https://newerahockeytraining.com/assets/logo.png',
    image: 'https://newerahockeytraining.com/assets/og-image.jpg',
    telephone: '+1-XXX-XXX-XXXX', // TODO: Add actual phone number
    email: 'coachwill@newerahockeytraining.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'DMV Area',
      addressRegion: 'VA/MD/DC',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      // TODO: Add actual coordinates if specific location available
    },
    sameAs: [
      'https://www.instagram.com/newerahockey',
      // Add other social media URLs as needed
    ],
    priceRange: '$$',
    areaServed: {
      '@type': 'State',
      name: ['Virginia', 'Maryland', 'District of Columbia'],
    },
    sport: 'Ice Hockey',
    founder: {
      '@type': 'Person',
      name: 'Will Pasko',
      jobTitle: 'Head Coach',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '50', // TODO: Update with actual count from testimonials
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default LocalBusinessSchema;
