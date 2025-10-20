import { Helmet } from 'react-helmet-async';

/**
 * Organization Schema for New Era Hockey
 * Provides high-level organization information to search engines
 * Use on About/Home pages
 */
const OrganizationSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'New Era Hockey',
    alternateName: 'NEH',
    url: 'https://newerahockeytraining.com',
    logo: 'https://newerahockeytraining.com/assets/logo.png',
    description:
      'New Era Hockey provides premier hockey training and development programs in the DMV area, led by experienced coach Will Pasko.',
    email: 'coachwill@newerahockeytraining.com',
    telephone: '+1-XXX-XXX-XXXX', // TODO: Add actual phone
    sameAs: [
      'https://www.instagram.com/newerahockey',
      // Add other social profiles
    ],
    foundingDate: '2020', // TODO: Update with actual founding date
    founders: [
      {
        '@type': 'Person',
        name: 'Will Pasko',
      },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-XXX-XXX-XXXX', // TODO: Add actual phone
      contactType: 'Customer Service',
      email: 'coachwill@newerahockeytraining.com',
      areaServed: ['VA', 'MD', 'DC'],
      availableLanguage: 'English',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default OrganizationSchema;
