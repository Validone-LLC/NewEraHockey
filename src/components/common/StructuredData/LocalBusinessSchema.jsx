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
    logo: 'https://newerahockeytraining.com/assets/images/logo/neh-logo.png',
    image: 'https://newerahockeytraining.com/assets/images/logo/neh-logo.png',
    telephone: '+1-571-274-4691',
    email: 'coachwill@newerahockeytraining.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'DMV Area',
      addressRegion: 'VA/MD/DC',
      addressCountry: 'US',
    },
    sameAs: ['https://www.instagram.com/NewEraHockeyDMV'],
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
      reviewCount: '7',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default LocalBusinessSchema;
